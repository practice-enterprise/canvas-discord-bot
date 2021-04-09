import { Command } from './command';

export interface GuildConfig {
  _id: string,
  prefix: string,
  canvasInstanceID: string,
  courseChannels: {
    CategoryID: string,
    //Record<courseID, channelID), courseID should be number -> parseInt()
    channels: Record<string, string>
  }
  info: Command[],
  commands: Command[],
  notes: Record<string, string[]>
  //role type (student, teacher), channelID
  Roles: Record<string, string>
}
