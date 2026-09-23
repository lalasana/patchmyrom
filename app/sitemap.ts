import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

type RouteConfig = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: string;
};

// lastModified values are fixed, realistic dates (not `new Date()` at build
// time) so the sitemap doesn't claim every page changed on every deploy —
// only bump a route's date when its content actually changes.
const routes: RouteConfig[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly", lastModified: "2026-07-02" },
  { path: "/pokemon-rom-patcher", priority: 0.9, changeFrequency: "weekly", lastModified: "2026-07-03" },
  { path: "/patch-formats", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-07-02" },
  { path: "/how-to-patch-pokemon-rom-hacks", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/troubleshooting", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/ips-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/bps-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/ups-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/xdelta-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/gba-rom-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/nds-rom-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/gbc-rom-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/nes-rom-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/snes-rom-patcher", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/gba-play", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-09-23" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly", lastModified: "2026-07-03" },
  { path: "/changelog", priority: 0.5, changeFrequency: "weekly", lastModified: "2026-07-03" },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly", lastModified: "2026-07-02" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly", lastModified: "2026-07-02" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly", lastModified: "2026-07-02" },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly", lastModified: "2026-07-02" },
  { path: "/dmca", priority: 0.3, changeFrequency: "yearly", lastModified: "2026-07-02" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
