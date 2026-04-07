import { createWriteStream, createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import readline from "node:readline";
import https from "node:https";

const SOURCES = [
  {
    name: "df_VEH0120_UK",
    url: "https://assets.publishing.service.gov.uk/media/6966489999fbdc498faecd9d/df_VEH0120_UK.csv",
    kind: "licensed",
  },
  {
    name: "df_VEH0160_UK",
    url: "https://assets.publishing.service.gov.uk/media/696648918d599f4c09e1fffd/df_VEH0160_UK.csv",
    kind: "registrations",
  },
];

const OUTPUT_DIR = resolve("supabase", "generated");
const TEMP_DIR = resolve(".tmp", "vehicle-catalog");
const MAKES_CSV_PATH = resolve(OUTPUT_DIR, "vehicle_makes.seed.csv");
const MODELS_CSV_PATH = resolve(OUTPUT_DIR, "vehicle_models.seed.csv");
const SQL_PATH = resolve(OUTPUT_DIR, "seed_vehicle_catalog.sql");

const TOP_MAKE_COUNT = 150;
const TOP_MODEL_COUNT_PER_MAKE = 80;

function downloadFile(url, destinationPath) {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = https.get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        downloadFile(response.headers.location, destinationPath)
          .then(resolvePromise)
          .catch(rejectPromise);
        return;
      }

      if (response.statusCode !== 200) {
        rejectPromise(
          new Error(`Failed to download ${url}. Status: ${response.statusCode}`),
        );
        response.resume();
        return;
      }

      const output = createWriteStream(destinationPath);

      pipeline(response, output).then(resolvePromise).catch(rejectPromise);
    });

    request.on("error", rejectPromise);
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);

  return values;
}

function cleanText(value) {
  return value.replace(/\uFEFF/g, "").replace(/\s+/g, " ").trim();
}

