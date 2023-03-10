import { CommandInteraction } from "eris";
import {
    Bot
} from "../../structures/Client.js";
import {
    SlashCommand
} from "../../structures/SlashCommand.js";
import { SlashCommandOptionTypes } from "../../types.js";

export default class Adventure extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'adventure',
            description: 'Check out adventures!',
            category: 'fun',
            cooldown: 5000,
            ephemeral: true,
            options: [
                // TODO; Setup sub command and sub command groups.
                // {
                //     type: SlashCommandOptionTypes.SUB_COMMAND_GROUP,
                //     options: [
                //         {
                //             type: SlashCommandOptionTypes.SUB_COMMAND,
                //             name: 'test2',
                //             description: 'test2',
                //             options: []
                //         }
                //     ],
                //     name: 'test',
                //     description: 'test'
                // }
            ]
        })
    }


    run(interaction: CommandInteraction) {
        console.log(interaction.data.options)
        return {
            embeds: [
                {
                    title: `Pong! ${this.client.shards.get(0)?.latency === Infinity ?
                        '0' :
                        this.client.shards.get(0)?.latency
                        }ms`
                }
            ]
        };
    }
}