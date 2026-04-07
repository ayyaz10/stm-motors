import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import https from "node:https";
import readline from "node:readline";

const DATA_DIR = resolve(".tmp", "vehicle-catalog");
const OUTPUT_DIR = resolve("supabase", "generated");

const OUTPUT_PATHS = {
  makesCsv: resolve(OUTPUT_DIR, "vehicle_makes.curated.seed.csv"),
  modelsCsv: resolve(OUTPUT_DIR, "vehicle_models.curated.seed.csv"),
  fuelsCsv: resolve(OUTPUT_DIR, "vehicle_model_fuels.curated.seed.csv"),
  engineSizesCsv: resolve(OUTPUT_DIR, "vehicle_model_engine_sizes.curated.seed.csv"),
  yearsCsv: resolve(OUTPUT_DIR, "vehicle_model_years.curated.seed.csv"),
  sql: resolve(OUTPUT_DIR, "seed_vehicle_catalog_curated.sql"),
  report: resolve(OUTPUT_DIR, "vehicle_catalog_curated_report.json")
};

const SOURCES = [
  {
    key: "catalogStock",
    fileName: "df_VEH0120_UK.csv",
    url: "https://assets.publishing.service.gov.uk/media/6966489999fbdc498faecd9d/df_VEH0120_UK.csv"
  },
  {
    key: "catalogRegistrations",
    fileName: "df_VEH0160_UK.csv",
    url: "https://assets.publishing.service.gov.uk/media/696648918d599f4c09e1fffd/df_VEH0160_UK.csv"
  },
  {
    key: "yearAgeAM",
    fileName: "df_VEH0124_AM.csv",
    url: "https://assets.publishing.service.gov.uk/media/68ed0befa8398380cb4acfdb/df_VEH0124_AM.csv"
  },
  {
    key: "yearAgeNZ",
    fileName: "df_VEH0124_NZ.csv",
    url: "https://assets.publishing.service.gov.uk/media/68ed0bbc82670806f9d5dfe2/df_VEH0124_NZ.csv"
  },
  {
    key: "engineSize",
    fileName: "df_VEH0220.csv",
    url: "https://assets.publishing.service.gov.uk/media/68ed09a42adc28a81b4acfec/df_VEH0220.csv"
  }
];

const REQUESTED_MAKES = [
  "Abarth", "AC", "Aixam", "Aixam Mega", "Alfa Romeo", "Alpine",
  "Aston Martin", "Audi", "Austin", "Bentley", "BMW", "B-ON",
  "Bristol", "BYD", "Cadillac", "Caterham", "Chery", "Chevrolet",
  "Chrysler", "Citroen", "Coleman Milne", "Corvette", "Cupra", "Dacia",
  "Daewoo", "Daihatsu", "Daimler", "De Tomaso", "DFM", "DFSK", "Dodge",
  "DS", "Farizon", "Ferrari", "Fiat", "Fisker", "Ford", "Genesis",
  "GWM", "HMC", "Honda", "Hummer", "Hyundai", "Ineos", "Infiniti",
  "Isuzu", "Isuzu Truck", "Iveco", "Jaecoo", "Jaguar", "Jeep",
  "KGM / Ssangyong", "Kia", "Lamborghini", "Land Rover", "LDV",
  "LDV (SAIC)", "Leapmotor", "LEVC", "Lexus", "Ligier",
  "London Taxi's International", "Lotus", "Mahindra", "M.A.N.", "Marcos",
  "Marlin", "Maserati", "MAXUS", "Maybach", "Mazda", "McLaren",
  "Mercedes-Benz", "MG", "Mia-Electric Vehicle", "Microcar", "MINI",
  "Mitsubishi", "Mitsubishi Fuso", "Morgan", "Nissan", "Noble", "Omoda",
  "ORA", "Perodua", "Peugeot", "Piaggio", "Polestar", "Porsche",
  "Proton", "Reliant", "Renault", "Renault Trucks", "Rolls-Royce",
  "Rover", "Saab", "San", "Santana", "SEAT", "Seres", "Skoda",
  "Skywell", "Smart", "Smart Car", "Spectre", "Subaru", "Suzuki",
  "Tata", "Tesla", "Toyota", "TVR", "Vauxhall", "Volkswagen", "Volvo",
  "Westfield", "XPENG"
];

