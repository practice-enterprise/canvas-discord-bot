import Axios from 'axios';
import { Reminder } from '../models/reminder';

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
}
