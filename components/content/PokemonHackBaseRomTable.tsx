"use client";

import { useMemo, useState } from "react";
import {
  pokemonHackBaseRomTable,
  type PokemonHackPlatform,
} from "@/lib/data/pokemonHackBaseRomTable";

const PLATFORM_FILTERS: Array<{ value: PokemonHackPlatform | "All"; label: string }> = [
  { value: "All", label: "All platforms" },
  { value: "GBA", label: "GBA" },
  { value: "GBC", label: "GBC" },
  { value: "GB", label: "GB" },
  { value: "NDS", label: "NDS" },
];

const platformBadgeClasses: Record<PokemonHackPlatform, string> = {
  GBA: "border-accent-green/30 bg-accent-green/10 text-accent-green",
  GBC: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
  GB: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  NDS: "border-purple-500/30 bg-purple-500/10 text-purple-300",
};

function formatBadgeClasses(format: string): string {
  const normalized = format.trim().toLowerCase();
  if (normalized === "ips") return "border-accent-green/30 bg-accent-green/10 text-accent-green";
  if (normalized === "ups") return "border-accent-blue/30 bg-accent-blue/10 text-accent-blue";
  if (normalized === "bps") return "border-purple-500/30 bg-purple-500/10 text-purple-300";
  if (normalized === "xdelta") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-border bg-card-hover text-muted";
}

function PlatformBadge({ platform }: { platform: PokemonHackPlatform }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${platformBadgeClasses[platform]}`}
    >
      {platform}
    </span>
  );
}

function FormatBadgeSmall({ format }: { format: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${formatBadgeClasses(format)}`}
    >
      {format}
    </span>
  );
}

export default function PokemonHackBaseRomTable() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<PokemonHackPlatform | "All">("All");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pokemonHackBaseRomTable.filter((entry) => {
      const matchesPlatform = platform === "All" || entry.platform === platform;
      const matchesSearch =
        query.length === 0 ||
        entry.hackName.toLowerCase().includes(query) ||
        entry.baseGame.toLowerCase().includes(query);
      return matchesPlatform && matchesSearch;
    });
  }, [search, platform]);

  return (
    <div className="glow-border rounded-2xl">
      <div className="card flex flex-col gap-4 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex-1">
            <span className="sr-only">Search Pokemon ROM hacks</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Pokemon ROM hacks…"
              className="w-full rounded-lg border border-border bg-card/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent-blue focus:outline-none sm:max-w-xs"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {PLATFORM_FILTERS.map((option) => {
              const isActive = platform === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPlatform(option.value)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-accent-blue/60 bg-accent-blue/15 text-accent-blue"
                      : "border-border text-muted hover:border-accent-blue/40 hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted">
          Showing {filtered.length} of {pokemonHackBaseRomTable.length} Pokemon ROM hacks.
        </p>

        <div className="max-h-[32rem] overflow-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <caption className="sr-only">
              Base ROM, platform, and patch format reference for popular Pokemon ROM hacks
            </caption>
            <thead>
              <tr className="bg-card-hover text-xs text-muted">
                <th scope="col" className="sticky top-0 z-10 bg-card-hover px-4 py-3 font-semibold">
                  Pokemon ROM Hack
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-card-hover px-4 py-3 font-semibold">
                  Required Base ROM
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-card-hover px-4 py-3 font-semibold">
                  Platform
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-card-hover px-4 py-3 font-semibold">
                  Common Patch Format
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-card-hover px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-card-hover px-4 py-3 font-semibold">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.hackName} className="border-t border-border/60 align-top hover:bg-card-hover/60">
                  <th scope="row" className="px-4 py-3 font-medium text-foreground">
                    {entry.hackName}
                  </th>
                  <td className="px-4 py-3 text-muted">{entry.baseGame}</td>
                  <td className="px-4 py-3">
                    <PlatformBadge platform={entry.platform} />
                  </td>
                  <td className="px-4 py-3">
                    <FormatBadgeSmall format={entry.commonPatchFormat} />
                  </td>
                  <td className="px-4 py-3 text-muted">{entry.status}</td>
                  <td className="px-4 py-3 max-w-xs text-muted">{entry.shortNote}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No Pokemon ROM hacks match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
