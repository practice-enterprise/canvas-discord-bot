import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { GuildConfig } from './guild';

export type Response = string | MessageEmbedOptions | MessageEmbed;
export interface Command {
  name: string,
  category: string,
  aliases: string[],
  description: string;
  response: Response | ((msg: Message, guildConfig: GuildConfig | undefined) => PromiseLike<Response | void>)
}
