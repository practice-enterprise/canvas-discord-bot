import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
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

export const defaultPrefix = '!';

export const timeZones = ['Europe/brussels', 'Australia/Melbourne', 'America/Detroit', 'not a type'];

export const dateFormates = ['d/M/y h:m', 'd-M-y h:m'];

const guildOnly: MessageEmbed = new EmbedBuilder().error('This is a server only command.');

export const commands: Command[] = [
  { // help
    name: 'help',
    category: 'help',
    description: 'that\'s this command.',
    aliases: ['how', 'wtf', 'man', 'get-help'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (guildConfig) {
        return {
          'title': 'Help is on the way!',
          'description': commands.concat(guildConfig.commands).map(c => `\`${guildConfig.prefix}${c.name}\`: ${c.description}`).join('\n') + '\n',
          'color': '43B581',
        } as MessageEmbedOptions;
      }

      return {
        'title': 'Help is on the way!',
        'description': commands.map(c => `\`${defaultPrefix}${c.name}\`: ${c.description}`).join('\n') + '\n',
        'color': '43B581',
      } as MessageEmbedOptions;
    }
  },
  { // Info
    name: 'info',
    category: 'info',
    description: 'Displays more information. server only',
    aliases: ['informatie', 'information'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
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
      return new EmbedBuilder().info(guildConfig.info.map(i => `\`${guildConfig?.prefix || defaultPrefix}${this.name} ${i.name}\`: ${i.description}`).join('\n'));
    }
  },
  { // setup
    name: 'setup',
    category: 'setup',
    description: 'Quick setup and introduction for the bot. Server only',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      const time = 300000; //300000 = 5 minutes
      const ePrev = '◀';
      const eNext = '▶';
      const reactions = [ePrev, eNext];

      const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
        return reactions.includes(reaction.emoji.name) && user.id === msg.author.id;
      };

      if (!(msg.member?.hasPermission('ADMINISTRATOR')))
        return 'You need to be an admin for this command.';

      let page = 0;
      const pages: MessageEmbedOptions[] = [
        {
          'title': 'Setup',
          'description': `Intro :)\nUse ${ePrev} and ${eNext} to switch pages.`,
          'color': '7289DA',
        },
        {
          'title': 'Setup',
          'description': 'The first page!',
          'color': '7289DA',

        },
        {
          'title': 'Setup',
          'description': 'Another page',
          'color': '7289DA',
        },
      ];

      pages[page].footer = { text: `Page ${page + 1}` };
      const botmsg = await msg.channel.send(new MessageEmbed(pages[0]));
      try {
        for (const e of reactions) {
          await botmsg.react(e);
        }
      } catch (err) {
        console.error('One or more reactions failed.');
      }

      const collector = botmsg.createReactionCollector(filter, { time });
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
          botmsg.edit(new MessageEmbed(pages[page]));
        }
      });

      collector.on('end', (reaction, user) => {
        botmsg.edit(':x:`Session has ended.`\nEnter the command again for a new session.');
        botmsg.reactions.removeAll().catch(err => console.error('Failed to remove all reactions: ', err));
      });
    }
  },
  { // ping
    name: 'ping',
    category: 'ping',
    description: 'play the most mundane ping pong ever with the bot.',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      msg.channel.send('Pong!')
        .then(m =>
          m.edit('Pong! :ping_pong:')
            .then(m => {
              if (m.editedTimestamp !== null)
                m.edit(`Pong! :ping_pong: \`${m.editedTimestamp - msg.createdTimestamp} ms | API: ${msg.client.ws.ping} ms\``);
            }));
    }
  },
  { // roll
    name: 'roll',
    category: 'misc',
    description: 'Rolls a die or dice (eg d6, 2d10, d20 ...).',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);

      const match = (/^(\d+)?d(\d+)$/gm).exec(tokenizer.tokens[1]?.content);
      if (match) {
        const times = Number(match[1]) > 0 ? Number(match[1]) : 1;
        const dice = [];
        for (let i = 0; i < times; i++) {
          dice.push(Math.floor(Math.random() * Number(match[2]) + 1));
        }

        if (times === 1) {
          return new MessageEmbed({
            title: `:game_die: ${tokenizer.tokens[1]?.content}`,
            description: `You rolled a ${dice[0]}.`,
            color: Colors.error
          });
        } else {
          return new MessageEmbed({
            title: `:game_die: ${tokenizer.tokens[1]?.content}`,
            description: `You rolled: ${dice.join(' + ')}\nTotal: ${dice.reduce((p, c) => p + c, 0)}`,
            color: Colors.error
          });
        }
      } else {
        return new EmbedBuilder().buildHelp(this, guildConfig?.prefix || defaultPrefix, Colors.success,
          {'XdY': 'X: amount of times (defaults to 1). Y: amount of sides the die should have.'}, ['d6', 'd20', '2d8', '3d6']);
      }
    }
  },
  { // coinflip
    name: 'coinflip',
    category: 'misc',
    description: 'Heads or tails?',
    aliases: ['coin', 'flip', 'cf'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);

      const flip = Math.round(Math.random());
      const embed = new MessageEmbed({
        color: Colors.warning
      }).setTitle(flip ? ':coin: Heads!' : ':coin: Tails!');

      if (tokenizer.tokens.length === 1) {
        return embed;
      }
      else if (tokenizer.tokens[1]?.content == 'heads' || tokenizer.tokens[1]?.content == 'h') {
        return flip == 1 ? (embed.setDescription('You\'ve won! :tada:')) : (embed.setDescription('You\'ve lost...'));
      }
      else if (tokenizer.tokens[1]?.content == 'tails' || tokenizer.tokens[1]?.content == 't') {
        return flip == 0 ? (embed.setDescription('You\'ve won! :tada:')) : (embed.setDescription('You\'ve lost...'));
      }
      else {
        return new EmbedBuilder().buildHelp(this, guildConfig?.prefix || defaultPrefix, Colors.success,
          {'h/t (optional)': 'Place your bets on heads or tails'}, ['', 'heads', 't']);
      }
    }
  },
  { // prefix
    name: 'prefix',
    category: 'prefix',
    description: 'Set prefix for guild. Server only',
    aliases: ['pf'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      const tokenizer = new Tokenizer(msg.content, guildConfig.prefix);

      if (!msg.member?.hasPermission('ADMINISTRATOR')) {
        return new EmbedBuilder().error('No admin permissions!');
      }

      if (tokenizer.tokens[1] != undefined && tokenizer.tokens[1].type === 'text' && msg.guild?.id != undefined) {
        GuildService.setPrefix(tokenizer.tokens[1].content, msg.guild?.id);
        return new EmbedBuilder().success('Prefix updated with: ' + tokenizer.tokens[1].content);
      }
      else {
        return new EmbedBuilder().buildHelp(this,  guildConfig?.prefix || defaultPrefix, Colors.error, {'prefix': 'the new prefix'}, ['!', '?']);
      }
    }
  },
  { // notes
    name: 'notes',
    category: 'notes',
    description: 'Set or get notes for channels and DM\'s.',
    aliases: ['note'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      return new NotesService(this, guildConfig?.prefix || defaultPrefix).response(msg, guildConfig);
    }
  },
  { // reminder TODO prettyfy/ refactor
    name: 'reminder',
    category: 'reminders',
    description: 'Set reminders default channel = current, command format: date desc channel(optional) \n\'s. supported formats: d/m/y h:m, d.m.y h:m, d-m-y h:m',
    aliases: ['remindme', 'remind', 'setreminder'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
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
      //TODO
      return new MessageEmbed({
        title: 'Reminder usage',
        description: `${guildConfig?.prefix || defaultPrefix}${this.name} \`date\` \`time\` \`content\` (optional) \`channel\` (optional)
        ${guildConfig?.prefix || defaultPrefix}${this.name} \`get\` or \`list\`
        ${guildConfig?.prefix || defaultPrefix}${this.name} (\`delete\` or \`remove\`) \`index\`

        **Examples:**
        ${guildConfig?.prefix || defaultPrefix}${this.name} 1/5/2021 8:00
        ${guildConfig?.prefix || defaultPrefix}${this.name} 17-04-21 14:00 buy some juice
        ${guildConfig?.prefix || defaultPrefix}${this.name} 26.11.2021 16:00 movie night in 1 hour #info`,
        color: '#F04747',
        footer: {
          text: `Supported formats: ${dateFormates.join(', ')}`
        }
      });
    }
  },
  { // timezone TODO prettify 
    name: 'timezone',
    category: 'timezone',
    description: 'Get/set your current time zone',
    aliases: ['time', 'clock', 'tz'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);

      if (tokenizer.tokens[1] == undefined) {
        return {
          'title': 'Time zone',
          'description': `\`${guildConfig?.prefix || defaultPrefix}tz get:\` gets you your time\n\`${guildConfig?.prefix || defaultPrefix}tz set:\` set your clock`,
          'color': '4FAFEF',
        } as MessageEmbedOptions;
      }
      if (tokenizer.tokens[1].content == 'get') {
        const tz = (await ReminderService.getTimeZone(msg.author.id));
        console.log(tz);
        const time = DateTime.fromJSDate(new Date(), { zone: tz });
        return `bot thinks it's ${time.toString()} for you with time zone ${time.zoneName}`;
      }
      if (tokenizer.tokens[1].content == 'set') {
        if (tokenizer.tokens[2]) {
          let tz = timeZones[parseInt(tokenizer.tokens[2].content)];
          if (!tz) {
            tz = tokenizer.tokens[2].content;
          }
          const time = DateTime.fromMillis(Date.now(), { zone: tz });

          if (time.isValid) {
            await ReminderService.setTimeZone(msg.author.id, tz);
            return `bot thinks it's ${time.toString()} for you with time zone ${time.zoneName}`;
          }
        }
        let i = 0;
        return {
          'title': 'Time zones!',
          'url': 'https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
          'description': timeZones.map(tz => `\`${i++}:\`${tz}`).join('\n') + '\n',
          'footer': 'use a number or IANA formated time zone',
          'color': '43B581',
        } as MessageEmbedOptions;
      }
      return {
        'title': 'Time zone',
        'description': `\`${guildConfig?.prefix || defaultPrefix}tz get:\` gets you your time\n\`${guildConfig?.prefix || defaultPrefix}tz set:\` set your clock`,
        'color': '4FAFEF',
      } as MessageEmbedOptions;
    }
  },
  { // wiki
    name: 'wiki',
    category: 'wiki',
    description: 'Search on the Thomas More wiki',
    aliases: ['wk'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);

      const query = tokenizer.body();
      if (query.length == 0)
        return 'https://tmwiki.be';

      const wikiContent = await WikiService.wiki(query);

      const results: Record<string, string> = {};
      for (const result of wikiContent.data.pages.search.results) {
        results[`[${result.title}](https://tmwiki.be/${result.locale}/${result.path}) \`${result.path}\``] = result.description;
      }

      const embed = new EmbedBuilder().buildList(Colors.info, 'Wiki', results, `Search results for \`${query}\`.`, '', 'https://tmwiki.be/');

      return embed;
    }
  },
  { // courses menu command
    name: 'courses',
    category: 'courses',
    description: 'Lists your courses, modules and items with controls. guild command',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const botmsg = await msg.channel.send(new MessageEmbed({ title: ':information_source: Loading courses...' }));
      new CoursesMenu(botmsg, msg).coursesMenu();
    }
  },
  {
    name: 'modules',
    category: 'modules',
    description: 'gives you a list of the modules',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      if (!msg.member?.hasPermission('ADMINISTRATOR')) {
        return 'No admin permissions!';
      }
      let res = '';
      for (const key in (await GuildService.updateModules(guildConfig.id)))
        res = res + key + '\n';
      return res;
    }
  }
];
