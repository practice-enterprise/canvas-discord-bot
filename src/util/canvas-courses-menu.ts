import { ButtonInteraction, Client, CommandInteraction, Interaction, InteractionButtonOptions, Message, MessageActionRow, MessageButton, MessageEmbed, MessageReaction } from 'discord.js';
import { CanvasCourse, CanvasModule } from '../models/canvas';
import { CanvasService } from '../services/canvas-service';
import { EmbedBuilder } from './embed-builder';

export class MenuCourses {
  readonly buttonsNav: MessageButton[] = [
    new MessageButton({ style: 'SUCCESS', label: '< Prev', customId: 'prev' }),
    new MessageButton({ style: 'SUCCESS', label: 'Next >', customId: 'next' }),
    new MessageButton({ style: 'DANGER', label: 'Stop', customId: 'back' })
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
  readonly newMenu = 'newMenu'; //easy access for the reason to stop a collector reason when a new menu gets created from courses to modules
  readonly expireTime = 30000

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
  }

  async commandRes(): Promise<void> {
    if (!this.interaction.replied) {
      this.actionRowNav.components[0].disabled = true;
      if (this.courses.length / this.perPage > 1)
        this.actionRowNav.components[1].disabled = false;
      else
        this.actionRowNav.components[1].disabled = true;
      await this.interaction.reply({ components: [this.actionRowNav, this.actionRowSelect], embeds: [this.getCoursePage(this.page)] });
    }
  }

  coursesCollect(interactionButton?: ButtonInteraction): void {
    if (this.actionRowNav.components[2].type == 'BUTTON')
      this.actionRowNav.components[2].setLabel('Stop');
    if (interactionButton) {
      this.actionRowNav.components[0].disabled = true;
      if (this.courses.length / this.perPage > 1)
        this.actionRowNav.components[1].disabled = false;
      else
        this.actionRowNav.components[1].disabled = true;
      interactionButton.update({ components: [this.actionRowNav, this.actionRowSelect], embeds: [this.getCoursePage(this.page)] });
    }

    const filter = (i: ButtonInteraction) => this.buttonsNav.concat(this.buttonsSelect).map(i => i.customId).includes(i.customId) && i.user.id == this.interaction.user.id && i.message.interaction!.id == this.interaction.id;
    const collector = this.interaction.channel?.createMessageComponentCollector({ filter: filter, time: this.expireTime });
    let courseNr;
    if (!collector) return;

    collector.on('collect', async i => {
      this.actionRowNav.components[0].disabled = false;
      this.actionRowNav.components[1].disabled = false;
      collector.resetTimer();
      const oldPage = this.page;
      let disabled;
      switch (i.customId) {
        case this.buttonsNav[0].customId:
          if (this.page == 1) {
            this.actionRowNav.components[0].disabled = true;

          }
          this.page--;
          break;
        case this.buttonsNav[1].customId:
          this.page++;
          if (this.page >= (this.courses.length / this.perPage) - 1) {
            this.actionRowNav.components[1].disabled = true;
            disabled = ((this.courses.length / this.perPage) % 1) * this.perPage - .5;
            for (let i = this.perPage - 1; i > disabled; i--)
              this.actionRowSelect.components[i].disabled = true;
          }
          break;
        case this.buttonsNav[2].customId:
          collector.stop();
          break;
        default:
          !Number.isNaN(Number.parseInt(i.customId)) ? courseNr = this.perPage * this.page + Number.parseInt(i.customId) - 1 : courseNr = -1;
          if (courseNr <= this.courses.length && courseNr >= 0) {
            if (this.actionRowNav.components[2].type == 'BUTTON')
              this.actionRowNav.components[2].setLabel('Back');
            collector.stop(this.newMenu);
            this.modulesCollect(i, courseNr);
            return;
          }
          break;
      }
      if (oldPage !== this.page) { //Only edit if it's a different page.
        i.update({ components: [this.actionRowNav, this.actionRowSelect], embeds: [getCoursePage(this.courses, this.page, this.perPage, this.canvasUrl)] });
        if (disabled)
          for (let i = this.perPage - 1; i > disabled; i--) {
            this.actionRowSelect.components[i].disabled = false;
          }
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason != this.newMenu)
        this.end();
    });
  }

