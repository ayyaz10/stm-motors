import { useMemo, useState } from "react";
import { services } from "../../data/services";
import { createBooking, type CreatedBooking } from "../../lib/bookings";
import validatePostcode, { formatPostcode } from "../../utils/postcode";

interface UserDetailsProps {
  selectedWorks: string[];
  formPlateData: {
    registration: string;
    postcode: string;
  };
  formDetailsData: {
    make: string;
    model: string;
    fuel: string;
    engine: string;
    year: string;
    postcode: string;
  };
  userDetails: {
    fullName: string;
    phone: string;
    email: string;
    street1: string;
    street2: string;
    city: string;
    postcode: string;
    carRegistration: string;
  };
  setUserDetails: React.Dispatch<
    React.SetStateAction<{
      fullName: string;
      phone: string;
      email: string;
      street1: string;
      street2: string;
      city: string;
      postcode: string;
      carRegistration: string;
    }>
  >;
  setCreatedBooking: React.Dispatch<React.SetStateAction<CreatedBooking | null>>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const UserDetails = ({
  selectedWorks,
  formPlateData,
  formDetailsData,
  userDetails,
  setUserDetails,
  setCreatedBooking,
  goToNextStep,
  goToPreviousStep,
}: UserDetailsProps) => {
  const [errors, setErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
    street1: "",
    city: "",
    postcode: "",
    carRegistration: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedServiceObjects = useMemo(() => {
    return services.filter((service) => selectedWorks.includes(service.id));
  }, [selectedWorks]);

  const totalPrice = useMemo(() => {
    return selectedServiceObjects.reduce(
      (total, service) => total + service.price,
      0,
    );
  }, [selectedServiceObjects]);

  const fallbackRegistration =
    formPlateData.registration ||
    `${formDetailsData.make} ${formDetailsData.model} ${formDetailsData.year}`.trim();

  const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

  const validateName = (value: string) => {
    const cleaned = normalizeSpaces(value);

    if (!cleaned) return "Full name is required";
    if (cleaned.length < 2) return "Full name is too short";
    if (cleaned.length > 60) return "Full name is too long";
    if (!/^[a-zA-Z\s'-]+$/.test(cleaned)) {
      return "Enter a valid full name";
    }

    return "";
  };

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\s+/g, "").trim();

    if (!cleaned) return "Phone number is required";
    if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
      return "Enter a valid phone number";
    }

    return "";
  };

  const validateEmail = (value: string) => {
    const cleaned = value.trim().toLowerCase();

    if (!cleaned) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      return "Enter a valid email address";
    }

