import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheckBig,
  ClipboardList,
  Headphones,
  MapPin,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import GoogleRecaptchaField from "../components/forms/GoogleRecaptchaField";
import { mechanicServiceOptions as serviceOptions } from "../data/mechanicServiceOptions";
import type {
  MechanicApplicationInput,
  MechanicApplicationRecord,
  MechanicApplicationType,
} from "../lib/mechanicApplications";
import { submitMechanicApplication } from "../lib/mechanicApplications";
import { trackAnalyticsEvent, trackGoogleAdsConversion } from "../lib/googleTracking";
import { usePageMetadata } from "../lib/seo";

type ApplicationStep = 1 | 2 | 3;

type ApplicationField =
  | keyof MechanicApplicationInput
  | "hasQualifications"
  | "submission"
  | "step";

type ApplicationErrors = Partial<Record<ApplicationField, string>>;
type ApplicationTouched = Partial<Record<ApplicationField, boolean>>;
type AttemptedSteps = Partial<Record<ApplicationStep, boolean>>;
type InteractedSteps = Partial<Record<ApplicationStep, boolean>>;

interface MechanicTypeOption {
  description: string;
  icon: typeof Wrench;
  title: string;
  value: MechanicApplicationType;
}

const mechanicTypeOptions: MechanicTypeOption[] = [
  {
    value: "mobile_mechanic",
    title: "Mobile mechanic",
    description:
      "You mainly travel to the customer and complete the work at their location.",
    icon: Wrench,
  },
  {
    value: "garage_and_mobile",
    title: "Garage + mobile",
    description:
      "You operate from a workshop as well, but you also carry out mobile appointments.",
    icon: Building2,
  },
  {
    value: "garage_based",
    title: "Garage-based",
    description:
      "You primarily work from a garage and want to discuss suitable STM Motors work.",
    icon: BriefcaseBusiness,
  },
];

const workTypeOptions = [
  { label: "Mobile mechanic service", value: "mobile_service" },
  { label: "Customer drop-off", value: "customer_drop_off" },
  { label: "Collection and delivery", value: "collection_and_delivery" },
  { label: "Electric vehicle support", value: "electric_vehicle_support" },
];

const insuranceOptions = [
  { label: "Trade insurance", value: "trade_insurance" },
  { label: "Public liability insurance", value: "public_liability" },
  { label: "Motor trade policy", value: "motor_trade_policy" },
  { label: "No insurance currently", value: "no_current_insurance" },
];

const mechanicBenefits = [
  {
    icon: MapPin,
    title: "Local opportunities",
    description:
      "Take on suitable work matched to the services you offer and the area you cover.",
  },
  {
    icon: CalendarDays,
    title: "Flexible working",
    description:
      "Share your preferred working pattern, travel radius, and the jobs that fit your setup.",
  },
  {
    icon: ClipboardList,
    title: "Clear job information",
    description:
      "Assigned jobs include the vehicle, service, location, and practical details you need.",
  },
  {
    icon: Headphones,
    title: "Team support",
    description:
      "STM Motors helps coordinate customer information and the operational side of each job.",
  },
];

const mechanicJourney = [
  {
    title: "Tell us about your work",
    description:
      "Share your experience, services, equipment, work setup, and usual coverage area.",
  },
  {
    title: "Get matched to suitable jobs",
    description:
      "STM Motors uses your skills and location to coordinate relevant local opportunities.",
  },
  {
    title: "Complete work with clear details",
    description:
      "Use the mechanic portal to view assigned jobs and follow the guided service workflow.",
  },
];

const mechanicRequirements = [
  "Relevant vehicle servicing or repair experience",
  "Suitable tools and equipment for the work you offer",
  "Appropriate insurance for the jobs you carry out",
  "Reliable communication and professional customer care",
];

const mechanicFaqs = [
  {
    question: "Who can apply to work with STM Motors?",
    answer:
      "Mobile mechanics, garage-based mechanics, and businesses offering a mixture of workshop and mobile services can apply.",
  },
  {
    question: "What type of work is available?",
    answer:
      "Opportunities can include routine servicing, brakes, diagnostics, batteries, filters, suspension, steering, heating, and air-conditioning work. Jobs are matched to the services you tell us you offer.",
  },
  {
    question: "How are jobs matched to me?",
    answer:
      "Matching is based on your service area, work setup, skills, equipment, and the requirements of each customer booking. Job volume is not guaranteed and can vary by location and demand.",
  },
  {
    question: "Do I need formal qualifications?",
    answer:
      "Tell us about any qualifications, certifications, or practical training you have. Experienced mechanics without formal qualifications can still share their details with us.",
  },
  {
    question: "What insurance and equipment do I need?",
    answer:
      "Requirements depend on the work you carry out. You should have suitable tools and the appropriate insurance for any job you accept. The application lets you describe your current setup.",
  },
  {
    question: "What happens after I send the form?",
    answer:
      "STM Motors will use the contact details you provide to discuss suitable mechanic opportunities and the practical next steps with you.",
  },
];

