import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import PricingDisclaimer from "../PricingDisclaimer";
import {
  bookingServiceSections,
  formatServicePriceLabel,
  getServicePricingSummary,
  services,
  type ServiceDefinition,
} from "../../data/services";
import type { VehiclePricingLoadState } from "../../lib/useVehicleServicePricing";
import {
  formatVehicleServicePrice,
  getSelectedVehiclePricingSummary,
} from "../../lib/vehiclePricing";
import { formatPostcode } from "../../utils/postcode";

interface WorkSelectionProps {
  formPlateData: {
    registration: string;
    postcode: string;
  };
  formDetailsData: {
    vehicleModelId: number | null;
    make: string;
    model: string;
    fuel: string;
    engine: string;
    year: string;
    postcode: string;
  };
  vehiclePricingState: VehiclePricingLoadState;
  selectedWorks: string[];
  setSelectedWorks: React.Dispatch<React.SetStateAction<string[]>>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToVehicleStep: () => void;
}

const activeServices = services.filter((service) => service.active);
const activeServicesById = new Map(
  activeServices.map((service) => [service.id, service]),
);

const includedServiceRules = {
  "engine-flush": {
    includedIds: ["engine-oil-filter-replacement"],
    note: "Includes engine oil and filter replacement.",
  },
  "full-service": {
    includedIds: ["top-up-all-fluids"],
    note: "Includes top up of serviceable fluids.",
  },
} satisfies Record<string, { includedIds: string[]; note: string }>;

function normalizeSelectedServices(selectedServiceIds: string[]) {
  let normalizedSelection = [...new Set(selectedServiceIds)];

  Object.entries(includedServiceRules).forEach(([parentServiceId, inclusionRule]) => {
    if (!normalizedSelection.includes(parentServiceId)) {
      return;
    }

    normalizedSelection = normalizedSelection.filter(
      (serviceId) =>
        serviceId === parentServiceId ||
        !inclusionRule.includedIds.includes(serviceId),
    );
  });

  return normalizedSelection;
}

