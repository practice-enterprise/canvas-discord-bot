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
import { CanvasService } from './services/canvas-service';
import TurndownService from 'turndown';

export const commands: Command[] = [
  { // help
    name: 'help',
    description: 'that\'s this command.',
    aliases: ['how', 'wtf', 'man', 'get-help'],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const help: MessageEmbedOptions = {
        'title': 'Help is on the way!',
        'description': commands.concat(guildConfig.commands).map(c => `\`${guildConfig.prefix}${c.name}\`: ${c.description}`).join('\n') + '\n`' + guildConfig.prefix + guildConfig.info.name + '`' + ': ' + guildConfig.info.description,
        'color': '43B581',
        'footer': { text: 'Some commands support putting \'help\' behind it.' }
      };

      return help;
    }
  },
  { // setup
    name: 'setup',
    description: 'Quick setup and introduction for the bot',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const time = 300000; //300000 = 5 minutes
      const ePrev = '◀';
      const eNext = '▶';
      const reactions = [ePrev, eNext];

      const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
        return reactions.includes(reaction.emoji.name) && user.id === msg.author.id;
      };

      if (!(msg.member?.hasPermission('ADMINISTRATOR')))
        msg.channel.send('You need to be an admin for this command.');

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
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
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
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig);

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
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig);
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
    description: 'Set prefix for guild',
    aliases: ['pf'],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig);

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
  { // default
    name: 'default',
    description: 'sets the default channel',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig);
      if (tokenizer.tokens[1]?.type === 'channel') {
        return tokenizer.tokens[1].content; //TODO stash in db of server
      } else {
        return 'this is not a valid channel';
      }
    }
  },
  { // notes
    name: 'notes',
    description: 'set or get notes for channels',
    aliases: ['note'],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig);
      //!notes #channel adds this note
      if (tokenizer.tokens[1]?.type === 'channel' && tokenizer.tokens[2]?.type === 'text' && msg.guild?.id != undefined) {
        await NotesService.setNote(tokenizer.body(2), tokenizer.tokens[1].content.substr(2, 18), guildConfig);
        return `Note '${tokenizer.body(2)}' got succesfully added to the channel ` + tokenizer.tokens[1].content;
      }
      //!notes #channel - get notes for a channel
      else if (tokenizer.tokens[1]?.type === 'channel') {
        return NotesService.getByChannel(tokenizer.tokens[1].content.substr(2, 18), guildConfig);
      }
      //!notes - get notes in channel
      else if (tokenizer.tokens.length === 1) {
        return NotesService.getByChannel(msg.channel.id.toString(), guildConfig);
      }
      //!notes remove <channel> <number>
      else if (tokenizer.tokens[1]?.type === 'text' && tokenizer.tokens[1].content === 'remove'
        && tokenizer.tokens[2]?.type === 'channel' && tokenizer.tokens[3]?.type === 'text' && msg.guild?.id != undefined
      ) {
        //TODO permissions
        const noteNum: number = parseInt(tokenizer.tokens[3].content);
        return NotesService.delNote(noteNum, tokenizer.tokens[2].content.substr(2, 18), guildConfig);
      }
      //When incorrectly used (includes !notes help)
      else {
        return new Formatter()
          .bold('Help for ' + command(guildConfig.prefix + 'notes'), true)
          .command(guildConfig.prefix + 'notes').text(': get notes from your current channel', true)
          .command(guildConfig.prefix + 'notes #channel').text(': get notes from your favourite channel', true)
          .command(guildConfig.prefix + 'notes #channel an amazing note').text(': Enter a note in a channel', true)
          .command(guildConfig.prefix + 'notes remove #channel notenumber').text(': Remove a note in a channel', true)
          .build();
      }
    }
  },
  { // reminder
    name: 'reminder',
    description: 'set reminders default channel = current, command format: date desc channel(optional) \n\'s. supported formats: d/m/y h:m, d.m.y h:m, d-m-y h:m',
    aliases: ['remindme', 'remind', 'setreminder'],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {

      const tokenizer = new Tokenizer(msg.content, guildConfig);
      const dateFormates: string[] = ['d/M/y h:m', 'd.M.y h:m', 'd-M-y h:m'];

      for (const format of dateFormates) {
        let time;
        if (tokenizer.tokens[1] && tokenizer.tokens[2] && tokenizer.tokens[1].type == 'date' && tokenizer.tokens[2].type == 'time') {
          time = DateTime.fromFormat(tokenizer.tokens[1].content + ' ' + tokenizer.tokens[2].content, format);
        } else {
          time = undefined;
        }
        if (time && time.isValid) {
          ReminderService.create({
            content: tokenizer.body(3),
            date: time.toString(),
            target: {
              channel: tokenizer.tokens.find((t) => t.type === 'channel')?.content.substr(2, 18) || msg.channel.id,
              guild: msg.guild!.id
            },
          });

          return 'your reminder has been set as: ' + time.toString();
        }
      }
      return 'this was not a valid date/time format';
    }
  },
  { // wiki
    name: 'wiki',
    description: 'Search on the Thomas More wiki',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig);

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
    description: 'Lists your courses, modules and items with controls',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {

      // TODO: replace with user tokens!
      const token = process.env.CANVAS_TOKEN;

      if (token != undefined && token.length > 1) {
        const botmsg = await msg.channel.send(new MessageEmbed({ title: 'Loading courses...' }));

        CoursesMenu.coursesMenu(botmsg, msg, token);

        //coursesMenu(botmsg, msg, token);
      }
      else {
        const embed = new MessageEmbed({
          'title': 'Undefined or incorrect token.',
          'description': 'Are you sure you logged in?\nURL TO AUTH',
          'color': 'EF4A25', //Canvas color pallete
        });
        return embed;
      }
    }
  },
  { // courses menu command
    name: 'lastannounce',
    description: 'Last announcement',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      if(process.env.CANVAS_TOKEN !== undefined) {

        // Uses turndown to turn HTML in markdown (not all markdown features are supported in Discord, so this might lead to some issues, however most basic features such as italic, bold, links are supported just fine).
        const ts = new TurndownService();

        const announcements = await CanvasService.getAnnouncements(process.env.CANVAS_TOKEN, '10912');
        const courses = await CanvasService.getCourses(process.env.CANVAS_TOKEN);
        const course = courses.find(c => c.id === 10912);

        const postedTime = new Date(announcements[0].posted_at);
        console.log(postedTime);
        console.log(postedTime.getHours());
        const postTimeString = postedTime.getHours() + ':' + postedTime.getMinutes() + ' • ' + postedTime.getDate() + '/' + (postedTime.getMonth() + 1) + '/' + postedTime.getFullYear();

        const embed = new MessageEmbed({
          color: '#E63F30',
          title: announcements[0].title,
          url: announcements[0].html_url,
          author: {
            name:  course?.course_code + ' - ' + announcements[0].author.display_name
          },
          description: ts.turndown(announcements[0].message),
          footer: {
            text: postTimeString
          }
        });
        return embed;
      }
      else {
        return 'Token undefined';
      }
    }
  },
];
