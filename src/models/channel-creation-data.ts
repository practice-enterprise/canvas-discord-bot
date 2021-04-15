export interface CreateChannelsData {
  guildID: string,
  courseChannels: {
    categoryID: string,
    channels: Record<string, string>
  },
  courses: Record<string, string>
}
