import { useEffect, useMemo, useRef, useState } from "react";
import NumberPlateForm from "../components/forms/NumberPlateForm";
import CarDetailsForm from "../components/forms/CarDetailsForm";
import WorkSelection from "../components/Steps/WorkSelection";
import AvailabilitySelection from "../components/Steps/AvailabilitySelection";
import UserDetails from "../components/Steps/UserDetails";
import BookingConfirmation from "../components/Steps/BookingConfirmation";
import CarTabs from "../components/navigation/CarTabs";
import Stepper from "../components/navigation/Stepper";
import { appSettings } from "../config/appSettings";
import { bookingServiceSections, services } from "../data/services";
import {
  normalizeCreatedBooking,
  type CreatedBooking,
} from "../lib/bookings";
import {
  INITIAL_BOOKING_AVAILABILITY,
  normalizeAvailabilityDays,
  type BookingAvailabilityState,
} from "../lib/availability";
import { usePageMetadata } from "../lib/seo";
import { useVehicleServicePricing } from "../lib/useVehicleServicePricing";
import validatePostcode from "../utils/postcode";

const STORAGE_KEY = "carSelectionData";
const activeBookingServiceIds = services
  .filter((service) => service.active)
  .map((service) => service.id);

const initialPlateData = {
  registration: "",
  postcode: "",
};

const initialDetailsData = {
  vehicleModelId: null as number | null,
  make: "",
  model: "",
  fuel: "",
  engine: "",
  year: "",
  postcode: "",
};

type DetailsFormData = typeof initialDetailsData;
type DisabledField = "model" | "fuel" | "engine" | "year";
type DisabledStates = Record<DisabledField, boolean>;

const initialUserDetails = {
  fullName: "",
  phone: "",
  email: "",
  street1: "",
  street2: "",
  city: "",
  postcode: "",
  carRegistration: "",
  workNotes: "",
  vehicleDriveable: "" as "" | "yes" | "no",
};

const stepHeadings: Record<number, string> = {
  1: "Vehicle Details",
  2: "Select Service",
  3: "Availability",
  4: "Booking Details",
  5: "Booking Confirmation",
};

const normalizeRegistration = (value: string) =>
  value.replace(/\s+/g, "").trim().toUpperCase();

const normalizePostcode = (value: string) => value.trim().toUpperCase();

const todayDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildVehicleSelectionKey = ({
  activeTab,
  formPlateData,
  formDetailsData,
}: {
  activeTab: string;
  formPlateData: typeof initialPlateData;
  formDetailsData: typeof initialDetailsData;
}) => {
  if (activeTab === "plate") {
    return [
      "plate",
      normalizeRegistration(formPlateData.registration),
      normalizePostcode(formPlateData.postcode),
    ].join("|");
  }

  return [
    "details",
    formDetailsData.make.trim(),
    formDetailsData.model.trim(),
    formDetailsData.fuel.trim(),
    formDetailsData.engine.trim(),
    formDetailsData.year.trim(),
    normalizePostcode(formDetailsData.postcode),
  ].join("|");
};

const buildSeededUserDetails = ({
  activeTab,
  formPlateData,
  formDetailsData,
}: {
  activeTab: string;
  formPlateData: typeof initialPlateData;
  formDetailsData: typeof initialDetailsData;
}) => ({
  ...initialUserDetails,
  carRegistration:
    activeTab === "plate"
      ? normalizeRegistration(formPlateData.registration)
      : "",
  postcode:
    activeTab === "plate"
      ? normalizePostcode(formPlateData.postcode)
      : normalizePostcode(formDetailsData.postcode),
});

const hasSavedBookingProgress = (savedData: {
  currentStep?: number;
  selectedWorks?: string[];
  userDetails?: Partial<typeof initialUserDetails>;
}) =>
  Boolean(
    (savedData.currentStep ?? 1) > 1 ||
      (savedData.selectedWorks?.length ?? 0) > 0 ||
      Object.values(savedData.userDetails ?? {}).some(
        (value) => typeof value === "string" && value.trim() !== "",
      ),
  );

