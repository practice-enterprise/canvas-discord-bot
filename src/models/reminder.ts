export interface Reminder {
  _id: string;
  date: Date,
  content: string;
  target: {
    user: string
  } | {
    guild: string,
    channel: string
  }
}
