import { Channel, Client, Guild, TextChannel } from 'discord.js';
import { Reminder } from './models/reminder';
import Axios from 'axios';

export function checkReminderInit(client: Client): void {
  setTimeout(async function () {
    const reminders = await getReminder();

    for (const data of reminders) {
      const time = new Date(data.date);
      if (time.getTime() < Date.now()) {
        if (!isUserTarget(data.target)) {
          sendReminder(data.target.guild, data.target.channel, client, data.content);
          DelReminder(data);
        }
        else {
          console.log('reminder: ' + data.content); //TODO find user DM channel + send reminder
        }
      }
    }
  }, 10000);
}

async function getReminder(): Promise<Reminder[]> {
  return (await Axios.request<Reminder[]>({
    method: 'GET',
    baseURL: process.env.API_URL,
    url: '/reminders'
  })).data;
}

async function DelReminder(object: Reminder) {
  return (await Axios.request<Reminder>({
    method: 'DELETE',
    baseURL: process.env.API_URL,
    url: '/reminders',
    data: object
  }));
}

async function getGuild(id: string, client: Client): Promise<Guild> {
  return await client.guilds?.fetch(id);
}

async function getChannel(guildID: string, channelID: string, client: Client): Promise<Channel> {
  return await (await getGuild(guildID, client)).client.channels.fetch(channelID);
}

async function sendReminder(guildID: string, channelID: string, client: Client, reminderD: string) {
  const channel = await getChannel(guildID, channelID, client);
  (channel as TextChannel).send('reminder: ' + reminderD);
}

const isUserTarget = (target: any): target is { user: string } =>// to know if it's for the user or for a guild
  (target as { user: string }).user != null;
