import { ButtonInteraction, CommandInteraction, GuildMember, MessageActionRow, MessageButton, MessageEmbed, User } from 'discord.js';
import { Colors } from './util/embed-builder';

export class Buzzer {
  interaction: CommandInteraction
  readonly expireTime = 60000*5
  usersBuzzed: GuildMember[] = [];
  
  //Buzzer
  readonly buttonBuzzer = [
    new MessageButton({ label: 'Buzz', customId: 'buzz', style: 'DANGER', emoji: '🐝', disabled: true }),
  ];

  //Start Pauze Reset
  readonly buttonsBuzzerControls = [
    new MessageButton({ label: 'Start', customId: 'start', style: 'SUCCESS'}),
    new MessageButton({ label: 'Pauze', customId: 'pauze', style: 'PRIMARY'}),
    new MessageButton({ label: 'Reset', customId: 'reset', style: 'DANGER'}),
  ];

  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
  }

  init(): void {
    this.interaction.reply({embeds: [this.createEmbed(Colors.warning, 'Buzzer hasn\'t started yet')],
      components: [new MessageActionRow({components: this.buttonBuzzer}), new MessageActionRow({components: this.buttonsBuzzerControls})]});

    const buzzFilter = (i: ButtonInteraction) => this.buttonBuzzer
      .map(i => i.customId).includes(i.customId)
      // && i.user.id == player.id
      && i.message.interaction!.id == this.interaction.id;
    
    const buzzerControlFilter = (i: ButtonInteraction) => this.buttonsBuzzerControls
      .map(i => i.customId).includes(i.customId)
      && i.user.id == this.interaction.user.id
      && i.message.interaction!.id == this.interaction.id;

    const buzzCollector = this.interaction.channel?.createMessageComponentCollector({ filter: buzzFilter, time: this.expireTime });
    const controlCollector = this.interaction.channel?.createMessageComponentCollector({ filter: buzzerControlFilter, time: this.expireTime });

    if (!buzzCollector) return;
    if (!controlCollector) return;
    
    // Collectors
    buzzCollector.on('collect', i => {
      buzzCollector.resetTimer();
      controlCollector.resetTimer();
      
      if (this.buttonBuzzer[0].disabled) return;
      if (!(i.member instanceof GuildMember)) return;

      if (!this.usersBuzzed.includes(i.member)) {
        this.usersBuzzed.push(i.member);
      }

      this.updateButtonInteraction(i, Colors.success, i.member.displayName + ' buzzed!');
    });

    controlCollector.on('collect', i => {
      buzzCollector.resetTimer();
      controlCollector.resetTimer();

      switch (i.customId) {
        case this.buttonsBuzzerControls[0].customId: // start
          this.buttonBuzzer[0].setDisabled(false);
          this.updateButtonInteraction(i, Colors.success, 'Buzzer started!');
          break;
        case this.buttonsBuzzerControls[1].customId: // pauze
          this.buttonBuzzer[0].setDisabled(true);
          this.updateButtonInteraction(i, Colors.warning, 'Buzzer pauzed');
          break;
        case this.buttonsBuzzerControls[2].customId: // reset
          this.buttonBuzzer[0].setDisabled(true);
          this.usersBuzzed = []; // Empty users
          this.updateButtonInteraction(i, Colors.warning, 'Buzzer reset');
          break;
      }
    });

    // End of collectors
    buzzCollector.on('end', () => this.endInteraction());
    controlCollector.on('end', () => this.endInteraction());
  }
  
  createEmbed(color: Colors, footer: string): MessageEmbed {
    const userList: string[] = this.usersBuzzed.map((u, i) => `${++i}. ${u.displayName}`);
    if (userList.length > 0) {
      userList[0] = '**' + userList[0] + '**';
    }
    const embed = new MessageEmbed()
      .setTitle('🅱uzzer')
      .setDescription(userList.join('\n'))
      .setFooter(footer)
      .setColor(color);
    return embed;
  }

  updateButtonInteraction(i: ButtonInteraction, color: Colors, footer: string): void {
    i.update({embeds: [this.createEmbed(color, footer)],
      components: [new MessageActionRow({components: this.buttonBuzzer}), new MessageActionRow({components: this.buttonsBuzzerControls})]});
  }

  endInteraction(): void {
    this.interaction.editReply({embeds: [
      this.createEmbed(Colors.warning, 'Buzzer has timed out, you can always start a new one').setTitle('No more 🅱uzz 🐝')
    ], components: []});
  }
}

export class Challenge {
  interaction: CommandInteraction
  readonly challengeName: string
  readonly expireTime = 60000

  constructor(interaction: CommandInteraction, challengeName: string) {
    this.challengeName = challengeName;
    this.interaction = interaction;
  }

