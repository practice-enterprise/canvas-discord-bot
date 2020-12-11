import { Command } from './command';

export interface GuildConfig {
  _id: string,
  prefix: string,
  commands: Command[],
  notes: Record<string, string[]>
}
