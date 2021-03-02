import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { GuildConfig } from './guild';

export type Response = string | MessageEmbedOptions | MessageEmbed;
export interface Command {
  name: string,
  aliases: string[],
  description: string;
  response: Response | ((msg: Message, guildConfig: GuildConfig) => PromiseLike<Response | void>)
}

export interface Info {
  name: string,
  aliases: string[],
  description: string;
  reply: Command[]
}
