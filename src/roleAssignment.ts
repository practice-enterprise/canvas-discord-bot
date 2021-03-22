//import Axios from 'axios';
import { Client, Guild } from 'discord.js'; 
//import { stringify } from 'querystring';
//import { GuildConfig } from './models/guild';
import { CanvasService } from './services/canvas-service';
import { GuildService } from './services/guild-service';
//import { GuildService } from './services/guild-service';

export class RoleAssignmentService {
  static async RoleAssignmentInit(client: Client): Promise<void> {
    if (process.env.USERTOKENCANVAS1 == undefined || process.env.USERTOKENCANVAS2 == undefined) { console.error('canvasToken undefined'); return; }
    const discordUserID = '223928391559151618';
    const serverID = '780572565240414208';
    const guild = await client.guilds.fetch(serverID);
    const config = await GuildService.getForId(serverID);
    const canvasToken: string[] = [process.env.USERTOKENCANVAS1, process.env.USERTOKENCANVAS2];//from authO flow or DB

    for (const token of canvasToken) {
      // eslint-disable-next-line no-await-in-loop
      const courses = await CanvasService.getCourses(token);
      for (const course of courses) {
        course.enrollments.forEach(element => {
          this.giveRole(guild, discordUserID, config.roles[element.type]);
        });
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
}

/*
TODO remove role function
  check every id of config.roles check id == enrolement type if not exist remove role[id]
  for(const k in config.roles)
    {
      k -> id like config.roles[k]
    }
 */

//extra functionele code
/*
//get all roles from guild id
const guild = await client.guilds.fetch(serverID);
guild?.roles.cache.forEach(element => {
console.log(element.name);
});
*/
/*
//get all roles of user
const guild = await client.guilds.fetch(serverID);
const userboy = await guild?.members.fetch(discordUserID);
userboy.roles.cache.forEach(element => {
console.log(element.name);
});
*/
