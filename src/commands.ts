import { Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { Tokenizer } from './util/tokenizer';
import { command, Formatter, preventExceed } from './util/formatter';
import { DateTime } from 'luxon';
import { Command, Response } from './models/command';
import { GuildConfig } from './models/guild';
import { GuildService } from './services/guild-service';
import { ReminderService } from './services/reminder-service';
import { WikiService } from './services/wiki-service';
import { NotesService } from './services/notes-service';
import { CoursesMenu } from './util/canvas-courses-menu';

export const commands: Command[] = [
  { // help
    name: 'help',
    description: 'that\'s this command.',
    aliases: ['how', 'wtf', 'man', 'get-help'],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const help: MessageEmbedOptions = {
        'title': 'Help is on the way!',
        'description': commands.concat(guildConfig.commands).map(c => `\`${guildConfig.prefix}${c.name}\`: ${c.description}`).join('\n') + '\n`',
        'color': '43B581',
      };

      return help;
    }
  },
  { // Info
    name: 'info',
    description: 'Displays more information.',
    aliases: ['informatie', 'information'],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const tokenizer = new Tokenizer(msg.content, guildConfig);

      for (const reply of guildConfig.info) {
        if (tokenizer.tokens[1] !== undefined && reply.name === tokenizer.tokens[1].content) {
          const response = typeof reply.response === 'function' ? await reply.response(msg, guildConfig) : reply.response;
          if (typeof response === 'string') {
            msg.channel.send(response);
          } else if (typeof response !== 'undefined') {
            msg.channel.send(new MessageEmbed(response));
          }
          return;
        }
      }
      const embed: MessageEmbedOptions = {
        'title': 'Info commands',
        'description': guildConfig.info.map(i => `\`${i.name}\`: ${i.description}`).join('\n'),
        'color': '4FAFEF',
      };
      return embed;
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
        if (time && time.isValid && msg.guild != null) {
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

      const query = tokenizer.body();
      if (query.length == 0)
        return 'https://tmwiki.be';

      const wikiContent = await WikiService.wiki(query);
      wikiContent.data.pages.search.results
        .map(p => `[${p.title}](https://tmwiki.be/${p.locale}/${p.path})`).join('\n\n');

      const embed = new MessageEmbed({
        'title': `Wiki results for '${query}'`,
        'url': 'https://tmwiki.be',
        'description': wikiContent.data.pages.search.results
          .map(p => `[${p.title}](https://tmwiki.be/${p.locale}/${p.path}) \`${p.path}\`
          Desc: ${p.description}`).join('\n\n')
      });

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
        const botmsg = await msg.channel.send(new MessageEmbed({ title: ':information_source: Loading courses...' }));
        new CoursesMenu(guildConfig, botmsg, msg).coursesMenu();
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
  {
    // temp for testing preventExceed()
    name: 'long',
    description: 'very long',
    aliases: [],
    async response(msg: Message, guildConfig: GuildConfig): Promise<Response | void> {
      const long = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Blandit turpis cursus in hac habitasse platea dictumst quisque. Proin libero nunc consequat interdum varius sit amet. Quam viverra orci sagittis eu volutpat odio facilisis mauris. Semper auctor neque vitae tempus quam pellentesque. Urna molestie at elementum eu facilisis sed odio morbi quis. Amet consectetur adipiscing elit duis tristique sollicitudin nibh sit amet. Amet est placerat in egestas erat. Sagittis vitae et leo duis ut. Id aliquet lectus proin nibh nisl condimentum id. Id consectetur purus ut faucibus pulvinar. Blandit massa enim nec dui nunc mattis enim ut tellus. A diam sollicitudin tempor id eu nisl nunc. Dapibus ultrices in iaculis nunc sed. Id semper risus in hendrerit. Accumsan lacus vel facilisis volutpat est velit egestas dui. Fames ac turpis egestas integer. Auctor elit sed vulputate mi. Et ligula ullamcorper malesuada proin libero nunc consequat. Ut diam quam nulla porttitor massa id neque. Tellus integer feugiat scelerisque varius morbi enim nunc. Sed adipiscing diam donec adipiscing tristique risus. Ut lectus arcu bibendum at. Quis commodo odio aenean sed adipiscing diam donec. Ac auctor augue mauris augue neque gravida in. Iaculis eu non diam phasellus vestibulum lorem sed. Fermentum odio eu feugiat pretium nibh ipsum consequat nisl. Augue lacus viverra vitae congue. Fringilla urna porttitor rhoncus dolor purus non enim praesent elementum. Sit amet cursus sit amet. Arcu ac tortor dignissim convallis aenean et. Vitae et leo duis ut diam. Egestas fringilla phasellus faucibus scelerisque eleifend donec. Fames ac turpis egestas sed tempus. Faucibus scelerisque eleifend donec pretium vulputate sapien nec. Porta non pulvinar neque laoreet suspendisse interdum. Enim blandit volutpat maecenas volutpat blandit aliquam. Suscipit adipiscing bibendum est ultricies integer quis auctor. Vestibulum lorem sed risus ultricies tristique nulla. Et odio pellentesque diam volutpat. Purus sit amet volutpat consequat mauris nunc. Pretium quam vulputate dignissim suspendisse in. Ut diam quam nulla porttitor massa id neque aliquam. Urna id volutpat lacus laoreet non curabitur gravida arcu. Tellus pellentesque eu tincidunt tortor aliquam. Vel pretium lectus quam id. Neque convallis a cras semper auctor. Mauris ultrices eros in cursus turpis massa tincidunt dui ut. Nunc sed augue lacus viverra vitae congue eu. Amet nisl purus in mollis. Viverra aliquet eget sit amet tellus cras adipiscing enim. Fermentum odio eu feugiat pretium. Molestie at elementum eu facilisis. Cras pulvinar mattis nunc sed. Adipiscing enim eu turpis egestas pretium. Sed turpis tincidunt id aliquet risus feugiat. Lectus magna fringilla urna porttitor rhoncus dolor. Sed enim ut sem viverra aliquet eget sit amet. Risus viverra adipiscing at in tellus integer feugiat. Sit amet facilisis magna etiam tempor orci. Interdum consectetur libero id faucibus nisl tincidunt eget nullam non. Penatibus et magnis dis parturient montes. Purus in mollis nunc sed id semper risus in. Quis auctor elit sed vulputate mi. Suscipit adipiscing bibendum est ultricies integer quis auctor elit. Cursus turpis massa tincidunt dui ut ornare. Risus feugiat in ante metus. Facilisis sed odio morbi quis. Mattis aliquam faucibus purus in massa tempor. Mauris commodo quis imperdiet massa tincidunt. Amet porttitor eget dolor morbi non arcu risus quis. Luctus accumsan tortor posuere ac ut consequat semper. Senectus et netus et malesuada. Tellus cras adipiscing enim eu turpis egestas pretium. Odio eu feugiat pretium nibh ipsum consequat. Commodo odio aenean sed adipiscing diam. At imperdiet dui accumsan sit. Laoreet suspendisse interdum consectetur libero id. In metus vulputate eu scelerisque. Cursus mattis molestie a iaculis at erat. Pellentesque id nibh tortor id aliquet lectus proin nibh. Non pulvinar neque laoreet suspendisse interdum consectetur libero id. Turpis egestas sed tempus urna et pharetra pharetra massa. Amet cursus sit amet dictum sit amet justo. Dui id ornare arcu odio. Morbi leo urna molestie at elementum eu facilisis sed odio. Id aliquet risus feugiat in ante metus. Porttitor rhoncus dolor purus non enim praesent elementum facilisis. Eros in cursus turpis massa tincidunt. Nec dui nunc mattis enim. Pellentesque habitant morbi tristique senectus. At ultrices mi tempus imperdiet nulla malesuada pellentesque elit. Sed nisi lacus sed viverra tellus in hac habitasse platea. Facilisis leo vel fringilla est ullamcorper. Commodo viverra maecenas accumsan lacus vel facilisis volutpat est. Quis risus sed vulputate odio ut. Sed odio morbi quis commodo odio. Adipiscing elit pellentesque habitant morbi tristique senectus. Quam pellentesque nec nam aliquam sem et tortor consequat. Iaculis eu non diam phasellus vestibulum. Varius quam quisque id diam vel quam elementum pulvinar. Consequat mauris nunc congue nisi vitae suscipit tellus mauris. Mi tempus imperdiet nulla malesuada pellentesque elit eget. Proin nibh nisl condimentum id venenatis a. Condimentum mattis pellentesque id nibh tortor id aliquet. Tellus in hac habitasse platea dictumst vestibulum rhoncus est. Commodo nulla facilisi nullam vehicula. Egestas pretium aenean pharetra magna ac placerat vestibulum lectus mauris. Facilisis mauris sit amet massa. Neque laoreet suspendisse interdum consectetur libero. Nunc scelerisque viverra mauris in aliquam sem. Et magnis dis parturient montes nascetur ridiculus mus mauris. Cras tincidunt lobortis feugiat vivamus at augue. Pellentesque habitant morbi tristique senectus et netus et malesuada fames. Volutpat est velit egestas dui id ornare arcu. Phasellus vestibulum lorem sed risus ultricies tristique nulla. Eget duis at tellus at urna condimentum. Dolor sit amet consectetur adipiscing elit ut aliquam. Egestas fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate. Eleifend mi in nulla posuere sollicitudin. Tellus cras adipiscing enim eu turpis. Ultrices tincidunt arcu non sodales neque sodales ut etiam. Elit pellentesque habitant morbi tristique senectus et netus. Risus sed vulputate odio ut. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper dignissim cras. Aliquam sem fringilla ut morbi tincidunt augue. Blandit libero volutpat sed cras ornare. Porttitor leo a diam sollicitudin tempor id eu nisl. Eget mi proin sed libero enim sed. Tempor orci eu lobortis elementum nibh tellus molestie nunc non. Odio ut enim blandit volutpat maecenas volutpat blandit. Sollicitudin nibh sit amet commodo nulla. Laoreet suspendisse interdum consectetur libero id faucibus. Aliquam nulla facilisi cras fermentum odio eu feugiat pretium nibh. Volutpat diam ut venenatis tellus in metus vulputate eu scelerisque. In hac habitasse platea dictumst quisque sagittis. Vel pretium lectus quam id leo in vitae turpis. Interdum consectetur libero id faucibus nisl tincidunt eget nullam non. Aliquam id diam maecenas ultricies mi eget mauris. Egestas dui id ornare arcu odio ut sem nulla. Vitae sapien pellentesque habitant morbi tristique senectus. Consectetur adipiscing elit duis tristique sollicitudin nibh sit amet commodo. Placerat in egestas erat imperdiet sed euismod nisi porta lorem. Risus sed vulputate odio ut. Vestibulum lorem sed risus ultricies tristique nulla aliquet enim. Bibendum at varius vel pharetra vel turpis. Accumsan in nisl nisi scelerisque eu ultrices vitae auctor. In nisl nisi scelerisque eu. Luctus venenatis lectus magna fringilla urna porttitor rhoncus dolor. Convallis convallis tellus id interdum velit laoreet. Amet est placerat in egestas erat imperdiet sed euismod. Eu ultrices vitae auctor eu augue ut lectus. Eleifend quam adipiscing vitae proin sagittis. Consectetur purus ut faucibus pulvinar elementum integer enim. Quam elementum pulvinar etiam non quam lacus suspendisse faucibus interdum. Viverra nam libero justo laoreet. Rutrum tellus pellentesque eu tincidunt. Arcu cursus vitae congue mauris rhoncus aenean vel elit. Accumsan sit amet nulla facilisi morbi. Lectus proin nibh nisl condimentum id venenatis a condimentum vitae. Lacinia quis vel eros donec ac odio tempor orci. Elementum eu facilisis sed odio morbi quis commodo.';
      const embed = new MessageEmbed({
        title: long,
        description: long,
        author: {name: long},
        footer: {text: long}
      });
      msg.channel.send(preventExceed(long));
      if (typeof embed != 'string')
        msg.channel.send(new MessageEmbed(preventExceed(embed)));
    }
  },
];
