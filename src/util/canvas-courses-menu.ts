import { Client, Message, MessageEmbed } from 'discord.js';
import { CanvasCourse, CanvasModule } from '../models/canvas';
import { CanvasService } from '../services/canvas-service';

export class CoursesMenu {
  botmsg: Message;
  msg: Message;
  stopMsg = ':grey_exclamation: `Loading or session has ended.`';

  undefinedTokenEmbed: MessageEmbed = new MessageEmbed({
    color: 'F04747',
    title: ':warning: Can\'t fetch courses',
    description: 'If you\'re not logged in, please do so for this command to work.\nManual canvas tokens might not be valid anymore.',
    footer: { text: 'Error: invalid token' }
  });

  constructor(botmessage: Message, message: Message) {
    this.botmsg = botmessage;
    this.msg = message;
  }

  readonly eNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']; //.length needs to be equal to perPage
  readonly ePrev = '◀';
  readonly eNext = '▶';
  readonly eBack = '↩';
  readonly courseReactions = [this.ePrev].concat(this.eNumbers).concat(this.eNext);

  async coursesMenu(): Promise<void> {
    // Declarations
    let page = 0;
    const perPage = 5;
    let courseNr;

    const courses = await CanvasService.getCourses(this.msg.author.id);
    if (courses === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }

    const time = 60000; //=1 minute
    const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
      return this.eNumbers.concat(this.ePrev, this.eNext).includes(reaction.emoji.name) && user.id === this.msg.author.id;
    };

    // Logic
    this.botmsg.edit(''); // Clear collector end message
    this.botmsg.reactions.cache.get(this.eBack)?.remove().catch(err => console.error('Failed to remove emote: ', err));
    this.botmsg.edit(getCoursePage(courses, page, perPage));
    quickAddReactions(this.botmsg, this.botmsg.client, this.courseReactions);

    const collector = this.botmsg.createReactionCollector(filter, { time });

    collector.on('collect', async (reaction, user) => {
      collector.resetTimer(); //Reset timer everytime a reaction is used.

      reaction.users.remove(user.id);
      const oldPage = page;
      if (this.eNumbers.includes(reaction.emoji.name)) {
        courseNr = perPage * page + (this.eNumbers.indexOf(reaction.emoji.name) + 1);
        if (courseNr <= courses.length) {
          collector.stop();
          this.modulesMenu(courseNr);
        }
      }

      switch (reaction.emoji.name) {
      case this.ePrev:
        if (page > 0)
          page--;
        break;
      case this.eNext:
        if (page < (courses.length / perPage) - 1)
          page++;
        break;
      }

      if (oldPage !== page) { //Only edit if it's a different page.

        this.botmsg.edit(getCoursePage(courses, page, perPage));
      }
    });

    collector.on('end', (reaction, user) => {
      this.botmsg.edit(this.stopMsg);
    });
  }

  async modulesMenu(courseNr: number): Promise<void> {
    // Declarations
    let page = 0;
    const perPage = 5;
    let moduleNr;

    const moduleReactions = [this.ePrev].concat(this.eNumbers).concat(this.eNext).concat(this.eBack);

    const courses = await CanvasService.getCourses(this.msg.author.id);
    if (courses === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }
    const modules = await CanvasService.getModules(this.msg.author.id, courses[courseNr - 1].id);
    if (modules === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }

    const time = 60000; //=1 minute
    const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
      return moduleReactions.includes(reaction.emoji.name) && user.id === this.msg.author.id;
    };

    // Logic
    this.botmsg.edit(''); // Clear collector end message
    const modulePage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr);
    if (modulePage === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }
    this.botmsg.edit(modulePage);
    //quickAddReactions(botmsg, botmsg.client, moduleReactions);
    this.botmsg.react(this.eBack);

    const collector = this.botmsg.createReactionCollector(filter, { time });

    collector.on('collect', async (reaction, user) => {
      collector.resetTimer(); //Reset timer everytime a reaction is used.

      reaction.users.remove(user.id);
      const oldPage = page;

      if (this.eNumbers.includes(reaction.emoji.name)) {
        moduleNr = perPage * page + (this.eNumbers.indexOf(reaction.emoji.name) + 1);
        if (moduleNr <= modules.length) {
          collector.stop();
          this.itemMenu(courseNr, moduleNr);
        }
      }

      switch (reaction.emoji.name) {
      case this.ePrev:
        if (page > 0)
          page--;
        break;
      case this.eNext:
        if (page < (modules.length / perPage) - 1)
          page++;
        break;
      case this.eBack:
        collector.stop();
        this.coursesMenu();
      }

      if (oldPage !== page) { //Only edit if it's a different page.
        const modulePage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr);
        if (modulePage === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }
        this.botmsg.edit(modulePage);
      }
    });

    collector.on('end', (reaction, user) => {
      this.botmsg.edit(this.stopMsg);
    });
  }

  async itemMenu(courseNr: number, moduleNr: number): Promise<void> {
    // Declarations
    let page = 0;
    const perPage = 5;

    // const ePrev = '◀';
    // const eNext = '▶';
    // const eBack = '↩';

    const itemReactions = [this.ePrev].concat(this.eNext).concat(this.eBack);

    const courses = await CanvasService.getCourses(this.msg.author.id);
    if (courses === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }
    const modules = await CanvasService.getModules(this.msg.author.id, courses[courseNr - 1].id);
    if (modules === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }

    const time = 60000; //=1 minute
    const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
      return itemReactions.includes(reaction.emoji.name) && user.id === this.msg.author.id;
    };

    // Logic
    this.botmsg.edit(''); // Clear collector end message
    const itemPage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr, moduleNr);
    if (itemPage === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }
    this.botmsg.edit(itemPage);
    //quickAddReactions(botmsg, botmsg.client, itemReactions);
    this.botmsg.react(this.eBack);

    const collector = this.botmsg.createReactionCollector(filter, { time });

    collector.on('collect', async (reaction, user) => {
      collector.resetTimer(); //Reset timer everytime a reaction is used.

      reaction.users.remove(user.id);
      const oldPage = page;

      switch (reaction.emoji.name) {
      case this.ePrev:
        if (page > 0)
          page--;
        break;
      case this.eNext:
        // TODO length of items
        if (page < (modules[moduleNr].items_count / perPage) - 1)
          page++;
        break;
      case this.eBack:
        collector.stop();
        this.modulesMenu(courseNr);
      }

      if (oldPage !== page) { //Only edit if it's a different page.
        const itemPage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr, moduleNr);
        if (itemPage === undefined) { this.botmsg.edit(''); this.botmsg.edit(this.undefinedTokenEmbed); return; }
        this.botmsg.edit(itemPage);
      }
    });

    collector.on('end', (reaction, user) => {
      this.botmsg.edit(this.stopMsg);
    });
  }


}

