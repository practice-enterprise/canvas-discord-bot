import { Command } from './command';

export interface GuildConfig {
  _id: string,
  prefix: string,

  courseChannels: {
    CategoryID: string,
    //Record<courseID, channelID), courseID should be number -> parseInt()
    channels: Record<string, string>
  }
  info: Command[],
  commands: Command[],
  notes: Record<string, string[]>
}

export interface Info {
  name: string,
  aliases: string[],
  description: string;
  reply: Command[]
}

export interface CouresChannel
{
  CategoryID: string,
  channels: Record<string, string>
}
