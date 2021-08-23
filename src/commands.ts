import { Interaction, Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { Tokenizer } from './util/tokenizer';
import { DateTime } from 'luxon';
import { Command, Response } from './models/command';
import { GuildConfig } from './models/guild';
import { GuildService } from './services/guild-service';
import { ReminderService } from './services/reminder-service';
import { WikiService } from './services/wiki-service';
import { NotesService } from './services/notes-service';
import { CoursesMenu } from './util/canvas-courses-menu';
import { Colors, EmbedBuilder } from './util/embed-builder';
import { ConfigService } from './services/config-service';
import { CanvasService } from './services/canvas-service';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';

export const defaultPrefix = '!';

export const timeZones = ['Europe/Brussels', 'Australia/Melbourne', 'America/Detroit'];

export const dateFormates = ['d/M/y h:m', 'd-M-y h:m'];

const guildOnly: MessageEmbed = EmbedBuilder.error('This is a server only command.');

//TODO check content of respond messages
export const commands: Command[] = [
  /*{ // help
    name: 'help',
    category: 'help',
    description: 'That\'s this command.',
    aliases: ['how', 'man', 'get-help'],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (guildConfig) {
        return new MessageEmbed({
          'title': 'Help is on the way!',
          'description': commands.concat(guildConfig.modules['customCommands'] === false ? [] : guildConfig.commands).map(c => `\`${guildConfig.prefix}${c.name}\`: ${c.description}`).join('\n') + '\n',
          'color': '#43B581',
        });
      }

      return new MessageEmbed({
        'title': 'Help is on the way!',
        'description': commands.map(c => `\`${defaultPrefix}${c.name}\`: ${c.description}`).join('\n') + '\n',
        'color': '#43B581',
      });
    }
  },*/
  /*{ // Info
    name: 'info',
    category: 'info',
    description: 'Displays more information. Server only.',
    aliases: ['informatie', 'information'],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }

      const tokenizer = new Tokenizer(msg.content, guildConfig.prefix);
      for (const reply of guildConfig.info) {
        if (tokenizer.tokens[1] !== undefined && reply.name === tokenizer.tokens[1].content) {
          const response = typeof reply.response === 'function' ? await reply.response(msg, guildConfig) : reply.response;
          return response;
        }
      }
      return EmbedBuilder.info(guildConfig.info.map(i => `\`${guildConfig?.prefix || defaultPrefix}${this.name} ${i.name}\`: ${i.description}`).join('\n'));
    }
    return 'disabled';
  },*/
  /*{ // setup
    name: 'setup',
    category: 'setup',
    description: 'Quick setup and introduction for the bot. Server only.',
    aliases: [],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      const time = 300000; //300000 = 5 minutes
      const ePrev = '◀';
      const eNext = '▶';
      const reactions = [ePrev, eNext];

      const filter = (reaction: any, user: { id: string; }) => {
        return reactions.includes(reaction._emoji.name) && user.id === msg.author.id;
      };

      if (!(msg.member?.permissions.has(['ADMINISTRATOR'], true)))
        return EmbedBuilder.error('No admin permissions!');

      let page = 0;
      const pages: MessageEmbedOptions[] = [
        {
          'title': 'Setup',
          'description': 'Github repositories for Discan:\nhttps://github.com/practice-enterprise\nhttps://github.com/practice-enterprise/api\nhttps://github.com/practice-enterprise/canvas-discord-bot\nhttps://github.com/practice-enterprise/oauth',
          'color': '#7289DA',

        },
        {
          'title': 'Setup',
          'description': 'Users need to login with OAuth to start using the services.',
          'color': '#7289DA',
        },
      ];

      pages[page].footer = { text: `Page ${page + 1}` };
      const botmsg = await msg.channel.send({embeds: [new MessageEmbed(pages[0])]});
      try {
        for (const e of reactions) {
          await botmsg.react(e);
        }
      } catch (err) {
        console.error('One or more reactions failed.');
      }
      
      //TODO fix FILTER
      const collector = botmsg.createReactionCollector({filter: filter, time: time });
      collector.on('collect', (reaction, user) => {
        reaction.users.remove(user.id);
        const oldPage = page;

        switch (reaction.emoji.name) {
          case reactions[0]:
            if (page > 0)
              page--;
            break;
          case reactions[1]:
            if (page < pages.length - 1)
              page++;
            break;
        }

        if (oldPage !== page) { //Only edit if it's a different page.
          pages[page].footer = { text: `Page ${page + 1}` };
          botmsg.edit({embeds: [new MessageEmbed(pages[page])]});
        }
      });

      collector.on('end', (reaction, user) => {
        botmsg.edit(':x:`Session has ended.`\nEnter the command again for a new session.');
        botmsg.reactions.removeAll().catch(err => console.error('Failed to remove all reactions: ', err));
      });
    }
  },*/
  { // ping
    name: 'ping',
    category: 'ping',
    description: 'Play the most mundane ping pong ever with the bot.',
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<void> {
      if (!interaction.isCommand())
        return;
      interaction.reply(`Pong! :ping_pong: \`${Date.now() - interaction.createdTimestamp} ms | API: ${interaction.client.ws.ping} ms\``);
    }
  },
  { // roll TODO make up of embed
    name: 'roll',
    category: 'misc',
    description: 'Rolls a die or dice.',
    options: [{ required: true, type: 4, name: 'faces', description: 'default dice have 6 faces (1-6)' },
    { required: false, type: 4, name: 'amount', description: 'amount of these dice default: 1' }],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<void> {
      if (!interaction.isCommand() || !this.options)
        return;
      let times = interaction.options.getInteger(this.options[1].name);
      if (!times)
        times = 1;
      const dice = [];
      for (let i = 0; i < times; i++) {
        dice.push(Math.floor(Math.random() * interaction.options.getInteger(this.options[0].name, true) + 1));
      }

      if (times === 1) {
        interaction.reply({
          embeds: [new MessageEmbed({
            title: `${interaction.options.getInteger(this.options[0].name)} faces :game_die:`,
            description: `You rolled a ${dice[0]}.`,
            color: Colors.error
          })]
        });
      }
      else {
        interaction.reply({
          embeds: [new MessageEmbed({
            title: `${interaction.options.getInteger(this.options[0].name)} faces ${interaction.options.getInteger(this.options[1].name)} times :game_die:`,
            description: `You rolled: ${dice.join(' + ')}\nTotal: ${dice.reduce((p, c) => p + c, 0)}`,
            color: Colors.error
          })]
        });
      }
    }
  },
  { // coinflip
    name: 'coinflip',
    category: 'misc',
    description: 'Heads or tails?',
    options: [{ required: false, type: 4, name: 'pick', description: 'from 0 to 6 for example', choices: [{ name: 'heads', value: 1 }, { name: 'tails', value: 0 }] }],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<void> {
      if (!interaction.isCommand() || !this.options)
        return;
      const flip = Math.round(Math.random());
      const embed = new MessageEmbed({
        color: Colors.warning
      }).setTitle(flip ? ':coin: Heads!' : ':coin: Tails!');
      if (interaction.options.getInteger(this.options[0].name) != null)
        flip == interaction.options.getInteger(this.options[0].name) ? (embed.setDescription('You\'ve won! :tada:')) : (embed.setDescription('You\'ve lost...'));
      interaction.reply({ embeds: [embed] });
    }
  },
  /*{ // prefix
    name: 'prefix',
    category: 'prefix',
    description: 'Set prefix for guild. Server only.',
    aliases: ['pf'],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      const tokenizer = new Tokenizer(msg.content, guildConfig.prefix);

      if (!(msg.member?.permissions.has(['ADMINISTRATOR'], true))) {
        return EmbedBuilder.error('No admin permissions!');
      }

      if (tokenizer.tokens[1] != undefined && tokenizer.tokens[1].type === 'text' && msg.guild?.id != undefined) {
        GuildService.setPrefix(tokenizer.tokens[1].content, msg.guild?.id);
        return EmbedBuilder.success('Prefix updated with: ' + tokenizer.tokens[1].content);
      }
      else {
        return EmbedBuilder.buildHelp(this, guildConfig?.prefix || defaultPrefix, Colors.error, { 'prefix': 'the new prefix' }, ['!', '?']);
      }
    }
  },*/
  /*{ // notes
    name: 'notes',
    category: 'notes',
    description: 'Set or get notes for channels and DM\'s.',
    aliases: ['note'],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      return new NotesService(this, guildConfig?.prefix || defaultPrefix).response(msg, guildConfig);
    }
  },*/
  /*{ // reminder
    name: 'reminder',
    category: 'reminders',
    description: 'Set reminders.',
    aliases: ['remindme', 'remind', 'setreminder'],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);
      if (tokenizer.tokens[1]) {
        if (tokenizer.tokens[1].content == 'get' || tokenizer.tokens[1].content == 'list') {
          return ReminderService.getCommand(msg.author.id);
        }
        if (tokenizer.tokens[1].content == 'delete' || tokenizer.tokens[1].content == 'remove') {
          return ReminderService.deleteCommand(msg.author.id, tokenizer);
        }
        if (tokenizer.tokens[2] && tokenizer.tokens[1].type == 'date' && tokenizer.tokens[2].type == 'time') {
          const response = ReminderService.setCommand(tokenizer, msg.author.id, msg.guild?.id, msg.channel.id);
          if (response) {
            return response;
          }
        }
      }
      return EmbedBuilder.buildHelp(this, guildConfig?.prefix || defaultPrefix, Colors.info,
        { 'get/list': 'get all your reminders you\'ve set', 'delete/remove': 'remove a reminder', 'date time': 'sets a reminder with date and time' }, ['1/5/2021 8:00', '17-04-21 14:00 buy some juice', '26/11/2021 16:00 movie night in 1 hour #info'], `Supported formats: ${dateFormates.join(', ')}`);
    }
  },*/
  /*{ //timezone
    name: 'timezone',
    category: 'timezone',
    description: 'Get/set your current time zone.',
    aliases: ['time', 'clock', 'tz'],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);
      if (tokenizer.tokens[1] != undefined) {
        if (tokenizer.tokens[1].content == 'get') {
          const tz = (await ReminderService.getTimeZone(msg.author.id));
          const time = DateTime.fromJSDate(new Date(), { zone: tz });
          return EmbedBuilder.info(`${time.toFormat('dd/MM/yyyy HH:mm z')}`, undefined, 'Your current time zone!');
        }
        if (tokenizer.tokens[1].content == 'set') {
          if (tokenizer.tokens[2]) {
            let tz = timeZones[parseInt(tokenizer.tokens[2].content) - 1];
            if (!tz) {
              tz = tokenizer.tokens[2].content;
            }
            const time = DateTime.fromMillis(Date.now(), { zone: tz });

            if (time.isValid) {
              await ReminderService.setTimeZone(msg.author.id, tz);
              return EmbedBuilder.info(`${time.toFormat('dd/MM/yyyy HH:mm z')}`, undefined, 'Your new time zone!');
            }
          }
          return EmbedBuilder.buildList(Colors.info, 'Time zones!', timeZones, 'you can use a IANA standard as timezone. Here are some options:');
        }
      }
      return EmbedBuilder.buildHelp(this, guildConfig?.prefix || defaultPrefix, Colors.success, ['get', 'set'], ['set Europe/brussels', 'set 1', 'get']);
    }
  },*/
  /*{ // wiki
    name: 'wiki',
    category: 'wiki',
    description: 'Search on the Thomas More wiki.',
    aliases: ['wk'],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);
      const url = (await ConfigService.get()).wiki;
      const query = tokenizer.body();
      if (query.length == 0)
        return url;

      const wikiContent = await WikiService.wiki(query);

      const results: Record<string, string> = {};
      for (const result of wikiContent.data.pages.search.results) {
        results[`[${result.title}](${url}/${result.locale}/${result.path}) \`${result.path}\``] = result.description;
      }

      return EmbedBuilder.buildList(Colors.info, 'Wiki', results, `Search results for \`${query}\`.`, '', url);
    }
  },
  { // courses menu command
    name: 'courses',
    category: 'courses',
    description: 'Lists your courses, modules and items with controls. Server only.',
    aliases: [],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      if (!interaction.isCommand()) return 'not a command';
      const botmsg = await interaction.reply({ embeds: [new MessageEmbed({ title: ':information_source: Loading courses...' })] });
      if (guildConfig == null || guildConfig.canvasInstanceID == null) {
        return EmbedBuilder.error('No Canvas instance ID defined.', 'Contact your administator', 'Couldn\'t load courses!');
      }
      const canvasUrl = (await CanvasService.getInstanceForId(guildConfig.canvasInstanceID)).endpoint;
      new CoursesMenu(botmsg, msg, canvasUrl).coursesMenu();
    }
  },
  { // modules
    name: 'modules',
    category: 'modules',
    description: 'Updates all modules to true. Server admin only.',
    aliases: [],
    async response(interaction: Interaction, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      if (!(msg.member?.permissions.has(['ADMINISTRATOR'], true))) {
        return EmbedBuilder.error('No admin permissions!');
      }
      const res = [];
      for (const key in (await GuildService.updateModules(guildConfig.id))) {
        res.push(key);
      }
      return EmbedBuilder.buildList(Colors.info, 'modules', res, 'Updates all modules to true. List of modules:');
    }
  }*/
];
