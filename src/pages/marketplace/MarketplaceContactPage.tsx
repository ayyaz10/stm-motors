import { Mail, Phone } from "lucide-react";
import { useState } from "react";
import GoogleRecaptchaField from "../../components/forms/GoogleRecaptchaField";
import PublicLink from "../../components/public/PublicLink";
import { contactDetails } from "../../data/siteContent";
import { submitContactEnquiry } from "../../lib/contactEnquiries";
import { usePageMetadata } from "../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../lib/siteMode";

function MarketplaceContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    website: "",
  });
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const captchaSiteKey =
    typeof __STM_RECAPTCHA_SITE_KEY__ === "string"
      ? __STM_RECAPTCHA_SITE_KEY__.trim()
      : "";
  usePageMetadata({
    title: "Contact STM Motors Vehicle Sales",
    description: "Contact STM Motors about buying or selling a used car.",
    pathname: "/contact",
    canonicalOrigin: MARKETPLACE_SITE_ORIGIN,
  });
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (captchaSiteKey && !captchaToken) {
      setError("Complete the spam protection check.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await submitContactEnquiry({
        ...form,
        enquiryType: "buy-car",
        service: "",
        captchaToken: captchaSiteKey ? captchaToken : undefined,
        sourceUrl: window.location.href,
      });
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "", website: "" });
      setCaptchaToken("");
      setCaptchaReset((value) => value + 1);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send your message.",
      );
      setCaptchaReset((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-300">
            Vehicle sales
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Talk to STM Motors
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Ask about current stock, a particular vehicle or the car you would
            like to sell.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[.7fr_1.3fr] lg:px-12">
        <aside className="h-fit rounded-3xl bg-blue-50 p-7">
          <h2 className="text-2xl font-bold">Contact sales</h2>
          <a
            href={`tel:${contactDetails.phone.replace(/\s+/g, "")}`}
            className="mt-6 flex items-center gap-3 font-semibold"
          >
            <Phone className="h-5 w-5 text-[#1c69d4]" />
            {contactDetails.phone}
          </a>
          <a
            href={`mailto:${contactDetails.email}`}
            className="mt-4 flex items-center gap-3 font-semibold"
          >
            <Mail className="h-5 w-5 text-[#1c69d4]" />
            {contactDetails.email}
          </a>
          <div className="mt-8 grid gap-3">
            <PublicLink
              href="/cars"
              className="rounded-xl bg-[#1c69d4] px-5 py-3 text-center font-semibold text-white"
            >
              Browse cars
            </PublicLink>
            <PublicLink
              href="/sell-your-car"
              className="rounded-xl border border-blue-200 px-5 py-3 text-center font-semibold text-[#1c69d4]"
            >
              Sell your car
            </PublicLink>
          </div>
        </aside>
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold">Send a sales message</h2>
          {sent ? (
            <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              Thank you. Your message has been sent to STM Motors.
            </p>
          ) : null}
          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <label className="text-sm font-semibold">
              Name *
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Email *
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Message *
              <textarea
                required
                minLength={10}
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
              />
            </label>
            <input
              tabIndex={-1}
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="hidden"
            />
            {captchaSiteKey ? (
              <div className="sm:col-span-2">
                <GoogleRecaptchaField
                  siteKey={captchaSiteKey}
                  onTokenChange={setCaptchaToken}
                  resetSignal={captchaReset}
                />
              </div>
            ) : null}
            {error ? (
              <p className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                {error}
              </p>
            ) : null}
            <button
              disabled={submitting}
              className="sm:col-span-2 min-h-12 rounded-xl bg-[#1c69d4] font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default MarketplaceContactPage;