const applicationNextSteps = [
  "Keep an eye on the email address and phone number you provided.",
  "We will discuss your services, coverage, and preferred working setup.",
  "Any practical next steps will be shared with you directly.",
];

const MECHANIC_APPLICATION_DRAFT_STORAGE_KEY =
  "stm-mechanic-application-draft";

const defaultFormState: MechanicApplicationInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  postcode: "",
  businessName: "",
  mechanicType: "",
  yearsExperience: "",
  serviceRadiusMiles: "",
  websiteUrl: "",
  qualificationsSummary: "",
  insuranceHeld: [],
  servicesOffered: [],
  workTypes: [],
  hasDiagnosticTools: null,
  hasServiceVan: null,
  additionalNotes: "",
};

interface MechanicApplicationDraft {
  currentStep: ApplicationStep;
  formState: MechanicApplicationInput;
  hasQualifications: boolean | null;
}

function isApplicationStep(value: unknown): value is ApplicationStep {
  return value === 1 || value === 2 || value === 3;
}

function normaliseStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normaliseSavedFormState(value: unknown): MechanicApplicationInput {
  if (!value || typeof value !== "object") {
    return defaultFormState;
  }

  const source = value as Partial<Record<keyof MechanicApplicationInput, unknown>>;

  return {
    firstName: typeof source.firstName === "string" ? source.firstName : "",
    lastName: typeof source.lastName === "string" ? source.lastName : "",
    email: typeof source.email === "string" ? source.email : "",
    phone: typeof source.phone === "string" ? source.phone : "",
    postcode: typeof source.postcode === "string" ? source.postcode : "",
    businessName:
      typeof source.businessName === "string" ? source.businessName : "",
    mechanicType:
      source.mechanicType === "mobile_mechanic" ||
      source.mechanicType === "garage_and_mobile" ||
      source.mechanicType === "garage_based"
        ? source.mechanicType
        : "",
    yearsExperience:
      typeof source.yearsExperience === "string" ? source.yearsExperience : "",
    serviceRadiusMiles:
      typeof source.serviceRadiusMiles === "string"
        ? source.serviceRadiusMiles
        : "",
    websiteUrl: typeof source.websiteUrl === "string" ? source.websiteUrl : "",
    qualificationsSummary:
      typeof source.qualificationsSummary === "string"
        ? source.qualificationsSummary
        : "",
    insuranceHeld: normaliseStringList(source.insuranceHeld),
    servicesOffered: normaliseStringList(source.servicesOffered),
    workTypes: normaliseStringList(source.workTypes),
    hasDiagnosticTools:
      typeof source.hasDiagnosticTools === "boolean"
        ? source.hasDiagnosticTools
        : null,
    hasServiceVan:
      typeof source.hasServiceVan === "boolean" ? source.hasServiceVan : null,
    additionalNotes:
      typeof source.additionalNotes === "string" ? source.additionalNotes : "",
  };
}

function readSavedMechanicApplicationDraft():
  | MechanicApplicationDraft
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(
      MECHANIC_APPLICATION_DRAFT_STORAGE_KEY,
    );

    if (!rawDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(rawDraft) as Partial<MechanicApplicationDraft>;

    return {
      currentStep: isApplicationStep(parsedDraft.currentStep)
        ? parsedDraft.currentStep
        : 1,
      formState: normaliseSavedFormState(parsedDraft.formState),
      hasQualifications:
        typeof parsedDraft.hasQualifications === "boolean"
          ? parsedDraft.hasQualifications
          : null,
    };
  } catch {
    return null;
  }
}

function toggleSelection(values: string[], nextValue: string) {
  return values.includes(nextValue)
    ? values.filter((value) => value !== nextValue)
    : [...values, nextValue];
}

const stepFieldMap: Record<ApplicationStep, ApplicationField[]> = {
  1: ["firstName", "lastName", "email", "phone", "postcode"],
  2: ["mechanicType"],
  3: [
    "yearsExperience",
    "serviceRadiusMiles",
    "hasQualifications",
    "qualificationsSummary",
    "servicesOffered",
    "workTypes",
    "insuranceHeld",
    "hasDiagnosticTools",
    "hasServiceVan",
  ],
};

