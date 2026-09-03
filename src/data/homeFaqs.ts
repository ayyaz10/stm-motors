export interface HomeFaqItem {
  question: string;
  answer: string;
}

export const homeFaqs: HomeFaqItem[] = [
  {
    question: "What does a mobile mechanic service include?",
    answer:
      "STM Motors brings selected servicing and repair work to your home or workplace, so you can book practical vehicle care without arranging a garage visit.",
  },
  {
    question: "Which services can I book with STM Motors right now?",
    answer:
      "You can now submit bookings for brake work, routine servicing, diagnostics, battery service, heating and air conditioning, and suspension or steering repairs. Some services show fixed prices straight away, while others are confirmed with a quote after review.",
  },
  {
    question: "Can you replace brake pads at my home or workplace?",
    answer:
      "Yes. Front and rear brake pad replacement can be completed on-site when the vehicle is safely accessible and the job is suitable for mobile servicing.",
  },
  {
    question: "Do you offer engine oil and filter changes on-site?",
    answer:
      "Yes. Engine oil and filter replacement can be carried out at your location, helping you keep up with routine maintenance without losing time to a workshop visit.",
  },
  {
    question: "How does the booking process work?",
    answer:
      "Start with your registration and postcode, choose the service you need, pick your availability, and submit your details so the booking can be reviewed and confirmed.",
  },
  {
    question: "Is the price clear before I submit my booking?",
    answer:
      "Yes. Fixed-price services show their pricing in the booking flow, and quote-based services are clearly marked so you know final pricing will be confirmed after review.",
  },
  {
    question: "How do I check if STM Motors covers my area?",
    answer:
      "Enter your postcode at the start of the quote or booking flow. That is the quickest way to confirm whether we can arrange a mobile visit in your area.",
  },
  {
    question: "Why do customers trust STM Motors?",
    answer:
      "Customers choose STM Motors for qualified mechanics, clear communication, sensible pricing, and a 1-year warranty on parts and repairs included in the booking.",
  },
];

export const homeFaqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};
