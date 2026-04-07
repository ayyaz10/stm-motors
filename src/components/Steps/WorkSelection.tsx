import { useState } from "react";
import { services } from "../../data/services";

interface WorkSelectionProps {
  selectedWorks: string[];
  setSelectedWorks: React.Dispatch<React.SetStateAction<string[]>>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const activeServices = services.filter((s) => s.active);

const WorkSelection = ({
  selectedWorks,
  setSelectedWorks,
  goToNextStep,
  goToPreviousStep,
}: WorkSelectionProps) => {
  const [error, setError] = useState("");
  const [openServiceId, setOpenServiceId] = useState<string | null>(null);

  const selectedServiceForModal = activeServices.find(
    (service) => service.id === openServiceId,
  );

  const handleToggleWork = (workId: string) => {
    setSelectedWorks((prev) => {
      const alreadySelected = prev.includes(workId);

      if (alreadySelected) {
        return prev.filter((item) => item !== workId);
      }

      return [...prev, workId];
    });

    setError("");
  };

  const handleNext = () => {
    if (selectedWorks.length === 0) {
      setError("Please select at least one repair option");
      return;
    }

    goToNextStep();
  };

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Choose repair</h1>

        <div className="space-y-4">
          {activeServices.map((service) => {
            const isSelected = selectedWorks.includes(service.id);

            return (
              <div
                key={service.id}
                className={`border rounded p-4 flex items-start justify-between gap-4 ${
                  isSelected
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300"
                }`}
              >
                <div className="flex-1">
                  <h2 className="font-semibold">{service.name}</h2>
                  {service.shortDescription && (
                    <p className="text-sm text-gray-600 mt-1">
                      {service.shortDescription}
                    </p>
                  )}
                  <p className="text-sm font-medium mt-2">£{service.price}</p>
                </div>

                <div className="flex flex-col gap-2 min-w-[120px]">
                  <button
                    type="button"
                    onClick={() => setOpenServiceId(service.id)}
                    className="border border-blue-500 text-blue-600 px-4 py-2 text-sm rounded cursor-pointer"
                  >
                    More info
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleWork(service.id)}
                    className={`px-4 py-2 text-sm rounded cursor-pointer font-semibold ${
                      isSelected
                        ? "bg-red-600 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {isSelected ? "Remove" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="bg-gray-400 font-semibold text-sm px-8 py-2 my-4 cursor-pointer"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`font-semibold text-sm px-8 py-2 my-4 cursor-pointer ${
                selectedWorks.length > 0
                  ? "bg-green-400 hover:bg-green-500"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedServiceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded shadow-lg">
            <div className="flex items-start justify-between border-b p-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedServiceForModal.name}
                </h2>
                {selectedServiceForModal.shortDescription && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedServiceForModal.shortDescription}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setOpenServiceId(null)}
                className="text-gray-500 text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-5">
              {selectedServiceForModal.whatsIncluded?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    What's included?
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {selectedServiceForModal.whatsIncluded.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedServiceForModal.symptoms?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    What are the symptoms?
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {selectedServiceForModal.symptoms.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedServiceForModal.workDetails?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    What happens?
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {selectedServiceForModal.workDetails.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedServiceForModal.importantNotes?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    Important notes
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {selectedServiceForModal.importantNotes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenServiceId(null)}
                className="bg-gray-200 px-6 py-2 rounded font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkSelection;
