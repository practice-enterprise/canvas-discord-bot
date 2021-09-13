import { ApplicationCommandOption, ApplicationCommandOptionData, CommandInteraction, Interaction, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { GuildConfig } from './guild';

export type Response = string | MessageEmbedOptions | MessageEmbed;
export interface Command {
  name: string,
  category: string,
  description: string;
  options?: ApplicationCommandOptionData[];
  response: /*Response |*/ ((interaction: CommandInteraction) => PromiseLike<void>)
}

export interface InfoCommand {
  name: string,
  category: string,
  description: string;
  options?: ApplicationCommandOptionData[];
  response: /*Response |*/ MessageEmbedOptions;
}