// To-do: move
async function quickAddReactions(msg: Message, client: Client, emotes: string[], delay?: number): Promise<void> {
  try {
    /*
    Temporarily changes the rate limit -> add emotes quickly.
    10 ms is extremely low, reset is necessary. (Default is 500 ms)
    */
    if (delay === undefined)
      delay = 10;

    const TimeOffset = msg.client.options.restTimeOffset;
    client.options.restTimeOffset = delay;

    // Adding emotes
    for (const e of emotes) {
      await msg.react(e);
    }

    // Resetting to default time offset for ratelimit
    client.options.restTimeOffset = TimeOffset;
  } catch (err) {
    console.error('One or more reactions failed.');
  }
}

function getCoursePage(courses: CanvasCourse[], page: number, perPage: number): MessageEmbed {
  const embed: MessageEmbed = new MessageEmbed({
    'title': 'All your courses!',
    'description': '`Nr` Course name',
    'color': 'EF4A25', //Canvas color pallete
    'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' },
    'footer': { text: `Page ${page + 1}` }
  });

  let count = 0;
  for (let i = page * perPage; i < (page + 1) * perPage && i < courses.length; i++) {
    embed.setDescription(
      embed.description + `\n\`${++count}.\` [${courses[i].name}](${process.env.CANVAS_URL}/courses/${courses[i].id}) `
    );
  }
  embed.footer = { text: `Page ${page + 1}` };

  return embed;
}

async function getModulesPage(discordUserID: string, courses: CanvasCourse[], modules: CanvasModule[], page: number, perPage: number, courseNr: number, moduleNr?: number): Promise<MessageEmbed | undefined> {
  const courseID = courses[courseNr - 1].id;
  const courseName = courses[courseNr - 1].name;
  let count = 0;

  if (typeof moduleNr === 'undefined') { //All modules of course
    const embed: MessageEmbed = new MessageEmbed({
      'title': `Modules for ${courseName}`,
      'description': '`Nr` Module name',
      'color': 'EF4A25', //Canvas color pallete
      'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' },
      'footer': { text: 'Use !modules ' + courseNr.toString() + ' <Nr> for items in a module' }
    });

    for (let i = page * perPage; i < (page + 1) * perPage && i < modules.length; i++) {
      embed.setDescription(
        embed.description + `\n\`${++count}.\` [${modules[i].name}](${process.env.CANVAS_URL}/courses/${courseID}/modules)`
      );
    }
    embed.footer = { text: `Page ${page + 1}` };

    return embed;
  }
  else {
    const moduleByID = modules[moduleNr - 1];
    const items = await CanvasService.getModuleItems(discordUserID, moduleByID.items_url);
    if (items === undefined) {
      return undefined;
    }
    const embed: MessageEmbed = new MessageEmbed({
      'title': 'Module ' + moduleByID.name,
      'description': items.map(i => `[${i.title}](${i.html_url})`).join('\n'),
      'color': 'EF4A25',
      'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' }
    });

    return embed;
  }
}

