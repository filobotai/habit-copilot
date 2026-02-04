"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Habit, ExportBlob, ISODate } from "@/lib/types";
import { addDays, todayISO } from "@/lib/date";
import { currentStreak, longestStreak } from "@/lib/streak";
import { exportBlob, loadHabits, saveHabits } from "@/lib/storage";
import { Modal } from "@/components/Modal";
import { HabitForm } from "@/components/HabitForm";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toggleDoneForDate(habit: Habit, date: ISODate): Habit {
  const set = new Set(habit.doneDates);
  if (set.has(date)) set.delete(date);
  else set.add(date);
  return { ...habit, doneDates: Array.from(set).sort() };
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseImport(raw: string): Habit[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const list: unknown = Array.isArray(parsed)
      ? parsed
      : isObject(parsed)
        ? (parsed as ExportBlob).habits
        : null;

    if (!Array.isArray(list)) return null;

    const habits: Habit[] = list
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

    return habits;
  } catch {
    return null;
  }
}

export default function Page() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const didHydrateRef = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const today = todayISO();

  useEffect(() => {
    // Skip the first effect run to avoid re-saving immediately during hydration.
    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
      return;
    }
    saveHabits(habits);
  }, [habits]);

  const stats = useMemo(() => {
    const total = habits.length;
    const doneToday = habits.filter((h) => h.doneDates.includes(today)).length;
    const completionRate = total === 0 ? 0 : Math.round((doneToday / total) * 100);

    const streaks = habits.map((h) => currentStreak(h.doneDates, today));
    const bestStreak = streaks.length ? Math.max(...streaks) : 0;
    const avgStreak = streaks.length
      ? Math.round((streaks.reduce((a, b) => a + b, 0) / streaks.length) * 10) / 10
      : 0;

    return { total, doneToday, completionRate, bestStreak, avgStreak };
  }, [habits, today]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(h: Habit) {
    setEditing(h);
    setModalOpen(true);
  }

  function upsertHabit(data: { name: string; color: string }) {
    if (editing) {
      setHabits((prev) =>
        prev.map((h) => (h.id === editing.id ? { ...h, name: data.name, color: data.color } : h)),
      );
    } else {
      const newHabit: Habit = {
        id: uid(),
        name: data.name,
        color: data.color,
        createdAt: Date.now(),
        doneDates: [],
      };
      setHabits((prev) => [newHabit, ...prev]);
    }
    setModalOpen(false);
    setEditing(null);
  }

  function deleteHabit(h: Habit) {
    const ok = window.confirm(`Delete "${h.name}"? This cannot be undone.`);
    if (!ok) return;
    setHabits((prev) => prev.filter((x) => x.id !== h.id));
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Habit Copilot
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Today: <span className="font-mono text-xl sm:text-2xl">{today}</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              A tiny habit tracker that lives in your browser (localStorage).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openAdd}
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              + Add habit
            </button>
            <button
              onClick={() => downloadJson(`habit-copilot-${today}.json`, exportBlob(habits))}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-white dark:border-zinc-800 dark:hover:bg-zinc-950"
            >
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-white dark:border-zinc-800 dark:hover:bg-zinc-950"
            >
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const raw = await file.text();
                const imported = parseImport(raw);
                if (!imported) {
                  window.alert("Invalid JSON export.");
                  return;
                }
                const ok = window.confirm(`Import ${imported.length} habits and replace current data?`);
                if (!ok) return;
                setHabits(imported);
              }}
            />
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Habits" value={stats.total} />
          <Stat label="Done today" value={`${stats.doneToday}/${stats.total || 0}`} />
          <Stat label="Completion" value={`${stats.completionRate}%`} />
          <Stat label="Best streak" value={`${stats.bestStreak}d`} />
        </section>

        <main className="mt-6">
          {habits.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            <div className="space-y-3">
              {habits.map((h) => {
                const isDoneToday = h.doneDates.includes(today);
                const streak = currentStreak(h.doneDates, today);
                const best = longestStreak(h.doneDates);
                return (
                  <div
                    key={h.id}
                    className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: h.color }}
                          />
                          <h3 className="truncate text-base font-semibold tracking-tight">
                            {h.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Streak: <span className="font-medium">{streak}d</span>
                          {best > streak ? (
                            <>
                              {" "}
                              · Best: <span className="font-medium">{best}d</span>
                            </>
                          ) : null}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => setHabits((prev) => prev.map((x) => (x.id === h.id ? toggleDoneForDate(x, today) : x)))}
                          className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-inset transition-colors ${
                            isDoneToday
                              ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 hover:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-zinc-900 text-white ring-transparent hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                          }`}
                        >
                          {isDoneToday ? "Done ✓" : "Mark done"}
                        </button>
                        <button
                          onClick={() => openEdit(h)}
                          className="rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteHabit(h)}
                          className="rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <MiniCalendar doneDates={h.doneDates} today={today} color={h.color} />
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <footer className="mt-10 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Data stays on this device. Export JSON for backups, or to move to another browser.
            </p>
            <p className="font-mono">localStorage · v1</p>
          </div>
        </footer>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Edit habit" : "Add a habit"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        <HabitForm
          initial={editing}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={upsertHabit}
        />
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold tracking-tight">No habits yet</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Add your first habit and start building a streak.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        + Add habit
      </button>
    </div>
  );
}

function MiniCalendar({
  doneDates,
  today,
  color,
}: {
  doneDates: ISODate[];
  today: ISODate;
  color: string;
}) {
  // Last 14 days (including today)
  const set = useMemo(() => new Set(doneDates), [doneDates]);
  const days = useMemo(() => {
    const out: ISODate[] = [];
    for (let i = 13; i >= 0; i--) {
      out.push(addDays(today, -i));
    }
    return out;
  }, [today]);

  return (
    <div className="mt-3 flex items-center gap-1.5">
      {days.map((d) => {
        const isDone = set.has(d);
        const isToday = d === today;
        return (
          <div
            key={d}
            title={d}
            className={`h-5 w-5 rounded-md ring-1 ring-inset ${
              isToday
                ? "ring-zinc-400 dark:ring-zinc-600"
                : "ring-zinc-200 dark:ring-zinc-800"
            }`}
            style={{
              backgroundColor: isDone ? color : "transparent",
              opacity: isDone ? 0.85 : 1,
            }}
          />
        );
      })}
      <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">last 14d</span>
    </div>
  );
}
