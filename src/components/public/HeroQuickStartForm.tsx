import { ArrowRight, Check, ChevronDown, MapPin, Wrench } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { bookingServiceSections } from "../../data/services";
import { navigateTo } from "../../lib/navigation";
import validatePostcode from "../../utils/postcode";

const validateHeroPostcode = (value: string) => {
  if (!value.trim()) {
    return "Postcode is required.";
  }

  if (!validatePostcode(value)) {
    return "Enter a valid UK postcode such as SW1A 1AA.";
  }

  return "";
};

const validateServiceCategory = (value: string) => {
  if (!value.trim()) {
    return "Select the type of service you need.";
  }

  return "";
};

const serviceCategoryOptions = [
  ...bookingServiceSections.map((section) => ({
    label: section.title,
    value: section.id,
  })),
  {
    label: "Not sure yet",
    value: "not-sure-yet",
  },
];

function HeroQuickStartForm() {
  const fieldIdPrefix = useId();
  const [postcode, setPostcode] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    postcode: false,
    serviceCategory: false,
  });
  const serviceMenuRef = useRef<HTMLDivElement | null>(null);
  const postcodeErrorId = `${fieldIdPrefix}-postcode-error`;
  const serviceCategoryErrorId = `${fieldIdPrefix}-service-category-error`;
  const postcodeError = validateHeroPostcode(postcode);
  const serviceCategoryError = validateServiceCategory(serviceCategory);
  const isFormValid = !postcodeError && !serviceCategoryError;
  const selectedServiceLabel =
    serviceCategoryOptions.find((option) => option.value === serviceCategory)
      ?.label ?? "Service needed";
  const hasPostcodeValue = postcode.trim().length > 0;
  const showPostcodeError =
    Boolean(postcodeError) &&
    ((touched.postcode && hasPostcodeValue) || hasSubmitted);
  const showServiceCategoryError =
    hasSubmitted && Boolean(serviceCategoryError);

  const handleBlur = (field: "postcode" | "serviceCategory") => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);

    setTouched({
      postcode: true,
      serviceCategory: true,
    });

    if (!isFormValid) {
      return;
    }

    const searchParams = new URLSearchParams();
    const cleanedPostcode = postcode.trim().toUpperCase();

    if (cleanedPostcode) {
      searchParams.set("postcode", cleanedPostcode);
    }

    if (serviceCategory && serviceCategory !== "not-sure-yet") {
      searchParams.set("serviceCategory", serviceCategory);
    }

    navigateTo(
      searchParams.toString() ? `/book?${searchParams.toString()}` : "/book",
    );
  };

  useEffect(() => {
    if (!isServiceMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!serviceMenuRef.current?.contains(event.target as Node)) {
        setIsServiceMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsServiceMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isServiceMenuOpen]);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="rounded-[1.55rem] border border-white/55 bg-white/96 p-3 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.42)] backdrop-blur-sm sm:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12.25rem] md:items-start">
          <div className="space-y-2">
            <label
              className={`relative flex min-h-14 items-center rounded-[1rem] border px-4 text-slate-900 ${
                showPostcodeError
                  ? "border-rose-300 bg-rose-50/85"
                  : "border-slate-200 bg-slate-50/92"
              }`}
            >
              <MapPin className="absolute left-3 h-4 w-4 text-[#1c69d4]/70" />
              <input
                type="text"
                name="postcode"
                required
                autoComplete="postal-code"
                autoCapitalize="characters"
                placeholder="Enter postcode"
                className="w-full border-0 bg-transparent pl-7 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
                onBlur={() => handleBlur("postcode")}
                aria-invalid={showPostcodeError}
                aria-describedby={
                  showPostcodeError ? postcodeErrorId : undefined
                }
              />
            </label>
          </div>

          <div ref={serviceMenuRef} className="relative space-y-2">
            <button
              type="button"
              onClick={() => setIsServiceMenuOpen((current) => !current)}
              aria-invalid={showServiceCategoryError}
              aria-describedby={
                showServiceCategoryError ? serviceCategoryErrorId : undefined
              }
              aria-expanded={isServiceMenuOpen}
              aria-haspopup="listbox"
              className={`relative flex min-h-14 w-full items-center rounded-[1rem] border px-4 text-left ${
                showServiceCategoryError
                  ? "border-rose-300 bg-rose-50/85"
                  : "border-slate-200 bg-slate-50/92"
              }`}
            >
              <Wrench className="absolute left-3 h-4 w-4 text-[#1c69d4]/70" />
              <span
                className={`block w-full truncate pl-7 pr-8 text-sm font-medium ${
                  serviceCategory ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {selectedServiceLabel}
              </span>
              <ChevronDown
                className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${
                  isServiceMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isServiceMenuOpen ? (
              <div
                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[1rem] border border-slate-200 bg-white p-2 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.28)]"
                role="listbox"
                aria-label="Service needed"
              >
                {serviceCategoryOptions.map((option) => {
                  const isSelected = serviceCategory === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setServiceCategory(option.value);
                        setTouched((current) => ({
                          ...current,
                          serviceCategory: true,
                        }));
                        setIsServiceMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium transition ${
                        isSelected
                          ? "bg-blue-50 text-[#1c69d4]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span>{option.label}</span>
                      {isSelected ? (
                        <Check className="h-4 w-4 text-[#1c69d4]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[1rem] bg-[#1c69d4] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_-30px_rgba(28,105,212,0.55)] transition hover:bg-[#1557b3] disabled:cursor-pointer disabled:opacity-100 md:min-w-[12rem]"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {showPostcodeError || showServiceCategoryError ? (
          <div className="public-error-banner mt-3" role="alert">
            <div className="grid gap-2 md:grid-cols-2">
              {showPostcodeError ? (
                <p id={postcodeErrorId}>{postcodeError}</p>
              ) : (
                <div />
              )}
              {showServiceCategoryError ? (
                <p id={serviceCategoryErrorId}>{serviceCategoryError}</p>
              ) : (
                <div />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}

export default HeroQuickStartForm;
