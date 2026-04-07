import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
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

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "42px",
    borderColor: state.isFocused ? "#d97706" : "#d97706",
    boxShadow: state.isFocused ? "0 0 0 1px #d97706" : "none",
    "&:hover": {
      borderColor: "#d97706",
    },
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#22c55e"
      : state.isFocused
        ? "#fef3c7"
        : "white",
    color: state.isSelected ? "white" : "#111827",
    cursor: "pointer",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#6b7280",
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 30,
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

const CarDetailsForm = ({
  formData,
  setFormData,
  disabledStates,
  setDisabled,
  goToNextStep,
  goToPreviousStep,
}: CarDetailsFormProps) => {
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
              "Vehicle list is empty right now. Please use registration lookup until catalog data is added.",
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch makes:", error);

        if (!ignore) {
          setApiError(
            "Unable to load vehicle makes right now. Please try registration lookup.",
          );
        }
      } finally {
        if (!ignore) {
          setMakesLoading(false);
        }
      }
    };

    loadMakes();

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
        return;
      }

      try {
        setModelsLoading(true);
        setApiError("");

        const vehicleModels = await fetchVehicleModels(selectedMake.id);

        if (!ignore) {
          setModels(vehicleModels);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);

        if (!ignore) {
          setModels([]);
          setMetadataByModelId({});
          setApiError(
            "Unable to load models for the selected make. Please try registration lookup.",
          );
        }
      } finally {
        if (!ignore) {
          setModelsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      ignore = true;
    };
  }, [selectedMake]);

  useEffect(() => {
    let ignore = false;

    const loadMetadata = async () => {
      if (!models.length) {
        setMetadataByModelId({});
        return;
      }

      try {
        setMetadataLoading(true);
        setApiError("");

        const metadata = await fetchVehicleMetadataForModels(
          models.map((model) => model.id),
        );

        if (!ignore) {
          setMetadataByModelId(metadata);
        }
      } catch (error) {
        console.error("Failed to fetch vehicle metadata:", error);

        if (!ignore) {
          setMetadataByModelId({});
          setApiError(
            "Unable to load fuel, engine, and year data right now. Please try registration lookup.",
          );
        }
      } finally {
        if (!ignore) {
          setMetadataLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      ignore = true;
    };
  }, [models]);

  const makeOptions = useMemo<SelectOption[]>(() => {
    const top = makes
      .filter((make) => make.is_popular || TOP_MAKES.includes(make.name))
      .map((make) => ({
        value: make.name,
        label: `★ ${make.name}`,
      }));

    const rest = makes
      .filter((make) => !make.is_popular && !TOP_MAKES.includes(make.name))
      .map((make) => ({
        value: make.name,
        label: make.name,
      }));

    return [...top, ...rest];
  }, [makes]);

  const modelOptions = useMemo<SelectOption[]>(() => {
    return models.map((model) => ({
      value: model.name,
      label: model.name,
    }));
  }, [models]);

  const selectedMakeOption =
    makeOptions.find((option) => option.value === formData.make) || null;

  const selectedModel =
    models.find((model) => model.name === formData.model) || null;

  const selectedModelOption =
    modelOptions.find((option) => option.value === formData.model) || null;

  const fallbackYearOptions = useMemo<SelectOption[]>(() => {
    return Array.from({ length: 25 }, (_, i) => {
      const year = String(new Date().getFullYear() - i);

      return {
        value: year,
        label: year,
      };
    });
  }, []);

  const selectedModelMetadata = selectedModel
    ? metadataByModelId[selectedModel.id]
    : null;

  const fuelOptions = useMemo<SelectOption[]>(() => {
    return (selectedModelMetadata?.fuels || []).map((fuel) => ({
      value: fuel.fuel_type,
      label: fuel.fuel_type,
    }));
  }, [selectedModelMetadata]);

  const engineOptions = useMemo<SelectOption[]>(() => {
    return (selectedModelMetadata?.engineSizes || []).map((engineSize) => ({
      value: engineSize.engine_size_desc,
      label: engineSize.engine_size_desc,
    }));
  }, [selectedModelMetadata]);

  const yearOptions = useMemo<SelectOption[]>(() => {
    const metadataYearOptions = (selectedModelMetadata?.years || []).map(
      (year) => ({
        value: String(year.year),
        label: String(year.year),
      }),
    );

    return metadataYearOptions.length ? metadataYearOptions : fallbackYearOptions;
  }, [fallbackYearOptions, selectedModelMetadata]);

  const selectedFuelOption =
    fuelOptions.find((option) => option.value === formData.fuel) || null;

  const selectedEngineOption =
    engineOptions.find((option) => option.value === formData.engine) || null;

  const selectedYearOption =
    yearOptions.find((option) => option.value === formData.year) || null;

  const canSkipEngineSelection =
    isPureElectricFuel(formData.fuel) || engineOptions.length === 0;

  useEffect(() => {
    if (makesLoading || !formData.make) {
      return;
    }

    const makeExists = makes.some((make) => make.name === formData.make);

    if (!makeExists) {
      setFormData((prev) => ({
        ...prev,
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
  }, [formData.make, makes, makesLoading, setDisabled, setFormData]);

  useEffect(() => {
    if ((modelsLoading && !models.length) || !formData.model) {
      return;
    }

    const modelExists = models.some((model) => model.name === formData.model);

    if (!modelExists) {
      setFormData((prev) => ({
        ...prev,
        model: "",
        fuel: "",
        engine: "",
        year: "",
      }));

      setDisabled("fuel", true);
      setDisabled("engine", true);
      setDisabled("year", true);
    }
  }, [formData.model, models, modelsLoading, setDisabled, setFormData]);

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
    if (!formData.fuel) {
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
  }, [formData.fuel, fuelOptions, setFormData]);

  useEffect(() => {
    if (!formData.engine) {
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
  }, [engineOptions, formData.engine, setFormData]);

  useEffect(() => {
    if (!formData.year) {
      return;
    }

    const yearExists = yearOptions.some((option) => option.value === formData.year);

    if (!yearExists) {
      setFormData((prev) => ({
        ...prev,
        year: "",
      }));
    }
  }, [formData.year, setFormData, yearOptions]);

  const validatePostcodeField = (postcode: string) => {
    if (!postcode.trim()) {
      setPostcodeError("Postcode is required");
      return false;
    }

    const isValid = validatePostcode(postcode);

    if (!isValid) {
      setPostcodeError("Please enter a valid UK postcode (e.g. SW1A 1AA)");
    } else {
      setPostcodeError("");
    }

    return isValid;
  };

  const handleMakeChange = (selectedOption: SelectOption | null) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
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

  const handleModelChange = (selectedOption: SelectOption | null) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      model: value,
      fuel: "",
      engine: "",
      year: "",
    }));

    setDisabled("fuel", true);
    setDisabled("engine", true);
    setDisabled("year", true);
  };

  const handleFuelChange = (selectedOption: SelectOption | null) => {
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

  const handleEngineChange = (selectedOption: SelectOption | null) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      engine: value,
      year: "",
    }));

    setDisabled("year", !value);
  };

  const handleYearChange = (selectedOption: SelectOption | null) => {
    const value = selectedOption?.value || "";

    setFormData((prev) => ({
      ...prev,
      year: value,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "postcode" && touched.postcode) {
      validatePostcodeField(value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    if (name === "postcode") {
      const formatted = formatPostcode(value);

      setFormData((prev) => ({
        ...prev,
        postcode: formatted,
      }));

      validatePostcodeField(formatted);
    }
  };

  const isFormValid = () => {
    const requiredFields: Array<keyof CarDetailsFormData> = [
      "make",
      "model",
      "fuel",
      "year",
      "postcode",
    ];
    const allFieldsFilled = requiredFields.every((field) => !!formData[field]);
    const hasRequiredEngine = canSkipEngineSelection ? true : !!formData.engine;
    const isPostcodeValid = validatePostcode(formData.postcode || "");

    return allFieldsFilled && hasRequiredEngine && isPostcodeValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    const allFieldsFilled = requiredFields.every((field) => !!formData[field]);
    const hasRequiredEngine = canSkipEngineSelection ? true : !!formData.engine;

    if (allFieldsFilled && hasRequiredEngine && isPostcodeValid) {
      goToNextStep();
    }
  };

  return (
    <div className="car-selection-form">
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {apiError && (
            <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div>
            <Select
              inputId="make"
              name="make"
              options={makeOptions}
              value={selectedMakeOption}
              onChange={handleMakeChange}
              isLoading={makesLoading}
              isSearchable
              placeholder={makesLoading ? "Loading makes..." : "Select a make"}
              styles={selectStyles}
              className="text-sm"
              classNamePrefix="car-make-select"
              noOptionsMessage={() =>
                makes.length
                  ? "No makes found"
                  : "No makes available. Try registration lookup"
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Can&apos;t find your car? You can use the registration lookup
              instead.
            </p>
          </div>

          <div>
            <Select
              inputId="model"
              name="model"
              options={modelOptions}
              value={selectedModelOption}
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
              className="text-sm"
              classNamePrefix="car-model-select"
              noOptionsMessage={() =>
                formData.make
                  ? "No models found for this make"
                  : "Select make first"
              }
            />
          </div>

          <div>
            <Select
              inputId="fuel"
              name="fuel"
              options={fuelOptions}
              value={selectedFuelOption}
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
              className="text-sm"
              classNamePrefix="car-fuel-select"
              noOptionsMessage={() => "No fuel types found"}
            />
          </div>

          <div>
            <Select
              inputId="engine"
              name="engine"
              options={engineOptions}
              value={selectedEngineOption}
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
                  ? "Not applicable for electric cars"
                  : metadataLoading
                    ? "Loading engine sizes..."
                    : !engineOptions.length
                      ? "No engine selection needed"
                      : !formData.fuel
                        ? "Select fuel type first"
                        : "Select an engine capacity"
              }
              styles={selectStyles}
              className="text-sm"
              classNamePrefix="car-engine-select"
              noOptionsMessage={() => "No engine sizes found"}
            />
          </div>

          <div>
            <Select
              inputId="year"
              name="year"
              options={yearOptions}
              value={selectedYearOption}
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
              className="text-sm"
              classNamePrefix="car-year-select"
              noOptionsMessage={() => "No years found"}
            />
          </div>

          <div>
            <input
              className={`border px-2 py-2 w-full ${
                touched.postcode && postcodeError
                  ? "border-red-600 bg-red-50"
                  : touched.postcode && !postcodeError && formData.postcode
                    ? "border-green-600 bg-green-50"
                    : "border-amber-600"
              }`}
              type="text"
              name="postcode"
              placeholder="Your postcode (e.g. SW1A 1AA)"
              value={formData.postcode || ""}
              onChange={handleChange}
              onBlur={handleBlur}
            />

            {touched.postcode && postcodeError && (
              <p className="text-red-600 text-sm mt-1">{postcodeError}</p>
            )}

            {touched.postcode && !postcodeError && formData.postcode && (
              <p className="text-green-600 text-sm mt-1">✓ Valid postcode</p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="bg-gray-400 font-semibold text-sm px-8 py-2 my-4 cursor-pointer"
            >
              Previous
            </button>

            <button
              type="submit"
              className={`font-semibold text-sm px-8 py-2 my-4 cursor-pointer ${
                isFormValid()
                  ? "bg-green-400 hover:bg-green-500"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={!isFormValid()}
            >
              Next
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CarDetailsForm;
