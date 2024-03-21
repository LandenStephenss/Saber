import type { AdvancedMessageContent, CommandInteraction } from 'eris';
import type { ConvertedCommandOptions } from '../../events/interactionCreate.js';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../types.js';

export default class Pinged extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'pinged',
            description: 'Send a GIF whenever somebody pings you.',
            category: 'fun',
            ephemeral: true,
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    options: [],
                    name: 'view',
                    description: 'View the current GIF you have set.',
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            description: "URL to the GIF you'd like to use.",
                            name: 'gif_url',
                            required: true,
                        },
                    ],
                    name: 'set',
                    description: "Set the GIF you'd like to show when you're pinged.",
                },
            ],
        });
    }

    async run(
        interaction: CommandInteraction,
        options: ConvertedCommandOptions
    ): Promise<AdvancedMessageContent> {
        const DatabaseUser = await this.client.database.getUser(interaction.member!);

        if (options.view) {
            if (!DatabaseUser.pingedGif)
                return {
                    flags: 64,
                    content: `You do not currently have a gif set.${
                        this.id
                            ? ` Run </${this.slashCommandData.name} set:${this.id}>`
                            : '' // doing it like this just incase the ID has not been set whenever the command runs. this is unlikely but shrug.
                    }`,
                };

            return {
                content: DatabaseUser.pingedGif.url,
            };
        }

        if (options.set) {
            const GIFUrl = options.set.options!.gif_url.value as string;
            const TenorRegex = /http(s):\/\/tenor.com/g;
            if (!TenorRegex.test(GIFUrl))
                return {
                    flags: 64,
                    content: 'That GIF is invalid. Please use <https://tenor.com>',
                };

            try {
                await this.client.database.editUser(interaction.member!, {
                    $set: {
                        'pingedGif.url': GIFUrl,
                    },
                    $currentDate: {
                        'pingedGif.updatedAt': true,
                    },
                });
            } catch (e) {
                throw new Error('Could not edit user. ' + e);
            }

            return {
                flags: 64,
                content: 'GIF is now set to ' + GIFUrl,
            };
        }

        throw new Error(
            'Slash command not handled properly ' + this.slashCommandData.name
        );
    }
}
