import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { useState } from "react";
import GoogleRecaptchaField from "../components/forms/GoogleRecaptchaField";
import {
  findDealershipVehicle,
  type DealershipVehicle,
} from "../data/dealershipVehicles";
import { servicePages } from "../data/servicePages";
import { contactDetails } from "../data/siteContent";
import {
  submitContactEnquiry,
  type ContactEnquiryType,
} from "../lib/contactEnquiries";
import { usePageMetadata } from "../lib/seo";

const availableServices = servicePages.map((service) => service.title);

const enquiryTypeOptions = [
  { value: "general", label: "General Enquiry" },
  { value: "service", label: "Car Service or Repair" },
  { value: "buy-car", label: "Buy a Car" },
  { value: "sell-car", label: "Sell My Car" },
] as const;

type EnquiryType = (typeof enquiryTypeOptions)[number]["value"];

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  enquiryType: EnquiryType;
  service: string;
  message: string;
}

const isEnquiryType = (value: string | null): value is EnquiryType =>
  enquiryTypeOptions.some((option) => option.value === value);

const createInitialFormData = (): {
  formData: ContactFormData;
  selectedVehicle?: DealershipVehicle;
} => {
  const searchParams = new URLSearchParams(window.location.search);
  const requestedEnquiry = searchParams.get("enquiry");
  const enquiryType = isEnquiryType(requestedEnquiry)
    ? requestedEnquiry
    : "general";
  const selectedVehicle =
    enquiryType === "buy-car"
      ? findDealershipVehicle(searchParams.get("vehicle") ?? "")
      : undefined;
  let message = "";

  if (selectedVehicle) {
    const subject = `Purchase Enquiry – ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`;
    message = `${subject}\n\nI am interested in this vehicle. Please contact me to discuss availability and the next steps.`;
  } else if (enquiryType === "sell-car") {
    message =
      "I would like to discuss selling my vehicle.\n\nVehicle make and model:\nRegistration year:\nMileage:\nRegistration number:";
  } else if (enquiryType === "buy-car") {
    message =
      "I am looking to buy a car.\n\nPreferred make and model:\nApproximate budget:\nFuel type and transmission:\nImportant features:\nPreferred timescale:";
  }

  return {
    selectedVehicle,
    formData: {
      name: "",
      email: "",
      phone: "",
      enquiryType,
      service: "",
      message,
    },
  };
};

