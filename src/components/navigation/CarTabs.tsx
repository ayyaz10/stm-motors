import clsx from "clsx";
import type { Dispatch, SetStateAction } from "react";
import { appSettings } from "../../config/appSettings";

interface CarTabsProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

function CarTabs({ activeTab, setActiveTab }: CarTabsProps) {
  const hasBothTabsEnabled =
    appSettings.numberPlateEnabled && appSettings.carDetailsEnabled;

  if (!hasBothTabsEnabled) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-1.5 sm:p-2">
      <div
        role="tablist"
        aria-label="Vehicle entry method"
        className={clsx("grid gap-2", "grid-cols-2")}
      >
        {appSettings.numberPlateEnabled ? (
          <button
            id="vehicle-tab-plate"
            type="button"
            role="tab"
            aria-selected={activeTab === "plate"}
            aria-controls="vehicle-tab-panel"
            className={clsx(
              "min-h-[3.25rem] rounded-xl px-4 py-3 text-center text-sm font-semibold transition sm:text-left",
              activeTab === "plate"
                ? "bg-[#1c69d4] text-white shadow-sm"
                : "bg-transparent text-slate-600 hover:bg-white hover:text-[#1c69d4]",
            )}
            onClick={() => setActiveTab("plate")}
          >
            Number plate
          </button>
        ) : null}

        {appSettings.carDetailsEnabled ? (
          <button
            id="vehicle-tab-details"
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            aria-controls="vehicle-tab-panel"
            className={clsx(
              "min-h-[3.25rem] rounded-xl px-4 py-3 text-center text-sm font-semibold transition sm:text-left",
              activeTab === "details"
                ? "bg-[#1c69d4] text-white shadow-sm"
                : "bg-transparent text-slate-600 hover:bg-white hover:text-[#1c69d4]",
            )}
            onClick={() => setActiveTab("details")}
          >
            Manual vehicle details
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default CarTabs;
