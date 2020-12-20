import Axios from 'axios';
import { Client, TextChannel } from 'discord.js';
import { Subscription, timer } from 'rxjs';
import { isUserTarget, Reminder } from '../models/reminder';
import { Logger } from '../util/logger';

export class ReminderService {
  static async get(): Promise<Reminder[]> {
    return Axios.request<Reminder[]>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: '/reminders'
    }).then((res) => res.data);
  }

  static async delete(reminder: Reminder): Promise<void> {
    await Axios.request<Reminder>({
      method: 'DELETE',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static async create(reminder: Omit<Reminder, '_id'>): Promise<void> {
    await Axios.request<void>({
      method: 'POST',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static initReminderJob(client: Client): Subscription {
    return timer(0, 60000).subscribe(async function () {
      const reminders = await ReminderService.get();
      for (const reminder of reminders) {
        const time = new Date(reminder.date);
        if (time.getTime() < Date.now()) {
          try {
            if (!isUserTarget(reminder.target)) {
              (client.guilds.resolve(reminder.target.guild)?.channels.resolve(reminder.target.channel) as TextChannel)
                .send('reminder: ' + reminder.content);
            } else {
              client.users.resolve(reminder.target.user)?.send(reminder.content);
            }
          } catch (err) {
            Logger.error(err);
          } finally {
            ReminderService.delete(reminder);
          }
        }
      }
    });
  }
}
