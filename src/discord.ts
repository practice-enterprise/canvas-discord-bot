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
  });

  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
