import { Client, TextChannel } from 'discord.js';

export function checkReminderInit(client: Client): void {
  setTimeout(async function () {

    //currently reffers to the TM testing ground + #test (channel)
    const guildID = '780572565240414208'; //TODO get guild id from db to post in correct server
    const channelID = '780572795250933781'; //TODO get channel of the reminder from the database

    const guild = await client.guilds?.fetch(guildID);
    const channel = await guild.client.channels.fetch(channelID);

    //TODO check if there is a reminder that has to be sent + get the reminder message...
    if (channel.type == 'text') {
      (channel as TextChannel).send('reminder message here'); // sends a message every minute if uncommented
    }
  }, 60000);
}
