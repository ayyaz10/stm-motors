import { useEffect } from "react";
import { buildStaffPortalUrl } from "../../lib/staffPortal";

function StaffPortalRedirect({ pathname, search = "" }: { pathname: string; search?: string }) {
  const destination = buildStaffPortalUrl(pathname, search);

  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-center text-white">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-blue-300">STM Motors Staff</p>
        <h1 className="mt-3 text-3xl font-bold">Opening the staff portal</h1>
        <p className="mt-3 text-slate-300">Your secure staff workspace is moving to one central location.</p>
        <a href={destination} className="mt-6 inline-flex rounded-xl bg-[#1c69d4] px-5 py-3 font-semibold text-white">Continue to staff portal</a>
      </section>
    </main>
  );
}

export default StaffPortalRedirect;
