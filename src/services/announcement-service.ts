/* eslint-disable no-await-in-loop */
import { Guild } from 'discord.js';
import { CanvasService } from './canvas-service';

export async function createCourseChannels(dcID: string, guild: Guild): Promise<void> {
  //check if parent exists
  //const parent = await guild.channels.create('subjects', { type: 'category' });
  if (process.env.USERTOKENCANVAS1 != undefined) {
    const courses = await CanvasService.getCourses(process.env.USERTOKENCANVAS1).catch((err) => { console.log(err); });
    if (Array.isArray(courses)) {
      for (const course of courses) {
        //check if course channel already exists  
        //await guild.channels.create(course.name, { type: 'text', parent: parent.id });
        console.log(course);
      }
    }
  }
}