function getFieldError(
  field: ApplicationField,
  formState: MechanicApplicationInput,
  hasQualifications: boolean | null,
): string | undefined {
  switch (field) {
    case "firstName":
      return formState.firstName.trim() ? undefined : "First name is required.";
    case "lastName":
      return formState.lastName.trim() ? undefined : "Last name is required.";
    case "email":
      if (!formState.email.trim()) {
        return "Email is required.";
      }
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())
        ? undefined
        : "Enter a valid email address.";
    case "phone":
      return formState.phone.trim() ? undefined : "Phone number is required.";
    case "postcode":
      return formState.postcode.trim() ? undefined : "Postcode is required.";
    case "mechanicType":
      return formState.mechanicType
        ? undefined
        : "Choose the work setup that fits you best.";
    case "yearsExperience":
      return formState.yearsExperience.trim()
        ? undefined
        : "Add your years of experience.";
    case "serviceRadiusMiles":
      return formState.serviceRadiusMiles.trim()
        ? undefined
        : "Add your travel radius in miles.";
    case "hasQualifications":
      return hasQualifications === null
        ? "Tell us whether you have qualifications or training."
        : undefined;
    case "qualificationsSummary":
      if (!hasQualifications) {
        return undefined;
      }
      return formState.qualificationsSummary.trim()
        ? undefined
        : "Summarise your qualifications or training.";
    case "servicesOffered":
      return formState.servicesOffered.length > 0
        ? undefined
        : "Select at least one service you currently offer.";
    case "workTypes":
      return formState.workTypes.length > 0
        ? undefined
        : "Select at least one way you usually fulfil bookings.";
    case "insuranceHeld":
      return formState.insuranceHeld.length > 0
        ? undefined
        : "Tell us what cover you currently hold.";
    case "hasDiagnosticTools":
      return formState.hasDiagnosticTools === null
        ? "Let us know whether you have diagnostic tools."
        : undefined;
    case "hasServiceVan":
      return formState.hasServiceVan === null
        ? "Let us know whether you have a service van."
        : undefined;
    default:
      return undefined;
  }
}

function getStepForField(field: ApplicationField): ApplicationStep | null {
  if (stepFieldMap[1].includes(field)) {
    return 1;
  }

  if (stepFieldMap[2].includes(field)) {
    return 2;
  }

  if (stepFieldMap[3].includes(field)) {
    return 3;
  }

  return null;
}

function StepPill({
  disabled,
  index,
  isActive,
  isComplete,
  label,
  onClick,
}: {
  disabled: boolean;
  index: ApplicationStep;
  isActive: boolean;
  isComplete: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={isActive ? "step" : undefined}
      aria-label={label}
      className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-white opacity-60"
          : isActive
            ? "cursor-pointer border-blue-200 bg-blue-50 shadow-[0_16px_40px_-34px_rgba(28,105,212,0.55)]"
            : isComplete
              ? "cursor-pointer border-slate-200 bg-slate-50 hover:border-blue-100 hover:bg-blue-50/60"
              : "cursor-pointer border-slate-200 bg-white hover:border-blue-100 hover:bg-blue-50/50"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
          isActive || isComplete
            ? "border-[#1c69d4] bg-[#1c69d4] text-white"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        {isComplete ? <Check className="h-4 w-4" /> : index}
      </span>
      <div className="min-w-0">
        <p
          className={`truncate text-sm font-semibold ${
            isActive || isComplete ? "text-slate-950" : "text-slate-700"
          }`}
        >
          {label}
        </p>
      </div>
    </button>
  );
}