    return "";
  };

  const validateStreet1 = (value: string) => {
    const cleaned = normalizeSpaces(value);

    if (!cleaned) return "Street address is required";
    if (cleaned.length < 5) return "Enter a valid street address";
    if (cleaned.length > 100) return "Street address is too long";

    return "";
  };

  const validateCity = (value: string) => {
    const cleaned = normalizeSpaces(value);

    if (!cleaned) return "City is required";
    if (cleaned.length < 2) return "City is too short";
    if (cleaned.length > 50) return "City is too long";
    if (!/^[a-zA-Z\s'-]+$/.test(cleaned)) {
      return "Enter a valid city";
    }

    return "";
  };

  const validatePostcodeField = (value: string) => {
    const cleaned = value.trim().toUpperCase();

    if (!cleaned) return "Postcode is required";
    if (!validatePostcode(cleaned)) return "Enter a valid postcode";

    return "";
  };

  const validateCarRegistration = (value: string) => {
    const cleaned = value.replace(/\s+/g, "").trim().toUpperCase();

    if (!cleaned) return "Car registration is required";
    if (cleaned.length < 2 || cleaned.length > 10) {
      return "Enter a valid registration number";
    }
    if (!/^[A-Z0-9]+$/.test(cleaned)) {
      return "Enter a valid registration number";
    }

    return "";
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "fullName":
        return validateName(value);
      case "phone":
        return validatePhone(value);
      case "email":
        return validateEmail(value);
      case "street1":
        return validateStreet1(value);
      case "city":
        return validateCity(value);
      case "postcode":
        return validatePostcodeField(value);
      case "carRegistration":
        return validateCarRegistration(value);
      default:
        return "";
    }
  };

  const getValidationErrors = () => {
    return {
      fullName: validateName(userDetails.fullName),
      phone: validatePhone(userDetails.phone),
      email: validateEmail(userDetails.email),
      street1: validateStreet1(userDetails.street1),
      city: validateCity(userDetails.city),
      postcode: validatePostcodeField(userDetails.postcode),
      carRegistration: validateCarRegistration(userDetails.carRegistration),
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setUserDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name in errors) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }

    if (submitError) {
      setSubmitError("");
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let finalValue = value;

    if (name === "postcode") {
      finalValue = formatPostcode(value);

      setUserDetails((prev) => ({
        ...prev,
        postcode: finalValue,
      }));
    }

    const errorMessage = validateField(name, finalValue);

    if (name in errors) {
      setErrors((prev) => ({
        ...prev,
        [name]: errorMessage,
      }));
    }
  };

  const buildBookingPayload = () => {
    const cleanedRegistration =
      userDetails.carRegistration.trim() || fallbackRegistration;

    return {
      full_name: normalizeSpaces(userDetails.fullName),
      phone: userDetails.phone.replace(/\s+/g, ""),
      email: userDetails.email.trim().toLowerCase(),
      street_address_1: normalizeSpaces(userDetails.street1),
      street_address_2: userDetails.street2
        ? normalizeSpaces(userDetails.street2)
        : null,
      city: normalizeSpaces(userDetails.city),
      postcode: formatPostcode(userDetails.postcode),
      car_registration: cleanedRegistration.replace(/\s+/g, "").toUpperCase(),
      make: formDetailsData.make.trim() || null,
      model: formDetailsData.model.trim() || null,
      fuel: formDetailsData.fuel.trim() || null,
      engine: formDetailsData.engine.trim() || null,
      year: formDetailsData.year.trim() || null,
      selected_services: selectedWorks,
      total_price: totalPrice,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const newErrors = getValidationErrors();
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (hasErrors) {
      const firstErrorField = Object.keys(newErrors).find(
        (key) => newErrors[key as keyof typeof newErrors],
      );

      if (firstErrorField) {
        const el = document.querySelector(
          `[name="${firstErrorField}"]`,
        ) as HTMLElement | null;

        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }

      return;
    }

    try {
      setIsSubmitting(true);

      const payload = buildBookingPayload();
      const booking = await createBooking(payload);

      setCreatedBooking(booking);
      goToNextStep();
    } catch (error) {
      console.error("Booking submission failed:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your booking.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-4">Your details</h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <input
                className={`px-3 py-2 w-full border ${
                  errors.fullName ? "border-red-500" : "border-amber-600"
                }`}
                type="text"
                name="fullName"
                placeholder="Full name"
                value={userDetails.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.fullName && (
                <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <input
                className={`px-3 py-2 w-full border ${
                  errors.phone ? "border-red-500" : "border-amber-600"
                }`}
                type="text"
                name="phone"
                placeholder="Phone number"
                value={userDetails.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <input
                className={`px-3 py-2 w-full border ${
                  errors.email ? "border-red-500" : "border-amber-600"
                }`}
                type="email"
                name="email"
                placeholder="Email address"
                value={userDetails.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    className={`px-3 py-2 w-full border ${
                      errors.street1 ? "border-red-500" : "border-amber-600"
                    }`}
                    type="text"
                    name="street1"
                    placeholder="Street address 1"
                    value={userDetails.street1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.street1 && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.street1}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    className="px-3 py-2 w-full border border-amber-600"
                    type="text"
                    name="street2"
                    placeholder="Street address 2 (optional)"
                    value={userDetails.street2}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <input
                    className={`px-3 py-2 w-full border ${
                      errors.city ? "border-red-500" : "border-amber-600"
                    }`}
                    type="text"
                    name="city"
                    placeholder="City"
                    value={userDetails.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.city && (
                    <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <input
                    className={`px-3 py-2 w-full border ${
                      errors.postcode ? "border-red-500" : "border-amber-600"
                    }`}
                    type="text"
                    name="postcode"
                    placeholder="Postcode"
                    value={userDetails.postcode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.postcode && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.postcode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <input
                className={`px-3 py-2 w-full border ${
                  errors.carRegistration ? "border-red-500" : "border-amber-600"
                }`}
                type="text"
                name="carRegistration"
                placeholder="Car registration number"
                value={userDetails.carRegistration}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.carRegistration && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.carRegistration}
                </p>
              )}
            </div>

            {!userDetails.carRegistration && fallbackRegistration && (
              <p className="text-sm text-gray-500">
                Suggested: {fallbackRegistration}
              </p>
            )}

            {submitError && (
              <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
                className="bg-gray-400 font-semibold text-sm px-8 py-2 my-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-400 hover:bg-green-500 font-semibold text-sm px-8 py-2 my-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit booking"}
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="bg-zinc-900 text-white rounded p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
              Total price
            </p>

            <h2 className="text-4xl font-bold mb-2">
              £{totalPrice.toFixed(2)}
            </h2>

            <p className="text-sm text-gray-300 mb-6">
              Quote includes VAT where applicable
            </p>

            <div className="text-sm text-gray-200 space-y-3">
              <div>
                <p>
                  {formDetailsData.make} {formDetailsData.model}{" "}
                  {formDetailsData.engine} {formDetailsData.fuel}{" "}
                  {formDetailsData.year} ·{" "}
                  {formPlateData.postcode || formDetailsData.postcode}
                </p>
              </div>

              <div className="space-y-1">
                {selectedServiceObjects.map((service) => (
                  <p key={service.id}>
                    {service.name} · Labour time: {service.labourTime}
                  </p>
                ))}
              </div>

              <div>
                <p>
                  Parts:{" "}
                  {[
                    ...new Set(
                      selectedServiceObjects.flatMap(
                        (service) => service.partsIncluded || [],
                      ),
                    ),
                  ].join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
