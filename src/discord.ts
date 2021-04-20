/* eslint-disable no-await-in-loop */
import { Client, ClientPresenceStatus, MessageEmbed, MessageEmbedOptions, } from 'discord.js';
import { inspect } from 'util';
import { commands } from './commands';
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
      return; // ignore messages not from a guild
    }

    const guildConfig = await GuildService.getForId(msg.guild.id);
    const tokenizer = new Tokenizer(msg.content, guildConfig);

    if (!tokenizer.command()) {
      return; // not a valid command
    }

    if (tokenizer.command() === 'eval') {
      // Eval is a dangerous command since it executes code on the node itself. Make sure no one that shouldnt use this command can.
      if (process.env.NODE_ENV != 'development' || !(msg.member?.hasPermission('ADMINISTRATOR')) || !(msg.member?.roles.cache.has('817824554616487946'))) {
        return;
      }

      const content = new Tokenizer(msg.content, guildConfig).body();
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


    //info command
    // if (tokenizer.command() === guildConfig.info.name || guildConfig.info.aliases.includes(tokenizer.command()!)) {//check if command is of the info type
    //   for (const info of guildConfig.info.reply) { // check the option if it's valid
    //     if (tokenizer.tokens[1] != undefined && tokenizer.tokens[1].content == info.name) {
    //       const response = typeof info.response === 'function' ? await info.response(msg, guildConfig) : info.response;
    //       if (typeof response === 'string') {
    //         msg.channel.send(response);
    //       } else if (typeof response !== 'undefined') {
    //         msg.channel.send(new MessageEmbed(response));
    //       }
    //       return;
    //     }
    //   }
    //   msg.channel.send(guildConfig.info.reply.map(c => `\`${guildConfig.prefix}${guildConfig.info.name} ${c.name}\`: ${c.description}`).join('\n'));
    // }

    for (const command of commands.concat(guildConfig.commands)) {
      if (tokenizer.command() !== command.name && !command.aliases.includes(tokenizer.command()!)) {
        continue;
      }

      Logger.debug(`received command '${tokenizer.command()}' from guild ${msg.guild.id} in channel ${msg.channel.id}`);
      // eslint-disable-next-line no-await-in-loop
      const response = typeof command.response === 'function' ? await command.response(msg, guildConfig) : command.response;

      if (typeof response === 'string') {
        msg.channel.send(response).catch((err) => console.log(err));
        return;
      } else if (typeof response !== 'undefined') {
        msg.channel.send(new MessageEmbed(response)).catch(err => console.error(err));
        return;
      }
    }
    return;
  });

  client.on('guildCreate', async guild => {
    const roleNames = ['student', 'teacher']

    const roleIDs: Record<string, string> = {};
    for (const roleName of roleNames) {
      const role = await guild.roles.create({ data: { name: roleName } });
      roleIDs[roleName] = role.id;
    }
    GuildService.create({ guildID: guild.id, roles: roleIDs }).catch(() => console.error('error'));

    return;


  });

  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
