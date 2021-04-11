import { Command } from './command';

export interface GuildConfig {
  _id: string,
  prefix: string,
  canvasInstanceID: string,
  courseChannels: CourseChannels,
  info: Command[],
  commands: Command[],
  notes: Record<string, string[]>
}

export interface CourseChannels{
  CategoryID: string,
  //Record<courseID, channelID), courseID should be number -> parseInt()
  channels: Record<string, string>
}

