import Axios from 'axios';
import { Client, MessageEmbed } from 'discord.js';

// prefix
import * as data from '../cfg/config.json';
import { commands } from './commands';
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

    for (const command of commands.concat(guildConfig.commands)) {
      if (tokenizer.command() !== command.name && !command.aliases.includes(tokenizer.command()!)) {
        continue;
      }

      const response = typeof command.response === 'function' ? command.response(msg, guildConfig) : command.response;
      if (typeof response === 'string') {
        msg.channel.send(response);
        return;
      } else {
        msg.channel.send(new MessageEmbed(response));
        return;
      }
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
