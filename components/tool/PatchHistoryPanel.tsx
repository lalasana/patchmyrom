"use client";

import { useState, useSyncExternalStore } from "react";
import {
  clearHistory,
  readStoredHistory,
  subscribeToStoredHistory,
  type PatchHistoryEntry,
} from "@/lib/patch-history";
import { Button } from "@/components/ui/Button";
import { FormatChip } from "@/components/ui/FormatBadge";
import { IconChevronDown, IconLayers } from "@/components/ui/icons";
import { mapDetectedFormatToChipKey } from "@/lib/format-labels";

const EMPTY_HISTORY: PatchHistoryEntry[] = [];
function getServerSnapshot() {
  return EMPTY_HISTORY;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function PatchHistoryPanel() {
  const history = useSyncExternalStore(subscribeToStoredHistory, readStoredHistory, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="glow-border rounded-2xl">
      <div className="card flex flex-col gap-4 rounded-2xl p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-blue/20 text-accent-green">
              <IconLayers className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-foreground">
              Recent local patches ({history.length})
            </span>
          </span>
          <IconChevronDown className={`h-5 w-5 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <p className="text-xs text-muted">
              Stored only in your browser&apos;s local storage — never uploaded, never synced.
            </p>
            <div className="flex flex-col gap-2">
              {history.map((entry) => {
                const chipKey = mapDetectedFormatToChipKey(entry.format);
                return (
                  <div key={entry.id} className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted">{formatDate(entry.date)}</span>
                      {chipKey ? (
                        <FormatChip format={chipKey} />
                      ) : (
                        <span className="rounded-full border border-border px-2.5 py-1 font-semibold text-muted">
                          {entry.format}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground">
                      <span className="text-muted">ROM:</span> {entry.romFileName}
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted">Patch:</span> {entry.patchFileName}
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted">Output:</span> {entry.outputFileName}
                    </p>
                  </div>
                );
              })}
            </div>
            <div>
              <Button type="button" variant="outline" onClick={() => clearHistory()}>
                Clear history
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