const SOURCE_ALIASES = {
  "Aixam Mega": ["AIXAM"],
  "Isuzu Truck": ["ISUZU TRUCKS"],
  "KGM / Ssangyong": ["KGM", "SSANGYONG"],
  "LDV (SAIC)": ["LDV", "LDV LIMITED", "SAIC", "MAXUS"],
  "London Taxi's International": [
    "LONDON TAXIS INT",
    "LONDON TAXIS INT.",
    "LTI CARBODIES"
  ],
  "M.A.N.": ["MAN"],
  "Mia-Electric Vehicle": ["MIA", "MIA ELECTRIC"],
  "Smart Car": ["SMART"],
  "Spectre": ["ROLLS ROYCE"]
};

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
          new Error(`Failed to download ${url}. Status: ${response.statusCode}`)
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
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "");
}

function parseMetric(value) {
  const normalized = cleanText(value);

  if (!normalized || normalized === "[x]" || normalized === "[z]") {
    return 0;
  }

  if (normalized === "[c]") {
    return 3;
  }

  const numeric = Number(normalized.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseInteger(value) {
  const normalized = cleanText(value);
  if (!normalized || normalized === "[x]" || normalized === "[z]") {
    return null;
  }

  const numeric = Number(normalized.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function escapeCsv(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function escapeSql(value) {
  return value.replace(/'/g, "''");
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
    const values = rowsChunk.map((row) => `  (${row.join(", ")})`).join("\n");
    return `insert into public.${tableName} (${columns.join(", ")})\nvalues\n${values};`;
  });
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

function sortFuelEntries(entries) {
  return [...entries].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.fuelType.localeCompare(right.fuelType);
  });
}

function sortEngineEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftSimple = left.engineSizeSimple ?? Number.MAX_SAFE_INTEGER;
    const rightSimple = right.engineSizeSimple ?? Number.MAX_SAFE_INTEGER;

    if (leftSimple !== rightSimple) {
      return leftSimple - rightSimple;
    }

    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.engineSizeDesc.localeCompare(right.engineSizeDesc);
  });
}

function sortYearEntries(entries) {
  return [...entries].sort((left, right) => right.year - left.year);
}

function getValueColumns(header, excludedColumns) {
  const excluded = new Set(excludedColumns);
  return header.filter((column) => !excluded.has(column));
}

function ensureModel(aggregate, modelName) {
  const modelKey = normalize(modelName);
  let model = aggregate.models.get(modelKey);

  if (!model) {
    model = {
      key: modelKey,
      name: modelName,
      latestMetric: 0,
      totalMetric: 0,
      fuels: new Map(),
      engineSizes: new Map(),
      years: new Map()
    };
    aggregate.models.set(modelKey, model);
  }

  return model;
}

function addFuel(model, fuelType, count) {
  const normalizedFuel = cleanText(fuelType);
  if (!normalizedFuel || count <= 0) {
    return;
  }

  const key = normalize(normalizedFuel);
  const existing = model.fuels.get(key) || { fuelType: normalizedFuel, count: 0 };
  existing.count += count;
  model.fuels.set(key, existing);
}

function addEngineSize(model, engineSizeSimple, engineSizeDesc, count) {
  const normalizedDesc = cleanText(engineSizeDesc);
  if (!normalizedDesc || count <= 0) {
    return;
  }

  const key = `${engineSizeSimple ?? "null"}:${normalize(normalizedDesc)}`;
  const existing = model.engineSizes.get(key) || {
    engineSizeSimple,
    engineSizeDesc: normalizedDesc,
    count: 0
  };
  existing.count += count;
  model.engineSizes.set(key, existing);
}

function addYear(model, year, count) {
  if (!year || count <= 0) {
    return;
  }

  const existing = model.years.get(year) || { year, count: 0 };
  existing.count += count;
  model.years.set(year, existing);
}

async function ensureSourceFiles() {
  await mkdir(DATA_DIR, { recursive: true });

  for (const source of SOURCES) {
    const filePath = resolve(DATA_DIR, source.fileName);
    source.filePath = filePath;

    if (existsSync(filePath)) {
      continue;
    }

    console.log(`Downloading ${source.fileName}...`);
    await downloadFile(source.url, filePath);
  }
}