  /**Will call callback when accepted */
  init(callback: () => any): void {
    const buttonsChallenge = [
      new MessageButton({ label: 'Accept', customId: 'accept', style: 'SUCCESS' }),
      new MessageButton({ label: 'Decline', customId: 'decline', style: 'DANGER' })
    ];
    const actionRowChallenge = new MessageActionRow({
      components: buttonsChallenge
    });

    // Player being challenged may accept or decline
    const player = this.interaction.options.getUser('player', true);
    const filter = (i: ButtonInteraction) => buttonsChallenge
      .map(i => i.customId).includes(i.customId)
      && i.user.id == player.id
      && i.message.interaction!.id == this.interaction.id;
    const collector = this.interaction.channel?.createMessageComponentCollector({ filter: filter, time: this.expireTime });

    this.interaction.reply({
      content: `<@!${player.id}>`,
      embeds:[new MessageEmbed()
        .setTitle(`${player.username} has been challenged by ${this.interaction.user.username}`)
        .setDescription(`${this.interaction.user.username} has you challenged you for \`${this.challengeName}\`.\nWill you accept this challenge?`)
        .setColor(Colors.success)
      ], components: [actionRowChallenge]});
    

    if (!collector) return;
    collector.on('collect', i => {
      switch(i.customId) {
        case buttonsChallenge[0].customId:
          collector.stop('accept');
          callback();
          break;
        case buttonsChallenge[1].customId:
          collector.stop('decline');
          break;
      }
    });

    collector.on('end', (collected, reason) => {
      const embed = new MessageEmbed();
      if (reason == 'accept') {
        return;
      }
      if (reason == 'decline') {
        embed
          .setTitle(`${player.username} was too afraid to accept this challenge!`)
          .setColor(Colors.error);
        this.interaction.editReply({embeds: [embed], components: []});
      }
      else {
        embed
          .setTitle(`${player.username} was too scared or slow to respond to this challenge.`)
          .setColor(Colors.warning);
        this.interaction.editReply({embeds: [embed], components: [
          new MessageActionRow({components: actionRowChallenge.components.map(i => i.setDisabled(true))})
        ]});
      }
    });
  }
}

export class RockPaperScissors {
  challenge: Challenge
  interaction: CommandInteraction
  readonly expireTime = 60000
  
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
    this.challenge = new Challenge(this.interaction, 'Rock Paper Scissors');
  
    this.challenge.init(() => this.rps(3));
  }

  async rps(bestOf: number): Promise<void> {
    const players: [User, User] = [this.interaction.user, this.interaction.options.getUser('player', true)];
    let score: [number, number] = [0, 0];
    let status: [string, string] = ['has not picked', 'has not picked'];
    let guess: [string, string];
    
    const buttonsRps = [
      new MessageButton({ label: 'Rock', customId: 'rock', emoji: '🪨', style: 'PRIMARY' }),
      new MessageButton({ label: 'Paper', customId: 'paper', emoji: '📝', style: 'PRIMARY' }),
      new MessageButton({ label: 'Scissors', customId: 'scissors', emoji: '✂️', style: 'PRIMARY' })
    ];
    const actionRowRps = new MessageActionRow({
      components: buttonsRps
    });

    this.interaction.editReply({embeds: [this.buildEmbed(players, status, score)], components: [actionRowRps]});
    const filter = (i: ButtonInteraction) => buttonsRps
      .map(i => i.customId).includes(i.customId)
      && (i.user.id == players[0].id || i.user.id == players[1].id)
      && i.message.interaction!.id == this.interaction.id;

    const collector = this.interaction.channel?.createMessageComponentCollector({ filter: filter, time: this.expireTime });
    if (collector == null) return;
    collector.on('collect', async i => {
      // switch i.customId {
      //   case buttonsRps[0].customId:
          
      // }
    });
  }

  buildEmbed(players: [User, User], status: [string, string], score: [number, number]): MessageEmbed{
    const embed = new MessageEmbed()
      .setTitle('Rock paper scissors')
      .setDescription(players.map((u, i) => `${u.username} ${status[i]}`).join('\n'))
      .addField(`${players[0].username} - ${players[1].username}`, `${score[0]} - ${score[1]}`);
    return embed;
  }
}

export class DiceRoll {
  roll(amount: number, faces: number): MessageEmbed {
    const embed = new MessageEmbed;
    const dice = [];
    for (let i = 0; i < amount; i++) {
      dice.push(Math.floor(Math.random() * faces + 1));
    }

    if (amount === 1) {
      embed.setTitle(`:game_die: 1d${faces}`)
        .setDescription(`You rolled a ${dice[0]}.`)
        .setColor(Colors.error);
    }
    else {
      embed.setTitle(`${amount}d${faces} :game_die:`)
        .setDescription(`You rolled: ${dice.join(' + ')}\nTotal: ${dice.reduce((p, c) => p + c, 0)}`)
        .setColor(Colors.error);
    }
    return embed;
  }
}

export class Coinflip {
  flip(side?: number | null): MessageEmbed {
    const flip = Math.round(Math.random());
    const embed = new MessageEmbed({
      color: Colors.warning
    }).setTitle(flip ? ':coin: Heads!' : ':coin: Tails!');

    if (side != null)
      flip == side ? (embed.setDescription('You\'ve won! :tada:')) : (embed.setDescription('You\'ve lost...'));

    return embed;
  }
}