function WorkSelection({
  formPlateData,
  formDetailsData,
  vehiclePricingState,
  selectedWorks,
  setSelectedWorks,
  goToNextStep,
  goToPreviousStep,
  goToVehicleStep,
}: WorkSelectionProps) {
  const [error, setError] = useState("");
  const [detailsService, setDetailsService] = useState<ServiceDefinition | null>(
    null,
  );

  const selectedServiceObjects = activeServices.filter((service) =>
    selectedWorks.includes(service.id),
  );
  const pricingSummary = getServicePricingSummary(selectedWorks);
  const estimatedPricingSummary = getSelectedVehiclePricingSummary(
    selectedWorks,
    vehiclePricingState.pricing,
  );
  const pricingDisplayLabel = estimatedPricingSummary
    ? estimatedPricingSummary.displayLabel
    : pricingSummary.displayLabel;
  const pricingHelperText =
    vehiclePricingState.status === "loading"
      ? "Calculating the estimated price for your vehicle..."
      : pricingSummary.helperText;
  const vehicleTitle =
    [formDetailsData.make, formDetailsData.model, formDetailsData.year]
      .filter(Boolean)
      .join(" ") || "Vehicle details to be confirmed";
  const displayedRegistration =
    formPlateData.registration.trim().toUpperCase() ||
    "Registration to be confirmed";
  const displayedPostcode =
    formatPostcode(formPlateData.postcode || formDetailsData.postcode || "") ||
    "Postcode to be confirmed";
  const includedServicesByParent = selectedWorks.reduce<Record<string, string>>(
    (includedByParent, serviceId) => {
      const inclusionRule =
        includedServiceRules[serviceId as keyof typeof includedServiceRules];

      if (!inclusionRule) {
        return includedByParent;
      }

      inclusionRule.includedIds.forEach((includedId) => {
        includedByParent[includedId] = serviceId;
      });

      return includedByParent;
    },
    {},
  );

  const applySelectedWorks = (nextSelectedWorks: string[]) => {
    const normalizedSelection = normalizeSelectedServices(nextSelectedWorks);
    setSelectedWorks(normalizedSelection);
    setError("");
  };

  const handleToggleWork = (serviceId: string) => {
    const alreadySelected = selectedWorks.includes(serviceId);

    applySelectedWorks(
      alreadySelected
        ? selectedWorks.filter((item) => item !== serviceId)
        : [...selectedWorks, serviceId],
    );
  };

  const handleNext = () => {
    if (selectedWorks.length === 0) {
      setError("Select at least one service before continuing.");
      return;
    }

    goToNextStep();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          {bookingServiceSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className={sectionIndex > 0 ? "border-t border-slate-200" : ""}
            >
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
                  {section.title}
                </p>
              </div>

              {(() => {
                const sectionOptionIds = [
                  ...new Set(section.groups.flatMap((group) => group.optionIds)),
                ];

                return (
                  <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
                    {sectionOptionIds.map((serviceId) => {
                        const service = activeServicesById.get(serviceId);

                        if (!service) {
                          return null;
                        }

                        const isSelected = selectedWorks.includes(service.id);
                        const vehicleServicePrice =
                          vehiclePricingState.pricing?.pricesByServiceId[
                            service.id
                          ];
                        const includedByServiceId = includedServicesByParent[service.id];
                        const includingService = includedByServiceId
                          ? activeServicesById.get(includedByServiceId)
                          : null;
                        const isIncludedByAnotherSelection =
                          !isSelected && Boolean(includingService);
                        const isCheckboxChecked =
                          isSelected || isIncludedByAnotherSelection;

                        return (
                          <article
                            key={service.id}
                            className={`rounded-2xl border p-4 text-left transition-colors ${
                              isCheckboxChecked
                                ? "border-[#1c69d4] bg-blue-50"
                                : isIncludedByAnotherSelection
                                  ? "border-slate-200 bg-slate-100/80 opacity-80"
                                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                            }`}
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <label
                                className={`flex min-w-0 flex-1 items-start gap-3 ${
                                  isIncludedByAnotherSelection
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isCheckboxChecked}
                                  disabled={isIncludedByAnotherSelection}
                                  onChange={() => handleToggleWork(service.id)}
                                  className="mt-1 h-5 w-5 rounded border-slate-300 text-[#1c69d4] focus:ring-[#1c69d4]"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-semibold text-slate-950">
                                      {service.name}
                                    </h3>
                                    {vehicleServicePrice?.pricingType === "from" ? (
                                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-amber-800">
                                        From price
                                      </span>
                                    ) : !vehicleServicePrice &&
                                      vehiclePricingState.status !== "loading" &&
                                      service.pricingModel === "quote" ? (
                                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-amber-800">
                                        Quote
                                      </span>
                                    ) : null}
                                    {isIncludedByAnotherSelection ? (
                                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                                        Included
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <p className="font-semibold text-[#1c69d4]">
                                  {vehicleServicePrice
                                    ? formatVehicleServicePrice(vehicleServicePrice)
                                    : vehiclePricingState.status === "loading"
                                      ? "Calculating..."
                                      : formatServicePriceLabel(service)}
                                </p>
                                <p className="text-slate-600">
                                  Time: {service.labourTime}
                                </p>
                              </div>

                                  {isIncludedByAnotherSelection && includingService ? (
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                      Included in {includingService.name.toLowerCase()}.
                                    </p>
                                  ) : null}

                                  {service.id in includedServiceRules ? (
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                      {
                                        includedServiceRules[
                                          service.id as keyof typeof includedServiceRules
                                        ].note
                                      }
                                    </p>
                                  ) : null}
                                </div>
                              </label>

                              <div className="flex shrink-0 items-center justify-end sm:pt-1">
                                <button
                                  type="button"
                                  onClick={() => setDetailsService(service)}
                                  className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-[#1c69d4] hover:underline"
                                >
                                  More info
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}

                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border border-blue-100 bg-white shadow-sm xl:sticky xl:top-28">
          <div className="rounded-t-2xl bg-slate-950 px-5 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Estimated price
            </p>
            <h3 className="mt-3 text-3xl font-bold">
              {selectedServiceObjects.length
                ? vehiclePricingState.status === "loading"
                  ? "Calculating..."
                  : pricingDisplayLabel
                : "\u2014"}
            </h3>
            {selectedServiceObjects.length && estimatedPricingSummary ? (
              <PricingDisclaimer
                hasFromPricing={estimatedPricingSummary.hasFromPrices}
                className="mt-2 text-sm leading-6 text-slate-300"
              />
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {selectedServiceObjects.length
                  ? pricingHelperText
                  : "Select a service to view pricing and time."}
              </p>
            )}

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                Vehicle
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold text-white">
                  {vehicleTitle}
                </p>
                <p className="text-sm text-slate-300">{displayedRegistration}</p>
                <p className="text-sm text-slate-300">{displayedPostcode}</p>
              </div>
              <button
                type="button"
                onClick={goToVehicleStep}
                className="mt-3 text-sm font-medium text-blue-200 underline-offset-4 hover:text-white hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {selectedServiceObjects.length ? (
              <div className="space-y-3">
                {selectedServiceObjects.map((service) => {
                  const vehicleServicePrice =
                    vehiclePricingState.pricing?.pricesByServiceId[service.id];

                  return (
                  <div
                    key={service.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-950">
                            {service.name}
                          </h4>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#1c69d4]">
                            {vehicleServicePrice
                              ? formatVehicleServicePrice(vehicleServicePrice)
                              : vehiclePricingState.status === "loading"
                                ? "Calculating..."
                                : formatServicePriceLabel(service)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleWork(service.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#1c69d4] hover:text-[#1c69d4]"
                          aria-label={`Remove ${service.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Time: {service.labourTime}
                    </p>
                    {service.id in includedServiceRules ? (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {
                          includedServiceRules[
                            service.id as keyof typeof includedServiceRules
                          ].note
                        }
                      </p>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            ) : null}

            <div className="space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <p className="inline-flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1c69d4]" />
                Final availability can be checked against inventory before
                confirmation.
              </p>
              {estimatedPricingSummary?.hasFromPrices ||
              (!estimatedPricingSummary && pricingSummary.hasQuoteServices) ? (
                <p className="inline-flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1c69d4]" />
                  From-price services may change after the fault and required
                  parts have been confirmed.
                </p>
              ) : null}
              <p className="inline-flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1c69d4]" />
                If a required part is unavailable, we can show a clear next
                step instead of taking the booking.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {detailsService ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-details-title"
        >
          <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="public-kicker">Service details</p>
                <h3
                  id="service-details-title"
                  className="mt-2 text-2xl font-bold tracking-tight text-slate-950"
                >
                  {detailsService.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsService(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-[#1c69d4] hover:text-[#1c69d4]"
                aria-label="Close service details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-base leading-7 text-slate-700">
                {detailsService.shortDescription}
              </p>
              {detailsService.heroSummary !== detailsService.shortDescription ? (
                <p className="text-base leading-7 text-slate-600">
                  {detailsService.heroSummary}
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-950">
                  What is included
                </h4>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                  {detailsService.whatsIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1c69d4]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-950">
                  Important notes
                </h4>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                  {detailsService.importantNotes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div
          className="public-error-banner"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="public-btn-secondary w-full sm:w-auto"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="public-btn-primary w-full sm:w-auto"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default WorkSelection;
