import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Handshake,
  HelpCircle,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PublicLink from "../components/public/PublicLink";
import { usePageMetadata } from "../lib/seo";

const pageStructuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Car buying and selling enquiries",
  provider: {
    "@type": "AutomotiveBusiness",
    name: "STM Motors UK",
  },
  description:
    "Contact STM Motors UK to discuss buying a car or selling your current vehicle.",
  areaServed: "United Kingdom",
};

function CarsForSalePage() {
  usePageMetadata({
    title: "Buy or Sell a Car | STM Motors UK",
    description:
      "Tell STM Motors UK what car you are looking to buy, or share details of a vehicle you would like to sell. Start a straightforward vehicle enquiry today.",
    pathname: "/cars-for-sale",
    structuredData: pageStructuredData,
  });

  const buyingDetails = [
    "The make or model you have in mind",
    "Your approximate budget",
    "Preferred fuel type and transmission",
    "Important features or practical requirements",
    "When you would ideally like the vehicle",
  ];
  const sellingDetails = [
    "Vehicle make, model and registration year",
    "Registration number and current mileage",
    "General condition and service history",
    "Any known faults or outstanding work",
    "Your preferred contact details",
  ];
  const processSteps = [
    {
      icon: MessageSquareText,
      number: "01",
      title: "Tell us what you need",
      description:
        "Choose a buying or selling enquiry and share the vehicle details you already know.",
    },
    {
      icon: SearchCheck,
      number: "02",
      title: "We review your enquiry",
      description:
        "Our team will review the information and contact you to discuss availability, requirements and suitable next steps.",
    },
    {
      icon: Handshake,
      number: "03",
      title: "Agree the next step",
      description:
        "If we can help, we will explain what happens next so you can make an informed decision without pressure.",
    },
  ];
  const frequentlyAskedQuestions = [
    {
      question: "Do you currently list vehicles online?",
      answer:
        "We currently handle buying and selling enquiries directly. Contact us with what you need and our team will discuss current availability and the ways we may be able to help.",
    },
    {
      question: "Can I enquire if I already know the exact car I want?",
      answer:
        "Yes. Include the make, model, preferred year, budget and any essential features in your buying enquiry. The more detail you provide, the more useful our first conversation can be.",
    },
    {
      question: "What happens after I submit a selling enquiry?",
      answer:
        "We will review the vehicle information you provide and contact you to discuss its condition, any further details required and the appropriate next step.",
    },
    {
      question: "Does submitting an enquiry commit me to anything?",
      answer:
        "No. The form starts a conversation only. You can discuss your requirements and decide whether you would like to continue after speaking with the team.",
    },
  ];

  return (
    <div className="w-full pt-16 lg:pt-20">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(28,105,212,0.32),transparent_34%),radial-gradient(circle_at_12%_92%,rgba(21,87,179,0.2),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12 lg:py-28">
          <div className="max-w-2xl text-left">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Looking to Buy or Sell a Car?
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              Tell STM Motors UK what you are looking for, or share the details
              of a vehicle you would like to sell. We will review your enquiry
              and contact you for a straightforward conversation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PublicLink
                href="/contact?enquiry=buy-car"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40"
              >
                I&apos;m Looking to Buy
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PublicLink>
              <PublicLink
                href="/contact?enquiry=sell-car"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm hover:border-white hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                I Want to Sell My Car
              </PublicLink>
            </div>
            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
              Every enquiry starts with a conversation. Availability and next steps are confirmed directly by our team.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-label="Vehicle enquiry options">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-left backdrop-blur-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
                <CarFront className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-white">Looking for a car</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Share your preferred vehicle, budget and priorities so we can understand exactly what you need.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-left backdrop-blur-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-white">Selling your car</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Tell us about your current vehicle and we will contact you to discuss the information and next steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-3 lg:px-12">
          {[
            { icon: BadgeCheck, title: "Clear enquiries", text: "The right form is selected automatically." },
            { icon: MessageSquareText, title: "Direct conversation", text: "Discuss your requirements with our team." },
            { icon: Sparkles, title: "No-pressure approach", text: "Understand the options before deciding." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1c69d4]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="max-w-3xl text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1c69d4]">How we can help</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Start with the right conversation</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Whether you are changing cars or looking for something specific,
              a few useful details help us understand your enquiry from the start.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-[0_16px_40px_-32px_rgba(15,23,42,0.3)] sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1c69d4]">
                <SearchCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-950">I want to buy a car</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Let us know what would suit your driving, budget and everyday needs.
              </p>
              <h4 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Helpful information to include</h4>
              <ul className="mt-4 space-y-3">
                {buyingDetails.map((detail) => (
                  <li key={detail} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1c69d4]" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>
              <PublicLink
                href="/contact?enquiry=buy-car"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                Start a Buying Enquiry
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PublicLink>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-[0_16px_40px_-32px_rgba(15,23,42,0.3)] sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1c69d4]">
                <CarFront className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-950">I want to sell my car</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Share an honest overview of your vehicle so we can begin with the right information.
              </p>
              <h4 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">Helpful information to include</h4>
              <ul className="mt-4 space-y-3">
                {sellingDetails.map((detail) => (
                  <li key={detail} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1c69d4]" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>
              <PublicLink
                href="/contact?enquiry=sell-car"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-6 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                Start a Selling Enquiry
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PublicLink>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1c69d4]">What happens next</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">A simple three-step process</h2>
          </div>
          <ol className="mt-12 grid gap-6 lg:grid-cols-3">
            {processSteps.map(({ icon: Icon, number, title, description }) => (
              <li key={number} className="relative rounded-2xl border border-slate-200 p-7 text-left">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1c69d4]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-3xl font-bold text-slate-200">{number}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div className="text-left">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#1c69d4]">
              <HelpCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#1c69d4]">Common questions</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Before you get in touch</h2>
            <p className="mt-4 leading-7 text-slate-600">
              A few quick answers about how our vehicle enquiries work.
            </p>
          </div>
          <div className="grid gap-4">
            {frequentlyAskedQuestions.map(({ question, answer }) => (
              <article key={question} className="rounded-2xl border border-slate-200 bg-white p-6 text-left">
                <h3 className="font-semibold text-slate-950">{question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#1c69d4] to-[#1557b3] px-6 py-12 text-center shadow-xl shadow-blue-900/10 sm:px-10 lg:px-14 lg:py-14">
            <h2 className="text-3xl font-bold text-white">Tell Us What You Need</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
              Choose the enquiry that applies to you. The contact form will be prepared with the right details, and every field remains editable.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <PublicLink
                href="/contact?enquiry=buy-car"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[#1c69d4] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                Contact Us About Buying
              </PublicLink>
              <PublicLink
                href="/contact?enquiry=sell-car"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white hover:text-[#1c69d4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                Contact Us About Selling
              </PublicLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CarsForSalePage;
