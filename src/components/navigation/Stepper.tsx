interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
  isBookingLocked?: boolean;
}

const Stepper = ({
  currentStep,
  onStepClick,
  canNavigateToStep,
  isBookingLocked = false,
}: StepperProps) => {
  const steps = [
    { id: 1, label: "Car" },
    { id: 2, label: "Select Work" },
    { id: 3, label: "Details" },
    { id: 4, label: "Book" },
  ];

  return (
    <div className="flex justify-between mb-8">
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isClickable =
          step.id === 4
            ? canNavigateToStep(step.id)
            : !isBookingLocked && canNavigateToStep(step.id);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(step.id)}
            disabled={!isClickable}
            className={`${
              isActive ? "text-green-600 font-semibold" : ""
            } ${!isClickable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {step.id} {step.label}
          </button>
        );
      })}
    </div>
  );
};

export default Stepper;
