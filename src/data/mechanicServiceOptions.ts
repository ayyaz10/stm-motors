export const mechanicServiceOptions = [
  {
    label: "Brake pads, discs, and calipers",
    value: "brake_pads_discs_calipers",
  },
  {
    label: "Brake fluid replacement",
    value: "brake_fluid_replacement",
  },
  {
    label: "Engine oil, air filter, and cabin filter service",
    value: "engine_oil_and_filters",
  },
  {
    label: "Engine flush",
    value: "engine_flush",
  },
  {
    label: "Full service",
    value: "full_service",
  },
  {
    label: "Top up all fluids",
    value: "top_up_all_fluids",
  },
  {
    label: "Battery service",
    value: "battery_service",
  },
  {
    label: "Heating and air conditioning",
    value: "heating_air_conditioning",
  },
  {
    label: "Engine diagnostic service",
    value: "engine_diagnostic_service",
  },
  {
    label: "Suspension and steering system repairs",
    value: "suspension_steering_repairs",
  },
] as const;

export const mechanicServiceLabelMap = Object.fromEntries(
  mechanicServiceOptions.map((option) => [option.value, option.label]),
) as Record<string, string>;

export function formatMechanicServiceLabel(value: string): string {
  return mechanicServiceLabelMap[value] ?? value.replaceAll("_", " ");
}
