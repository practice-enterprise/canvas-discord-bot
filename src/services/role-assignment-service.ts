/* eslint-disable no-await-in-loop */
import { Client, FetchMemberOptions } from 'discord.js';

export class RoleAssignmentService {
  static async updateRoles(data: RoleUpdateData, client: Client): Promise<boolean> {
    const guild = await client.guilds.fetch(data.guildID).catch((err) => console.log(err));
    if (!guild) { return false; }

    const member = await guild.members.fetch({ 'user': data.userID, 'cache': true, 'force': true }).catch((err) => console.log(err))/*cache.get(data.userID)*/;
    if (!member) { return false; }

    const roleList = member.roles.cache.map((role) => role.id);

    for (const roleType in data.configRoles) {
      const hasRole = roleList.includes(data.configRoles[roleType]);

      if (data.roleTypes.includes(roleType)) {
        if (!hasRole) {
          await member.roles.add(data.configRoles[roleType]);
        }
      } else {
        if (hasRole) {
          await member.roles.remove(data.configRoles[roleType]);
        }
      }
    }
    return true;
  }
}

export interface RoleUpdateData {
  guildID: string,
  userID: string,
  roleTypes: string[],
  configRoles: Record<string, string>
}

//guild.id, 'UpdateRoles', { 'userID': user.id, 'roleTypes': validRoleTypes, 'courseChannels': guild.courseChannels 