function ContactPage() {
  usePageMetadata({
    title: "Contact STM Motors",
    description: "Book a service or ask a question with STM Motors.",
    pathname: "/contact",
  });

  const [{ formData: initialFormData, selectedVehicle }] = useState(
    createInitialFormData,
  );
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetCounter, setCaptchaResetCounter] = useState(0);
  const [website, setWebsite] = useState("");
  const recaptchaSiteKey =
    typeof __STM_RECAPTCHA_SITE_KEY__ === "string"
      ? __STM_RECAPTCHA_SITE_KEY__.trim()
      : "";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitted(false);
    setSubmissionError("");

    if (recaptchaSiteKey && !captchaToken) {
      setSubmissionError(
        "Please complete the spam protection check before sending your message.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactEnquiry({
        ...formData,
        enquiryType: formData.enquiryType as ContactEnquiryType,
        sourceUrl:
          typeof window !== "undefined" ? window.location.href : "/contact",
        captchaToken: recaptchaSiteKey ? captchaToken : undefined,
        website,
      });

      setIsSubmitted(true);
      setFormData(initialFormData);
      setWebsite("");
      setCaptchaToken("");
      setCaptchaResetCounter((current) => current + 1);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to send your message right now. Please try again.",
      );
      setCaptchaResetCounter((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      content: contactDetails.phone,
      subtext: contactDetails.openingHours,
    },
    {
      icon: Mail,
      title: "Email",
      content: contactDetails.email,
      subtext: "We reply within 24 hours",
    },
    {
      icon: MapPin,
      title: "Address",
      content: "123 Workshop Lane",
      subtext: "Motor City, MC1 2AB",
    },
    {
      icon: Clock,
      title: "Opening Hours",
      content: contactDetails.openingHours,
      subtext: "Sunday: Closed",
    },
  ];

  return (
    <div className="w-full pt-20">
      <section className="w-full bg-gradient-hero py-16 lg:py-20">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Let&apos;s Get You <span className="text-[#1c69d4]">Back on the Road</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Ask about a service, enquire about a listed car or tell us about
              a vehicle you would like to sell.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-12 lg:py-16">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {contactInfo.map((info) => {
                const Icon = info.icon;

                return (
                  <div
                    key={info.title}
                    className="text-center p-6 rounded-xl bg-blue-50"
                  >
                    <Icon className="w-8 h-8 text-[#1c69d4] mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {info.title}
                    </h3>
                    <p className="text-slate-700 text-sm">{info.content}</p>
                    <p className="text-slate-500 text-xs">{info.subtext}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-slate-50 py-16 lg:py-24">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white rounded-xl p-8 lg:p-10 shadow-sm border border-blue-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Send Us a Message
                </h2>
                <p className="text-slate-600 mb-6">
                  Fill out the form below and we&apos;ll get back to you as soon as
                  possible.
                </p>

                {isSubmitted ? (
                  <div className="mb-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-sm leading-6 text-[#1557b3] shadow-[0_18px_36px_-30px_rgba(28,105,212,0.45)]">
                    Thank you. Your message has been sent successfully, and a
                    member of the STM Motors team will get back to you as soon
                    as possible.
                  </div>
                ) : null}

                {submissionError ? (
                  <div className="public-error-banner mb-5" role="alert">
                    {submissionError}
                  </div>
                ) : null}

                {selectedVehicle?.status === "Sold" ? (
                  <div
                    role="alert"
                    className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                  >
                    The selected {selectedVehicle.year} {selectedVehicle.make}{" "}
                    {selectedVehicle.model} is sold. You can still send this
                    form to ask about similar vehicles, but it is no longer
                    available to purchase.
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div
                    aria-hidden="true"
                    className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
                  >
                    <label htmlFor="contact-website">Leave this field empty</label>
                    <input
                      id="contact-website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">
                        Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Your name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1c69d4] focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-2">
                        Email *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="your@email.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1c69d4] focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 mb-2">
                        Phone
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder={contactDetails.phone}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1c69d4] focus:ring-2 focus:ring-blue-100 transition-all"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-enquiry-type" className="block text-sm font-medium text-slate-700 mb-2">
                        Enquiry Type *
                      </label>
                      <select
                        id="contact-enquiry-type"
                        value={formData.enquiryType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enquiryType: e.target.value as EnquiryType,
                            service:
                              e.target.value === "service"
                                ? formData.service
                                : "",
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#1c69d4] focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                        disabled={isSubmitting}
                      >
                        {enquiryTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.enquiryType === "service" ? (
                    <div>
                      <label htmlFor="contact-service" className="block text-sm font-medium text-slate-700 mb-2">
                        Service Required
                      </label>
                      <select
                        id="contact-service"
                        value={formData.service}
                        onChange={(e) =>
                          setFormData({ ...formData, service: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#1c69d4] focus:ring-2 focus:ring-blue-100 transition-all"
                        disabled={isSubmitting}
                      >
                        <option value="">Select a service</option>
                        {availableServices.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="How can we help you?"
                      rows={5}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1c69d4] focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {recaptchaSiteKey ? (
                    <GoogleRecaptchaField
                      siteKey={recaptchaSiteKey}
                      onTokenChange={setCaptchaToken}
                      resetSignal={captchaResetCounter}
                    />
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:cursor-pointer disabled:opacity-75"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-2 shadow-sm border border-blue-100">
                  <div className="bg-blue-50 rounded-lg h-64 lg:h-80 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Map Location</p>
                      <p className="text-slate-400 text-sm">
                        123 Workshop Lane, Motor City
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Why Book With Us?
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Front and rear brake pad replacement available",
                      "Engine oil & filter replacement available",
                      "12-month warranty on all parts & labour",
                      "Qualified mechanics",
                      "Mobile appointments at your home or workplace",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#1c69d4] flex-shrink-0" />
                        <span className="text-slate-700 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-gradient-to-r from-[#1c69d4] to-[#1557b3] py-12 lg:py-16">
        <div className="w-full px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Need Emergency Assistance?
            </h2>
            <p className="text-blue-100 mb-6">
              Our breakdown service is available 24/7. Call us anytime.
            </p>
            <a
              href={`tel:${contactDetails.phone.replace(/\s+/g, "")}`}
              className="bg-white text-[#1c69d4] font-medium px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call {contactDetails.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
