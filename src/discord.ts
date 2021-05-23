/* eslint-disable no-await-in-loop */
import { Client, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { inspect } from 'util';
import { commands, defaultPrefix } from './commands';
import { ConfigService } from './services/config-service';
import { GuildService } from './services/guild-service';
import { Logger } from './util/logger';
import { Formatter, preventExceed } from './util/formatter';
import { Tokenizer } from './util/tokenizer';
import { EmbedBuilder } from './util/embed-builder';

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
      client.user?.setPresence(config.discord.richpresence.states[index]);
      if (index++, index >= length) {
        index = 0;
      }
    }, interval);
  });

  client.on('message', async (msg): Promise<void> => {
    if (msg.author.bot) {
      return; // ignore messages by bots and as a result itself
    }

    const guildConfig = msg.guild ? await GuildService.getForId(msg.guild.id) : undefined;
    const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);

    if (!tokenizer.command()) {
      return; // not a valid command
    }

    if (tokenizer.command() === 'eval') {
      // Eval is a dangerous command since it executes code on the node itself. Make sure no one that shouldnt use this command can.
      if (process.env.NODE_ENV != 'development' || !(msg.member?.hasPermission('ADMINISTRATOR')) || !(msg.member?.roles.cache.has('817824554616487946'))) {
        return;
      }

      const content = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix).body();
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
    const commandList = commands.concat(guildConfig === undefined || guildConfig.modules['customCommands'] === false ? [] : guildConfig?.commands);

    for (const command of commandList) {
      if (tokenizer.command() !== command.name && !command.aliases.includes(tokenizer.command()!)) {
        continue;
      }
      if (guildConfig && guildConfig.modules[command.category] === false) {
        msg.channel.send(EmbedBuilder.error(`The ${command.name} command has been disabled.`, `Enable the ${command.category} module to enable this command.`));
        return;
      }

      Logger.debug(`received command '${tokenizer.command()}' from guild ${msg.guild?.id || msg.author.id} in channel ${msg.channel.id}`);
      // eslint-disable-next-line no-await-in-loop
      const response = typeof command.response === 'function' ? await command.response(msg, guildConfig) : command.response;

      if (typeof response === 'string') {
        // We might want preventExceed here instead
        msg.channel.send(response, { split: true });
        return;
      } else if (typeof response !== 'undefined') {
        msg.channel.send(new MessageEmbed(preventExceed(response)));
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
