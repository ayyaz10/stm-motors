import { useEffect, useMemo, useState } from "react";
import Select, {
  type SingleValue,
  type StylesConfig,
} from "react-select";
import {
  fetchVehicleMakes,
  fetchVehicleMetadataForModels,
  fetchVehicleModels,
  type VehicleMakeRecord,
  type VehicleModelMetadata,
  type VehicleModelRecord,
} from "../../lib/vehicles";
import validatePostcode, { formatPostcode } from "../../utils/postcode";

interface CarDetailsFormData {
  vehicleModelId: number | null;
  make: string;
  model: string;
  fuel: string;
  engine: string;
  year: string;
  postcode: string;
}

type DisabledField = "model" | "fuel" | "engine" | "year";

interface CarDetailsFormProps {
  formData: CarDetailsFormData;
  setFormData: React.Dispatch<React.SetStateAction<CarDetailsFormData>>;
  disabledStates: Record<DisabledField, boolean>;
  setDisabled: (key: DisabledField, value: boolean) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

interface SelectOption {
  value: string;
  label: string;
  recordId?: number;
}

const TOP_MAKES = [
  "Audi",
  "BMW",
  "Citroen",
  "Ford",
  "Honda",
  "Hyundai",
  "Kia",
  "Mercedes-Benz",
  "MINI",
  "Nissan",
  "Peugeot",
  "Renault",
  "Toyota",
  "Vauxhall",
  "Volkswagen",
  "Volvo",
];

const LEGACY_MAKES_CACHE_KEY = "vehicle_makes_cache_v1";
const LEGACY_MODELS_CACHE_PREFIX = "vehicle_models_cache_v1_";

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "56px",
    borderRadius: "1rem",
    borderColor: state.isFocused ? "#1c69d4" : "#e2e8f0",
    backgroundColor: "#f8fafc",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(28,105,212,0.12)" : "none",
    paddingLeft: "0.2rem",
    "&:hover": {
      borderColor: "#1c69d4",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 30,
    borderRadius: "1rem",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 40px -18px rgba(15,23,42,0.16)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#1c69d4"
      : state.isFocused
        ? "#eff6ff"
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#0f172a",
    cursor: "pointer",
    paddingBlock: "0.85rem",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#94a3b8",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "#e2e8f0",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#1c69d4",
    "&:hover": {
      color: "#1557b3",
    },
  }),
};

