import { Client, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';

export function checkReminderInit(client: Client): void {
  setTimeout(async function () {

    const dateFormates: string[] = ['d/m/y h:m', 'd.m.y h:m', 'd-m-y h:m'];
    //currently reffers to the TM testing ground + #test (channel)
    const guildID = '780572565240414208'; //TODO get guild id from db to post in correct server
    const channelID = '780572795250933781'; //TODO get channel of the reminder from the database

    const testDate: string[] = ['17/4/2020 17:50', '17.4.2020 17:50', '17-4-2020 17:40']; //TODO get rid after fetch from DB

    const guild = await client.guilds?.fetch(guildID);
    const channel = await guild.client.channels.fetch(channelID);

    //TODO check if there is a reminder that has to be sent + get the reminder message...
    if (channel.type == 'text') {
      //POSSIBILITY put it in the reminder command and store the date instead
      testDate.forEach(testDate => { //TODO change to db date
        dateFormates.forEach(format => {
          const time = DateTime.fromFormat(testDate, format);
          if (time.isValid) {
            //(channel as TextChannel).send(time.toString());
          }
        });
      });
    }
  }, 10000);
}
