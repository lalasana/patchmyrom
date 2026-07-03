"use client";

import { useState } from "react";
import JsonLd from "@/components/seo/JsonLd";

export type FaqItem = {
  question: string;
  answer: string;
};

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col gap-3">
      <JsonLd data={jsonLd} />
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className={`card overflow-hidden transition-colors ${isOpen ? "border-accent-blue/30" : "hover:border-border/80"}`}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-medium text-foreground transition-colors hover:bg-card-hover"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <span
                aria-hidden
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm transition-colors ${
                  isOpen ? "bg-accent-blue/15 text-accent-blue" : "bg-border/40 text-muted"
                }`}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {/*
              Always rendered (never conditionally mounted) so the full answer
              text exists in the static HTML output for non-JS readers and AI
              crawlers, not just inside the JSON-LD block. Collapsed state is
              purely a CSS grid-row trick — no content is added or removed.
            */}
            <div
              className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border/60 px-4 py-4 text-sm leading-relaxed text-muted">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
