export type ReminderTarget = {
  user: string
} | {
  guild: string,
  channel: string
};

export interface Reminder {
  _id: string;
  date: Date | string,
  content: string;
  target: ReminderTarget
}

export function isUserTarget(target: ReminderTarget): target is ({ user: string }) {
  return (target as { user: string }).user != null;
}
