
//import { promises } from "fs";

import { Client, TextChannel } from 'discord.js';

//const getguild = (guildID: string, client: Client) => Promise.resolve(client.guilds?.fetch(guildID));


export function checkreminderinit(client: Client): void {
  setInterval(async function () {

    //currently reffers to the TM testing ground + #test (channel)
    const guildID = '780572565240414208'; //TODO get guild id from db to post in correct server
    const channelID = '782283497582624778'; //TODO get channel of the reminder from the database

    const guild = await Promise.resolve(client.guilds?.fetch(guildID));
    const channel: TextChannel = await Promise.resolve(guild.client.channels.fetch(channelID)) as TextChannel;

    //TODO check if there is a reminder that has to be sent + get the reminder message...
    //channel.send('reminder message here'); // sends a message every minute if uncommented

  }, 60000);
}
