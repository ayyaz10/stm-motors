import { ChevronDown } from "lucide-react";

interface MarketplaceFaq {
  question: string;
  answer: string;
}

const marketplaceGeneralFaqs: MarketplaceFaq[] = [
  {
    question: "Is a vehicle submission a guaranteed valuation or offer?",
    answer:
      "No. Sending us your vehicle details only starts a review. It is not a guaranteed valuation, purchase offer or agreement. STM Motors will contact you directly if there is a suitable next step.",
  },
  {
    question: "Will my vehicle details or photos be published?",
    answer:
      "No. Seller submissions and uploaded photos stay private and are only available to authorised STM Motors staff for reviewing your request.",
  },
  {
    question: "What happens after I submit my car?",
    answer:
      "Our team reviews the information you provide and then contacts you using your preferred contact method if we need more details or want to discuss a next step.",
  },
  {
    question: "Can I ask about a car before arranging a viewing?",
    answer:
      "Yes. Open the vehicle listing and send an enquiry, or contact our sales team. We can answer questions and confirm the vehicle's current availability before you travel.",
  },
  {
    question: "Are listed vehicles guaranteed to be available?",
    answer:
      "Availability can change. Please enquire with STM Motors so we can confirm the vehicle is still available before you make plans to view it.",
  },
];

function MarketplaceFaqSection({
  faqs = marketplaceGeneralFaqs,
}: {
  faqs?: MarketplaceFaq[];
}) {
  return (
    <section className="border-t border-slate-200 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[90rem] px-5 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-950 sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-semibold text-slate-950">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-[#1c69d4] transition-transform group-open:rotate-180" />
              </summary>
              <p className="max-w-4xl pb-6 pr-10 leading-7 text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MarketplaceFaqSection;
