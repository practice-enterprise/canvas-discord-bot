import { ButtonInteraction, Client, CommandInteraction, Interaction, InteractionButtonOptions, Message, MessageActionRow, MessageButton, MessageEmbed, MessageReaction } from 'discord.js';
import { CanvasCourse, CanvasModule } from '../models/canvas';
import { CanvasService } from '../services/canvas-service';
import { EmbedBuilder } from './embed-builder';

export class MenuCourses {
  readonly buttonsNav: MessageButton[] = [
    new MessageButton({ style: 'PRIMARY', label: 'prev', customId: 'prev' }),
    new MessageButton({ style: 'PRIMARY', label: 'next', customId: 'next' }),
    new MessageButton({ style: 'PRIMARY', label: 'back', customId: 'back' })
  ];
  readonly buttonsSelect: MessageButton[] = [
    new MessageButton({ style: 'PRIMARY', label: '1', customId: '1' }),
    new MessageButton({ style: 'PRIMARY', label: '2', customId: '2' }),
    new MessageButton({ style: 'PRIMARY', label: '3', customId: '3' }),
    new MessageButton({ style: 'PRIMARY', label: '4', customId: '4' }),
    new MessageButton({ style: 'PRIMARY', label: '5', customId: '5' }),
  ];

  readonly actionRowNav = new MessageActionRow({ components: this.buttonsNav });
  readonly actionRowSelect = new MessageActionRow({ components: this.buttonsSelect });
  readonly newMenu = 'newMenu'; //easy access for the reason to stop a collector
  interaction: CommandInteraction;
  courses: CanvasCourse[];
  perPage = this.buttonsSelect.length;
  canvasUrl: string;
  page = 0;
  constructor(interaction: CommandInteraction, courses: CanvasCourse[], canvasUrl: string) {
    this.interaction = interaction;
    this.courses = courses;
    this.canvasUrl = canvasUrl;
    this.commandRes();
    this.coursesCollect();
    //await interaction.reply({ components: [this.actionRowNav, this.actionRowSelect], embeds: [getCoursePage(courses, page, perPage, canvasUrl)] });
  }

  async commandRes(): Promise<void> {
    if (!this.interaction.replied)
      await this.interaction.reply({ components: [this.actionRowNav, this.actionRowSelect], embeds: [this.getCoursePage(this.page)] });

  }

  getCoursePage(page: number): MessageEmbed {
    const embed: MessageEmbed = new MessageEmbed({
      'title': 'All your courses!',
      'description': '`Nr` Course name',
      'color': '#EF4A25', //Canvas color pallete
      'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' },
      'footer': { text: `Page ${page + 1}` }
    });

    let count = 0;
    for (let i = page * this.perPage; i < (page + 1) * this.perPage && i < this.courses.length; i++) {
      embed.setDescription(
        embed.description + `\n\`${++count}.\` [${this.courses[i].name}](${this.canvasUrl}/courses/${this.courses[i].id}) `
      );
    }
    embed.footer = { text: `Page ${page + 1}` };

