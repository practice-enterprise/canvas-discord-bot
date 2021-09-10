import { ButtonInteraction, CommandInteraction, Interaction, Message, MessageActionRow, MessageButton, MessageEmbed, MessageEmbedOptions, MessageInteraction } from 'discord.js';
import { Tokenizer } from './util/tokenizer';
import { DateTime } from 'luxon';
import { Command, Response } from './models/command';
import { GuildConfig } from './models/guild';
import { GuildService } from './services/guild-service';
import { ReminderService } from './services/reminder-service';
import { WikiService } from './services/wiki-service';
import { NotesService } from './services/notes-service';
import { MenuCourses } from './util/canvas-courses-menu';
import { Colors, EmbedBuilder } from './util/embed-builder';
import { ConfigService } from './services/config-service';
import { CanvasService } from './services/canvas-service';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { Challenge, Coinflip, DiceRoll, RockPaperScissors } from './games';

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
    async response(interaction: CommandInteraction): Promise<void> {
      if (!interaction.isCommand())
        return;
      interaction.reply(`Pong! :ping_pong: \`${Date.now() - interaction.createdTimestamp} ms | API: ${interaction.client.ws.ping} ms\``);
    }
  },
  { // roll TODO make up of embed
    name: 'roll',
    category: 'misc',
    description: 'Rolls a die or dice.',
    options: [{ required: false, type: 4, name: 'faces', description: 'Amount of faces for your dice/die (default 6)' },
      { required: false, type: 4, name: 'amount', description: 'Amount of dice/die (default 1)' }],
    async response(interaction: CommandInteraction): Promise<void> {
      if (!this.options)
        return;
      let times = interaction.options.getInteger(this.options[1].name);
      let faces = interaction.options.getInteger(this.options[0].name);
      if (!times)
        times = 1;
      if (!faces)
        faces = 6;

      interaction.reply({embeds: [new DiceRoll().roll(times, faces)]});
    }
  },
  { // coinflip
    name: 'coinflip',
    category: 'misc',
    description: 'Heads or tails?',
    options: [{ required: false, type: 4, name: 'coinside', description: 'Which side of the coin you wanna bet for?', choices: [{ name: 'Heads', value: 1 }, { name: 'Tails', value: 0 }] }],
    async response(interaction: CommandInteraction): Promise<void> {
      if (!this.options) {
        return;
      }
      interaction.reply({ embeds: [new Coinflip().flip(interaction.options.getInteger(this.options[0].name))] });
    }
  },
  { // rps
    name: 'rps',
    category: 'misc',
    description: 'Rock paper scissors',
    options: [{ required: true, type: 6, name: 'player', description: 'Player you want to challenge'}],
    async response(interaction: CommandInteraction): Promise<void> {
      if (!this.options) {
        return;
      }
      new RockPaperScissors(interaction);
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
  { // notes
    name: 'notes',
    category: 'notes',
    description: 'Set or get notes for channels and DM\'s.',
    options: [
      { required: false, type: 1, name: 'view', description: 'View notes of a channel', options: [
        { required: false, name: 'channel',  type: 7,  description: 'Choose which channel to get notes from'}
      ] },
      { required: false, type: 1, name: 'add', description: 'Add a note to a channel', options: [
        {required: true, type: 3, name: 'note', description: 'Content of note'},
        {required: false, type: 7, name: 'channel', description: 'Choose which channel to add a note to'}
      ] },
      { required: false, type: 1, name: 'remove', description: 'Remove a note from a channel', options: [
        {required: true, type: 4, name: 'note', description: 'Index of note to remove'},
        {required: false, type: 7, name: 'channel', description: 'Choose which channel to remove a note from'}
      ] }
    ],
    async response(interaction: CommandInteraction): Promise<void> {
      // return new NotesService(this, guildConfig?.prefix || defaultPrefix).response(msg, guildConfig);
      await new NotesService(interaction).response();
      // interaction.reply('beep');
    }
  },
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
  // { //timezone
  //   name: 'timezone',
  //   category: 'timezone',
  //   description: 'Get/set your current time zone.',
  //   options: [{ required: true, type: 3, name: 'timezone', description: 'write down an IANA time zone' }],
  //   async response(interaction: Interaction): Promise<void> {
  //     if (!interaction.isCommand() || !this.options)
  //       return;
  //     const zone = interaction.options.getString(this.options[0].name, true);
  //     if (zone) {
  //       /*if (tokenizer.tokens[1].content == 'get') {
  //         const tz = (await ReminderService.getTimeZone(msg.author.id));
  //         const time = DateTime.fromJSDate(new Date(), { zone: tz });
  //         return EmbedBuilder.info(`${time.toFormat('dd/MM/yyyy HH:mm z')}`, undefined, 'Your current time zone!');
  //       }*/
  //       //if (tokenizer.tokens[1].content == 'set') {
  //       //if (tokenizer.tokens[2]) {
  //       /*let tz = timeZones[parseInt(tokenizer.tokens[2].content) - 1];
  //       if (!tz) {
  //         tz = tokenizer.tokens[2].content;
  //       }
  //       */
  //       const time = DateTime.fromMillis(Date.now(), { zone: zone });
  //       if (time.isValid) {
  //         console.log('valid zone');

  //         await ReminderService.setTimeZone(interaction.user.id, zone);
  //         interaction.reply({embeds: [EmbedBuilder.info(`${time.toFormat('dd/MM/yyyy HH:mm z')}`, undefined, 'Your new time zone!')]});
  //         return;
  //       }
  //       //}
  //       //EmbedBuilder.buildList(Colors.info, 'Time zones!', timeZones, 'you can use a IANA standard as timezone. Here are some options:');
  //       //}
  //     }
  //     //return EmbedBuilder.buildHelp(this, guildConfig?.prefix || defaultPrefix, Colors.success, ['get', 'set'], ['set Europe/brussels', 'set 1', 'get']);
  //     interaction.reply({embeds: [EmbedBuilder.error('Setting timezone failed!', undefined, 'Timezone error')]});
  //   }
  // },
  { // wiki TODO test
    name: 'wiki',
    category: 'wiki',
    description: 'Search on the Thomas More wiki.',
    options: [{ required: false, type: 3, name: 'search', description: 'What are you looking for?' }],
    async response(interaction: CommandInteraction): Promise<void> {
      if (!this.options)
        return;
      const url = (await ConfigService.get()).wiki;
      const query = interaction.options.getString(this.options[0].name);
      if (!query) {
        interaction.reply(url);
        return;
      }

      const wikiContent = await WikiService.wiki(query).catch(() => console.log('wiki down?'));
      if (!wikiContent) {
        interaction.reply({ embeds: [EmbedBuilder.error('Wiki might be down', undefined, 'WIKI')] });
        return;
      }
      const results: Record<string, string> = {};
      for (const result of wikiContent.data.pages.search.results) {
        results[`[${result.title}](${url}/${result.locale}/${result.path}) \`${result.path}\``] = result.description;
      }

      interaction.reply({ embeds: [EmbedBuilder.buildList(Colors.info, 'Wiki', results, `Search results for \`${query}\`.`, '', url)] });
    }
  },
  { // courses menu command TODO fix variables
    name: 'courses',
    category: 'courses',
    description: 'Lists your courses, modules and items with controls. Server only.',
    async response(interaction: CommandInteraction): Promise<void> {
      const courses = await CanvasService.getCourses(interaction.user.id);
      if (courses === undefined) {
        interaction.reply({
          embeds: [new MessageEmbed({
            color: '#F04747',
            title: ':warning: Can\'t fetch courses',
            description: 'If you\'re not logged in, please do so for this command to work.\nManual canvas tokens might not be valid anymore.',
            footer: { text: 'Error: invalid token' }
          })]
        }); return;
      }
      const instanceId = await CanvasService.getInstanceId(interaction.user.id);
      if (!instanceId)
        return;
      const endpoint = (await CanvasService.getInstanceForId(instanceId));
      new MenuCourses(interaction, courses, endpoint.endpoint);

    }
  }
];
