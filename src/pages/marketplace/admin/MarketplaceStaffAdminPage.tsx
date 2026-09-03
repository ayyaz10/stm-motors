import {
  LoaderCircle,
  MailPlus,
  RefreshCw,
  RotateCw,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchStaffDirectory,
  inviteStaffMember,
  isValidStaffEmail,
  manageStaffInvitation,
  type MarketplaceStaffMember,
  type MarketplaceStaffRole,
  type StaffInvitationSummary,
} from "../../../lib/staffInvitations";
import { usePageMetadata } from "../../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../../lib/siteMode";

const activeStatuses = new Set(["creating", "pending"]);

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

function statusClasses(status: StaffInvitationSummary["status"]) {
  if (status === "accepted") return "bg-emerald-100 text-emerald-800";
  if (status === "pending" || status === "creating") return "bg-amber-100 text-amber-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function MarketplaceStaffAdminPage({
  canonicalOrigin = MARKETPLACE_SITE_ORIGIN,
  canonicalPath = "/admin/staff",
}: {
  canonicalOrigin?: string;
  canonicalPath?: string;
}) {
  const [staff, setStaff] = useState<MarketplaceStaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitationSummary[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MarketplaceStaffRole>("ops");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyInvitationId, setBusyInvitationId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  usePageMetadata({
    title: "Staff Management | STM Motors",
    description: "Manage invitation-only STM Motors marketplace staff access.",
    pathname: canonicalPath,
    canonicalOrigin,
    noIndex: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const directory = await fetchStaffDirectory();
      setStaff(directory.staff);
      setInvitations(directory.invitations);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load staff accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeInvitations = useMemo(
    () => invitations.filter((invitation) => activeStatuses.has(invitation.status)),
    [invitations],
  );

  const submitInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setError("Enter the staff member's full name.");
      return;
    }
    if (!isValidStaffEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (
      role === "admin" &&
      !window.confirm("Invite this person as an Admin with staff-management access?")
    ) {
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      await inviteStaffMember({ fullName: trimmedName, email, role });
      setFullName("");
      setEmail("");
      setRole("ops");
      setMessage("Invitation sent. Staff access will activate only after the recipient accepts it.");
      await load();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to send the invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const runInvitationAction = async (
    action: "resend" | "cancel",
    invitation: StaffInvitationSummary,
  ) => {
    if (
      action === "cancel" &&
      !window.confirm(`Cancel the pending invitation for ${invitation.email}?`)
    ) {
      return;
    }
    try {
      setBusyInvitationId(invitation.id);
      setError("");
      setMessage("");
      await manageStaffInvitation(action, invitation.id);
      setMessage(action === "resend" ? "Invitation resent." : "Invitation cancelled.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Unable to ${action} the invitation.`);
    } finally {
      setBusyInvitationId("");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1c69d4]">Admin only</p>
          <h1 className="mt-2 text-3xl font-bold">Staff management</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Invite Admin or Ops staff. There is no public signup and access activates only after invitation acceptance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error ? <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p> : null}

      <div className="mt-7 grid gap-7 xl:grid-cols-[23rem_1fr]">
        <form onSubmit={submitInvite} className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <MailPlus className="h-6 w-6 text-[#1c69d4]" />
            <h2 className="text-xl font-bold">Invite staff member</h2>
          </div>
          <div className="mt-6 grid gap-5">
            <label className="text-sm font-semibold">
              Full name
              <input required minLength={2} maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input required type="email" autoComplete="off" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
            </label>
            <label className="text-sm font-semibold">
              Approved role
              <select value={role} onChange={(event) => setRole(event.target.value as MarketplaceStaffRole)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal">
                <option value="ops">Ops — vehicles and enquiries</option>
                <option value="admin">Admin — includes staff invitations</option>
              </select>
            </label>
            <button disabled={submitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 font-semibold text-white disabled:opacity-60">
              {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <MailPlus className="h-5 w-5" />}
              {submitting ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </form>

        <div className="grid gap-7">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-bold">Active staff</h2>
              <p className="mt-1 text-sm text-slate-600">Admin and Ops accounts with active profiles.</p>
            </div>
            {loading ? <div className="flex min-h-36 items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-[#1c69d4]" /></div> : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Staff member</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Last sign-in</th><th className="px-5 py-3">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{staff.map((member) => <tr key={member.id}><td className="px-5 py-4"><p className="font-semibold">{member.fullName || "Unnamed staff member"}</p><p className="mt-1 text-xs text-slate-500">{member.email || "Email unavailable"}</p></td><td className="px-5 py-4 font-semibold uppercase">{member.role}</td><td className="px-5 py-4 text-slate-600">{formatDate(member.lastSignInAt)}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"><UserRoundCheck className="h-3.5 w-3.5" />Active</span></td></tr>)}</tbody>
              </table>
            )}
            {!loading && !staff.length ? <p className="p-6 text-sm text-slate-600">No active Admin or Ops profiles found.</p> : null}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-bold">Invitations</h2>
              <p className="mt-1 text-sm text-slate-600">{activeInvitations.length} currently active. Previous invitation records remain for audit.</p>
            </div>
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Sent / expiry</th><th className="px-5 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{invitations.map((invitation) => <tr key={invitation.id}><td className="px-5 py-4"><p className="font-semibold">{invitation.fullName}</p><p className="mt-1 text-xs text-slate-500">{invitation.email}</p><p className="mt-1 text-xs text-slate-400">By {invitation.invitedByName}</p></td><td className="px-5 py-4 font-semibold uppercase">{invitation.role}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(invitation.status)}`}>{invitation.status}</span></td><td className="px-5 py-4 text-xs leading-5 text-slate-600"><p>Sent: {formatDate(invitation.lastSentAt)}</p><p>Expires: {formatDate(invitation.expiresAt)}</p></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2">{invitation.status === "pending" ? <><button type="button" disabled={Boolean(busyInvitationId)} onClick={() => void runInvitationAction("resend", invitation)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50">{busyInvitationId === invitation.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}Resend</button><button type="button" disabled={Boolean(busyInvitationId)} onClick={() => void runInvitationAction("cancel", invitation)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 font-semibold text-rose-700 disabled:opacity-50"><UserRoundX className="h-4 w-4" />Cancel</button></> : <span className="text-xs text-slate-400">No actions</span>}</div></td></tr>)}</tbody>
            </table>
            {!loading && !invitations.length ? <p className="p-6 text-sm text-slate-600">No staff invitations have been sent.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MarketplaceStaffAdminPage;
