/* eslint-disable no-await-in-loop */
//import Axios from 'axios';
import { Client, Guild } from 'discord.js';
import { CanvasService } from './canvas-service';
import { GuildService } from './guild-service';

export class RoleAssignmentService {
  static async RoleAssignmentInit(client: Client): Promise<void> {
    const idCourses = await CanvasService.updateRoles();
    const serverID = '780572565240414208'; //see *
    const guild = await client.guilds.fetch(serverID);
    const config = await GuildService.getForId(serverID);

    
    for (const idCourse of idCourses) {
      const shouldHave: string[] = [];
      //TODO get all guilds of the bot for this user *
      for (const course of idCourse.courses)
        course.enrollments.forEach(element => {
          if (!shouldHave.includes(element.type)) {
            shouldHave.push(element.type);
          }
        });
      for (const roleType of shouldHave) {
        this.giveRole(guild, idCourse.id, config.roles[roleType]);
        console.log(roleType);
      }
    }
  }

  static async giveRole(guild: Guild, discordUserID: string, roleID: string): Promise<void> {
    const userBoy = await guild?.members.fetch(discordUserID);
    const role = await guild.roles.fetch(roleID);
    if (role != null) {
      await userBoy.roles.add(role);
    }
  }

  static async deleteRoles(client: Client): Promise<void> {
    const idCourses = await CanvasService.updateRoles();
    const serverID = '780572565240414208'; //see *
    
    const guild = await client.guilds.fetch(serverID);
    const config = await GuildService.getForId(serverID);
    
    for (const idCourse of idCourses) {
      const shouldHave: string[] = [];
      //TODO get all guilds of the bot for this user *
      const user = await guild.members.fetch(idCourse.id);
      for (const course of idCourse.courses) {
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

}
