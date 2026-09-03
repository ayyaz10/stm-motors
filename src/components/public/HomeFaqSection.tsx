import { ChevronDown } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { homeFaqs } from "../../data/homeFaqs";

interface FaqAccordionItemProps {
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  question: string;
}

function FaqAccordionItem({
  answer,
  isOpen,
  onToggle,
  question,
}: FaqAccordionItemProps) {
  const panelId = useId();
  const buttonId = `${panelId}-button`;
  const answerRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const element = answerRef.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setContentHeight(element.scrollHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [answer]);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white px-6 py-5 shadow-[0_24px_70px_-56px_rgba(15,23,42,0.26)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_28px_80px_-56px_rgba(15,23,42,0.3)]">
      <dt>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <span className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
            {question}
          </span>
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
              isOpen
                ? "border-[#1c69d4] bg-[#1c69d4] text-white"
                : "border-blue-100 bg-blue-50 text-[#1c69d4]"
            }`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ease-out ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </span>
        </button>
      </dt>

      <dd
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          ref={answerRef}
          className={`pt-4 transition-[transform,opacity] duration-300 ease-out ${
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
        >
          <p className="text-base leading-7 text-slate-600">{answer}</p>
        </div>
      </dd>
    </div>
  );
}

function HomeFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative scroll-mt-24 bg-[#edf4ff] py-20 lg:scroll-mt-28 lg:py-28"
      aria-labelledby="homepage-faq-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white px-6 py-10 shadow-[0_36px_100px_-70px_rgba(15,23,42,0.32)] sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

          <div className="mx-auto max-w-4xl text-left">
            <h2
              id="homepage-faq-heading"
              className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
            >
              FAQs
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Answers to common questions about mobile mechanic visits, brake
              pads, oil servicing, pricing, and the booking process.
            </p>

            <dl className="mt-10 space-y-4">
              {homeFaqs.map((item, index) => (
                <FaqAccordionItem
                  key={item.question}
                  answer={item.answer}
                  isOpen={openIndex === index}
                  onToggle={() =>
                    setOpenIndex((current) => (current === index ? null : index))
                  }
                  question={item.question}
                />
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeFaqSection;
