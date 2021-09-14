/* eslint-disable no-await-in-loop */
import { Client, Intents, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { inspect } from 'util';
import { commands, defaultPrefix } from './commands';
import { ConfigService } from './services/config-service';
import { GuildService } from './services/guild-service';
import { Logger } from './util/logger';
import { Formatter } from './util/formatter';
import { Tokenizer } from './util/tokenizer';
import { REST } from '@discordjs/rest';//' //@discordjs/rest/dist/lib/REST


export async function buildClient(shard: number, shardCount: number): Promise<Client> {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'], shards: shard, shardCount: shardCount });
  const config = await ConfigService.get();

  client.on('interactionCreate', async (interaction) => {

    if (!interaction.isCommand()) {
      return;
    }

    for (const command of commands) {
      if (command.name == interaction.commandName) {
        await command.response(interaction);
      }
    }

  });
  if (!process.env.DISCORD_TOKEN) throw new Error('discord token undefined');
  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);


  client.on('ready', async () => {
    Logger.info(`Logged in as ${client.user?.tag}`);

    rest.put(
      `/applications/${client.user!.id}/guilds/780572565240414208/commands`,
      { body: commands });

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


  client.on('guildCreate', async guild => {
    const roleNames = ['student', 'teacher'];

    const roleIDs: Record<string, string> = {};
    for (const roleName of roleNames) {
      const role = await guild.roles.create({ name: roleName });
      roleIDs[roleName] = role.id;
    }
    GuildService.createDefault(guild.id, roleIDs);
  });

  await client.login(process.env.DISCORD_TOKEN);
  return client;
}
