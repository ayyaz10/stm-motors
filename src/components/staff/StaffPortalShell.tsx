import {
  CarFront,
  ClipboardCheck,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { StaffRole } from "../../lib/auth";
import { navigateTo } from "../../lib/navigation";

interface StaffPortalNavItem {
  href: string;
  label: string;
  roles: StaffRole[];
  icon: typeof LayoutDashboard;
}

const staffPortalNavItems: StaffPortalNavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "ops", "mechanic"], icon: LayoutDashboard },
  { href: "/marketplace/vehicles", label: "Marketplace", roles: ["admin", "ops"], icon: CarFront },
  { href: "/marketplace/enquiries", label: "Enquiries", roles: ["admin", "ops"], icon: ClipboardCheck },
  { href: "/operations/jobs", label: "Job assignment", roles: ["admin", "ops"], icon: UserCog },
  { href: "/operations/job-progress", label: "Job progress", roles: ["admin", "ops"], icon: Gauge },
  { href: "/mechanic/jobs", label: "Mechanic jobs", roles: ["admin", "mechanic"], icon: Wrench },
  { href: "/staff", label: "Staff", roles: ["admin"], icon: Users },
];

function visibleStaffPortalNavItems(role: StaffRole) {
  return staffPortalNavItems.filter((item) => item.roles.includes(role));
}

function StaffPortalShell({
  children,
  currentPath,
  staffName,
  staffRole,
  onSignOut,
}: {
  children: ReactNode;
  currentPath: string;
  staffName: string;
  staffRole: StaffRole;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = visibleStaffPortalNavItems(staffRole);
  const isCurrent = (href: string) =>
    currentPath === href ||
    (href === "/marketplace/vehicles" && currentPath.startsWith("/marketplace/vehicles/"));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex min-h-16 max-w-[96rem] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <button type="button" onClick={() => navigateTo("/dashboard")} className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-300">STM Motors</p>
            <p className="mt-0.5 font-bold">Staff Portal</p>
          </button>
          <nav className="hidden flex-wrap items-center justify-end gap-1 xl:flex" aria-label="Staff portal">
            {links.map(({ href, label, icon: Icon }) => (
              <button key={href} type="button" onClick={() => navigateTo(href)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${isCurrent(href) ? "bg-[#1c69d4] text-white" : "text-slate-200 hover:bg-white/10"}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
            <button type="button" onClick={onSignOut} className="ml-2 inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-semibold text-rose-200"><LogOut className="h-4 w-4" />Sign out</button>
          </nav>
          <button type="button" onClick={() => setMenuOpen((value) => !value)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 xl:hidden" aria-label="Toggle staff navigation">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen ? (
          <nav className="grid gap-1 border-t border-white/10 px-5 py-4 xl:hidden" aria-label="Staff portal mobile">
            <p className="mb-2 text-xs text-slate-400">{staffName} · {staffRole}</p>
            {links.map(({ href, label, icon: Icon }) => <button key={href} type="button" onClick={() => { setMenuOpen(false); navigateTo(href); }} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold ${isCurrent(href) ? "bg-[#1c69d4]" : "text-slate-200 hover:bg-white/10"}`}><Icon className="h-5 w-5" />{label}</button>)}
            <button type="button" onClick={onSignOut} className="mt-2 flex items-center gap-3 rounded-xl border border-rose-400/30 px-4 py-3 text-left font-semibold text-rose-200"><LogOut className="h-5 w-5" />Sign out</button>
          </nav>
        ) : null}
      </header>
      <div className="border-b border-slate-200 bg-white px-5 py-2 text-right text-xs text-slate-500 lg:px-8">Signed in as <span className="font-semibold text-slate-700">{staffName}</span> · <span className="uppercase">{staffRole}</span></div>
      {children}
    </div>
  );
}

export default StaffPortalShell;
