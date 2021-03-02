import { Client, ClientPresenceStatus, MessageEmbed } from 'discord.js';
import { commands } from './commands';
import { ConfigService } from './services/config-service';
import { GuildService } from './services/guild-service';
import { NotesService } from './services/notes-service';
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

    if (!tokenizer.command()) {
      return; // not a valid command
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
