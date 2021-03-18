/* eslint-disable no-await-in-loop */
import { CategoryChannel, Guild } from 'discord.js';
import { GuildConfig } from '../models/guild';
import { CanvasService } from './canvas-service';

export async function createCourseChannels(dcID: string, guild: Guild, guildConfig: GuildConfig): Promise<void> {
  let parent = await guild.channels.cache.get(guildConfig.courseChannels.CategoryID) as CategoryChannel;

  if (parent == undefined) {
    parent = await guild.channels.create('subjects', { type: 'category' });
    //TODO post to DB
  }

  if (process.env.USERTOKENCANVAS1 != undefined) {
    const courses = await CanvasService.getCourses(process.env.USERTOKENCANVAS1).catch((err) => { console.log(err); });
    if (Array.isArray(courses)) {
      for (const course of courses) {
        if (guild.channels.cache.get(guildConfig.courseChannels.channels[course.id]) == undefined) {
          await guild.channels.create(course.name, { type: 'text', parent: parent.id });
          //TODO post to DB
        }
      }
    }
  }
}