function createMakeAggregates() {
  const requested = new Map();

  REQUESTED_MAKES.forEach((makeName) => {
    requested.set(makeName, {
      sourceKeys: new Set((SOURCE_ALIASES[makeName] || [makeName]).map(normalize)),
      sourceNames: new Set(),
      models: new Map()
    });
  });

  return requested;
}

async function processCatalogSource(filePath, aggregates) {
  const reader = readline.createInterface({
    input: createReadStream(filePath, "utf8"),
    crlfDelay: Infinity
  });

  let header = null;
  let valueColumns = [];

  for await (const line of reader) {
    if (!header) {
      header = parseCsvLine(line).map(cleanText);
      valueColumns = getValueColumns(header, [
        "BodyType",
        "Make",
        "GenModel",
        "Model",
        "Fuel",
        "LicenceStatus"
      ]);
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    const values = parseCsvLine(line);
    const row = {};
    header.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });

    const makeKey = normalize(row.Make);
    const modelName = cleanText(row.GenModel || row.Model);

    if (!makeKey || !modelName) {
      continue;
    }

    const latestColumn = valueColumns[valueColumns.length - 1];
    const latestMetric = latestColumn ? parseMetric(row[latestColumn]) : 0;
    const totalMetric = valueColumns.reduce(
      (sum, column) => sum + parseMetric(row[column]),
      0
    );

    for (const aggregate of aggregates.values()) {
      if (!aggregate.sourceKeys.has(makeKey)) {
        continue;
      }

      aggregate.sourceNames.add(cleanText(row.Make));
      const model = ensureModel(aggregate, modelName);
      model.latestMetric += latestMetric;
      model.totalMetric += totalMetric || 1;
      addFuel(model, row.Fuel, totalMetric || latestMetric || 1);
    }
  }
}

async function processYearSource(filePath, aggregates) {
  const reader = readline.createInterface({
    input: createReadStream(filePath, "utf8"),
    crlfDelay: Infinity
  });

  let header = null;
  let valueColumns = [];

  for await (const line of reader) {
    if (!header) {
      header = parseCsvLine(line).map(cleanText);
      valueColumns = getValueColumns(header, [
        "BodyType",
        "Make",
        "GenModel",
        "Model",
        "YearFirstUsed",
        "YearManufacture",
        "LicenceStatus"
      ]);
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    const values = parseCsvLine(line);
    const row = {};
    header.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });

    const makeKey = normalize(row.Make);
    const modelKey = normalize(row.GenModel || row.Model);
    const year = parseInteger(row.YearManufacture);
    const totalMetric = valueColumns.reduce(
      (sum, column) => sum + parseMetric(row[column]),
      0
    );

    if (!makeKey || !modelKey || !year || totalMetric <= 0) {
      continue;
    }

    for (const aggregate of aggregates.values()) {
      if (!aggregate.sourceKeys.has(makeKey)) {
        continue;
      }

      const model = aggregate.models.get(modelKey);
      if (!model) {
        continue;
      }

      addYear(model, year, totalMetric);
    }
  }
}

async function processEngineSource(filePath, aggregates) {
  const reader = readline.createInterface({
    input: createReadStream(filePath, "utf8"),
    crlfDelay: Infinity
  });

  let header = null;
  let valueColumns = [];

  for await (const line of reader) {
    if (!header) {
      header = parseCsvLine(line).map(cleanText);
      valueColumns = getValueColumns(header, [
        "BodyType",
        "Make",
        "GenModel",
        "Model",
        "Fuel",
        "EngineSizeSimple",
        "EngineSizeDesc",
        "LicenceStatus"
      ]);
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    const values = parseCsvLine(line);
    const row = {};
    header.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });

    const makeKey = normalize(row.Make);
    const modelKey = normalize(row.GenModel || row.Model);
    const totalMetric = valueColumns.reduce(
      (sum, column) => sum + parseMetric(row[column]),
      0
    );

    if (!makeKey || !modelKey || totalMetric <= 0) {
      continue;
    }

    for (const aggregate of aggregates.values()) {
      if (!aggregate.sourceKeys.has(makeKey)) {
        continue;
      }

      const model = aggregate.models.get(modelKey);
      if (!model) {
        continue;
      }

      addFuel(model, row.Fuel, totalMetric);
      addEngineSize(
        model,
        parseInteger(row.EngineSizeSimple),
        row.EngineSizeDesc,
        totalMetric
      );
    }
  }
}