    return embed;
  }
  coursesCollect(interactionButton?: ButtonInteraction): void {
    if (interactionButton) {
      interactionButton.update({ embeds: [this.getCoursePage(this.page)] });
    }

    const filter = (i: ButtonInteraction) => this.buttonsNav.concat(this.buttonsSelect).map(i => i.customId).includes(i.customId) && i.user.id == this.interaction.user.id && i.message.interaction!.id == this.interaction.id;
    const collector = this.interaction.channel?.createMessageComponentCollector({ filter: filter, time: 15000 });
    let courseNr;
    if (!collector) return;
    collector.on('collect', async i => {
      const oldPage = this.page;
      switch (i.customId) {
      case this.buttonsNav[0].customId:
        if (this.page > 0)
          this.page--;
        break;
      case this.buttonsNav[1].customId:
        if (this.page < (this.courses.length / this.perPage) - 1)
          this.page++;
        break;
      default:
        !Number.isNaN(Number.parseInt(i.customId)) ? courseNr = this.perPage * this.page + Number.parseInt(i.customId) - 1 : courseNr = -1;
        console.log(courseNr);
        if (courseNr <= this.courses.length && courseNr >= 0) {
          collector.stop(this.newMenu);
          this.modulesCollect(i, courseNr);
          console.log('activate modules');
          return;
        }
        break;
      }
      if (oldPage !== this.page) { //Only edit if it's a different page.
        console.log('edit');
        console.log(oldPage);
        console.log(this.page);
        i.update({ embeds: [getCoursePage(this.courses, this.page, this.perPage, this.canvasUrl)] });
        console.log(i);
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason != this.newMenu)
        this.end();
    });
  }

  async modulesCollect(interactionButton: ButtonInteraction, courseNr: number) {
    const modules = await CanvasService.getModules(interactionButton.user.id, this.courses[courseNr].id);
    if (modules === undefined) {
      interactionButton.update({ embeds: [new MessageEmbed({ title: 'no modules' })] });
      return;
    }

    const filter = (i: ButtonInteraction) => this.buttonsNav.concat(this.buttonsSelect).map(i => i.customId).includes(i.customId) && i.user.id == this.interaction.user.id && i.message.interaction!.id == this.interaction.id;
    const collector = this.interaction.channel?.createMessageComponentCollector({ filter: filter, time: 15000 });

    const modulesPage = (await getModulesPage(this.interaction.user.id,
      this.courses, modules, this.page = 0, this.perPage, courseNr, this.canvasUrl));
    if (!collector || !modulesPage) {
      return;
    }
    interactionButton.update({ embeds: [modulesPage] });

    collector.on('collect', async (interaction) => {
      console.log(interaction.message.interaction!.id);
      console.log();

      const oldPage = this.page;
      switch (interaction.customId) {
      case this.buttonsNav[0].customId:
        if (this.page > 0)
          this.page--;
        break;
      case this.buttonsNav[1].customId:
        // TODO length of items
        if (this.page < (modules.length / this.perPage) - 1)
          this.page++;
        break;
      case this.buttonsNav[2].customId:
        this.coursesCollect(interaction);
        collector.stop(this.newMenu);
        return;

        /*default:
          (await getModulesPage(this.interaction.user.id, 
            this.courses, modules, this.page, this.perPage, courseNr, this.canvasUrl));
          if (!modulesPage) {
            return;
          }*/
      }

      if (oldPage !== this.page) { //Only edit if it's a different page.
        const modulePage = (await getModulesPage(this.interaction.user.id,
          this.courses, modules, this.page, this.perPage, courseNr, this.canvasUrl).catch(() => console.log('modules')));
        if (modulePage === undefined) return;
        interaction.update({ embeds: [modulePage] });
      }
    }
    );

    collector.on('end', (collected, reason) => {
      console.log(reason);
      if (reason != this.newMenu)
        this.end();
    });

  }
  async end() {
    console.log(this.interaction.deferred);
    const message = (await this.interaction.fetchReply()).embeds[0] as MessageEmbed;
    message.setFooter(`${message.footer?.text}. Command has expired!`);
    this.interaction.editReply({ components: [], embeds: [message] });
  }

}

export class CoursesMenu {
  canvasUrl: string;
  botmsg: Message;
  msg: Message;
  stopMsg = ':grey_exclamation: `Loading or session has ended.`';

  undefinedTokenEmbed: MessageEmbed = new MessageEmbed({
    color: '#F04747',
    title: ':warning: Can\'t fetch courses',
    description: 'If you\'re not logged in, please do so for this command to work.\nManual canvas tokens might not be valid anymore.',
    footer: { text: 'Error: invalid token' }
  });

  constructor(botmessage: Message, message: Message, canvasUrl: string) {
    this.botmsg = botmessage;
    this.msg = message;
    this.canvasUrl = canvasUrl;
  }

  readonly eNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']; //.length needs to be equal to perPage
  readonly ePrev = '◀';
  readonly eNext = '▶';
  readonly eBack = '↩';
  readonly courseReactions = [this.ePrev].concat(this.eNumbers).concat(this.eNext);

