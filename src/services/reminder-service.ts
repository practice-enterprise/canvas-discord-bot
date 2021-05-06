import Axios from 'axios';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import { AssignmentDM, GuildReminder, UserReminder } from '../models/reminder';
import { preventExceed } from '../util/formatter';


export class ReminderService {
  static async delete(reminder: GuildReminder | UserReminder): Promise<void> {
    await Axios.request<GuildReminder | UserReminder>({
      method: 'DELETE',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static async create(reminder: Omit<GuildReminder | UserReminder, 'id'>): Promise<void> {
    console.log(reminder);
    await Axios.request<void>({
      method: 'POST',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static sendGuildReminder(reminder: GuildReminder, client: Client): void {
    try {

      (client.channels.resolve(preventExceed(reminder.target.channel)) as TextChannel)
        .send(preventExceed(reminder.content));
    } catch (err) {
      console.error(err);
    } finally {
      ReminderService.delete(reminder);
    }
  }

  static sendUserReminder(reminder: UserReminder, client: Client): void {
    try {
      client.users.resolve(reminder.target.user)?.send(preventExceed(reminder.content));
    } catch (err) {
      console.error(err);
    } finally {
      ReminderService.delete(reminder);
    }
  }

  static async sendAssignment(data: AssignmentDM, client: Client): Promise<void> {
    // TODO: prettify
    const user = await client.users.fetch(data.userDiscordID);
    if (typeof (data.message) === 'string') {
      user?.send(preventExceed(data.message));
    } else {
      user?.send(new MessageEmbed(preventExceed(data.message)));
    }
    await this.updateLastAssignment(data.id, data.assignmentID);
  }

  static async updateLastAssignment(userID: string, lastAssignment: string): Promise<void> {
    await Axios.request<void>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: `/reminders/${userID}/${lastAssignment}`,
    });
  }

  static async getTimeZone(discordID: string): Promise<string> {
    return await Axios.request<string>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/reminders/timezone/${discordID}`
    }).then(res => res.data);
  }
  static async setTimeZone(discordID: string, tz: string) {
    await Axios.request<void>({
      method: 'PUT',
      baseURL: process.env.API_URL,
      url: `/reminders/timezone/${discordID}`,
      data: { tz: tz }
    });
  }
}
