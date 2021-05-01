import { MessageEmbedOptions } from 'discord.js';

export interface GuildReminder {
  id: string;
  date: string,
  content: string;
  target: {
    guild: string,
    channel: string,
    user: string
  };
}

export interface UserReminder {
  id: string;
  date: string,
  content: string;
  target: {
    user: string
  }
}

export interface AssignmentDM {
  id: string
  assignmentID: string
  userDiscordID: string,
  message: MessageEmbedOptions | string
}

