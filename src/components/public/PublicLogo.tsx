interface PublicLogoProps {
  compact?: boolean;
  light?: boolean;
}

const HEADER_LOGO_SRC = "/images/STM_Motors_Horizontal_Header_Logo_dark.png";
const FOOTER_LOGO_SRC =
  "/images/STM_Motors_Horizontal_Header_Logo_white_blue_light.png";

function PublicLogo({ compact = false, light = false }: PublicLogoProps) {
  const logoHeightClass = compact ? "h-9" : "h-12 sm:h-14";

  return (
    <span className="inline-flex shrink-0 items-center">
      <img
        src={light ? FOOTER_LOGO_SRC : HEADER_LOGO_SRC}
        alt="STM Motors"
        className={`${logoHeightClass} w-auto`}
        loading="eager"
        decoding="async"
      />
    </span>
  );
}

export default PublicLogo;