function SelectionChip({
  checked,
  description,
  disabled = false,
  label,
  onToggle,
}: {
  checked: boolean;
  description?: string;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`rounded-2xl border p-4 text-left ${
        checked
          ? "border-[#1c69d4] bg-blue-50 shadow-[0_14px_30px_-24px_rgba(28,105,212,0.45)]"
          : disabled
            ? "border-slate-200 bg-slate-50 opacity-45"
            : "border-slate-200 bg-white hover:border-[#1c69d4]/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "border-[#1c69d4] bg-[#1c69d4] text-white"
              : "border-slate-300 bg-white text-transparent"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function RadioCard({
  checked,
  description,
  icon: Icon,
  title,
  onSelect,
}: MechanicTypeOption & { checked: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[1.5rem] border p-5 text-left transition-colors ${
        checked
          ? "border-[#1c69d4] bg-blue-50 shadow-[0_18px_40px_-28px_rgba(28,105,212,0.5)]"
          : "border-slate-200 bg-white hover:border-[#1c69d4]/35"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1c69d4]">
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "border-[#1c69d4] bg-[#1c69d4] text-white"
              : "border-slate-300 bg-white text-transparent"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>
      <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </button>
  );
}

function ChoiceButtons({
  noLabel = "No",
  onChange,
  yesLabel = "Yes",
  title,
  value,
}: {
  noLabel?: string;
  onChange: (nextValue: boolean) => void;
  yesLabel?: string;
  title: string;
  value: boolean | null;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: yesLabel, nextValue: true },
          { label: noLabel, nextValue: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.nextValue)}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
              value === option.nextValue
                ? "border-[#1c69d4] bg-blue-50 text-[#1c69d4]"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#1c69d4]/40"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MechanicApplicationPage() {
  usePageMetadata({
    title: "Apply to Be a Mechanic | STM Motors",
    description:
      "Join the STM Motors mechanic network for suitable local vehicle service and repair opportunities across the UK.",
    pathname: "/mechanic/apply",
  });

  const savedDraft = readSavedMechanicApplicationDraft();

  const [currentStep, setCurrentStep] = useState<ApplicationStep>(
    savedDraft?.currentStep ?? 1,
  );
  const [formState, setFormState] = useState<MechanicApplicationInput>(
    savedDraft?.formState ?? defaultFormState,
  );
  const [touchedFields, setTouchedFields] = useState<ApplicationTouched>({});
  const [attemptedSteps, setAttemptedSteps] = useState<AttemptedSteps>({});
  const [interactedSteps, setInteractedSteps] = useState<InteractedSteps>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetCounter, setCaptchaResetCounter] = useState(0);
  const [hasQualifications, setHasQualifications] = useState<boolean | null>(
    savedDraft?.hasQualifications ?? null,
  );
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedApplication, setSubmittedApplication] =
    useState<MechanicApplicationRecord | null>(null);
  const formCardRef = useRef<HTMLFormElement | null>(null);
  const formHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const shouldQuietResetOpenedStepRef = useRef(false);
  const shouldScrollToFormTopRef = useRef(false);
  const [quietOpenStep, setQuietOpenStep] = useState<ApplicationStep | null>(
    null,
  );
  const applicationIdRef = useRef<string | null>(null);
  const recaptchaSiteKey =
    typeof __STM_RECAPTCHA_SITE_KEY__ === "string"
      ? __STM_RECAPTCHA_SITE_KEY__.trim()
      : "";

  useEffect(() => {
    if (submittedApplication || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      MECHANIC_APPLICATION_DRAFT_STORAGE_KEY,
      JSON.stringify({
        currentStep,
        formState,
        hasQualifications,
      } satisfies MechanicApplicationDraft),
    );
  }, [currentStep, formState, hasQualifications, submittedApplication]);

  useEffect(() => {
    if (!submittedApplication || typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(MECHANIC_APPLICATION_DRAFT_STORAGE_KEY);
  }, [submittedApplication]);

  const scrollFormIntoView = (behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") {
      return;
    }

    const formCard = formCardRef.current;

    if (!formCard) {
      return;
    }

    const navigationOffset = 112;
    const formTop =
      formCard.getBoundingClientRect().top + window.scrollY - navigationOffset;

    window.scrollTo({
      top: Math.max(formTop, 0),
      behavior,
    });

    window.requestAnimationFrame(() => {
      formHeadingRef.current?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (!shouldQuietResetOpenedStepRef.current) {
      return;
    }

    shouldQuietResetOpenedStepRef.current = false;
    clearStepFeedback(currentStep);
    setSubmissionError(null);
  }, [currentStep]);

  useEffect(() => {
    if (!shouldScrollToFormTopRef.current) {
      return;
    }

    shouldScrollToFormTopRef.current = false;
    scrollFormIntoView();
  }, [currentStep]);

  const updateField = <Key extends keyof MechanicApplicationInput>(
    key: Key,
    value: MechanicApplicationInput[Key],
  ) => {
    setFormState((current) => ({ ...current, [key]: value }));
    setSubmissionError(null);
  };

  const markFieldTouched = (field: ApplicationField) => {
    const fieldStep = getStepForField(field);

    if (fieldStep !== null && quietOpenStep === fieldStep) {
      setQuietOpenStep(null);
      setInteractedSteps((current) => ({ ...current, [fieldStep]: true }));
    } else if (fieldStep !== null) {
      setInteractedSteps((current) => ({ ...current, [fieldStep]: true }));
    }

    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const handleFieldBlur = (field: ApplicationField) => {
    markFieldTouched(field);
  };

  const getVisibleFieldError = (
    field: ApplicationField,
    step: ApplicationStep = currentStep,
  ) => {
    const error = getFieldError(field, formState, hasQualifications);

    if (!error || quietOpenStep === step) {
      return undefined;
    }

    if (attemptedSteps[step]) {
      return error;
    }

    return interactedSteps[step] && touchedFields[field] ? error : undefined;
  };

  const shouldShowError = (
    field: ApplicationField,
    step: ApplicationStep = currentStep,
  ) => Boolean(getVisibleFieldError(field, step));

  const handleQualificationsChange = (nextValue: boolean) => {
    markFieldTouched("hasQualifications");
    setHasQualifications(nextValue);

    if (!nextValue) {
      setFormState((current) => ({
        ...current,
        qualificationsSummary: "",
      }));
    }
  };

  const handleInsuranceToggle = (nextValue: string) => {
    const noInsuranceValue = "no_current_insurance";

    if (nextValue === noInsuranceValue) {
      updateField(
        "insuranceHeld",
        formState.insuranceHeld.includes(noInsuranceValue)
          ? []
          : [noInsuranceValue],
      );
      return;
    }

    const filteredSelections = formState.insuranceHeld.filter(
      (value) => value !== noInsuranceValue,
    );

    updateField(
      "insuranceHeld",
      toggleSelection(filteredSelections, nextValue),
    );
  };

  const validateStep = (step: ApplicationStep): ApplicationErrors => {
    const nextErrors: ApplicationErrors = {};
    stepFieldMap[step].forEach((field) => {
      const error = getFieldError(field, formState, hasQualifications);
      if (error) {
        nextErrors[field] = error;
      }
    });

    return nextErrors;
  };

  const isStepComplete = (step: ApplicationStep) =>
    Object.keys(validateStep(step)).length === 0;

  const clearStepFeedback = (step: ApplicationStep) => {
    setAttemptedSteps((current) => ({ ...current, [step]: false }));
    setInteractedSteps((current) => ({ ...current, [step]: false }));
    setTouchedFields((current) => {
      const nextTouchedFields = { ...current };

      stepFieldMap[step].forEach((field) => {
        delete nextTouchedFields[field];
      });

      return nextTouchedFields;
    });
    setSubmissionError(null);
  };

  const canNavigateToStep = (targetStep: ApplicationStep) => {
    if (targetStep === 1) {
      return true;
    }

    if (targetStep === 2) {
      return isStepComplete(1);
    }

    return isStepComplete(1) && isStepComplete(2);
  };

  const canOpenStepFromStepper = (targetStep: ApplicationStep) => {
    if (targetStep === currentStep) {
      return true;
    }

    if (targetStep < currentStep) {
      return true;
    }

    return canNavigateToStep(targetStep);
  };

  const getFirstIncompleteStep = (): ApplicationStep | null => {
    if (!isStepComplete(1)) {
      return 1;
    }

    if (!isStepComplete(2)) {
      return 2;
    }

    if (!isStepComplete(3)) {
      return 3;
    }

    return null;
  };

  const openStep = (targetStep: ApplicationStep) => {
    setQuietOpenStep(targetStep);
    setInteractedSteps((current) => ({ ...current, [targetStep]: false }));
    shouldQuietResetOpenedStepRef.current = true;
    setSubmissionError(null);
    setCurrentStep(targetStep);
  };

  const handleContinue = () => {
    const nextErrors = validateStep(currentStep);

    if (Object.keys(nextErrors).length > 0) {
      setQuietOpenStep(null);
      setAttemptedSteps((current) => ({ ...current, [currentStep]: true }));
      return;
    }

    setAttemptedSteps((current) => ({ ...current, [currentStep]: false }));
    setSubmissionError(null);
    const nextStep = (currentStep + 1) as ApplicationStep;

    if (!canNavigateToStep(nextStep)) {
      const firstIncompleteStep = getFirstIncompleteStep();

      if (firstIncompleteStep !== null) {
        setAttemptedSteps((current) => ({
          ...current,
          [firstIncompleteStep]: true,
        }));
        setCurrentStep(firstIncompleteStep);
      }

      return;
    }

    shouldScrollToFormTopRef.current = true;
    openStep(nextStep);
  };

  const handleBack = () => {
    setSubmissionError(null);
    setCurrentStep((currentStep - 1) as ApplicationStep);
  };

  const handleStepClick = (targetStep: ApplicationStep) => {
    if (!canOpenStepFromStepper(targetStep)) {
      return;
    }

    openStep(targetStep);
  };

  const submitApplication = async () => {
    const firstIncompleteStep = getFirstIncompleteStep();

    if (firstIncompleteStep !== null) {
      setQuietOpenStep(null);
      setAttemptedSteps((current) => ({
        ...current,
        [firstIncompleteStep]: true,
      }));
      setSubmissionError(null);
      setCurrentStep(firstIncompleteStep);
      return;
    }

    if (!recaptchaSiteKey) {
      setSubmissionError(
        "Spam protection is temporarily unavailable. Please try again later.",
      );
      return;
    }

    if (!captchaToken) {
      setSubmissionError("Please confirm you are not a robot before applying.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionError(null);
      applicationIdRef.current ??= crypto.randomUUID();
      const application = await submitMechanicApplication(
        formState,
        captchaToken,
        applicationIdRef.current,
      );

      setSubmittedApplication(application);
      trackAnalyticsEvent("mechanic_application_submitted", { source: "service" });
      trackGoogleAdsConversion("mechanic");
    } catch (error) {
      setCaptchaToken("");
      setCaptchaResetCounter((current) => current + 1);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to submit the application right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitApplication();
  };

  if (submittedApplication) {
    return (
      <div className="bg-[radial-gradient(circle_at_top,#eef6ff_0%,#ffffff_55%,#f8fafc_100%)] pt-24 sm:pt-28">
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_32px_90px_-58px_rgba(15,23,42,0.22)]">
              <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
                <div className="p-7 sm:p-8 lg:p-10">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
                    Details received
                  </span>
                  <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                    Thanks, {submittedApplication.firstName}. We&apos;ve received
                    your details.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    STM Motors will contact you using the details provided to
                    discuss suitable mechanic opportunities and practical next
                    steps.
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Name
                      </span>
                      <span className="mt-1.5 block break-words text-[0.95rem] font-semibold text-slate-950">
                        {submittedApplication.firstName}{" "}
                        {submittedApplication.lastName}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Email
                      </span>
                      <span className="mt-1.5 block break-words text-[0.95rem] font-semibold text-slate-950">
                        {submittedApplication.email}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Mechanic type
                      </span>
                      <span className="mt-1.5 block break-words text-[0.95rem] font-semibold capitalize text-slate-950">
                        {submittedApplication.mechanicType.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Coverage postcode
                      </span>
                      <span className="mt-1.5 block break-words text-[0.95rem] font-semibold uppercase text-slate-950">
                        {submittedApplication.postcode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-blue-50 px-7 py-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-10">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1c69d4] shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)]">
                      <CircleCheckBig className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1c69d4]">
                        What happens next
                      </p>
                      <div className="mt-5 space-y-4">
                        {applicationNextSteps.map((item, index) => (
                          <div key={item} className="flex items-start gap-4">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1c69d4] text-sm font-semibold text-white">
                              {index + 1}
                            </span>
                            <p className="pt-0.5 text-sm leading-7 text-slate-700 sm:text-base">
                              {item}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white pt-16 text-slate-900 lg:pt-20">
      <section className="overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl lg:min-h-[34rem] lg:grid-cols-2">
          <div className="flex items-center px-6 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05] lg:text-[3.5rem]">
                Join STM Motors for more local work and flexibility.
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-300 sm:text-lg">
                Join the STM Motors mechanic network and tell us what you do,
                where you work, and which vehicle services suit your setup.
              </p>
              <div className="mt-7 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                {["Mobile and garage setups", "Jobs matched to your services", "Clear job information", "Operational team support"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>
              <button
                type="button"
                onClick={() => scrollFormIntoView()}
                className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white transition hover:bg-[#2878e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Apply to join STM Motors
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden sm:min-h-96 lg:min-h-full">
            <img
              src="/images/mechanic-recruitment.jpg"
              alt="Mobile mechanic working beside a customer vehicle"
              width="1200"
              height="600"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-950/20 lg:to-transparent" />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              A practical way to grow your workload
            </h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {mechanicBenefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article key={benefit.title} className="text-center">
                  <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1c69d4]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Straightforward from details to jobs
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {mechanicJourney.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-50px_rgba(15,23,42,0.3)]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1c69d4] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="mechanic-application" className="scroll-mt-24 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-12">
            <form
              ref={formCardRef}
              onSubmit={handleFormSubmit}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.24)] sm:p-8 lg:p-10"
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      ref={formHeadingRef}
                      tabIndex={-1}
                      className="text-3xl font-bold tracking-tight text-slate-950 outline-none"
                    >
                      Mechanic application
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Complete the form below to tell us about your experience,
                      services, and working setup.
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1c69d4]">
                    {currentStep} of 3
                  </span>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-3 sm:p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <StepPill
                      disabled={!canOpenStepFromStepper(1)}
                      index={1}
                      label="Your details"
                      isActive={currentStep === 1}
                      isComplete={currentStep > 1}
                      onClick={() => handleStepClick(1)}
                    />
                    <StepPill
                      disabled={!canOpenStepFromStepper(2)}
                      index={2}
                      label="Work model"
                      isActive={currentStep === 2}
                      isComplete={currentStep > 2}
                      onClick={() => handleStepClick(2)}
                    />
                    <StepPill
                      disabled={!canOpenStepFromStepper(3)}
                      index={3}
                      label="Experience"
                      isActive={currentStep === 3}
                      isComplete={false}
                      onClick={() => handleStepClick(3)}
                    />
                  </div>
                </div>
              </div>

              {currentStep === 1 ? (
                <div className="mt-8 grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        First name
                      </span>
                      <input
                        type="text"
                        value={formState.firstName}
                        onChange={(event) =>
                          updateField("firstName", event.target.value)
                        }
                        onBlur={() => handleFieldBlur("firstName")}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="First name"
                      />
                      {shouldShowError("firstName", 1) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("firstName", 1)}
                        </p>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        Last name
                      </span>
                      <input
                        type="text"
                        value={formState.lastName}
                        onChange={(event) =>
                          updateField("lastName", event.target.value)
                        }
                        onBlur={() => handleFieldBlur("lastName")}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="Last name"
                      />
                      {shouldShowError("lastName", 1) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("lastName", 1)}
                        </p>
                      ) : null}
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        Email address
                      </span>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        onBlur={() => handleFieldBlur("email")}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="you@example.com"
                      />
                      {shouldShowError("email", 1) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("email", 1)}
                        </p>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        Phone number
                      </span>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        onBlur={() => handleFieldBlur("phone")}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="07..."
                      />
                      {shouldShowError("phone", 1) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("phone", 1)}
                        </p>
                      ) : null}
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        Postcode
                      </span>
                      <input
                        type="text"
                        value={formState.postcode}
                        onChange={(event) =>
                          updateField("postcode", event.target.value)
                        }
                        onBlur={() => handleFieldBlur("postcode")}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm uppercase text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="MK1 2AB"
                      />
                      {shouldShowError("postcode", 1) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("postcode", 1)}
                        </p>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        Business name
                        <span className="ml-2 font-normal text-slate-500">
                          Optional
                        </span>
                      </span>
                      <input
                        type="text"
                        value={formState.businessName}
                        onChange={(event) =>
                          updateField("businessName", event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="Workshop or trading name"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="mt-8">
                  <div className="max-w-2xl">
                    <p className="text-base leading-7 text-slate-600">
                      Choose the setup that best matches how you currently take
                      on jobs.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {mechanicTypeOptions.map((option) => (
                      <RadioCard
                        key={option.value}
                        {...option}
                        checked={formState.mechanicType === option.value}
                        onSelect={() => {
                          markFieldTouched("mechanicType");
                          updateField("mechanicType", option.value);
                        }}
                      />
                    ))}
                  </div>

                  {shouldShowError("mechanicType", 2) ? (
                    <p className="mt-4 public-field-error">
                      {getVisibleFieldError("mechanicType", 2)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="mt-8 grid gap-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        Years of experience
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={formState.yearsExperience}
                        onChange={(event) =>
                          updateField("yearsExperience", event.target.value)
                        }
                        onBlur={() => handleFieldBlur("yearsExperience")}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="e.g. 8"
                      />
                      {shouldShowError("yearsExperience", 3) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("yearsExperience", 3)}
                        </p>
                      ) : null}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-900">
                        Travel radius in miles
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={formState.serviceRadiusMiles}
                        onChange={(event) =>
                          updateField("serviceRadiusMiles", event.target.value)
                        }
                        onBlur={() => handleFieldBlur("serviceRadiusMiles")}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                        placeholder="e.g. 20"
                      />
                      {shouldShowError("serviceRadiusMiles", 3) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("serviceRadiusMiles", 3)}
                        </p>
                      ) : null}
                    </label>
                  </div>

                  <div className="grid gap-4">
                    <ChoiceButtons
                      title="Do you have any qualification, certification, or training?"
                      value={hasQualifications}
                      yesLabel="Yes"
                      noLabel="No"
                      onChange={handleQualificationsChange}
                    />
                    {shouldShowError("hasQualifications", 3) ? (
                      <p className="public-field-error">
                        {getVisibleFieldError("hasQualifications", 3)}
                      </p>
                    ) : null}
                    {hasQualifications ? (
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-900">
                          Qualifications and training summary
                        </span>
                        <textarea
                          rows={4}
                          value={formState.qualificationsSummary}
                          onChange={(event) =>
                            updateField(
                              "qualificationsSummary",
                              event.target.value,
                            )
                          }
                          onBlur={() => handleFieldBlur("qualificationsSummary")}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                          placeholder="Summarise qualifications, certifications, or training."
                        />
                        {shouldShowError("qualificationsSummary", 3) ? (
                          <p className="mt-2 public-field-error">
                            {getVisibleFieldError("qualificationsSummary", 3)}
                          </p>
                        ) : null}
                      </label>
                    ) : null}
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-900">
                      Website or profile link
                      <span className="ml-2 font-normal text-slate-500">
                        Optional
                      </span>
                    </span>
                    <input
                      type="url"
                      value={formState.websiteUrl}
                      onChange={(event) =>
                        updateField("websiteUrl", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                      placeholder="Website, Facebook page, Google Business profile, or similar"
                    />
                  </label>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-900">
                      Services you currently offer
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {serviceOptions.map((option) => (
                        <SelectionChip
                          key={option.value}
                          checked={formState.servicesOffered.includes(option.value)}
                          label={option.label}
                          onToggle={() => {
                            markFieldTouched("servicesOffered");
                            updateField(
                              "servicesOffered",
                              toggleSelection(
                                formState.servicesOffered,
                                option.value,
                              ),
                            );
                          }}
                        />
                      ))}
                    </div>
                    {shouldShowError("servicesOffered", 3) ? (
                      <p className="mt-3 public-field-error">
                        {getVisibleFieldError("servicesOffered", 3)}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-900">
                      How you usually fulfil bookings
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {workTypeOptions.map((option) => (
                        <SelectionChip
                          key={option.value}
                          checked={formState.workTypes.includes(option.value)}
                          label={option.label}
                          onToggle={() => {
                            markFieldTouched("workTypes");
                            updateField(
                              "workTypes",
                              toggleSelection(formState.workTypes, option.value),
                            );
                          }}
                        />
                      ))}
                    </div>
                    {shouldShowError("workTypes", 3) ? (
                      <p className="mt-3 public-field-error">
                        {getVisibleFieldError("workTypes", 3)}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-900">
                      Insurance and business cover
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {insuranceOptions.map((option) => (
                        <SelectionChip
                          key={option.value}
                          checked={formState.insuranceHeld.includes(option.value)}
                          disabled={
                            formState.insuranceHeld.includes(
                              "no_current_insurance",
                            ) && option.value !== "no_current_insurance"
                          }
                          label={option.label}
                          onToggle={() => {
                            markFieldTouched("insuranceHeld");
                            handleInsuranceToggle(option.value);
                          }}
                        />
                      ))}
                    </div>
                    {shouldShowError("insuranceHeld", 3) ? (
                      <p className="mt-3 public-field-error">
                        {getVisibleFieldError("insuranceHeld", 3)}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <ChoiceButtons
                        title="Do you have diagnostic tools?"
                        value={formState.hasDiagnosticTools}
                        onChange={(nextValue) => {
                          markFieldTouched("hasDiagnosticTools");
                          updateField("hasDiagnosticTools", nextValue);
                        }}
                      />
                      {shouldShowError("hasDiagnosticTools", 3) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("hasDiagnosticTools", 3)}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <ChoiceButtons
                        title="Do you have a service van?"
                        value={formState.hasServiceVan}
                        onChange={(nextValue) => {
                          markFieldTouched("hasServiceVan");
                          updateField("hasServiceVan", nextValue);
                        }}
                      />
                      {shouldShowError("hasServiceVan", 3) ? (
                        <p className="mt-2 public-field-error">
                          {getVisibleFieldError("hasServiceVan", 3)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-900">
                      Anything else STM Motors should know?
                      <span className="ml-2 font-normal text-slate-500">
                        Optional
                      </span>
                    </span>
                    <textarea
                      rows={4}
                      value={formState.additionalNotes}
                      onChange={(event) =>
                        updateField("additionalNotes", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                      placeholder="Share specialist experience, your preferred working pattern, or anything else that may help us match suitable work."
                    />
                  </label>

                  <GoogleRecaptchaField
                    siteKey={recaptchaSiteKey}
                    onTokenChange={setCaptchaToken}
                    resetSignal={captchaResetCounter}
                  />
                </div>
              ) : null}

              {submissionError ? (
                <p className="mt-6 public-error-banner">
                  {submissionError}
                </p>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:border-[#1c69d4] hover:text-[#1c69d4]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3]"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void submitApplication();
                    }}
                    disabled={isSubmitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit application"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              What you need before you apply
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Tell us honestly about your current setup. The right requirements
              can vary depending on the services and work types you offer.
            </p>
            <ul className="mt-7 space-y-4">
              {mechanicRequirements.map((requirement) => (
                <li key={requirement} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#1c69d4]">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-6 text-slate-700">
                    {requirement}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Frequently asked questions
            </h2>
            <div className="mt-7 divide-y divide-slate-200 rounded-[1.5rem] border border-slate-200 bg-white px-5 sm:px-6">
              {mechanicFaqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4] focus-visible:ring-offset-4 [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#1c69d4] transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <p className="mt-3 pr-8 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1c69d4] py-14 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center lg:px-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to work with STM Motors?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">
            Share your experience, coverage, and services using our focused
            three-step mechanic form.
          </p>
          <button
            type="button"
            onClick={() => scrollFormIntoView()}
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#1c69d4] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c69d4]"
          >
            Start your application
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default MechanicApplicationPage;
