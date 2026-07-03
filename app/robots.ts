import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default fallback — every crawler not explicitly named below is still
      // fully allowed. This is intentionally listed first so it reads as the
      // baseline, not as an afterthought.
      {
        userAgent: "*",
        allow: "/",
      },

      // --- AI answer-engine crawlers, explicitly allowed on purpose ---
      // The wildcard rule above already permits these, but they're named
      // individually so the policy is explicit rather than implicit. The
      // goal of this site is to be readable and citable by AI answer
      // engines, so do NOT narrow or remove any of these without a specific
      // reason — a future edit tightening "*" should not silently take
      // these down with it.
      { userAgent: "OAI-SearchBot", allow: "/" }, // OpenAI — crawls for ChatGPT search / citations
      { userAgent: "ChatGPT-User", allow: "/" }, // OpenAI — fetches a page when a user asks ChatGPT to browse it
      { userAgent: "ClaudeBot", allow: "/" }, // Anthropic — general crawler for Claude's web knowledge
      { userAgent: "Claude-User", allow: "/" }, // Anthropic — fetches a page on behalf of a user's Claude request
      { userAgent: "Claude-SearchBot", allow: "/" }, // Anthropic — crawls for Claude's web search feature
      { userAgent: "PerplexityBot", allow: "/" }, // Perplexity — indexes pages for its answer engine
      { userAgent: "Perplexity-User", allow: "/" }, // Perplexity — fetches a page a user asks it to browse
      { userAgent: "Google-Extended", allow: "/" }, // Google — governs use in Gemini / AI Overviews
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
