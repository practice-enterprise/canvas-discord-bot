import Axios from 'axios';
import { Client, MessageEmbed } from 'discord.js';

// prefix
import * as data from '../cfg/config.json';
import { Formatter } from './util/formatter';
import { Tokenizer } from './util/tokenizer';

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
        activity: { name: data.discord.richpresence.messages[index], type: statusType }
      });

      if (index++, index >= length) {
        index = 0;
      }
    }, interval);
  });

  client.on('message', async (msg): Promise<void> => {
    if (msg.author.bot) {
      return; // ignore messages by bots and as a result itself
    }

    if (!msg.guild) {
      return; // ignore messages not from a guild
    }

    const guildConfig = (await Axios({
      method: 'GET',
      baseURL: process.env.API_URL,
      url: `/guilds/${msg.guild.id}`
    })).data;

    const tokenizer = new Tokenizer(msg.content, guildConfig);

    if (!tokenizer.command()) {
      return; // not a valid command
    }

    for (const command of guildConfig.commands) {
      if (tokenizer.command() !== command.name) {
        continue;
      }

      if (typeof command.response === 'string') {
        msg.channel.send(command.response);
      } else {
        msg.channel.send(new MessageEmbed(command.response));
      }
    }

    // dice roll eg. 3d6 rolls 3 six sided dice
    /* if (content.startsWith(prefix+'roll')) {
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
    } */

    // TODO: transfer to DB
    // Sends a message about Stuvo with contact page URL
    /* if (content.startsWith(prefix+'stuvo')) {
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
    } */

    // TODO: transfer to DB
    //sends a message about PAL
    /* if (content.startsWith(prefix+'pal')) {
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
    } */

    // TODO: transfer to DB
    /* if (content.startsWith(prefix+'code')){
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

    // TODO: transfer to DB
    /* if (content.startsWith(prefix+'rooster') || content.startsWith(prefix+'schedule')){
      const message = new MessageEmbed()
      //temp rooster link may change later probably
        .setColor('#E63F30')
        .setTitle('Click to view schedule')
        .setURL('https://rooster.thomasmore.be/schedule?requireLogin=true')
        .setAuthor('Thomas more');
      
      msg.channel.send(message);
    } */
  });

  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