const clearLegacyVehicleCache = () => {
  try {
    localStorage.removeItem(LEGACY_MAKES_CACHE_KEY);

    const keysToRemove: string[] = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (key?.startsWith(LEGACY_MODELS_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Failed to clear legacy vehicle cache:", error);
  }
};

const isPureElectricFuel = (fuel: string) => {
  const normalizedFuel = fuel.trim().toLowerCase();

  return (
    normalizedFuel.includes("electric") &&
    !normalizedFuel.includes("hybrid") &&
    !normalizedFuel.includes("petrol") &&
    !normalizedFuel.includes("diesel")
  );
};

function CarDetailsForm({
  formData,
  setFormData,
  disabledStates,
  setDisabled,
  goToNextStep,
  goToPreviousStep,
}: CarDetailsFormProps) {
  const [postcodeError, setPostcodeError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [makes, setMakes] = useState<VehicleMakeRecord[]>([]);
  const [models, setModels] = useState<VehicleModelRecord[]>([]);
  const [metadataByModelId, setMetadataByModelId] = useState<
    Record<number, VehicleModelMetadata>
  >({});
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [hasLoadedMakes, setHasLoadedMakes] = useState(false);
  const [loadedModelsMakeId, setLoadedModelsMakeId] = useState<number | null>(
    null,
  );
  const [loadedMetadataMakeId, setLoadedMetadataMakeId] = useState<
    number | null
  >(null);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    clearLegacyVehicleCache();
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadMakes = async () => {
      try {
        setMakesLoading(true);
        setApiError("");

        const vehicleMakes = await fetchVehicleMakes();

        if (!ignore) {
          setMakes(vehicleMakes);

          if (!vehicleMakes.length) {
            setApiError(
              "Vehicle data is not available right now. Please try again shortly.",
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch makes:", error);

        if (!ignore) {
          setApiError(
            "Unable to load vehicle makes right now. Please try again shortly.",
          );
        }
      } finally {
        if (!ignore) {
          setMakesLoading(false);
          setHasLoadedMakes(true);
        }
      }
    };

    void loadMakes();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedMake =
    makes.find((make) => make.name === formData.make) || null;

  useEffect(() => {
    let ignore = false;

    const loadModels = async () => {
      if (!selectedMake) {
        setModels([]);
        setMetadataByModelId({});
        setLoadedModelsMakeId(null);
        setLoadedMetadataMakeId(null);
        return;
      }

      try {
        setModelsLoading(true);
        setLoadedModelsMakeId(null);
        setLoadedMetadataMakeId(null);
        setApiError("");

        const vehicleModels = await fetchVehicleModels(selectedMake.id);

        if (!ignore) {
          setModels(vehicleModels);
          setLoadedModelsMakeId(selectedMake.id);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);

        if (!ignore) {
          setModels([]);
          setMetadataByModelId({});
          setApiError(
            "Unable to load models for the selected make right now.",
          );
        }
      } finally {
        if (!ignore) {
          setModelsLoading(false);
        }
      }
    };

    void loadModels();

    return () => {
      ignore = true;
    };
  }, [selectedMake]);

  useEffect(() => {
    let ignore = false;

    const loadMetadata = async () => {
      if (!models.length) {
        setMetadataByModelId({});
        setLoadedMetadataMakeId(null);
        return;
      }

      try {
        setMetadataLoading(true);
        setLoadedMetadataMakeId(null);
        setApiError("");

        const metadata = await fetchVehicleMetadataForModels(
          models.map((model) => model.id),
        );

        if (!ignore) {
          setMetadataByModelId(metadata);
          setLoadedMetadataMakeId(selectedMake?.id ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch vehicle metadata:", error);

        if (!ignore) {
          setMetadataByModelId({});
          setApiError(
            "Unable to load fuel, engine, and year information right now.",
          );
        }
      } finally {
        if (!ignore) {
          setMetadataLoading(false);
        }
      }
    };

    void loadMetadata();

    return () => {
      ignore = true;
    };
  }, [models, selectedMake]);

  const makeOptions = useMemo<SelectOption[]>(() => {
    const top = makes
      .filter((make) => make.is_popular || TOP_MAKES.includes(make.name))
      .map((make) => ({
        value: make.name,
        label: make.name,
      }));

    const rest = makes
      .filter((make) => !make.is_popular && !TOP_MAKES.includes(make.name))
      .map((make) => ({
        value: make.name,
        label: make.name,
      }));

    return [...top, ...rest];
  }, [makes]);

  const modelOptions = useMemo<SelectOption[]>(
    () =>
      models.map((model) => ({
        value: model.name,
        label: model.name,
        recordId: model.id,
      })),
    [models],
  );

  const selectedModel =
    models.find((model) => model.name === formData.model) || null;

  useEffect(() => {
    if (selectedModel && formData.vehicleModelId !== selectedModel.id) {
      setFormData((prev) => ({
        ...prev,
        vehicleModelId: selectedModel.id,
      }));
    }
  }, [formData.vehicleModelId, selectedModel, setFormData]);

  const selectedModelMetadata = selectedModel
    ? metadataByModelId[selectedModel.id]
    : null;

  const fallbackYearOptions = useMemo<SelectOption[]>(
    () =>
      Array.from({ length: 25 }, (_, index) => {
        const year = String(new Date().getFullYear() - index);

        return { value: year, label: year };
      }),
    [],
  );

  const fuelOptions = useMemo<SelectOption[]>(
    () =>
      (selectedModelMetadata?.fuels || []).map((fuel) => ({
        value: fuel.fuel_type,
        label: fuel.fuel_type,
      })),
    [selectedModelMetadata],
  );

  const engineOptions = useMemo<SelectOption[]>(
    () =>
      (selectedModelMetadata?.engineSizes || []).map((engineSize) => ({
        value: engineSize.engine_size_desc,
        label: engineSize.engine_size_desc,
      })),
    [selectedModelMetadata],
  );

  const yearOptions = useMemo<SelectOption[]>(() => {
    const metadataYearOptions = (selectedModelMetadata?.years || []).map(
      (year) => ({
        value: String(year.year),
        label: String(year.year),
      }),
    );

    return metadataYearOptions.length ? metadataYearOptions : fallbackYearOptions;
  }, [fallbackYearOptions, selectedModelMetadata]);

  const canSkipEngineSelection =
    isPureElectricFuel(formData.fuel) || engineOptions.length === 0;

  useEffect(() => {
    if (!hasLoadedMakes || !makes.length || makesLoading || !formData.make) {
      return;
    }

    const makeExists = makes.some((make) => make.name === formData.make);

    if (!makeExists) {
      setFormData((prev) => ({
        ...prev,
        vehicleModelId: null,
        make: "",
        model: "",
        fuel: "",
        engine: "",
        year: "",
      }));

      setDisabled("model", true);
      setDisabled("fuel", true);
      setDisabled("engine", true);
      setDisabled("year", true);
    }
  }, [
    formData.make,
    hasLoadedMakes,
    makes,
    makesLoading,
    setDisabled,
    setFormData,
  ]);

  useEffect(() => {
    if (
      !selectedMake ||
      loadedModelsMakeId !== selectedMake.id ||
      (modelsLoading && !models.length) ||
      !formData.model
    ) {
      return;
    }

    const modelExists = models.some((model) => model.name === formData.model);

    if (!modelExists) {
      setFormData((prev) => ({
        ...prev,
        vehicleModelId: null,
        model: "",
        fuel: "",
        engine: "",
        year: "",
      }));

      setDisabled("fuel", true);
      setDisabled("engine", true);
      setDisabled("year", true);
    }
  }, [
    formData.model,
    loadedModelsMakeId,
    models,
    modelsLoading,
    selectedMake,
    setDisabled,
    setFormData,
  ]);

  useEffect(() => {
    if (!formData.model) {
      return;
    }

    if (metadataLoading) {
      setDisabled("fuel", true);
      setDisabled("engine", true);
      setDisabled("year", true);
      return;
    }

    const hasFuelOptions = fuelOptions.length > 0;

    setDisabled("fuel", !hasFuelOptions);
    setDisabled("engine", !formData.fuel || canSkipEngineSelection);
    setDisabled(
      "year",
      !formData.fuel || (!canSkipEngineSelection && !formData.engine),
    );
  }, [
    canSkipEngineSelection,
    formData.engine,
    formData.fuel,
    formData.model,
    fuelOptions.length,
    metadataLoading,
    setDisabled,
  ]);

  useEffect(() => {
    if (
      !selectedMake ||
      loadedMetadataMakeId !== selectedMake.id ||
      !formData.fuel
    ) {
      return;
    }

    const fuelExists = fuelOptions.some((option) => option.value === formData.fuel);

    if (!fuelExists) {
      setFormData((prev) => ({
        ...prev,
        fuel: "",
        engine: "",
        year: "",
      }));
    }
  }, [formData.fuel, fuelOptions, loadedMetadataMakeId, selectedMake, setFormData]);

  useEffect(() => {
    if (
      !selectedMake ||
      loadedMetadataMakeId !== selectedMake.id ||
      !formData.engine
    ) {
      return;
    }

    const engineExists = engineOptions.some(
      (option) => option.value === formData.engine,
    );

    if (!engineExists) {
      setFormData((prev) => ({
        ...prev,
        engine: "",
        year: "",
      }));
    }
  }, [
    engineOptions,
    formData.engine,
    loadedMetadataMakeId,
    selectedMake,
    setFormData,
  ]);

  useEffect(() => {
    if (
      !selectedMake ||
      loadedMetadataMakeId !== selectedMake.id ||
      !formData.year
    ) {
      return;
    }

    const yearExists = yearOptions.some((option) => option.value === formData.year);

    if (!yearExists) {
      setFormData((prev) => ({
        ...prev,
        year: "",
      }));
    }
  }, [formData.year, loadedMetadataMakeId, selectedMake, setFormData, yearOptions]);

  const validatePostcodeField = (postcode: string) => {
    if (!postcode.trim()) {
      setPostcodeError("Postcode is required.");
      return false;
    }

    if (!validatePostcode(postcode)) {
      setPostcodeError("Enter a valid UK postcode such as SW1A 1AA.");
      return false;
    }

    setPostcodeError("");
    return true;
  };

  const handleMakeChange = (selectedOption: SingleValue<SelectOption>) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      vehicleModelId: null,
      make: value,
      model: "",
      fuel: "",
      engine: "",
      year: "",
    }));

    setModels([]);
    setMetadataByModelId({});
    setDisabled("model", !value);
    setDisabled("fuel", true);
    setDisabled("engine", true);
    setDisabled("year", true);
  };

  const handleModelChange = (selectedOption: SingleValue<SelectOption>) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      vehicleModelId: selectedOption?.recordId ?? null,
      model: value,
      fuel: "",
      engine: "",
      year: "",
    }));

    setDisabled("fuel", true);
    setDisabled("engine", true);
    setDisabled("year", true);
  };

  const handleFuelChange = (selectedOption: SingleValue<SelectOption>) => {
    const value = selectedOption?.value || "";
    const isElectric = isPureElectricFuel(value);
    const requiresEngineSelection = !isElectric && engineOptions.length > 0;

    setFormData((prev) => ({
      ...prev,
      fuel: value,
      engine: "",
      year: "",
    }));

    setDisabled("engine", !value || !requiresEngineSelection);
    setDisabled("year", !value ? true : requiresEngineSelection);
  };

  const handleEngineChange = (selectedOption: SingleValue<SelectOption>) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      engine: value,
      year: "",
    }));

    setDisabled("year", !value);
  };

  const handleYearChange = (selectedOption: SingleValue<SelectOption>) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      year: value,
    }));
  };

  const handlePostcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setFormData((prev) => ({
      ...prev,
      postcode: value,
    }));

    if (touched.postcode) {
      validatePostcodeField(value);
    }
  };

  const handlePostcodeBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatPostcode(event.target.value);

    setTouched((prev) => ({
      ...prev,
      postcode: true,
    }));

    setFormData((prev) => ({
      ...prev,
      postcode: formatted,
    }));

    validatePostcodeField(formatted);
  };

  const isFormValid = () => {
    const requiredFields: Array<keyof CarDetailsFormData> = [
      "make",
      "model",
      "fuel",
      "year",
      "postcode",
    ];
    const allFieldsFilled = requiredFields.every((field) => Boolean(formData[field]));
    const hasRequiredEngine = canSkipEngineSelection ? true : Boolean(formData.engine);
    const isPostcodeValid = validatePostcode(formData.postcode || "");

    return allFieldsFilled && hasRequiredEngine && isPostcodeValid;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setTouched({
      make: true,
      model: true,
      fuel: true,
      engine: true,
      year: true,
      postcode: true,
    });

    const isPostcodeValid = validatePostcodeField(formData.postcode || "");

    const requiredFields: Array<keyof CarDetailsFormData> = [
      "make",
      "model",
      "fuel",
      "year",
    ];

    const allFieldsFilled = requiredFields.every((field) => Boolean(formData[field]));
    const hasRequiredEngine = canSkipEngineSelection ? true : Boolean(formData.engine);

    if (allFieldsFilled && hasRequiredEngine && isPostcodeValid) {
      goToNextStep();
    }
  };

  const selectFieldClassName = "text-[0.98rem]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {apiError ? (
        <div className="public-error-banner">
          {apiError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:gap-5">
        <div className="space-y-2">
          <label className="public-label" htmlFor="make">
            Make
          </label>
          <Select
            inputId="make"
            options={makeOptions}
            value={makeOptions.find((option) => option.value === formData.make) || null}
            onChange={handleMakeChange}
            isLoading={makesLoading}
            isSearchable
            placeholder={makesLoading ? "Loading makes..." : "Select a make"}
            styles={selectStyles}
            className={selectFieldClassName}
            classNamePrefix="car-select"
            noOptionsMessage={() =>
              makes.length ? "No makes found" : "No makes available"
            }
          />
        </div>

        <div className="space-y-2">
          <label className="public-label" htmlFor="model">
            Model
          </label>
          <Select
            inputId="model"
            options={modelOptions}
            value={modelOptions.find((option) => option.value === formData.model) || null}
            onChange={handleModelChange}
            isLoading={modelsLoading}
            isSearchable
            isDisabled={disabledStates.model || modelsLoading || !formData.make}
            placeholder={
              modelsLoading
                ? "Loading models..."
                : !formData.make
                  ? "Select make first"
                  : "Select a model"
            }
            styles={selectStyles}
            className={selectFieldClassName}
            classNamePrefix="car-select"
            noOptionsMessage={() =>
              formData.make ? "No models found for this make" : "Select make first"
            }
          />
        </div>

        <div className="space-y-2">
          <label className="public-label" htmlFor="fuel">
            Fuel type
          </label>
          <Select
            inputId="fuel"
            options={fuelOptions}
            value={fuelOptions.find((option) => option.value === formData.fuel) || null}
            onChange={handleFuelChange}
            isLoading={metadataLoading}
            isSearchable
            isDisabled={
              disabledStates.fuel ||
              metadataLoading ||
              !formData.model ||
              !fuelOptions.length
            }
            placeholder={
              !formData.model
                ? "Select model first"
                : metadataLoading
                  ? "Loading fuel types..."
                  : !fuelOptions.length
                    ? "No fuel data available"
                    : "Select a fuel type"
            }
            styles={selectStyles}
            className={selectFieldClassName}
            classNamePrefix="car-select"
            noOptionsMessage={() => "No fuel types found"}
          />
        </div>

        <div className="space-y-2">
          <label className="public-label" htmlFor="engine">
            Engine size
          </label>
          <Select
            inputId="engine"
            options={engineOptions}
            value={
              engineOptions.find((option) => option.value === formData.engine) || null
            }
            onChange={handleEngineChange}
            isLoading={metadataLoading}
            isSearchable
            isDisabled={
              disabledStates.engine ||
              metadataLoading ||
              !formData.fuel ||
              canSkipEngineSelection
            }
            placeholder={
              isPureElectricFuel(formData.fuel)
                ? "Not needed for electric vehicles"
                : metadataLoading
                  ? "Loading engine sizes..."
                  : !engineOptions.length
                    ? "No engine selection needed"
                    : !formData.fuel
                      ? "Select fuel type first"
                      : "Select an engine size"
            }
            styles={selectStyles}
            className={selectFieldClassName}
            classNamePrefix="car-select"
            noOptionsMessage={() => "No engine sizes found"}
          />
        </div>

        <div className="space-y-2">
          <label className="public-label" htmlFor="year">
            Model year
          </label>
          <Select
            inputId="year"
            options={yearOptions}
            value={yearOptions.find((option) => option.value === formData.year) || null}
            onChange={handleYearChange}
            isLoading={metadataLoading}
            isSearchable
            isDisabled={
              disabledStates.year ||
              metadataLoading ||
              (!canSkipEngineSelection && !formData.engine)
            }
            placeholder={
              !formData.fuel
                ? "Select fuel type first"
                : metadataLoading
                  ? "Loading years..."
                  : !canSkipEngineSelection && !formData.engine
                    ? "Select engine first"
                    : "Select a year"
            }
            styles={selectStyles}
            className={selectFieldClassName}
            classNamePrefix="car-select"
            noOptionsMessage={() => "No years found"}
          />
        </div>

        <div className="space-y-2">
          <label className="public-label" htmlFor="manual-postcode">
            Postcode
          </label>
          <input
            id="manual-postcode"
            className="public-input"
            type="text"
            name="postcode"
            autoComplete="postal-code"
            placeholder="SW1A 1AA"
            value={formData.postcode || ""}
            onChange={handlePostcodeChange}
            onBlur={handlePostcodeBlur}
            aria-invalid={Boolean(touched.postcode && postcodeError)}
            aria-describedby={touched.postcode && postcodeError ? "manual-postcode-error" : undefined}
          />
          <p className="text-sm text-[var(--public-muted)]">
            We use this to confirm where the booking will take place.
          </p>
          {touched.postcode && postcodeError ? (
            <p id="manual-postcode-error" className="public-field-error">
              {postcodeError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="public-btn-secondary w-full"
        >
          Previous
        </button>

        <button
          type="submit"
          className="public-btn-primary w-full"
          disabled={!isFormValid()}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

export default CarDetailsForm;