  async modulesCollect(interactionButton: ButtonInteraction, courseNr: number): Promise<void> {
    const modules = await CanvasService.getModules(interactionButton.user.id, this.courses[courseNr].id);
    if (modules === undefined) {
      interactionButton.update({ embeds: [new MessageEmbed({ title: 'no modules' })] });
      return;
    }

    const filter = (i: ButtonInteraction) => this.buttonsNav.concat(this.buttonsSelect).map(i => i.customId).includes(i.customId) && i.user.id == this.interaction.user.id && i.message.interaction!.id == this.interaction.id;
    const collector = this.interaction.channel?.createMessageComponentCollector({ filter: filter, time: this.expireTime });

    const modulesPage = (await getModulesPage(this.interaction.user.id,
      this.courses, modules, this.page = 0, this.perPage, courseNr, this.canvasUrl));
    if (!collector || !modulesPage) {
      return;
    }
    if (modules.length == 0) {
      this.actionRowNav.components[0].disabled = true;
      this.actionRowNav.components[1].disabled = true;
      interactionButton.update({components: [this.actionRowNav], embeds: [new MessageEmbed({ title: 'no modules' })] });
    } else {
      this.actionRowNav.components[0].disabled = true;
      if (modules.length / this.perPage > 1)
        this.actionRowNav.components[1].disabled = false;
      else
        this.actionRowNav.components[1].disabled = true;
      interactionButton.update({ components: [this.actionRowNav, this.actionRowSelect], embeds: [modulesPage] });
    }
    collector.on('collect', async (interaction) => {
      collector.resetTimer();
      this.actionRowNav.components[0].disabled = false;
      this.actionRowNav.components[1].disabled = false;
      let moduleNr;
      let disabled;
      const oldPage = this.page;
      switch (interaction.customId) {
        case this.buttonsNav[0].customId:
          if (this.page == 1) {
            this.actionRowNav.components[0].disabled = true;
          }
          this.page--;
          break;
        case this.buttonsNav[1].customId:
          this.page++;
          if (this.page >= (modules.length / this.perPage) - 1) {
            this.actionRowNav.components[1].disabled = true;
            disabled = ((modules.length / this.perPage) % 1) * this.perPage - .5;
            for (let i = this.perPage - 1; i > disabled; i--)
              this.actionRowSelect.components[i].disabled = true;        
          }
          break;
        case this.buttonsNav[2].customId:
          this.page = 0;
          this.coursesCollect(interaction);
          collector.stop(this.newMenu);
          return;

        default:
          !Number.isNaN(Number.parseInt(interaction.customId)) ? moduleNr = this.perPage * this.page + Number.parseInt(interaction.customId) - 1 : moduleNr = -1;
          if (courseNr <= this.courses.length && courseNr >= 0) {
            collector.stop(this.newMenu);
            this.page = 0;
            this.itemsCollect(interaction, modules, moduleNr, courseNr);
            return;
          }
      }

      if (oldPage !== this.page) { //Only edit if it's a different page.
        const modulePage = (await getModulesPage(this.interaction.user.id,
          this.courses, modules, this.page, this.perPage, courseNr, this.canvasUrl).catch(() => console.log('modules')));
        if (modulePage === undefined) return;
        interaction.update({components: [this.actionRowNav, this.actionRowSelect], embeds: [modulePage] });
        if (disabled)
          for (let i = this.perPage - 1; i > disabled; i--) {
            this.actionRowSelect.components[i].disabled = false;

          }
      }
    }
    );

    collector.on('end', (collected, reason) => {
      if (reason != this.newMenu)
        this.end();
    });

  }
  async end() {
    const message = (await this.interaction.fetchReply()).embeds[0] as MessageEmbed;
    message.setFooter('Command has expired');
    this.interaction.editReply({ components: [], embeds: [message] });
  }

  async itemsCollect(interactionButton: ButtonInteraction, modules: CanvasModule[], moduleNr: number, courseNr: number) {
    const itemPage = await getModulesPage(this.interaction.user.id, this.courses, modules, this.page, this.perPage, courseNr, this.canvasUrl, moduleNr);
    if (!itemPage) {
      return;
    }
    interactionButton.update({ components: [new MessageActionRow({ components: [this.buttonsNav[2]] })], embeds: [itemPage] });
    const filter = (i: ButtonInteraction) => this.buttonsNav.concat(this.buttonsSelect).map(i => i.customId).includes(i.customId) && i.user.id == this.interaction.user.id && i.message.interaction!.id == this.interaction.id;
    const collector = this.interaction.channel?.createMessageComponentCollector({ filter: filter, time: this.expireTime });
    if (!collector) {
      return;
    }
    collector.on('collect', interaction => {
      if (interaction.customId == this.buttonsNav[2].customId) {
        this.modulesCollect(interaction, courseNr);
        collector.stop(this.newMenu);
      }
    });
    collector.on('end', (collected, reason) => {
      if (reason != this.newMenu)
        this.end();
    });
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
    const moduleByID = modules[moduleNr];
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

