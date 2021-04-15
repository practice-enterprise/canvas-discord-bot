export interface RoleUpdateData {
  guildID: string,
  userID: string,
  roleTypes: string[],
  configRoles: Record<string, string>
}
