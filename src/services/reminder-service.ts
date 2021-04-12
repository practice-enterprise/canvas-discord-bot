import Axios from 'axios';
import { Client, TextChannel } from 'discord.js';
import { isUserTarget, Reminder } from '../models/reminder';

export class ReminderService {
  static async delete(reminder: Reminder): Promise<void> {
    await Axios.request<Reminder>({
      method: 'DELETE',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static async create(reminder: Omit<Reminder, 'id'>): Promise<void> {
    await Axios.request<void>({
      method: 'POST',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static sendReminder(reminder: Reminder, client: Client): void {
    try {
      if (!isUserTarget(reminder.target)) {
        (client.channels.resolve(reminder.target.channel) as TextChannel)
          .send('reminder: ' + reminder.content);
      } else {
        client.users.resolve(reminder.target.user)?.send(reminder.content);//TODO 
      }
    } catch (err) {
      console.error(err);
    } finally {
      ReminderService.delete(reminder);
    }
  }

}
