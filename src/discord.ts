import { Client, MessageEmbed } from 'discord.js';

// prefix
import * as data from '../cfg/config.json';

export async function buildClient(): Promise<Client> {
  const client = new Client();
  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);

    /*
      Rich presence updating.
      Value may not be below 15000 (rate-limit discord api).
    */
    const interval = (parseInt(data.discord.richpresence.interval) < 15000 ? 15000 : parseInt(data.discord.richpresence.interval));
    const statusType = parseInt(data.discord.richpresence.statusType);
    const length = data.discord.richpresence.messages.length;
    
    // cycles through rich presence messages
    let index = 0;
    setInterval(() => {
      client.user?.setPresence({      
        activity:{name: data.discord.richpresence.messages[index], type: statusType}
      });

      if(index++, index >= length){
        index = 0;
      }
    },interval);
  });

  client.on('message', (msg): void => {
    if (msg.author.bot) {
      return; // ignore messages by bots and as a result itself
    }
    
    // normalise message content
    const content = msg.content.trim().toLocaleLowerCase();

    // get prefix
    const prefix: string = data.discord.prefix;
    

    // check if something with prefix has been entered
    if (content.startsWith(prefix)){
      console.log('Prefix trigger: '+content);
    }

    // ping pong
    if (content.startsWith(prefix+'ping')) {
      const delay = new Date().getTime() - new Date(msg.createdTimestamp).getTime();
      msg.channel.send('Pong!'+' `'+delay+' ms to receive`');
      // we could make it edit the message for full response time
    }

    // dice roll eg. 3d6 rolls 3 six sided dice
    if (content.startsWith(prefix+'roll')) {
      const match = (/^(\d+)?d(\d+)$/gm).exec(content);
      if (match) {
        const times = Number(match[1]) > 0 ? Number(match[1]) : 1;
        const dice = [];
        for (let i = 0; i < times; i++) {
          dice.push(Math.floor(Math.random() * Number(match[2]) + 1));
        }
  
        if(times === 1) {
          msg.reply(`Rolled a ${dice[0]}`);
        } else {
          msg.reply(`Dice: ${dice.join(', ')}\nTotal: ${dice.reduce((p, c) => p + c, 0)}`);
        }
      }
    }

    if (content.startsWith(prefix+'announce')) {
      const message = new MessageEmbed()
        .setColor('#E63F30')
        .setTitle('Online theorie OS Fundamentals 8:15')
        .setURL('https://thomasmore.instructure.com/courses/10979/discussion_topics/135013')
        .setAuthor('OS Fundamentals (YT0737)')
        .setDescription(`
          Topic: OS Fundamental theorie
          Time: This is a recurring meeting Meet anytime

          Join Zoom Meeting
          https://us02web.zoom.us/j/88278089824?pwd=VDMrUmhjdnAyK1oyMGdMdTRHMlFPQT09

          Meeting ID: 882 7808 9824
          Passcode: 6DR7V3
        `)
        .setFooter('7:43 • 26 nov 2020');

      msg.channel.send(message);
    }
    
    // Sends a message about Stuvo with contact page URL
    if (content.startsWith(prefix+'stuvo')) {
      const message = new MessageEmbed()
        .setColor('#E63F30')
        .setTitle('Stuvo, je buddy voor kleine en grote studentennoden')
        .setURL('https://youtu.be/yRkTWc4Tetw')
        .setAuthor('Thomas More')
        .setDescription(`
          Stuvo staat klaar om je te helpen bij de praktische kant van je studentenleven.
          Heb je een vraag? Contacteer ons of maak een afspraak!
          
          https://www.thomasmore.be/studenten/maak-een-afspraak-met-stuvo
        `);

      msg.channel.send(message);
    }

    if (content.startsWith(prefix+'code')){
      msg.channel.send(`
**Code block**
Write code in code blocks to make it more readable for others
      
\\\`\\\`\\\`c
printf("Hello world!");
\\\`\\\`\\\`
\`\`\`c
printf("Hello world!");
\`\`\`
You can also write commands like this: 
\\\`sudo apt update\\\` -> \`sudo apt update\``);
    }

    if (content.startsWith(prefix+'slide')){
      const message = new MessageEmbed()
        .setColor('#E63F30')
        .setTitle('Sliding in your DM\'s')
        .setThumbnail('https://cdn.discordapp.com/attachments/389813485120389132/781610879934267412/hemanwink.jpg')
        .setDescription('wink wink');

      const taggedUser = msg.mentions.users.first();

      if (taggedUser == null) {
        msg.author.send(message);
      }
      else
      {
        console.log('Mentioned');
        taggedUser.send(message);
      } 
    }
  });


  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