  async modulesMenu(courseNr: number): Promise<void> {
    // Declarations
    let page = 0;
    const perPage = 5;
    let moduleNr;

    const moduleReactions = [this.ePrev].concat(this.eNumbers).concat(this.eNext).concat(this.eBack);

    const courses = await CanvasService.getCourses(this.msg.author.id);
    if (courses === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }
    const modules = await CanvasService.getModules(this.msg.author.id, courses[courseNr - 1].id);
    if (modules === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }

    const time = 60000; //=1 minute
    const filter = (reaction: MessageReaction, user: { id: string; }) => {
      if (!reaction.emoji.name)
        return false;
      return moduleReactions.includes(reaction.emoji.name) && user.id === this.msg.author.id;
    };

    // Logic
    this.botmsg.edit(''); // Clear collector end message
    const modulePage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr, this.canvasUrl);
    if (modulePage === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }
    //this.botmsg.edit({ embeds: [z] });
    //quickAddReactions(botmsg, botmsg.client, moduleReactions);
    this.botmsg.react(this.eBack);

    const collector = this.botmsg.createReactionCollector({ filter: filter, time: time });

    collector.on('collect', async (reaction, user) => {
      if (!reaction.emoji.name)
        return;
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
        //this.coursesMenu();
      }

      if (oldPage !== page) { //Only edit if it's a different page.
        const modulePage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr, this.canvasUrl);
        if (modulePage === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }
        this.botmsg.edit({ embeds: [modulePage] });
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
    if (courses === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }
    const modules = await CanvasService.getModules(this.msg.author.id, courses[courseNr - 1].id);
    if (modules === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }

    const time = 60000; //=1 minute
    const filter = (reaction: MessageReaction, user: { id: string; }) => {
      if (!reaction.emoji.name)
        return false;
      return itemReactions.includes(reaction.emoji.name) && user.id === this.msg.author.id;
    };

    // Logic
    this.botmsg.edit(''); // Clear collector end message
    const itemPage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr, this.canvasUrl, moduleNr);
    if (itemPage === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }
    this.botmsg.edit({ embeds: [itemPage] });
    //quickAddReactions(botmsg, botmsg.client, itemReactions);
    this.botmsg.react(this.eBack);

    const collector = this.botmsg.createReactionCollector({ filter: filter, time: time });

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
        const itemPage = await getModulesPage(this.msg.author.id, courses, modules, page, perPage, courseNr, this.canvasUrl, moduleNr);
        if (itemPage === undefined) { this.botmsg.edit(''); this.botmsg.edit({ embeds: [this.undefinedTokenEmbed] }); return; }
        this.botmsg.edit({ embeds: [itemPage] });
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

export function getCoursePage(courses: CanvasCourse[], page: number, perPage: number, canvasUrl: string): MessageEmbed {
  const embed: MessageEmbed = new MessageEmbed({
    'title': 'All your courses!',
    'description': '`Nr` Course name',
    'color': '#EF4A25', //Canvas color pallete
    'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' },
    'footer': { text: `Page ${page + 1}` }
  });

  let count = 0;
  for (let i = page * perPage; i < (page + 1) * perPage && i < courses.length; i++) {
    embed.setDescription(
      embed.description + `\n\`${++count}.\` [${courses[i].name}](${canvasUrl}/courses/${courses[i].id}) `
    );
  }
  embed.footer = { text: `Page ${page + 1}` };

  return embed;
}

async function getModulesPage(discordUserID: string, courses: CanvasCourse[], modules: CanvasModule[], page: number, perPage: number, courseNr: number, canvasUrl: string, moduleNr?: number): Promise<MessageEmbed | undefined> {
  const courseID = courses[courseNr].id;
  const courseName = courses[courseNr].name;
  let count = 0;

  if (typeof moduleNr === 'undefined') { //All modules of course
    const embed: MessageEmbed = new MessageEmbed({
      'title': `Modules for ${courseName}`,
      'description': '`Nr` Module name',
      'color': '#EF4A25', //Canvas color pallete
      'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' },
      'footer': { text: 'Use !modules ' + courseNr.toString() + ' <Nr> for items in a module' }
    });

    for (let i = page * perPage; i < (page + 1) * perPage && i < modules.length; i++) {
      embed.setDescription(
        embed.description + `\n\`${++count}.\` [${modules[i].name}](${canvasUrl}/courses/${courseID}/modules#context_module_${modules[i].id})`
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
      'color': '#EF4A25',
      'thumbnail': { url: 'https://pbs.twimg.com/profile_images/1132832989841428481/0Ei3pZ4d_400x400.png' }
    });

    return embed;
  }
}