function parseMetric(value) {
  const normalized = cleanText(String(value ?? ""));

  if (!normalized || normalized === "[x]" || normalized === "[z]") {
    return 0;
  }

  if (normalized === "[c]") {
    return 3;
  }

  const numeric = Number(normalized.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function escapeCsv(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function getMetaColumns(header) {
  return header.filter((column) =>
    [
      "BodyType",
      "Make",
      "GenModel",
      "Model",
      "Fuel",
      "LicenceStatus",
      "EngineSizeSimple",
      "EngineSizeDesc",
      "YearFirstUsed",
      "YearManufacture",
    ].includes(column),
  );
}

function buildRowObject(header, values) {
  const row = {};

  header.forEach((column, index) => {
    row[column] = values[index] ?? "";
  });

  return row;
}

function getSortMetrics(row, valueColumns) {
  const latestColumn = valueColumns[valueColumns.length - 1];
  const latestMetric = latestColumn ? parseMetric(row[latestColumn]) : 0;
  const totalMetric = valueColumns.reduce(
    (sum, column) => sum + parseMetric(row[column]),
    0,
  );

  return {
    latestMetric,
    totalMetric,
  };
}

function shouldKeepRow(row) {
  const make = cleanText(row.Make || "");
  const model = cleanText(row.Model || row.GenModel || "");

  if (!make || !model) {
    return false;
  }

  if (make.toLowerCase() === "unknown") {
    return false;
  }

  return true;
}

async function processSource(filePath, aggregates) {
  const input = createReadStream(filePath, "utf8");
  const reader = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });

  let header = null;
  let valueColumns = [];

  for await (const line of reader) {
    if (!header) {
      header = parseCsvLine(line).map(cleanText);
      const metaColumns = new Set(getMetaColumns(header));
      valueColumns = header.filter((column) => !metaColumns.has(column));
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    const row = buildRowObject(header, parseCsvLine(line));

    if (!shouldKeepRow(row)) {
      continue;
    }

    const makeName = cleanText(row.Make);
    const modelName = cleanText(row.Model || row.GenModel);
    const { latestMetric, totalMetric } = getSortMetrics(row, valueColumns);

    let makeAggregate = aggregates.makes.get(makeName);

    if (!makeAggregate) {
      makeAggregate = {
        name: makeName,
        latestMetric: 0,
        totalMetric: 0,
        models: new Map(),
      };
      aggregates.makes.set(makeName, makeAggregate);
    }

    makeAggregate.latestMetric += latestMetric;
    makeAggregate.totalMetric += totalMetric || 1;

    let modelAggregate = makeAggregate.models.get(modelName);

    if (!modelAggregate) {
      modelAggregate = {
        name: modelName,
        latestMetric: 0,
        totalMetric: 0,
      };
      makeAggregate.models.set(modelName, modelAggregate);
    }

    modelAggregate.latestMetric += latestMetric;
    modelAggregate.totalMetric += totalMetric || 1;
  }
}

function sortByMetrics(items) {
  return [...items].sort((left, right) => {
    if (right.latestMetric !== left.latestMetric) {
      return right.latestMetric - left.latestMetric;
    }

    if (right.totalMetric !== left.totalMetric) {
      return right.totalMetric - left.totalMetric;
    }

    return left.name.localeCompare(right.name);
  });
}

function buildCatalog(aggregates) {
  const sortedMakes = sortByMetrics(aggregates.makes.values());
  const makes = sortedMakes.map((make, index) => ({
    id: index + 1,
    name: make.name,
    sortOrder: index + 1,
    isPopular: index < TOP_MAKE_COUNT,
    models: sortByMetrics(make.models.values()).map((model, modelIndex) => ({
      name: model.name,
      sortOrder: modelIndex + 1,
      isPopular: modelIndex < TOP_MODEL_COUNT_PER_MAKE,
    })),
  }));

  const makeIdByName = new Map(makes.map((make) => [make.name, make.id]));

  const models = [];
  let modelId = 1;

  makes.forEach((make) => {
    make.models.forEach((model) => {
      models.push({
        id: modelId,
        makeId: makeIdByName.get(make.name),
        name: model.name,
        sortOrder: model.sortOrder,
        isPopular: model.isPopular,
      });
      modelId += 1;
    });
  });

  return { makes, models };
}

async function writeCsv(filePath, header, rows) {
  const lines = [
    header.join(","),
    ...rows.map((row) => row.map((value) => escapeCsv(String(value))).join(",")),
  ];

  await writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
}

function chunk(array, size) {
  const result = [];

  for (let index = 0; index < array.length; index += size) {
    result.push(array.slice(index, index + size));
  }

  return result;
}

function buildInsertStatements(tableName, columns, rows) {
  return chunk(rows, 500).map((rowsChunk) => {
    const values = rowsChunk.map((row) => `  (${row.join(", ")})`).join(",\n");
    return `insert into public.${tableName} (${columns.join(", ")})\nvalues\n${values};`;
  });
}

async function writeSql(catalog) {
  const makeRows = catalog.makes.map((make) => [
    `'${escapeSql(make.name)}'`,
    String(make.sortOrder),
    make.isPopular ? "true" : "false",
  ]);

  const modelRows = catalog.models.map((model) => {
    const makeName = catalog.makes.find((make) => make.id === model.makeId)?.name;

    return [
      `(select id from public.vehicle_makes where name = '${escapeSql(makeName)}')`,
      `'${escapeSql(model.name)}'`,
      String(model.sortOrder),
      model.isPopular ? "true" : "false",
    ];
  });

  const statements = [
    "-- Generated from official UK vehicle licensing CSVs published by DfT/DVLA.",
    "-- Sources:",
    `-- ${SOURCES[0].url}`,
    `-- ${SOURCES[1].url}`,
    "begin;",
    "delete from public.vehicle_models;",
    "delete from public.vehicle_makes;",
    ...buildInsertStatements(
      "vehicle_makes",
      ["name", "sort_order", "is_popular"],
      makeRows,
    ),
    ...buildInsertStatements(
      "vehicle_models",
      ["make_id", "name", "sort_order", "is_popular"],
      modelRows,
    ),
    "commit;",
  ];

  await writeFile(SQL_PATH, `${statements.join("\n\n")}\n`, "utf8");
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(TEMP_DIR, { recursive: true });

  for (const source of SOURCES) {
    const destinationPath = resolve(TEMP_DIR, `${source.name}.csv`);
    await mkdir(dirname(destinationPath), { recursive: true });
    console.log(`Downloading ${source.name}...`);
    await downloadFile(source.url, destinationPath);
  }

  const aggregates = {
    makes: new Map(),
  };

  for (const source of SOURCES) {
    const sourcePath = resolve(TEMP_DIR, `${source.name}.csv`);
    console.log(`Processing ${source.name}...`);
    await processSource(sourcePath, aggregates);
  }

  const catalog = buildCatalog(aggregates);

  await writeCsv(
    MAKES_CSV_PATH,
    ["id", "name", "sort_order", "is_popular"],
    catalog.makes.map((make) => [
      make.id,
      make.name,
      make.sortOrder,
      make.isPopular,
    ]),
  );

  await writeCsv(
    MODELS_CSV_PATH,
    ["id", "make_id", "name", "sort_order", "is_popular"],
    catalog.models.map((model) => [
      model.id,
      model.makeId,
      model.name,
      model.sortOrder,
      model.isPopular,
    ]),
  );

  await writeSql(catalog);

  console.log(`Created ${catalog.makes.length} makes.`);
  console.log(`Created ${catalog.models.length} models.`);
  console.log(`CSV output: ${MAKES_CSV_PATH}`);
  console.log(`CSV output: ${MODELS_CSV_PATH}`);
  console.log(`SQL output: ${SQL_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
