export type ISODate = `${number}-${number}-${number}`;

export type Habit = {
  id: string;
  name: string;
  color: string; // tailwind-ish hex, e.g. #22c55e
  createdAt: number; // epoch ms
  doneDates: ISODate[]; // YYYY-MM-DD
};

export type ExportBlob = {
  app: "habit-copilot";
  version: 1;
  exportedAt: number;
  habits: Habit[];
};
