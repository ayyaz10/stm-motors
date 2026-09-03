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

const registrationErrorId = "registration-error";
const postcodeErrorId = "plate-postcode-error";

function NumberPlateForm({
  formData,
  setFormData,
  goToNextStep,
  goToPreviousStep,
}: NumberPlateFormProps) {
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
        return "Registration number is required.";
      }

      return "";
    }

    if (name === "postcode") {
      if (!value.trim()) {
        return "Postcode is required.";
      }

      if (!validatePostcode(value)) {
        return "Enter a valid UK postcode such as SW1A 1AA.";
      }

      return "";
    }

    return "";
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

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

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const isFormValid = () =>
    formData.registration.trim() !== "" &&
    formData.postcode.trim() !== "" &&
    validatePostcode(formData.postcode);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextTouched = {
      registration: true,
      postcode: true,
    };

    const nextErrors = {
      registration: validateField("registration", formData.registration),
      postcode: validateField("postcode", formData.postcode),
    };

    setTouched(nextTouched);
    setErrors(nextErrors);

    if (!Object.values(nextErrors).some(Boolean)) {
      goToNextStep();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <label className="public-label" htmlFor="registration">
          Registration number
        </label>
        <input
          id="registration"
          className="public-input"
          type="text"
          name="registration"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="AB12 CDE"
          value={formData.registration}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(touched.registration && errors.registration)}
          aria-describedby={
            touched.registration && errors.registration ? registrationErrorId : undefined
          }
        />
        <p className="text-sm text-[var(--public-muted)]">
          Enter the registration you want us to use for your booking.
        </p>
        {touched.registration && errors.registration ? (
          <p id={registrationErrorId} className="public-field-error">
            {errors.registration}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="public-label" htmlFor="plate-postcode">
          Postcode
        </label>
        <input
          id="plate-postcode"
          className="public-input"
          type="text"
          name="postcode"
          inputMode="text"
          autoComplete="postal-code"
          placeholder="SW1A 1AA"
          value={formData.postcode}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(touched.postcode && errors.postcode)}
          aria-describedby={
            touched.postcode && errors.postcode ? postcodeErrorId : undefined
          }
        />
        <p className="text-sm text-[var(--public-muted)]">
          We use your postcode to confirm local availability and pricing.
        </p>
        {touched.postcode && errors.postcode ? (
          <p id={postcodeErrorId} className="public-field-error">
            {errors.postcode}
          </p>
        ) : null}
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
          className="public-btn-primary w-full"
          type="submit"
          disabled={!isFormValid()}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

export default NumberPlateForm;
