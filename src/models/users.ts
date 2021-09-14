import { MessageEmbed, MessageEmbedOptions } from "discord.js";

export interface User {
  _id: string,
  discord: {
    id: string,
    token?: string,
  },
  canvas: {
    id?: string,
    token?: string,
  },
  courses?: string[],
}

export interface UserEmbedDM {
  userId: string;
  date: string,
  content: MessageEmbedOptions;
  target: {
    user: string
  }
}
