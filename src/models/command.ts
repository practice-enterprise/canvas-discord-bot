import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { GuildConfig } from './guild';

export type Response = string | MessageEmbedOptions | MessageEmbed;
export interface Command {
  name: string,
  aliases: string[],
  description: string;
  response: Response | ((message: Message, guildConfig: GuildConfig) => PromiseLike<Response>)
}
