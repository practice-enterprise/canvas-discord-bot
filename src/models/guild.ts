import { Command, Info } from './command';

export interface GuildConfig {
  _id: string,
  prefix: string,
  info: Command[],
  commands: Command[],
  notes: Record<string, string[]>
}