function buildCatalog(aggregates) {
  const makes = [];
  const models = [];
  const fuels = [];
  const engineSizes = [];
  const years = [];
  const report = [];

  let makeId = 1;
  let modelId = 1;
  let fuelId = 1;
  let engineSizeId = 1;
  let yearId = 1;

  for (const displayMake of REQUESTED_MAKES) {
    const aggregate = aggregates.get(displayMake);
    const sortedModels = sortByMetrics(aggregate.models.values());

    if (!sortedModels.length) {
      continue;
    }

    makes.push({
      id: makeId,
      name: displayMake,
      sortOrder: makeId,
      isPopular: true
    });

    for (const modelEntry of sortedModels) {
      const currentModelId = modelId;

      models.push({
        id: currentModelId,
        makeId,
        name: modelEntry.name,
        sortOrder: models.filter((item) => item.makeId === makeId).length + 1,
        isPopular: true
      });

      sortFuelEntries(modelEntry.fuels.values()).forEach((fuelEntry, index) => {
        fuels.push({
          id: fuelId,
          modelId: currentModelId,
          fuelType: fuelEntry.fuelType,
          sortOrder: index + 1
        });
        fuelId += 1;
      });

      sortEngineEntries(modelEntry.engineSizes.values()).forEach((entry, index) => {
        engineSizes.push({
          id: engineSizeId,
          modelId: currentModelId,
          engineSizeSimple: entry.engineSizeSimple,
          engineSizeDesc: entry.engineSizeDesc,
          sortOrder: index + 1
        });
        engineSizeId += 1;
      });

      sortYearEntries(modelEntry.years.values()).forEach((entry, index) => {
        years.push({
          id: yearId,
          modelId: currentModelId,
          year: entry.year,
          sortOrder: index + 1
        });
        yearId += 1;
      });

      modelId += 1;
    }

    report.push({
      make: displayMake,
      sourceMakes: [...aggregate.sourceNames],
      modelCount: sortedModels.length,
      fuelCount: fuels.filter((entry) => models.find((model) => model.id === entry.modelId)?.makeId === makeId).length,
      engineSizeCount: engineSizes.filter((entry) => models.find((model) => model.id === entry.modelId)?.makeId === makeId).length,
      yearCount: years.filter((entry) => models.find((model) => model.id === entry.modelId)?.makeId === makeId).length
    });

    makeId += 1;
  }

  return { makes, models, fuels, engineSizes, years, report };
}

async function writeCsv(filePath, header, rows) {
  const lines = [
    header.join(","),
    ...rows.map((row) => row.map((value) => escapeCsv(String(value ?? ""))).join(","))
  ];

  await writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
}

