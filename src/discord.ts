import { Client, ClientPresenceStatus, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { inspect } from 'util';
import { commands } from './commands';
import { createCourseChannels } from './services/announcement-service';
import { ConfigService } from './services/config-service';
import { GuildService } from './services/guild-service';
import { Formatter } from './util/formatter';
import { Tokenizer } from './util/tokenizer';

export async function buildClient(): Promise<Client> {
  const client = new Client();
  const config = await ConfigService.get();

  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);

    /*
      Presence updating.
      Value may not be below 15000 (rate-limit Discord API = 5/60s).
    */
    const interval = Math.max(15000, config[0].discord.richpresence.interval);
    const length = config[0].discord.richpresence.states.length;

    // cycles through rich presence messages
    let index = 0;
    setInterval(() => {
      client.user?.setPresence({
        status: <ClientPresenceStatus>config[0].discord.richpresence.states[index].status,
        activity: {
          name: config[0].discord.richpresence.states[index].activity.name,
          type: config[0].discord.richpresence.states[index].activity.type,
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

    await createCourseChannels(msg.author.id, msg.guild, guildConfig);

    if (!tokenizer.command()) {
      return; // not a valid command
    }

    if (tokenizer.command() === 'eval') {
      const evalRole = '817824554616487946';

      // Eval is a dangerous command since it executes code on the node itself. Make sure no one that shouldnt use this command can't.
      if (!(msg.member?.roles.cache.has(evalRole))) {
        msg.channel.send('You need to have the EVAL role.');
        return;
      }

      if (!(msg.member?.hasPermission('ADMINISTRATOR'))) {
        msg.channel.send('You need to be an admin for this command.');
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
    if (tokenizer.command() === guildConfig.info.name || guildConfig.info.aliases.includes(tokenizer.command()!)) {//check if command is of the info type
      for (const info of guildConfig.info.reply) { // check the option if it's valid
        if (tokenizer.tokens[1] != undefined && tokenizer.tokens[1].content == info.name) {
          const response = typeof info.response === 'function' ? await info.response(msg, guildConfig) : info.response;
          if (typeof response === 'string') {
            msg.channel.send(response);
          } else if (typeof response !== 'undefined') {
            msg.channel.send(new MessageEmbed(response));
          }
          return;
        }
      }
      msg.channel.send(guildConfig.info.reply.map(c => `\`${guildConfig.prefix}${guildConfig.info.name} ${c.name}\`: ${c.description}`).join('\n'));
    }

    if (!tokenizer.command()) {
      return; // not a valid command
    }

    for (const command of commands.concat(guildConfig.commands)) {
      if (tokenizer.command() !== command.name && !command.aliases.includes(tokenizer.command()!)) {
        continue;
      }


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

  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
