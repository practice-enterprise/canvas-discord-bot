import { Command, Info } from './command';

export interface GuildConfig {
  _id: string,
  prefix: string,
  subjectsChannel: SubjectChannel
  info: Info,
  commands: Command[],
  notes: Record<string, string[]>
}

interface SubjectChannel
{
  subjectCategoryID: string,
  subjects: Subject[]

}

interface Subject{
  subjectID: number,
  channelID: string
}
