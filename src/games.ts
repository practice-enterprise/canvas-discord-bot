import { CommandInteraction, Interaction, MessageEmbed } from "discord.js";
import { Command } from "./models/command";
import { Colors } from "./util/embed-builder";

export class RockPaperScissors {
  readonly command: Command
  interaction: CommandInteraction

  readonly expireTime = 60000

  constructor(command: Command, interaction: CommandInteraction) {
    this.command = command;
    this.interaction = interaction;
  }

  challenge(): void {
    
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
