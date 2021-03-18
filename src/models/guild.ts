import { Command, Info } from './command';

export interface GuildConfig {
  _id: string,
  prefix: string,
  courseChannels: CouresChannel
  info: Info,
  commands: Command[],
  notes: Record<string, string[]>
}

export interface CouresChannel
{
  CategoryID: string,
  channels: Record<string, string>
}
