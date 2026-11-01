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
            className={`pixel-card overflow-hidden ${isOpen ? "!border-accent-green/60 !shadow-[4px_4px_0_0_rgba(57,224,127,0.25)]" : "hover:!border-accent-blue/50"}`}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-lg font-bold text-foreground transition-colors hover:bg-card-hover"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <span
                aria-hidden
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-md border-2 text-sm font-bold transition-colors ${
                  isOpen ? "border-accent-green bg-accent-green/15 text-accent-green" : "border-border bg-border/30 text-muted"
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
