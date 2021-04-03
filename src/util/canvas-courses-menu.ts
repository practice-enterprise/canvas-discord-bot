import { Client, Message, MessageEmbed } from 'discord.js';
import { CanvasCourse, CanvasModule } from '../models/canvas';
import { CanvasService } from '../services/canvas-service';
import { Logger } from './logger';

export class CoursesMenu {
  static eNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']; //.length needs to be equal to perPage
  static ePrev = '◀';
  static eNext = '▶';
  static eBack = '↩';
  static courseReactions = [CoursesMenu.ePrev].concat(CoursesMenu.eNumbers).concat(CoursesMenu.eNext);
  
  static async coursesMenu(botmsg: Message, msg: Message, token: string): Promise<void> {
    // Declarations
    let page = 0;
    const perPage = 5;
  
    let courseNr;
  
    const courses = await CanvasService.getCourses(token);
    
    const time = 60000; //=1 minute
    const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
      return this.eNumbers.concat(this.ePrev, this.eNext).includes(reaction.emoji.name) && user.id === msg.author.id;
    };
    
    // Logic
    botmsg.edit(''); // Clear collector end message
    botmsg.reactions.cache.get(this.eBack)?.remove().catch(err => console.error('Failed to remove emote: ', err));
    botmsg.edit(getCoursePage(courses, page, perPage));
    quickAddReactions(botmsg, botmsg.client, this.courseReactions);
  
    const collector = botmsg.createReactionCollector(filter, { time });
  
    collector.on('collect', async (reaction, user) => {
      collector.resetTimer(); //Reset timer everytime a reaction is used.
  
      reaction.users.remove(user.id);
      const oldPage = page;
  
      Logger.debug('course: ', reaction.emoji.name);
  
      if (this.eNumbers.includes(reaction.emoji.name)) {
        courseNr = perPage * page + (this.eNumbers.indexOf(reaction.emoji.name) + 1);
        if (courseNr <= courses.length) {
          collector.stop();
          Logger.debug('CourseNr: ', courseNr);
          modulesMenu(botmsg, msg, token, courseNr);
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
  
        botmsg.edit(getCoursePage(courses, page, perPage));
      }
    });
  
    collector.on('end', (reaction, user) => {
      botmsg.edit(':grey_exclamation: `Loading or session has ended.`');
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

async function getModulesPage(token: string, courses: CanvasCourse[], modules: CanvasModule[], page: number, perPage: number, courseNr: number, moduleNr?: number): Promise<MessageEmbed> {
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

    const items = await CanvasService.getModuleItems(token, moduleByID.items_url);

    const embed: MessageEmbed = new MessageEmbed({
      'title': 'Module ' + moduleByID.name,
      'description': items.map(i => `[${i.title}](${i.html_url})`).join('\n'),
      'color': 'EF4A25', //Canvas color pallete
      'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' }
    });

    return embed;
  }
}

async function modulesMenu(botmsg: Message, msg: Message, token: string, courseNr: number): Promise<void> {
  // Declarations
  let page = 0;
  const perPage = 5;

  let moduleNr;

  const eNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']; //.length needs to be equal to perPage
  const ePrev = '◀';
  const eNext = '▶';
  const eBack = '↩';

  const moduleReactions = [ePrev].concat(eNumbers).concat(eNext).concat(eBack);

  const courses = await CanvasService.getCourses(token);
  const modules = await CanvasService.getModules(token, courses[courseNr - 1].id);

  const time = 60000; //=1 minute
  const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
    return moduleReactions.includes(reaction.emoji.name) && user.id === msg.author.id;
  };

  // Logic
  botmsg.edit(''); // Clear collector end message
  botmsg.edit(await getModulesPage(token, courses, modules, page, perPage, courseNr));
  //quickAddReactions(botmsg, botmsg.client, moduleReactions);
  botmsg.react(eBack);

  const collector = botmsg.createReactionCollector(filter, { time });

  collector.on('collect', async (reaction, user) => {
    Logger.debug('module: ', reaction.emoji.name);

    collector.resetTimer(); //Reset timer everytime a reaction is used.

    reaction.users.remove(user.id);
    const oldPage = page;

    Logger.debug(reaction.emoji.name);

    if (eNumbers.includes(reaction.emoji.name)) {
      moduleNr = perPage * page + (eNumbers.indexOf(reaction.emoji.name) + 1);
      if (moduleNr <= modules.length) {
        collector.stop();
        itemMenu(botmsg, msg, token, courseNr, moduleNr);
      }
    }

    switch (reaction.emoji.name) {
    case ePrev:
      if (page > 0)
        page--;
      break;
    case eNext:
      if (page < (courses.length / perPage) - 1)
        page++;
      break;
    case eBack:
      collector.stop();
      CoursesMenu.coursesMenu(botmsg, msg, token);
    }

    if (oldPage !== page) { //Only edit if it's a different page.
      botmsg.edit(await getModulesPage(token, courses, modules, page, perPage, courseNr));
    }
  });

  collector.on('end', (reaction, user) => {
    botmsg.edit(':grey_exclamation: `Loading or session has ended.`');
  });
}

async function itemMenu(botmsg: Message, msg: Message, token: string, courseNr: number, mooduleNr: number): Promise<void> {
  // Declarations
  let page = 0;
  const perPage = 5;

  const ePrev = '◀';
  const eNext = '▶';
  const eBack = '↩';

  const itemReactions = [ePrev].concat(eNext).concat(eBack);

  const courses = await CanvasService.getCourses(token);
  const modules = await CanvasService.getModules(token, courses[courseNr - 1].id);

  const time = 60000; //=1 minute
  const filter = (reaction: { emoji: { name: string; }; }, user: { id: string; }) => {
    return itemReactions.includes(reaction.emoji.name) && user.id === msg.author.id;
  };

  // Logic
  botmsg.edit(''); // Clear collector end message
  botmsg.edit(await getModulesPage(token, courses, modules, page, perPage, courseNr, mooduleNr));
  //quickAddReactions(botmsg, botmsg.client, itemReactions);
  botmsg.react(eBack);

  const collector = botmsg.createReactionCollector(filter, { time });

  collector.on('collect', async (reaction, user) => {
    Logger.debug('module: ', reaction.emoji.name);

    collector.resetTimer(); //Reset timer everytime a reaction is used.

    reaction.users.remove(user.id);
    const oldPage = page;

    Logger.debug(reaction.emoji.name);

    switch (reaction.emoji.name) {
    case ePrev:
      if (page > 0)
        page--;
      break;
    case eNext:
      if (page < (courses.length / perPage) - 1)
        page++;
      break;
    case eBack:
      collector.stop();
      modulesMenu(botmsg, msg, token, courseNr);
    }

    Logger.debug(page);

    if (oldPage !== page) { //Only edit if it's a different page.
      botmsg.edit(await getModulesPage(token, courses, modules, page, perPage, courseNr, mooduleNr));
    }
  });

  collector.on('end', (reaction, user) => {
    botmsg.edit(':grey_exclamation: `Loading or session has ended.`');
  });
}