const isKnownService = (serviceId: string) =>
  services.some((service) => service.id === serviceId);

const findServiceCategoryById = (categoryId: string) =>
  bookingServiceSections.find((section) => section.id === categoryId) ?? null;

const isElectricFuel = (fuel: string) => {
  const normalizedFuel = fuel.trim().toLowerCase();

  return (
    normalizedFuel.includes("electric") &&
    !normalizedFuel.includes("hybrid") &&
    !normalizedFuel.includes("petrol") &&
    !normalizedFuel.includes("diesel")
  );
};

function CarSelectionPage() {
  usePageMetadata({
    title: "Book Mobile Servicing | STM Motors",
    description:
      "Book a mobile service or inspection with STM Motors. Quality work, sensible pricing, and a polished booking experience across the UK.",
    pathname: "/book",
  });

  const [selectedWorks, setSelectedWorks] = useState<string[]>([]);
  const [bookingAvailability, setBookingAvailability] =
    useState<BookingAvailabilityState>(INITIAL_BOOKING_AVAILABILITY);
  const [userDetails, setUserDetails] = useState(initialUserDetails);
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("details");
  const [formPlateData, setFormPlateData] = useState(initialPlateData);
  const [formDetailsData, setFormDetailsData] = useState(initialDetailsData);
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestVisitedStep, setFurthestVisitedStep] = useState(1);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);
  const [hasAppliedSearchPrefill, setHasAppliedSearchPrefill] = useState(false);
  const [confirmedVehicleSelectionKey, setConfirmedVehicleSelectionKey] =
    useState<string | null>(null);
  const bookingShellRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBookingTopRef = useRef(false);

  const getDisabledStatesFromDetails = (
    details: DetailsFormData,
  ): DisabledStates => {
    const electricFuelSelected = isElectricFuel(details.fuel);

    return {
      model: !details.make,
      fuel: !details.model,
      engine: !details.fuel || electricFuelSelected,
      year: electricFuelSelected ? !details.fuel : !details.engine,
    };
  };

  const [disabledStates, setDisabledStates] = useState(
    getDisabledStatesFromDetails(initialDetailsData),
  );

  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const currentVehicleSelectionKey = useMemo(
    () =>
      buildVehicleSelectionKey({
        activeTab,
        formPlateData,
        formDetailsData,
      }),
    [activeTab, formDetailsData, formPlateData],
  );
  const hasVehicleContextChanged =
    confirmedVehicleSelectionKey !== null &&
    currentVehicleSelectionKey !== confirmedVehicleSelectionKey;

  const isPlateStepComplete =
    formPlateData.registration.trim() !== "" &&
    validatePostcode(formPlateData.postcode);
  const isBookingLocked = currentStep === 5 && createdBooking !== null;

  const isDetailsStepComplete =
    formDetailsData.make.trim() !== "" &&
    formDetailsData.model.trim() !== "" &&
    formDetailsData.fuel.trim() !== "" &&
    (isElectricFuel(formDetailsData.fuel) ||
      formDetailsData.engine.trim() !== "") &&
    formDetailsData.year.trim() !== "" &&
    validatePostcode(formDetailsData.postcode);

  const isStep1Complete =
    activeTab === "plate"
      ? appSettings.numberPlateEnabled && isPlateStepComplete
      : appSettings.carDetailsEnabled && isDetailsStepComplete;

  const isStep2Complete = !hasVehicleContextChanged && selectedWorks.length > 0;

  const vehiclePricingState = useVehicleServicePricing({
    enabled:
      currentStep >= 2 &&
      isStep1Complete &&
      !hasVehicleContextChanged,
    make: formDetailsData.make,
    model: formDetailsData.model,
    serviceIds: activeBookingServiceIds,
    vehicleModelId: formDetailsData.vehicleModelId,
    year: formDetailsData.year,
  });

  const isStep3Complete =
    !hasVehicleContextChanged &&
    normalizeAvailabilityDays(bookingAvailability.dates, {
      minDate: todayDateKey(),
    }).length > 0;

  const isStep4Complete =
    !hasVehicleContextChanged &&
    userDetails.fullName.trim() !== "" &&
    userDetails.phone.trim() !== "" &&
    userDetails.email.trim() !== "" &&
    userDetails.street1.trim() !== "" &&
    userDetails.city.trim() !== "" &&
    userDetails.postcode.trim() !== "" &&
    userDetails.carRegistration.trim() !== "";

  const canNavigateToStep = (targetStep: number) => {
    if (isBookingLocked) {
      return targetStep === 5;
    }

    if (targetStep === 1) return true;
    if (targetStep === 2) return isStep1Complete;
    if (targetStep === 3) return isStep1Complete && isStep2Complete;
    if (targetStep === 4)
      return isStep1Complete && isStep2Complete && isStep3Complete;
    if (targetStep === 5)
      return (
        isStep1Complete &&
        isStep2Complete &&
        isStep3Complete &&
        isStep4Complete
      );

    return false;
  };

  const canOpenStepFromStepper = (targetStep: number) => {
    if (isBookingLocked) {
      return targetStep === 5;
    }

    if (targetStep === currentStep) {
      return true;
    }

    if (targetStep < currentStep) {
      return targetStep <= furthestVisitedStep;
    }

    return targetStep <= furthestVisitedStep && canNavigateToStep(targetStep);
  };

  const commitVehicleStepState = () => {
    if (currentVehicleSelectionKey !== confirmedVehicleSelectionKey) {
      setSelectedWorks([]);
      setBookingAvailability(INITIAL_BOOKING_AVAILABILITY);
      setUserDetails(
        buildSeededUserDetails({
          activeTab,
          formPlateData,
          formDetailsData,
        }),
      );
      setCreatedBooking(null);
      setConfirmedVehicleSelectionKey(currentVehicleSelectionKey);
      setFurthestVisitedStep(1);
      setPrefillNotice(null);
    } else if (confirmedVehicleSelectionKey === null) {
      setConfirmedVehicleSelectionKey(currentVehicleSelectionKey);
    }
  };

  const scrollBookingShellIntoView = (behavior: ScrollBehavior = "smooth") => {
    const bookingShell = bookingShellRef.current;

    if (!bookingShell) {
      return;
    }

    const navigationOffset = 112;
    const bookingShellTop =
      bookingShell.getBoundingClientRect().top + window.scrollY - navigationOffset;

    window.scrollTo({
      top: Math.max(bookingShellTop, 0),
      behavior,
    });
  };

  const handleStepClick = (targetStep: number) => {
    if (isBookingLocked) return;

    if (canOpenStepFromStepper(targetStep)) {
      if (currentStep === 1 && targetStep > 1) {
        commitVehicleStepState();
      }
      shouldScrollToBookingTopRef.current = true;
      setCurrentStep(targetStep);
    }
  };

  const goToNextStep = () => {
    if (isBookingLocked) return;
    const nextStep = currentStep + 1;

    if (canNavigateToStep(nextStep)) {
      if (currentStep === 1) {
        commitVehicleStepState();
      }
      shouldScrollToBookingTopRef.current = true;
      setCurrentStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    if (isBookingLocked) return;
    shouldScrollToBookingTopRef.current = true;
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const setDisabled = (field: DisabledField, value: boolean) => {
    setDisabledStates((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const parsedData = JSON.parse(savedData);

        if (parsedData.activeTab) {
          setActiveTab(parsedData.activeTab);
        }

        if (parsedData.formPlateData) {
          setFormPlateData({
            ...initialPlateData,
            ...parsedData.formPlateData,
          });
        }

        if (parsedData.formDetailsData) {
          const restoredDetails = {
            ...initialDetailsData,
            ...parsedData.formDetailsData,
          };

          setFormDetailsData(restoredDetails);
          setDisabledStates(getDisabledStatesFromDetails(restoredDetails));
        }

        if (parsedData.selectedWorks) {
          setSelectedWorks(
            parsedData.selectedWorks.filter((serviceId: string) =>
              isKnownService(serviceId),
            ),
          );
        }

        if (parsedData.bookingAvailability) {
          setBookingAvailability({
            ...INITIAL_BOOKING_AVAILABILITY,
            ...parsedData.bookingAvailability,
            dates: normalizeAvailabilityDays(
              parsedData.bookingAvailability.dates ?? [],
              { minDate: todayDateKey() },
            ),
          });
        }

        if (parsedData.userDetails) {
          setUserDetails({
            ...initialUserDetails,
            ...parsedData.userDetails,
          });
        }

        if (parsedData.createdBooking) {
          setCreatedBooking(normalizeCreatedBooking(parsedData.createdBooking));
          setCurrentStep(5);
          setFurthestVisitedStep(5);
        } else if (typeof parsedData.furthestVisitedStep === "number") {
          setFurthestVisitedStep(Math.max(1, parsedData.furthestVisitedStep));
          setCurrentStep(parsedData.currentStep ?? 1);
        } else if (parsedData.currentStep) {
          setCurrentStep(parsedData.currentStep);
          setFurthestVisitedStep(parsedData.currentStep);
        }

        if (typeof parsedData.confirmedVehicleSelectionKey === "string") {
          setConfirmedVehicleSelectionKey(parsedData.confirmedVehicleSelectionKey);
        } else {
          const restoredActiveTab = parsedData.activeTab ?? "details";
          const restoredPlateData = {
            ...initialPlateData,
            ...parsedData.formPlateData,
          };
          const restoredDetailsData = {
            ...initialDetailsData,
            ...parsedData.formDetailsData,
          };

          if (hasSavedBookingProgress(parsedData)) {
            setConfirmedVehicleSelectionKey(
              buildVehicleSelectionKey({
                activeTab: restoredActiveTab,
                formPlateData: restoredPlateData,
                formDetailsData: restoredDetailsData,
              }),
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to restore form data from localStorage", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || createdBooking || hasAppliedSearchPrefill) {
      return;
    }

    const registration = searchParams.get("registration")?.trim().toUpperCase() || "";
    const postcode = searchParams.get("postcode")?.trim().toUpperCase() || "";
    const service = searchParams.get("service")?.trim() || "";
    const serviceCategory =
      searchParams.get("serviceCategory")?.trim() ||
      searchParams.get("service_category")?.trim() ||
      "";
    const hasValidService = services.some((serviceItem) => serviceItem.id === service);
    const selectedServiceCategory = findServiceCategoryById(serviceCategory);
    const canUseNumberPlateFlow = appSettings.numberPlateEnabled;

    if (!registration && !postcode && !hasValidService && !selectedServiceCategory) {
      setHasAppliedSearchPrefill(true);
      return;
    }

    const nextPlateData = {
      registration: registration || "",
      postcode: postcode || "",
    };

    if (canUseNumberPlateFlow && (registration || postcode)) {
      setActiveTab("plate");
      setFormPlateData(nextPlateData);
      setFormDetailsData((prev) => ({
        ...prev,
        postcode: postcode || "",
      }));
      setUserDetails(
        buildSeededUserDetails({
          activeTab: "plate",
          formPlateData: nextPlateData,
          formDetailsData: {
            ...initialDetailsData,
            postcode: postcode || "",
          },
        }),
      );
      setConfirmedVehicleSelectionKey(
        buildVehicleSelectionKey({
          activeTab: "plate",
          formPlateData: nextPlateData,
          formDetailsData: {
            ...initialDetailsData,
            postcode: postcode || "",
          },
        }),
      );
    } else if (postcode) {
      setActiveTab("details");
      setFormPlateData(initialPlateData);
      setFormDetailsData((prev) => ({
        ...prev,
        postcode,
      }));
      setUserDetails(
        buildSeededUserDetails({
          activeTab: "details",
          formPlateData: initialPlateData,
          formDetailsData: {
            ...initialDetailsData,
            postcode,
          },
        }),
      );
      setConfirmedVehicleSelectionKey(null);
    } else {
      setSelectedWorks([]);
      setBookingAvailability(INITIAL_BOOKING_AVAILABILITY);
      setUserDetails(initialUserDetails);
      setConfirmedVehicleSelectionKey(null);
    }

    if (hasValidService) {
      setSelectedWorks([service]);
    } else if (registration || postcode || selectedServiceCategory) {
      setSelectedWorks([]);
    }

    if (canUseNumberPlateFlow && registration && postcode && hasValidService) {
      setCurrentStep((prev) => Math.max(prev, 3));
      setFurthestVisitedStep((prev) => Math.max(prev, 3));
      setPrefillNotice(
        "We pre-filled your registration, postcode, and service from the homepage so you can continue with your booking.",
      );
    } else if (canUseNumberPlateFlow && registration && postcode) {
      setCurrentStep((prev) => Math.max(prev, 2));
      setFurthestVisitedStep((prev) => Math.max(prev, 2));
      setPrefillNotice(
        "Your vehicle and postcode have been pre-filled. Add a service to continue.",
      );
    } else if (!canUseNumberPlateFlow && postcode && hasValidService) {
      setCurrentStep((prev) => Math.max(prev, 2));
      setFurthestVisitedStep((prev) => Math.max(prev, 2));
      setPrefillNotice(
        "We pre-filled your postcode and service so you can continue with your booking.",
      );
    } else if (postcode && selectedServiceCategory) {
      setPrefillNotice(
        `Your postcode has been pre-filled. Continue with the vehicle details, then choose from our ${selectedServiceCategory.title.toLowerCase()} options.`,
      );
    } else if (!canUseNumberPlateFlow && postcode) {
      setPrefillNotice(
        "Your postcode has been pre-filled. Continue with the manual vehicle details to book your service.",
      );
    } else if (hasValidService) {
      setPrefillNotice(
        "Your selected service has been carried into the booking flow.",
      );
    }

    setHasAppliedSearchPrefill(true);
  }, [createdBooking, hasAppliedSearchPrefill, hasHydrated, searchParams]);

  useEffect(() => {
    if (!hasHydrated) return;

    const dataToStore = {
      activeTab,
      currentStep,
      furthestVisitedStep,
      confirmedVehicleSelectionKey,
      formPlateData,
      formDetailsData,
      selectedWorks,
      bookingAvailability,
      userDetails,
      createdBooking,
    };

    const timeoutId = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    hasHydrated,
    activeTab,
    currentStep,
    furthestVisitedStep,
    confirmedVehicleSelectionKey,
    formPlateData,
    formDetailsData,
    selectedWorks,
    bookingAvailability,
    userDetails,
    createdBooking,
  ]);

  useEffect(() => {
    if (activeTab === "plate" && !appSettings.numberPlateEnabled) {
      setActiveTab("details");
    }

    if (activeTab === "details" && !appSettings.carDetailsEnabled) {
      setActiveTab("plate");
    }
  }, [activeTab]);

  useEffect(() => {
    setFurthestVisitedStep((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      scrollBookingShellIntoView("auto");
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    if (!shouldScrollToBookingTopRef.current) {
      return;
    }

    shouldScrollToBookingTopRef.current = false;

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollBookingShellIntoView();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [currentStep]);

  const noCarInputMethodEnabled =
    !appSettings.numberPlateEnabled && !appSettings.carDetailsEnabled;

  const currentStepContent = (() => {
    if (noCarInputMethodEnabled) {
      return (
        <div
          className="public-error-banner"
          role="alert"
        >
          No vehicle entry method is currently enabled. Turn on number plate or
          manual vehicle entry in the app settings.
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <CarTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div id="vehicle-tab-panel" role="tabpanel" aria-labelledby={`vehicle-tab-${activeTab}`}>
            {activeTab === "plate" ? (
              <NumberPlateForm
                formData={formPlateData}
                setFormData={setFormPlateData}
                goToNextStep={goToNextStep}
                goToPreviousStep={goToPreviousStep}
              />
            ) : (
              <CarDetailsForm
                formData={formDetailsData}
                setFormData={setFormDetailsData}
                disabledStates={disabledStates}
                setDisabled={setDisabled}
                goToNextStep={goToNextStep}
                goToPreviousStep={goToPreviousStep}
              />
            )}
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <WorkSelection
          formPlateData={formPlateData}
          formDetailsData={formDetailsData}
          vehiclePricingState={vehiclePricingState}
          selectedWorks={selectedWorks}
          setSelectedWorks={setSelectedWorks}
          goToNextStep={goToNextStep}
          goToPreviousStep={goToPreviousStep}
          goToVehicleStep={() => {
            shouldScrollToBookingTopRef.current = true;
            setCurrentStep(1);
          }}
        />
      );
    }

    if (currentStep === 3) {
      return (
        <AvailabilitySelection
          availability={bookingAvailability}
          setAvailability={setBookingAvailability}
          goToNextStep={goToNextStep}
          goToPreviousStep={goToPreviousStep}
        />
      );
    }

    if (currentStep === 4) {
      return (
        <UserDetails
          selectedWorks={selectedWorks}
          formPlateData={formPlateData}
          formDetailsData={formDetailsData}
          vehiclePricingState={vehiclePricingState}
          bookingAvailability={bookingAvailability}
          userDetails={userDetails}
          setUserDetails={setUserDetails}
          setCreatedBooking={setCreatedBooking}
          goToNextStep={goToNextStep}
          goToPreviousStep={goToPreviousStep}
        />
      );
    }

    return <BookingConfirmation createdBooking={createdBooking} />;
  })();

  const bookingContentWidthClass =
    currentStep === 2
      ? "mx-auto w-full lg:max-w-4xl"
      : currentStep === 3
        ? "mx-auto w-full xl:max-w-6xl"
        : currentStep === 4
        ? "mx-auto w-full lg:max-w-3xl"
        : "mx-auto w-full lg:max-w-2xl";

  return (
    <section className="bg-slate-50 px-3 pb-10 pt-24 sm:px-4 sm:pb-12 sm:pt-24 lg:px-8 lg:pb-20 lg:pt-32">
      <div className="mx-auto w-full max-w-7xl">
        <div ref={bookingShellRef} className="mx-auto w-full xl:max-w-6xl">
          {prefillNotice ? (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#1557b3] sm:mb-6 sm:px-5 sm:py-4">
              {prefillNotice}
            </div>
          ) : null}

          <div
            className="rounded-[1.75rem] border border-blue-100 bg-white p-4 shadow-[0_28px_80px_-60px_rgba(15,23,42,0.35)] sm:p-6 lg:rounded-[2rem] lg:p-7"
          >
            <Stepper
              currentStep={currentStep}
              onStepClick={handleStepClick}
              canNavigateToStep={canOpenStepFromStepper}
              isBookingLocked={isBookingLocked}
              isFinalStepComplete={currentStep === 5 && createdBooking !== null}
            />
          </div>

          <div className={`mt-4 ${bookingContentWidthClass}`}>
            <div className="rounded-[1.75rem] border border-blue-100 bg-white p-4 shadow-[0_28px_80px_-60px_rgba(15,23,42,0.35)] sm:p-6 lg:rounded-[2rem] lg:p-7">
              <div className="space-y-5 sm:space-y-6">
                <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {stepHeadings[currentStep]}
                </h1>

                {currentStepContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CarSelectionPage;
