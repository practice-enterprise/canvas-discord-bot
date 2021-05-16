import Axios from 'axios';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import { dateFormates, timeZones } from '../commands';
import { AssignmentDM, GuildReminder, UserReminder } from '../models/reminder';
import { Colors, EmbedBuilder } from '../util/embed-builder';
import { preventExceed } from '../util/formatter';
import { Tokenizer } from '../util/tokenizer';

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
    await Axios.request<void>({
      method: 'POST',
      baseURL: process.env.API_URL,
      url: '/reminders',
      data: reminder
    });
  }

  static async get(discordID: string): Promise<(UserReminder | GuildReminder)[] | undefined> {
    return await Axios.request<(UserReminder | GuildReminder)[] | undefined>({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/reminders/${discordID}`
    }).then(res => res.data);
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

  static async getCommand(discordID: string): Promise<MessageEmbed> {
    const reminders = await ReminderService.get(discordID);
    if (reminders) {
      const results: Record<string, string> = {};
      for (const r of reminders) {
        results[`${DateTime.fromISO(r.date).toFormat('dd/MM/yyyy hh:mm')}`] = r.content.length <= 64 ? r.content : r.content.substring(0, 64) + '...';
      }
      return EmbedBuilder.buildList(Colors.info, 'Reminders', results);
    }
    return EmbedBuilder.info('There are no more reminders set for you.', undefined, 'Reminders');
  }

  static async deleteCommand(authorID: string, tokenizer: Tokenizer) {
    const reminders = await ReminderService.get(authorID);
    if (!reminders) {
      return EmbedBuilder.info('There are no more reminders set for you.', undefined, 'Reminders');
    }
    if (tokenizer.tokens[2]) {
      const index = parseInt(tokenizer.tokens[2].content) - 1;
      if (reminders[index]) {
        ReminderService.delete(reminders[parseInt(tokenizer.tokens[2].content)]);
        return EmbedBuilder.success('your reminder has been deleted');
      }
    }
    const results: Record<string, string> = {};
    for (const r of reminders) {
      results[`${DateTime.fromISO(r.date).toFormat('dd/MM/yyyy hh:mm')}`] = r.content.length <= 64 ? r.content : r.content.substring(0, 64) + '...';
    }
    return EmbedBuilder.buildList(Colors.info, 'Reminders', results);
  }

  static async setCommand(tokenizer: Tokenizer, authorID: string, guildID: string | undefined, channelID: string | undefined): Promise<MessageEmbed | undefined> {
    for (const format of dateFormates) {
      const time = DateTime.fromFormat(tokenizer.tokens[1].content + ' ' + tokenizer.tokens[2].content, format, { zone: 'UTC' });
      if (time && time.isValid) {
        const userTime = time.setZone(await ReminderService.getTimeZone(authorID) || timeZones[0], { keepLocalTime: true });
        if (guildID && channelID) {
          ReminderService.create({
            content: tokenizer.body(3) || `<@${authorID}> here's your reminder for ${userTime.toFormat('dd/MM/yyyy hh:mm')} ${userTime.zoneName}`,
            date: time.toISO(),
            target: {
              channel: tokenizer.tokens.find((t) => t.type === 'channel')?.content.substr(2, 18) || channelID,
              guild: guildID,
              user: authorID
            },
          });
        } else {
          ReminderService.create({
            content: tokenizer.body(3) || `<@${authorID}> here's your reminder for ${userTime.toFormat('dd/MM/yyyy hh:mm')} ${userTime.zoneName}`,
            date: time.toISO(),
            target: {
              user: authorID
            },
          });
        }
        return EmbedBuilder.success(`Your reminder has been set at: ${time.toFormat('dd/MM/yyyy hh:mm')}`);
      }
    }
    return undefined;
  }
}

