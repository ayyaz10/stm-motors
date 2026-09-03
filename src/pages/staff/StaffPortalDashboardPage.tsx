import { CarFront, ClipboardCheck, Gauge, Users, Wrench } from "lucide-react";
import type { StaffRole } from "../../lib/auth";
import { navigateTo } from "../../lib/navigation";

const cards = [
  { title: "Marketplace", detail: "Manage vehicle listings, images and customer enquiries.", href: "/marketplace/vehicles", roles: ["admin", "ops"] as StaffRole[], icon: CarFront },
  { title: "Operations", detail: "Assign bookings, manage availability and review job progress.", href: "/operations/jobs", roles: ["admin", "ops"] as StaffRole[], icon: Gauge },
  { title: "Mechanic applications", detail: "Review and approve mechanic applications.", href: "/operations/mechanic-applications", roles: ["admin", "ops"] as StaffRole[], icon: ClipboardCheck },
  { title: "Assigned jobs", detail: "Open assigned jobs and continue the guided workflow.", href: "/mechanic/jobs", roles: ["admin", "mechanic"] as StaffRole[], icon: Wrench },
  { title: "Staff management", detail: "Invite Admin and Ops staff and review invitation status.", href: "/staff", roles: ["admin"] as StaffRole[], icon: Users },
];

function dashboardCardsForRole(role: StaffRole) {
  return cards.filter((card) => card.roles.includes(role));
}

function StaffPortalDashboardPage({ role, name }: { role: StaffRole; name: string }) {
  return <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1c69d4]">{role} workspace</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome, {name}</h1><p className="mt-3 max-w-2xl text-slate-600">Choose a module below. Access is controlled by your STM Motors staff role and Supabase security policies.</p><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{dashboardCardsForRole(role).map(({ title, detail, href, icon: Icon }) => <button key={href} type="button" onClick={() => navigateTo(href)} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><Icon className="h-8 w-8 text-[#1c69d4]" /><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p><span className="mt-5 inline-flex text-sm font-semibold text-[#1c69d4]">Open module →</span></button>)}</div></main>;
}

export default StaffPortalDashboardPage;
