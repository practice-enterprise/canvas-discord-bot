import { Client, MessageEmbed } from 'discord.js';
import * as data from '../cfg/config.json';
import { commands } from './commands';
import { GuildService } from './services/guild-service';
import { Logger } from './util/logger';
import { Tokenizer } from './util/tokenizer';

export async function buildClient(shardCount: number, shard: number): Promise<Client> {
  const client = new Client({shardCount: shardCount, shards: shard});
  client.on('ready', () => {
    Logger.info(`Logged in as ${client.user?.tag} on shard ${shard}`);
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

    const guildConfig = await GuildService.getForId(msg.guild.id);
    const tokenizer = new Tokenizer(msg.content, guildConfig);

    if (!tokenizer.command()) {
      return; // not a valid command
    }

    for (const command of commands.concat(guildConfig.commands)) {
      if (tokenizer.command() !== command.name && !command.aliases.includes(tokenizer.command()!)) {
        continue;
      }

      Logger.debug(`received command '${tokenizer.command()}' from guild ${msg.guild.id} in channel ${msg.channel.id}`);
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
