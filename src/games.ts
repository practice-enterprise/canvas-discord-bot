import { ButtonInteraction, Client, CommandInteraction, Interaction, InteractionButtonOptions, Message, MessageActionRow, MessageButton, MessageEmbed, MessageReaction, User } from 'discord.js';
import { Command } from "./models/command";
import { Colors } from "./util/embed-builder";

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
