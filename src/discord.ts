/* eslint-disable no-await-in-loop */
import { Client, ClientPresenceStatus, MessageEmbed, MessageEmbedOptions, } from 'discord.js';
import { inspect } from 'util';
import { commands, defaultPrefix } from './commands';
import { ConfigService } from './services/config-service';
import { GuildService } from './services/guild-service';
import { Logger } from './util/logger';
import { Formatter } from './util/formatter';
import { Tokenizer } from './util/tokenizer';

export async function buildClient(shard: number, shardCount: number): Promise<Client> {
  const client = new Client({ shards: shard, shardCount });
  const config = await ConfigService.get();

  client.on('ready', () => {
    Logger.info(`Logged in as ${client.user?.tag}`);
    /*
      Presence updating.
      Value may not be below 15000 (rate-limit Discord API = 5/60s).
    */
    const interval = Math.max(15000, config.discord.richpresence.interval);
    const length = config.discord.richpresence.states.length;

    // cycles through rich presence messages
    let index = 0;
    setInterval(() => {
      client.user?.setPresence({
        status: <ClientPresenceStatus>config.discord.richpresence.states[index].status,
        activity: {
          name: config.discord.richpresence.states[index].activity.name,
          type: config.discord.richpresence.states[index].activity.type,
        }
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
      const tokenizer = new Tokenizer(msg.content, defaultPrefix);
      if (!tokenizer.command()) {
        return; // not a valid command
      }

      for (const command of commands) {
        if (tokenizer.command() !== command.name && !command.aliases.includes(tokenizer.command()!)) {
          continue;
        }

        Logger.debug(`Received dm command '${tokenizer.command()}' from user ${msg.author.id}.`);
        // eslint-disable-next-line no-await-in-loop
        const response = typeof command.response === 'function' ? await command.response(msg, undefined) : command.response;

        if (typeof response === 'string') {
          msg.channel.send(response);
          return;
        } else if (typeof response !== 'undefined') {
          msg.channel.send(new MessageEmbed(response));
          return;
        }
      }
      return;
    } // handle user DM commands

    const guildConfig = await GuildService.getForId(msg.guild.id);
    const tokenizer = new Tokenizer(msg.content, guildConfig.prefix);

    if (!tokenizer.command()) {
      return; // not a valid command
    }

    if (tokenizer.command() === 'eval') {
      // Eval is a dangerous command since it executes code on the node itself. Make sure no one that shouldnt use this command can.
      if (process.env.NODE_ENV != 'development' || !(msg.member?.hasPermission('ADMINISTRATOR')) || !(msg.member?.roles.cache.has('817824554616487946'))) {
        return;
      }

      const content = new Tokenizer(msg.content, guildConfig.prefix).body();
      try {
        const evalres = await eval(content);

        let desc = new Formatter()
          .bold('Eval content:', true)
          .codeblock('ts', content)
          .bold('Result/output:', true)
          .codeblock('ts', inspect(evalres))
          .build();

        // Max msg length is 2048, 1500 for readability.
        if (desc.length > 1500) {
          desc = desc.substr(0, 1500);
          desc += '\n...\n```';
        }

        const embed: MessageEmbedOptions = {
          'title': 'Evaluation',
          'description': desc,
          'color': '43B581',
        };
        msg.channel.send(new MessageEmbed(embed));
      }
      catch (err) {
        console.error(err);
        const embed: MessageEmbedOptions = {
          title: 'Evaluation',
          description: new Formatter()
            .bold('Eval content:', true)
            .codeblock('ts', content)
            .bold('Result/output:', true)
            .codeblock('ts', err)
            .build(),
          color: 'ff0000'
        };
        msg.channel.send(new MessageEmbed(embed));
      }
      return;
    }

    for (const command of commands.concat(guildConfig.modules['customCommands'] === false ? [] : guildConfig.commands)) {
      if (tokenizer.command() !== command.name && !command.aliases.includes(tokenizer.command()!)) {
        continue;
      }
      if (guildConfig.modules[command.category] === false) {
        msg.channel.send(new MessageEmbed({
          title: 'error',
          description: 'this command has been disabled',
          color: 'fF4747',
          footer: { text: 'enable it\'s module to use this command' }
        }));
        return;
      }

      Logger.debug(`received command '${tokenizer.command()}' from guild ${msg.guild.id} in channel ${msg.channel.id}`);
      // eslint-disable-next-line no-await-in-loop
      const response = typeof command.response === 'function' ? await command.response(msg, guildConfig) : command.response;

      if (typeof response === 'string') {
        msg.channel.send(response);
        return;
      } else if (typeof response !== 'undefined') {
        msg.channel.send(new MessageEmbed(response));
        return;
      }
    }
    return;
  });

  client.on('guildCreate', async guild => {
    const roleNames = ['student', 'teacher'];

    const roleIDs: Record<string, string> = {};
    for (const roleName of roleNames) {
      const role = await guild.roles.create({ data: { name: roleName } });
      roleIDs[roleName] = role.id;
    }
    GuildService.createDefault(guild.id, roleIDs);
  });

  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
