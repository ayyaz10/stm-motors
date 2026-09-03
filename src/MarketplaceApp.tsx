import { useEffect, useState, type ReactNode } from "react";
import StaffPortalRedirect from "./components/auth/StaffPortalRedirect";
import MarketplaceLayout from "./components/marketplace/MarketplaceLayout";
import { navigateTo } from "./lib/navigation";
import { mapLegacyStaffPath } from "./lib/staffPortal";
import { STAFF_SITE_ORIGIN } from "./lib/siteMode";
import MarketplaceContactPage from "./pages/marketplace/MarketplaceContactPage";
import MarketplaceHomePage from "./pages/marketplace/MarketplaceHomePage";
import MarketplaceInventoryPage from "./pages/marketplace/MarketplaceInventoryPage";
import MarketplaceVehiclePage from "./pages/marketplace/MarketplaceVehiclePage";
import SellYourCarPage from "./pages/marketplace/SellYourCarPage";
import MarketplaceAcceptInvitePage from "./pages/marketplace/admin/MarketplaceAcceptInvitePage";

function MarketplaceApp() {
  const [location, setLocation] = useState({ pathname: window.location.pathname, search: window.location.search });

  useEffect(() => {
    const updateLocation = () => setLocation({ pathname: window.location.pathname, search: window.location.search });
    window.addEventListener("popstate", updateLocation);
    if (window.location.pathname === "/cars-for-sale") navigateTo("/cars", true);
    else if (window.location.pathname.startsWith("/cars-for-sale/")) navigateTo(`/cars/${window.location.pathname.slice("/cars-for-sale/".length)}`, true);
    return () => window.removeEventListener("popstate", updateLocation);
  }, []);

  const { pathname, search } = location;
  const legacyStaffPath = mapLegacyStaffPath(pathname);
  let content: ReactNode;
  let usePublicLayout = true;

  if (pathname === "/") content = <MarketplaceHomePage />;
  else if (pathname === "/cars") content = <MarketplaceInventoryPage />;
  else if (pathname.startsWith("/cars/")) content = <MarketplaceVehiclePage slug={decodeURIComponent(pathname.slice("/cars/".length))} />;
  else if (pathname === "/sell-your-car") content = <SellYourCarPage />;
  else if (pathname === "/contact") content = <MarketplaceContactPage />;
  else if (pathname === "/admin/accept-invite") {
    usePublicLayout = false;
    content = <MarketplaceAcceptInvitePage successHref={`${STAFF_SITE_ORIGIN}/login`} successLabel="Sign in to the central staff portal" />;
  } else if (legacyStaffPath) {
    usePublicLayout = false;
    content = <StaffPortalRedirect pathname={pathname} search={search} />;
  } else {
    content = <section className="mx-auto max-w-3xl px-6 py-24 text-center"><h1 className="text-4xl font-bold">Page not found</h1><button onClick={() => navigateTo("/")} className="mt-7 rounded-xl bg-[#1c69d4] px-5 py-3 font-semibold text-white">Marketplace home</button></section>;
  }

  return usePublicLayout ? <MarketplaceLayout currentPath={pathname}>{content}</MarketplaceLayout> : content;
}

export default MarketplaceApp;
