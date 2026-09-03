import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
  isBookingLocked?: boolean;
  isFinalStepComplete?: boolean;
}

const steps = [
  { id: 1, label: "Vehicle" },
  { id: 2, label: "Service" },
  { id: 3, label: "Availability" },
  { id: 4, label: "Details" },
  { id: 5, label: "Confirm" },
];

function Stepper({
  currentStep,
  onStepClick,
  canNavigateToStep,
  isBookingLocked = false,
  isFinalStepComplete = false,
}: StepperProps) {
  const progressPercent = isFinalStepComplete
    ? 100
    : ((Math.max(currentStep, 1) - 1) / (steps.length - 1)) * 100;

  return (
    <nav aria-label="Booking progress" className="space-y-4">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
              Step {currentStep} of {steps.length}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Tap a completed step to review it.
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-950">
            {steps[currentStep - 1]?.label}
          </span>
        </div>

        <div className="mt-4 h-2 rounded-full bg-white">
          <span
            className="block h-full rounded-full bg-[#1c69d4] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ol className="mt-4 grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isComplete =
              currentStep > step.id ||
              (step.id === steps.length && isFinalStepComplete);
            const isClickable =
              step.id === 5
                ? canNavigateToStep(step.id)
                : !isBookingLocked && canNavigateToStep(step.id);

            return (
              <li key={step.id} className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={step.label}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition ${
                    isComplete
                      ? "border-[#1c69d4] bg-[#1c69d4] text-white"
                      : isActive
                        ? "border-[#1c69d4] bg-white text-[#1c69d4] shadow-[0_0_0_4px_rgba(28,105,212,0.12)]"
                        : "border-slate-300 bg-white text-slate-500"
                  } ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    String(step.id).padStart(2, "0")
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="hidden overflow-x-auto pb-1 sm:block">
        <ol className="flex min-w-[42rem] items-start sm:min-w-0">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isComplete =
              currentStep > step.id ||
              (step.id === steps.length && isFinalStepComplete);
            const isClickable =
              step.id === 5
                ? canNavigateToStep(step.id)
                : !isBookingLocked && canNavigateToStep(step.id);
            const isConnectorComplete = currentStep > step.id;

            return (
              <li
                key={step.id}
                className="relative flex flex-1 flex-col items-center text-center"
              >
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={`absolute left-1/2 top-4 h-0.5 w-full ${
                      isConnectorComplete ? "bg-[#1c69d4]" : "bg-slate-200"
                    }`}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isActive ? "step" : undefined}
                  className={`group relative z-10 flex min-w-20 flex-col items-center gap-3 rounded-2xl px-3 py-1 transition ${
                    isClickable
                      ? "cursor-pointer hover:text-[#1c69d4]"
                      : "cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      isComplete
                        ? "border-[#1c69d4] bg-[#1c69d4] text-white"
                        : isActive
                          ? "border-[#1c69d4] bg-white text-[#1c69d4] shadow-[0_0_0_4px_rgba(28,105,212,0.12)]"
                          : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      String(step.id).padStart(2, "0")
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium leading-5 ${
                      isActive || isComplete
                        ? "text-slate-950"
                        : "text-slate-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

export default Stepper;
