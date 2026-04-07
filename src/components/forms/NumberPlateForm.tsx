import { useState } from "react";
import validatePostcode from "../../utils/postcode";

interface NumberPlateFormProps {
  formData: {
    registration: string;
    postcode: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      registration: string;
      postcode: string;
    }>
  >;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const NumberPlateForm = ({
  formData,
  setFormData,
  goToNextStep,
  goToPreviousStep,
}: NumberPlateFormProps) => {
  const [errors, setErrors] = useState({
    registration: "",
    postcode: "",
  });

  const [touched, setTouched] = useState({
    registration: false,
    postcode: false,
  });

  const validateField = (name: string, value: string) => {
    if (name === "registration") {
      if (!value.trim()) {
        return "Registration number is required";
      }
      return "";
    }

    if (name === "postcode") {
      if (!value.trim()) {
        return "Postcode is required";
      }

      if (!validatePostcode(value)) {
        return "Please enter a valid UK postcode (e.g., SW1A 1AA)";
      }

      return "";
    }

    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name as keyof typeof touched]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const isFormValid = () => {
    return (
      formData.registration.trim() !== "" &&
      formData.postcode.trim() !== "" &&
      validatePostcode(formData.postcode)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTouched = {
      registration: true,
      postcode: true,
    };

    const newErrors = {
      registration: validateField("registration", formData.registration),
      postcode: validateField("postcode", formData.postcode),
    };

    setTouched(newTouched);
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (!hasErrors) {
      goToNextStep();
    }
  };

  return (
    <div className="car-numberplate-form">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <input
              className={`border px-2 py-2 w-full ${
                touched.registration && errors.registration
                  ? "border-red-600 bg-red-50"
                  : touched.registration &&
                      !errors.registration &&
                      formData.registration
                    ? "border-green-600 bg-green-50"
                    : "border-amber-600"
              }`}
              type="text"
              name="registration"
              placeholder="Your registration number"
              value={formData.registration}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.registration && errors.registration && (
              <p className="text-red-600 text-sm mt-1">{errors.registration}</p>
            )}
          </div>

          <div>
            <input
              className={`border px-2 py-2 w-full ${
                touched.postcode && errors.postcode
                  ? "border-red-600 bg-red-50"
                  : touched.postcode && !errors.postcode && formData.postcode
                    ? "border-green-600 bg-green-50"
                    : "border-amber-600"
              }`}
              type="text"
              name="postcode"
              placeholder="Your postcode"
              value={formData.postcode}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.postcode && errors.postcode && (
              <p className="text-red-600 text-sm mt-1">{errors.postcode}</p>
            )}
            {touched.postcode && !errors.postcode && formData.postcode && (
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
              className={`font-semibold text-sm px-8 py-2 my-4 cursor-pointer ${
                isFormValid()
                  ? "bg-green-400 hover:bg-green-500"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              type="submit"
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

export default NumberPlateForm;
