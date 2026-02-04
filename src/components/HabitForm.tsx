"use client";

import { useMemo, useState } from "react";
import type { Habit } from "../lib/types";

const PRESET_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#f97316", // orange
  "#ef4444", // red
  "#14b8a6", // teal
];

export function HabitForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Habit | null;
  onCancel: () => void;
  onSubmit: (data: { name: string; color: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ name: name.trim(), color });
      }}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="habit-name">
          Habit
        </label>
        <input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Walk 20 minutes"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Color</span>
          <span className="text-xs text-zinc-500">Used as an accent</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => {
            const selected = c === color;
            return (
              <button
                key={c}
                type="button"
                onPointerDown={(e) => {
                  // iOS Safari can occasionally miss click events on tiny, icon-less buttons.
                  // PointerDown fires earlier/more reliably across touch devices.
                  e.preventDefault();
                  setColor(c);
                }}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border ${
                  selected
                    ? "border-zinc-900 dark:border-white"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
                style={{ backgroundColor: c, touchAction: "manipulation" }}
                aria-label={`Pick color ${c}`}
                aria-pressed={selected}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          // iOS Safari sometimes treats the first tap as a blur/keyboard-dismiss and drops submit.
          // Trigger submit work on pointer-down to make it reliable.
          onPointerDown={(e) => {
            if (!canSubmit) return;
            e.preventDefault();
            onSubmit({ name: name.trim(), color });
          }}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {initial ? "Save" : "Add habit"}
        </button>
      </div>
    </form>
  );
}
