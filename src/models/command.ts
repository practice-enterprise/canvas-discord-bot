import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { GuildConfig } from './guild';

export interface Command {
  name: string,
  aliases: string[],
  description: string;
  response: string | MessageEmbedOptions | ((message: Message, guildConfig: GuildConfig) => string | MessageEmbedOptions | MessageEmbed)
}
