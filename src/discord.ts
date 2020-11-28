import { Client, Guild, MessageEmbed, Role } from 'discord.js';

// prefix
import * as data from '../cfg/config.json';

import fs from 'fs';

export async function buildClient(): Promise<Client> {
  const client = new Client();
  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
    /*
      Rich presence updating.
      Value may not be below 15000 (rate-limit discord api).
    */
    const interval = Math.max(15000, data.discord.richpresence.interval);
    const statusType = data.discord.richpresence.statusType;
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

    
    // # normalise message content
    // get prefix
    const prefix: string = data.discord.prefix;

    //full content
    const content = msg.content.trim().toLocaleLowerCase();

    //Only if there is a prefix continue
    if (!content.startsWith(prefix)) return;

    //get arguments and command (expl: array with parts split each ' ', shift first "argument" to command)
    const args = content.slice(prefix.length).trim().split(' ');
    const command = args.shift();

    // # debug
    //full if prefix
    if (content.startsWith(prefix)){
      console.log('Prefix trigger: '+content);
    }
    //cmd and args
    console.log('Debug command: '+command+' Args: '+args);

    // ping pong
    //if (content.startsWith(prefix+'ping')) {
    if (command === 'ping') {
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

    
    //sends a message about PAL
    if (content.startsWith(prefix+'pal')) {
      const message = new MessageEmbed()
        .setColor('#E63F30')
        .setTitle('Pal: Peer assisted Learning')
        .setURL('http://bouwstenenopleiding.thomasmore.be/studenten-helpen-elkaar.html')
        .setAuthor('Thomas More')
        .setDescription(`
Peer Assisted Learning (PAL) is een verzamelterm voor allerlei strategieën die het
leerproces trachten te faciliteren via de actieve en interactieve tussenkomst van 
andere lerenden die geen professionele leerkrachten zijn.PAL behelst met andere
woorden een actieve leeromgeving waarin peers elkaar ondersteunen en zelf
verantwoordelijkheid dragen voor het eigen leer- en instructieproces.

Indien je graag PAL wilt opstarten binnen je opleiding en je hier graag ondersteuning of informatie over wilt,
aarzel dan niet om contact op te nemen met liesbeth.huybens@thomasmore.be.

Voor meer informatie:
http://bouwstenenopleiding.thomasmore.be/studenten-helpen-elkaar.html        
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

    if (content.startsWith(prefix+'rooster') || content.startsWith(prefix+'schedule')){
      const message = new MessageEmbed()
      //temp rooster link may change later probably
        .setColor('#E63F30')
        .setTitle('Click to view schedule')
        .setURL('https://rooster.thomasmore.be/schedule?requireLogin=true')
        .setAuthor('Thomas more');
      
      msg.channel.send(message);
    }

    //rank and un/derank commands
    if(command === 'rank') {

      if(args.length == 0)
      {
        msg.channel.send('No role argument given. Use `'+prefix+'rank RoleName` to assign a role to yourself.');
      }
      else {
        const roleToAdd = args.join('');
        //Since content is in lowercase the role argument will be as well
        const roleID = msg.guild?.roles.cache.find(role => role.name === roleToAdd);

        if(roleID) {
          msg.member?.roles.add(roleID)
            .catch(console.error);
          msg.reply('role `'+roleID.name+'` succesfully assigned!');
        }
        else {
          msg.reply('role `'+roleToAdd+'` does not exist.');
        }
      }      
    }

    if(command === 'derank' || command === 'unrank') {

      if(args.length == 0)
      {
        msg.channel.send('No role argument given. Use `'+prefix+'rank RoleName` to assign a role to yourself.');
      }
      else {
        const roleToAdd = args.join('');
        //Since content is in lowercase the role argument will be as well
        const roleID = msg.guild?.roles.cache.find(role => role.name === roleToAdd);

        if(roleID) {
          msg.member?.roles.remove(roleID)
            .catch(console.error);
          msg.reply('role `'+roleID.name+'` succesfully removed!');
        }
        else {
          msg.reply('role `'+roleToAdd+'` does not exist.');
        }
      }      
    }

  });
  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
