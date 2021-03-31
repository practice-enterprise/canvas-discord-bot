//import Axios from 'axios';
import { Client, Guild } from 'discord.js';
import { CanvasService } from './canvas-service';
import { GuildService } from './guild-service';

export class RoleAssignmentService {
  static async RoleAssignmentInit(client: Client): Promise<void> {
    if (process.env.CANVAS_URL == undefined) { console.error('CANVAS_URL undefined'); return; }
    const discordUserID = '223928391559151618';
    const serverID = '780572565240414208';
    const guild = await client.guilds.fetch(serverID);
    const config = await GuildService.getForId(serverID);
    const courses = await CanvasService.getCourses(process.env.CANVAS_URL, discordUserID);
    if (courses == undefined) { console.error('courses undefined'); return; }


    // eslint-disable-next-line no-await-in-loop
    for (const course of courses) {
      course.enrollments.forEach(element => {
        this.giveRole(guild, discordUserID, config.roles[element.type]);
      });
    }

  }

  static async giveRole(guild: Guild, discordUserID: string, roleID: string): Promise<void> {
    const userBoy = await guild?.members.fetch(discordUserID);
    const role = await guild.roles.fetch(roleID);
    if (role != null) {
      await userBoy.roles.add(role);
    }
  }

  static async deleteRoles(client: Client):Promise<void> {
    const discordUserID = '223928391559151618';
    const serverID = '780572565240414208';
    if (process.env.CANVAS_URL == undefined) { console.error('CANVAS_URL undefined'); return; }
    const guild = await client.guilds.fetch(serverID);
    const user = await guild.members.fetch(discordUserID);
    const config = await GuildService.getForId(serverID);
    const courses = await CanvasService.getCourses(process.env.CANVAS_URL, discordUserID);
    if (courses == undefined) { console.error('courses undefined'); return; }
    const shouldHave: string[] = [];

    for (const course of courses) {
      for (const enrollment of course.enrollments) {
        if (!shouldHave.includes(enrollment.type)) {
          shouldHave.push(enrollment.type);
        }
      }
    }

    for (const configRole in config.roles) {
      if (user.roles.cache.has(config.roles[configRole]) && !shouldHave.includes(configRole)) {
        const roleToRemove = guild.roles.cache.get(config.roles[configRole]);
        if (roleToRemove != undefined) {
          user.roles.remove(roleToRemove);
        }
      }
    }
  }

}
