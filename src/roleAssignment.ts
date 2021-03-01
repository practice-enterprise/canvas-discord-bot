import Axios from 'axios';
import { Client, Guild, GuildMember, Role, Structures } from 'discord.js';
import { stringify } from 'querystring';
import { GuildConfig } from './models/guild';
import { GuildService } from './services/guild-service';

export class RoleAssignmentService {
  static async RoleAssignmentInit(client: Client): Promise<void> {
    if(process.env.USERTOKENCANVAS1 == undefined || process.env.USERTOKENCANVAS2 == undefined){console.error('canvasToken undefined');return;}
    const discordUserID = '223928391559151618';
    const serverID = '780572565240414208';
    const guild = await client.guilds.fetch(serverID);
    
    const canvasToken: string[] = [process.env.USERTOKENCANVAS1,process.env.USERTOKENCANVAS2];//from authO flow or DB
    const allowedValuesEnrolementType: EnrolementType[] = [{discordRoleID: '788846220277710848',typeName: 'teacher'},{ discordRoleID: '815937311510102057', typeName: 'student'}/*,'ta','observer','designer'*/]; //TODO discord role id get from a DB
    for( const token of canvasToken)
    {
      // eslint-disable-next-line no-await-in-loop
      const courses = await this.canvasCourses(token);
      console.log(courses);
      for(const course of courses)
      {
        course.enrollments.forEach(element =>{
          for(const enrolType of allowedValuesEnrolementType)
          {
            if(element.type == enrolType.typeName)
            {
              this.giveRole(guild, discordUserID, enrolType.discordRoleID);
            }
          }
        });
      }
    }
  }
  
  static async canvasCourses(token: string): Promise<Course[]> {
    return Axios.request<Course[]>({
      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/courses/',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((res) => { return res.data; });
  }
    
  static async giveRole(guild: Guild, discordUserID:string, roleID: string): Promise<void>{
    const userBoy = await guild?.members.fetch(discordUserID);
    const role = await guild.roles.fetch(roleID);
    if(role != null)
    {
      userBoy.roles.add(role);
    }
  }
} 



interface EnrolementType{
  discordRoleID: string,
  typeName: string
}

interface Enrolement{
  type: string,
  role: string,
  role_id: number,
  user_id: number
}

interface Course{
  id: number,
  enrollments: Enrolement[]
}

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
