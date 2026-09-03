import { CarFront, ClipboardList, LogOut, MessageSquareText, Plus, Store, Users } from "lucide-react";
import type { ReactNode } from "react";
import { navigateTo } from "../../lib/navigation";
import type { StaffRole } from "../../lib/auth";

function MarketplaceAdminShell({ children, currentPath, staffName, staffRole, onSignOut }: { children: ReactNode; currentPath: string; staffName: string; staffRole: StaffRole; onSignOut: () => void }) {
  const links = [
    { href: "/admin/vehicles", label: "Vehicles", icon: CarFront },
    { href: "/admin/vehicles/new", label: "Add vehicle", icon: Plus },
    { href: "/admin/enquiries", label: "Purchase enquiries", icon: MessageSquareText },
    { href: "/admin/sell-submissions", label: "Sell submissions", icon: ClipboardList },
    ...(staffRole === "admin"
      ? [{ href: "/admin/staff", label: "Staff", icon: Users }]
      : []),
  ];
  return <main className="min-h-screen bg-slate-100"><header className="border-b border-slate-800 bg-slate-950 text-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-300">STM Motors Marketplace</p><p className="mt-1 text-sm text-slate-300">Signed in as {staffName}</p></div><nav className="flex flex-wrap gap-2">{links.map(({ href, label, icon: Icon }) => <button key={href} type="button" onClick={() => navigateTo(href)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${currentPath === href || (href === "/admin/vehicles" && currentPath.startsWith("/admin/vehicles/") && currentPath !== "/admin/vehicles/new") ? "bg-[#1c69d4] text-white" : "bg-white/8 text-slate-200 hover:bg-white/15"}`}><Icon className="h-4 w-4" />{label}</button>)}<button type="button" onClick={() => navigateTo("/")} className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-sm font-semibold"><Store className="h-4 w-4" />Public site</button><button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 px-3 py-2 text-sm font-semibold text-rose-200"><LogOut className="h-4 w-4" />Sign out</button></nav></div></header>{children}</main>;
}

export default MarketplaceAdminShell;
