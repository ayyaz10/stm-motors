export const ESTIMATED_PRICE_DISCLAIMER =
  "Includes estimated parts, labour and mobile mechanic visit. Final price is confirmed after we verify your vehicle and required parts. In most cases, the price stays the same.";

export const FROM_PRICE_DISCLAIMER =
  "Starting price includes estimated parts, labour and mobile mechanic visit. The final price depends on the exact fault, parts required and vehicle specification. We will confirm the final price before any work begins.";

interface PricingDisclaimerProps {
  className?: string;
  hasFromPricing: boolean;
}

function PricingDisclaimer({
  className = "",
  hasFromPricing,
}: PricingDisclaimerProps) {
  return (
    <p className={className}>
      {hasFromPricing
        ? FROM_PRICE_DISCLAIMER
        : ESTIMATED_PRICE_DISCLAIMER}
    </p>
  );
}

export default PricingDisclaimer;
