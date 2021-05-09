import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { Tokenizer } from './util/tokenizer';
import { command, Formatter } from './util/formatter';
import { DateTime } from 'luxon';
import { Command, Response } from './models/command';
import { GuildConfig } from './models/guild';
import { GuildService } from './services/guild-service';
import { ReminderService } from './services/reminder-service';
import { WikiService } from './services/wiki-service';
import { NotesService } from './services/notes-service';
import { CoursesMenu } from './util/canvas-courses-menu';
import { EmbedMaker } from './util/embed-maker';


export const defaultPrefix = '!';

const timeZones = ['Europe/brussels', 'Australia/Melbourne', 'America/Detroit', 'not a type'];

const guildOnly: MessageEmbed = new MessageEmbed({
  title: 'Error!',
  description: 'This is a server only command.'
});

export const commands: Command[] = [
  { // help
    name: 'help',
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
      return {
        'title': 'Info commands',
        'description': guildConfig.info.map(i => `\`${i.name}\`: ${i.description}`).join('\n'),
        'color': '4FAFEF',
      } as MessageEmbedOptions;

    }
  },
  { // setup
    name: 'setup',
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
    description: 'rolls a die or dice (eg d6, 2d10, d20 ...).',
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
          return `Rolled a ${dice[0]}`;
        } else {
          return `Dice: ${dice.join(', ')}\nTotal: ${dice.reduce((p, c) => p + c, 0)}`;
        }
      } else {
        return 'no valid die found, e.g. \'3d6\'';
      }
    }
  },
  { // coinflip
    name: 'coinflip',
    description: 'heads or tails?',
    aliases: ['coin', 'flip', 'cf'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);


      const flip = Math.round(Math.random());
      const embed = new MessageEmbed()
        .setTitle(flip ? 'Heads! :coin:' : 'Tails! :coin:');

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
        return 'Try with heads (h) or tails (t) instead!';
      }
    }
  },
  { // prefix
    name: 'prefix',
    description: 'Set prefix for guild. Server only',
    aliases: ['pf'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      if (!guildConfig) {
        return guildOnly;
      }
      const tokenizer = new Tokenizer(msg.content, guildConfig.prefix);

      if (!msg.member?.hasPermission('ADMINISTRATOR')) {
        return 'No admin permissions!';
      }

      if (tokenizer.tokens[1] != undefined && tokenizer.tokens[1].type === 'text' && msg.guild?.id != undefined) {
        GuildService.setPrefix(tokenizer.tokens[1].content, msg.guild?.id);
        return 'Prefix update with: ' + tokenizer.tokens[1].content;
      }
      else {
        return 'Use like `prefix <new prefix>`';
      }
    }
  },
  /*{ // default
    name: 'default',
    description: 'sets the default channel',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig.prefix);
      if (tokenizer.tokens[1]?.type === 'channel') {
        return tokenizer.tokens[1].content; //TODO stash in db of server
      } else {
        return 'this is not a valid channel';
      }
    }
  },*/
  { // notes
    name: 'notes',
    description: 'Set or get notes for channels and DM\'s.',
    aliases: ['note'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      return new NotesService(this, guildConfig?.prefix || defaultPrefix).response(msg, guildConfig);
    }
  },
  { // reminder
    name: 'reminder',
    description: 'Set reminders default channel = current, command format: date desc channel(optional) \n\'s. supported formats: d/m/y h:m, d.m.y h:m, d-m-y h:m',
    aliases: ['remindme', 'remind', 'setreminder'],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);
      const dateFormates: string[] = ['d/M/y h:m', 'd.M.y h:m', 'd-M-y h:m'];

      for (const format of dateFormates) {
        let time = undefined;
        if (tokenizer.tokens[1] && tokenizer.tokens[2] && tokenizer.tokens[1].type == 'date' && tokenizer.tokens[2].type == 'time') {
          time = DateTime.fromFormat(tokenizer.tokens[1].content + ' ' + tokenizer.tokens[2].content, format, { zone: 'UTC' });
        }
        tokenizer.body(3).length;

        if (time && time.isValid) {
          const userTime = time.setZone(await ReminderService.getTimeZone(msg.author.id) || timeZones[0], { keepLocalTime: true });
          if (guildConfig) {
            ReminderService.create({
              content: tokenizer.body(3) || `<@${msg.author.id}> here's your reminder for ${userTime.toFormat('dd/MM/yyyy hh:mm')} ${userTime.zoneName}`,
              date: time.toISO(),
              target: {
                channel: tokenizer.tokens.find((t) => t.type === 'channel')?.content.substr(2, 18) || msg.channel.id,
                guild: msg.guild!.id,
                user: msg.author.id
              },
            });
          } else {
            ReminderService.create({
              content: tokenizer.body(3) || `<@${msg.author.id}> here's your reminder for ${userTime.toFormat('dd/MM/yyyy hh:mm')} ${userTime.zoneName}`,
              date: time.toISO(),
              target: {
                user: msg.author!.id
              },
            });
          }
          return `your reminder has been set as: ${userTime.toFormat('dd/MM/yyyy hh:mm')} ${userTime.zoneName}`;
        }
      }
      return new MessageEmbed({
        title: 'Reminder usage',
        description: `${guildConfig?.prefix || defaultPrefix}${this.name} \`date\` \`time\` \`content\` (optional) \`channel\` (optional)\n
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
    description: 'Search on the Thomas More wiki',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig?.prefix || defaultPrefix);

      const search = tokenizer.body();
      if (search.length == 0)
        return 'https://tmwiki.be';

      const wikiContent = await WikiService.wiki(search);
      wikiContent.data.pages.search.results
        .map(p => `[${p.title}](https://tmwiki.be/${p.locale}/${p.path})`).join('\n\n');

      const embed = new MessageEmbed({
        'title': `Wiki results for '${search}'`,
        'url': 'https://tmwiki.be',
        'description': wikiContent.data.pages.search.results
          .map(p => `[${p.title}](https://tmwiki.be/${p.locale}/${p.path}) \`${p.path}\`
          Desc: ${p.description}`).join('\n\n')
      });

      if (embed.length >= 2000)
        return '`Message too long.`';
      return embed;
    }
  },
  { // courses menu command
    name: 'courses',
    description: 'Lists your courses, modules and items with controls. guild command',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      const botmsg = await msg.channel.send(new MessageEmbed({ title: ':information_source: Loading courses...' }));
      new CoursesMenu(botmsg, msg).coursesMenu();
    }
  },
  {
    name: 'embed',
    description: '',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig | undefined): Promise<Response | void> {
      msg.channel.send(new EmbedMaker().buildHelp(this, guildConfig?.prefix || defaultPrefix, 'info', {'paramss (optional)': 'een epische bescrhijving'}, ['ee', 'eeee']));
      msg.channel.send(new EmbedMaker().success('Good job partner'));
      msg.channel.send(new EmbedMaker().error('wasnt a good job partner', 'Oh no!'));
      msg.channel.send(new EmbedMaker().buildList('gray', 'My epic list', ['eggs', 'many eggs', 'milk', 'sugar to induce my diabetes']));
      msg.channel.send(new EmbedMaker().buildList('canvas', 'My epic list', {
        'Cheggs': 'and eggs',
        'His last order was cum': 'And so they came, even the dragons',
        'Baby dont hurt me': 'no more!'
      }, 'My epic grocery list :D', 'also a brain if u can find it.'));
    }
  }
];
