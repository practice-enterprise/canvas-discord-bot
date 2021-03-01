import Axios from 'axios';
import { Client, Guild, GuildMember, Role } from 'discord.js';
import { stringify } from 'querystring';
import { GuildConfig } from './models/guild';
import { GuildService } from './services/guild-service';

export class RoleAssignmentService {
  static async RoleAssignmentInit(client: Client): Promise<void> {
    const canvasToken = process.env.USERTOKEN; //canvas Personal Access Token
    if (canvasToken == undefined) {console.error('canvasToken undefined'); return; }
    const discordUserID = '223928391559151618';
    const serverID = '780572565240414208';
    const rolesID: string[] = ['815954832325345350','788846220277710848', '815937311510102057']; //admin, leerkracht, student
    const guild = await client.guilds.fetch(serverID);
    
    const canvasRoles= await this.canvasRoles(canvasToken ,await (await this.canvasUser(canvasToken)).id);
    for(const role of canvasRoles)
    {
      if(role.id == 9)//admin id
      {
        this.giveRole(guild, discordUserID, rolesID[0]); //TODO go over all of the roles to check + get from DB
      }
    }  
  }
  static async canvasUser(token: string): Promise<canvasUser> {
    return Axios.request<canvasUser>({
      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: '/api/v1/users/self',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((res) => { return res.data; });
  }
  
  static async canvasRoles(token: string, userID: number): Promise<RoleCanvas[]> {
    return Axios.request<RoleCanvas[]>({
      method: 'GET',
      baseURL: process.env.CANVAS_URL,
      url: `/api/v1/accounts/${userID}/roles`,
      headers: {
        Authorization: `Bearer ${token}`,
        state: 'active'
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

export interface canvasUser {
  id: number,
  name: string
}

export interface RoleCanvas {
  id: number,
  role: string,
  label: string
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
