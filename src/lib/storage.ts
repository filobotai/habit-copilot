"use client";

import type { ExportBlob, Habit } from "./types";

const STORAGE_KEY = "habit-copilot:v1";

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asHabits(v: unknown): Habit[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (h): h is Record<string, unknown> =>
        isObject(h) && typeof h.id === "string" && typeof h.name === "string",
    )
    .map((h) => ({
      id: String(h.id),
      name: String(h.name),
      color: typeof h.color === "string" ? h.color : "#22c55e",
      createdAt: typeof h.createdAt === "number" ? h.createdAt : Date.now(),
      doneDates: Array.isArray(h.doneDates)
        ? (h.doneDates.filter((d) => typeof d === "string") as Habit["doneDates"])
        : [],
    }));
}

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  const parsed = safeJsonParse(raw);
  if (!parsed) return [];

  // Back-compat: allow saving just Habit[]
  if (Array.isArray(parsed)) return asHabits(parsed);

  if (isObject(parsed) && Array.isArray((parsed as ExportBlob).habits)) {
    return asHabits((parsed as ExportBlob).habits);
  }

  return [];
}

export function saveHabits(habits: Habit[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

export function exportBlob(habits: Habit[]): ExportBlob {
  return {
    app: "habit-copilot",
    version: 1,
    exportedAt: Date.now(),
    habits,
  };
}
