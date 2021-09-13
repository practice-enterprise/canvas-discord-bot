import { InfoCommand } from './command';

export interface GuildConfig {
  id: string,
  prefix: string,
  canvasInstanceID: string,
  courseChannels: CourseChannels,
  info: InfoCommand[],
  notes: Record<string, string[]>,
  //role type (student, teacher), channelID
  roles: Record<string, string>,
  modules: Record<string, boolean>
}

export interface CourseChannels {
  categoryID: string,
  //Record<courseID, channelID)
  channels: Record<string, string>
}