async function writeSql(catalog) {
  const makeRows = catalog.makes.map((make) => [
    `'${escapeSql(make.name)}'`,
    String(make.sortOrder),
    make.isPopular ? "true" : "false"
  ]);

  const modelRows = catalog.models.map((model) => {
    const makeName = catalog.makes.find((item) => item.id === model.makeId)?.name;
    return [
      `(select id from public.vehicle_makes where name = '${escapeSql(makeName)}')`,
      `'${escapeSql(model.name)}'`,
      String(model.sortOrder),
      model.isPopular ? "true" : "false"
    ];
  });

  const fuelRows = catalog.fuels.map((fuel) => {
    const model = catalog.models.find((item) => item.id === fuel.modelId);
    const make = catalog.makes.find((item) => item.id === model.makeId);
    return [
      `(select vm.id from public.vehicle_models vm join public.vehicle_makes mk on mk.id = vm.make_id where mk.name = '${escapeSql(make.name)}' and vm.name = '${escapeSql(model.name)}')`,
      `'${escapeSql(fuel.fuelType)}'`,
      String(fuel.sortOrder)
    ];
  });

  const engineSizeRows = catalog.engineSizes.map((entry) => {
    const model = catalog.models.find((item) => item.id === entry.modelId);
    const make = catalog.makes.find((item) => item.id === model.makeId);
    return [
      `(select vm.id from public.vehicle_models vm join public.vehicle_makes mk on mk.id = vm.make_id where mk.name = '${escapeSql(make.name)}' and vm.name = '${escapeSql(model.name)}')`,
      entry.engineSizeSimple === null ? "null" : String(entry.engineSizeSimple),
      `'${escapeSql(entry.engineSizeDesc)}'`,
      String(entry.sortOrder)
    ];
  });

  const yearRows = catalog.years.map((entry) => {
    const model = catalog.models.find((item) => item.id === entry.modelId);
    const make = catalog.makes.find((item) => item.id === model.makeId);
    return [
      `(select vm.id from public.vehicle_models vm join public.vehicle_makes mk on mk.id = vm.make_id where mk.name = '${escapeSql(make.name)}' and vm.name = '${escapeSql(model.name)}')`,
      String(entry.year),
      String(entry.sortOrder)
    ];
  });

  const statements = [
    "-- Curated lightweight UK vehicle catalog with fuels, engine sizes and years.",
    "-- Sources: official DfT/DVLA vehicle licensing statistics CSVs.",
    ...SOURCES.map((source) => `-- ${source.url}`),
    "begin;",
    "delete from public.vehicle_model_years;",
    "delete from public.vehicle_model_engine_sizes;",
    "delete from public.vehicle_model_fuels;",
    "delete from public.vehicle_models;",
    "delete from public.vehicle_makes;",
    ...buildInsertStatements("vehicle_makes", ["name", "sort_order", "is_popular"], makeRows),
    ...buildInsertStatements("vehicle_models", ["make_id", "name", "sort_order", "is_popular"], modelRows),
    ...buildInsertStatements("vehicle_model_fuels", ["model_id", "fuel_type", "sort_order"], fuelRows),
    ...buildInsertStatements(
      "vehicle_model_engine_sizes",
      ["model_id", "engine_size_simple", "engine_size_desc", "sort_order"],
      engineSizeRows
    ),
    ...buildInsertStatements("vehicle_model_years", ["model_id", "year", "sort_order"], yearRows),
    "commit;"
  ];

  await writeFile(OUTPUT_PATHS.sql, `${statements.join("\n\n")}\n`, "utf8");
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await ensureSourceFiles();

  const aggregates = createMakeAggregates();

  await processCatalogSource(SOURCES[0].filePath, aggregates);
  await processCatalogSource(SOURCES[1].filePath, aggregates);
  await processYearSource(SOURCES[2].filePath, aggregates);
  await processYearSource(SOURCES[3].filePath, aggregates);
  await processEngineSource(SOURCES[4].filePath, aggregates);

  const catalog = buildCatalog(aggregates);

  await writeCsv(
    OUTPUT_PATHS.makesCsv,
    ["id", "name", "sort_order", "is_popular"],
    catalog.makes.map((entry) => [entry.id, entry.name, entry.sortOrder, entry.isPopular])
  );

  await writeCsv(
    OUTPUT_PATHS.modelsCsv,
    ["id", "make_id", "name", "sort_order", "is_popular"],
    catalog.models.map((entry) => [entry.id, entry.makeId, entry.name, entry.sortOrder, entry.isPopular])
  );

  await writeCsv(
    OUTPUT_PATHS.fuelsCsv,
    ["id", "model_id", "fuel_type", "sort_order"],
    catalog.fuels.map((entry) => [entry.id, entry.modelId, entry.fuelType, entry.sortOrder])
  );

  await writeCsv(
    OUTPUT_PATHS.engineSizesCsv,
    ["id", "model_id", "engine_size_simple", "engine_size_desc", "sort_order"],
    catalog.engineSizes.map((entry) => [
      entry.id,
      entry.modelId,
      entry.engineSizeSimple ?? "",
      entry.engineSizeDesc,
      entry.sortOrder
    ])
  );

  await writeCsv(
    OUTPUT_PATHS.yearsCsv,
    ["id", "model_id", "year", "sort_order"],
    catalog.years.map((entry) => [entry.id, entry.modelId, entry.year, entry.sortOrder])
  );

  await writeSql(catalog);
  await writeFile(OUTPUT_PATHS.report, `${JSON.stringify(catalog.report, null, 2)}\n`, "utf8");

  console.log(`Created ${catalog.makes.length} curated makes.`);
  console.log(`Created ${catalog.models.length} curated models.`);
  console.log(`Created ${catalog.fuels.length} fuel rows.`);
  console.log(`Created ${catalog.engineSizes.length} engine-size rows.`);
  console.log(`Created ${catalog.years.length} year rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
