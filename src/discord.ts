import { Client, MessageEmbed } from 'discord.js';

// config file
import * as data from '../cfg/config.json';

export async function buildClient(): Promise<Client> {
  const client = new Client();
  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });

  client.on('message', (msg): void => {
    if (msg.author.bot) {
      return; // ignore messages by bots and as a result itself
    }
    
    // normalise message content
    let content = msg.content.trim().toLocaleLowerCase();

    // get prefix and remove it from content
    const prefix: string = data.discord.prefix;
    if (!content.startsWith(prefix)){
      return;
    }
    content = content.substr(prefix.length);

    // check if something with prefix has been entered
    console.log('Prefix trigger: '+content);

    // ping pong
    if (content === 'ping') {
      msg.channel.send('pong');
    }

    // dice roll eg. 3d6 rolls 3 six sided dice
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

    // formatting for an announcement
    if (content === 'announce') {
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

    // explains codeblock formatting
    if (content === 'code'){
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


    // Sends a message about Stuvo with contact page URL
    if (content === 'stuvo') {
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

    // This command is making DM based messages later
    if (content.startsWith('slide')){
      const message = new MessageEmbed()
        .setColor('#E63F30')
        .setTitle('Sliding in your DM\'s')
        .setThumbnail('https://cdn.discordapp.com/attachments/389813485120389132/781610879934267412/hemanwink.jpg')
        .setDescription('wink wink');

      const taggedUser = msg.mentions.users.first();

      // if empty (no mentions) it will be null, otherwise use the first mention.
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
