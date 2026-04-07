import { useState, useEffect } from "react";
import NumberPlateForm from "../components/forms/NumberPlateForm";
import CarDetailsForm from "../components/forms/CarDetailsForm";
import WorkSelection from "../components/Steps/WorkSelection";
import UserDetails from "../components/Steps/UserDetails";
import BookingConfirmation from "../components/Steps/BookingConfirmation";
import CarTabs from "../components/navigation/CarTabs";
import Stepper from "../components/navigation/Stepper";

import validatePostcode from "../utils/postcode";
import { appSettings } from "../config/appSettings";
import type { CreatedBooking } from "../lib/bookings";

const STORAGE_KEY = "carSelectionData";

const initialPlateData = {
  registration: "",
  postcode: "",
};

const initialDetailsData = {
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
const isElectricFuel = (fuel: string) => {
  const normalizedFuel = fuel.trim().toLowerCase();

  return (
    normalizedFuel.includes("electric") &&
    !normalizedFuel.includes("hybrid") &&
    !normalizedFuel.includes("petrol") &&
    !normalizedFuel.includes("diesel")
  );
};

const initialUserDetials = {
  fullName: "",
  phone: "",
  email: "",
  street1: "",
  street2: "",
  city: "",
  postcode: "",
  carRegistration: "",
};

const CarSelectionPage = () => {
  const [selectedWorks, setSelectedWorks] = useState<string[]>([]);
  const [userDetails, setUserDetails] = useState(initialUserDetials);

  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(
    null,
  );

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

  const [activeTab, setActiveTab] = useState("details");
  const [formPlateData, setFormPlateData] = useState(initialPlateData);
  const [formDetailsData, setFormDetailsData] = useState(initialDetailsData);

  const [disabledStates, setDisabledStates] = useState(
    getDisabledStatesFromDetails(initialDetailsData),
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [hasHydrated, setHasHydrated] = useState(false);

  const isPlateStepComplete =
    formPlateData.registration.trim() !== "" &&
    validatePostcode(formPlateData.postcode);
  const isBookingLocked = currentStep === 4 && createdBooking !== null;

  const isDetailsStepComplete =
    formDetailsData.make.trim() !== "" &&
    formDetailsData.model.trim() !== "" &&
    formDetailsData.fuel.trim() !== "" &&
    (isElectricFuel(formDetailsData.fuel) ||
      formDetailsData.engine.trim() !== "") &&
    formDetailsData.year.trim() !== "" &&
    validatePostcode(formDetailsData.postcode);

  const isStep1Complete =
    (appSettings.numberPlateEnabled && isPlateStepComplete) ||
    (appSettings.carDetailsEnabled && isDetailsStepComplete);

  const isStep2Complete = selectedWorks.length > 0;

  const isStep3Complete =
    userDetails.fullName.trim() !== "" &&
    userDetails.phone.trim() !== "" &&
    userDetails.email.trim() !== "" &&
    userDetails.street1.trim() !== "" &&
    userDetails.city.trim() !== "" &&
    userDetails.postcode.trim() !== "" &&
    userDetails.carRegistration.trim() !== "";

  const canNavigateToStep = (targetStep: number) => {
    if (isBookingLocked) {
      return targetStep === 4; // Only allow navigation to confirmation step if booking is locked
    }
    if (targetStep === 1) return true;
    if (targetStep === 2) return isStep1Complete;
    if (targetStep === 3) return isStep1Complete && isStep2Complete;
    if (targetStep === 4)
      return isStep1Complete && isStep2Complete && isStep3Complete;

    return false;
  };

  const handleStepClick = (targetStep: number) => {
    if (isBookingLocked) return;
    if (canNavigateToStep(targetStep)) {
      setCurrentStep(targetStep);
    }
  };

  const goToNextStep = () => {
    if (isBookingLocked) return;
    const nextStep = currentStep + 1;

    if (canNavigateToStep(nextStep)) {
      setCurrentStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    if (isBookingLocked) return;
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const setDisabled = (field: DisabledField, value: boolean) => {
    setDisabledStates((prev) => ({ ...prev, [field]: value }));
  };

  // Restore from localStorage
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
          setSelectedWorks(parsedData.selectedWorks);
        }

        if (parsedData.userDetails) {
          setUserDetails({
            ...initialUserDetials,
            ...parsedData.userDetails,
          });
        }

        if (parsedData.createdBooking) {
          setCreatedBooking(parsedData.createdBooking);
          setCurrentStep(4); // Jump to confirmation if booking was created
        } else if (parsedData.currentStep) {
          setCurrentStep(parsedData.currentStep);
        }
      }
    } catch (error) {
      console.error("Failed to restore form data from localStorage", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!hasHydrated) return;

    const dataToStore = {
      activeTab,
      currentStep,
      formPlateData,
      formDetailsData,
      selectedWorks,
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
    formPlateData,
    formDetailsData,
    selectedWorks,
    userDetails,
    createdBooking,
  ]);

  // handling edge case if plate tab is disabled but user tries to access it, or details tab is disabled but user tries to access it
  useEffect(() => {
    if (activeTab === "plate" && !appSettings.numberPlateEnabled) {
      setActiveTab("details");
    }

    if (activeTab === "details" && !appSettings.carDetailsEnabled) {
      setActiveTab("plate");
    }
  }, [activeTab]);
  const noCarInputMethodEnabled =
    !appSettings.numberPlateEnabled && !appSettings.carDetailsEnabled;
  return (
    <div>
      <div>
        <Stepper
          currentStep={currentStep}
          onStepClick={handleStepClick}
          canNavigateToStep={canNavigateToStep}
          isBookingLocked={isBookingLocked}
        />
      </div>

      {currentStep === 1 && (
        <div className="max-w-sm mx-auto">
          <h1>Tell us about your car</h1>
          {noCarInputMethodEnabled ? (
            <p className="text-red-500">
              No car input method is currently enabled. Please contact support.
            </p>
          ) : (
            <>
              <CarTabs activeTab={activeTab} setActiveTab={setActiveTab} />

              {activeTab === "plate" && appSettings.numberPlateEnabled && (
                <NumberPlateForm
                  formData={formPlateData}
                  setFormData={setFormPlateData}
                  goToNextStep={goToNextStep}
                  goToPreviousStep={goToPreviousStep}
                />
              )}

              {activeTab === "details" && appSettings.carDetailsEnabled && (
                <CarDetailsForm
                  formData={formDetailsData}
                  setFormData={setFormDetailsData}
                  disabledStates={disabledStates}
                  setDisabled={setDisabled}
                  goToNextStep={goToNextStep}
                  goToPreviousStep={goToPreviousStep}
                />
              )}
            </>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <WorkSelection
          selectedWorks={selectedWorks}
          setSelectedWorks={setSelectedWorks}
          goToNextStep={goToNextStep}
          goToPreviousStep={goToPreviousStep}
        />
      )}
      {currentStep === 3 && (
        <UserDetails
          selectedWorks={selectedWorks}
          formPlateData={formPlateData}
          formDetailsData={formDetailsData}
          userDetails={userDetails}
          setUserDetails={setUserDetails}
          setCreatedBooking={setCreatedBooking}
          goToNextStep={goToNextStep}
          goToPreviousStep={goToPreviousStep}
        />
      )}
      {currentStep === 4 && (
        <BookingConfirmation createdBooking={createdBooking} />
      )}
    </div>
  );
};

export default CarSelectionPage;
