import { AdvancedMessageContent, CommandInteraction } from 'eris';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../types.js';
import { ConvertedCommandOptions } from '../../events/interactionCreate.js';

export default class Ping extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'marry',
            description: 'Marry a user.',
            category: 'fun',
            ephemeral: true,
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            type: SlashCommandOptionTypes.USER,
                            description: "User you'd like to propose to",
                            name: 'user',
                            required: true,
                        },
                    ],
                    name: 'propose',
                    description: 'Propose to a user.',
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    options: [],
                    name: 'divorce',
                    description: 'Divorce your partner.',
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    options: [],
                    name: 'status',
                    description: 'See the status of your marriage.',
                },
            ],
        });
    }

    async run(
        interaction: CommandInteraction,
        options: ConvertedCommandOptions
    ): Promise<AdvancedMessageContent> {
        // Command should always be ran in guild so this doesn't really matter.
        const DatabaseUser = await this.client.database.getUser(interaction.member!);

        if (options.propose) {
            if (!DatabaseUser.marriedTo) {
                return {
                    embeds: [
                        {
                            description: `You're already married to <@${DatabaseUser.marriedTo}>`,
                        },
                    ],
                };
            } else {
                if (!options.propose.options?.user)
                    throw new TypeError('User is not defined');

                // need to set both users to married to eachother
            }
        }
        if (options.divorce) {
            // need to make both users 'marriedTo' value to undefined
        }
        if (options.status) {
            // Need to check if there's a user mentioned and if there is show the user their married to, if not make it show the user who ran the command
        }

        throw new Error(
            'Slash command not handled properly ' + this.slashCommandData.name
        );
    }
}
