import clsx from "clsx";
import type { Dispatch, SetStateAction } from "react";
import { appSettings } from "../../config/appSettings";

interface CarTabsProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

const CarTabs = ({ activeTab, setActiveTab }: CarTabsProps) => {
  return (
    <div className="car-selection-tabs-container py-4">
      <div className="car-selection-tabs flex justify-center">
        {appSettings.numberPlateEnabled && (
          <div
            className={clsx(
              "car-numberplate-tab  px-2 py-2 cursor-pointer",
              activeTab === "plate" && "border border-amber-600",
            )}
            onClick={() => setActiveTab("plate")}
          >
            <h2>Number Plate</h2>
          </div>
        )}
        {appSettings.carDetailsEnabled && (
          <div
            className={clsx(
              "car-details-tab px-2 py-2 cursor-pointer",
              activeTab === "details" && "border border-amber-600",
            )}
            onClick={() => setActiveTab("details")}
          >
            <h2>Car Details</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarTabs;
