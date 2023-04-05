import type { AdvancedMessageContent, CommandInteraction } from 'eris';
import type { ConvertedCommandOptions } from '../../../events/interactionCreate.js';
import type { Bot } from '../../../structures/Client.js';
import { SlashCommand } from '../../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../../types.js';

export default class Avatar extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'avatar',
            description: "See the bot's latency to Discord.",
            category: 'information',
            options: [
                {
                    type: SlashCommandOptionTypes.USER,
                    name: 'user',
                    description: "User you'd like to see.",
                },
            ],
        });
    }

    run(
        interaction: CommandInteraction,
        options: ConvertedCommandOptions
    ): AdvancedMessageContent {
        const user = !options.user
            ? this.client.resolveUser(interaction.member!.id)
            : options.user.user!;

        if (!user) {
            throw new Error('User could not be found');
        }

        return {
            embeds: [
                {
                    title: `${user.username}'s avatar`,
                    image: {
                        url: !user.avatar
                            ? user.defaultAvatarURL
                            : user.dynamicAvatarURL(),
                    },
                },
            ],
        };
    }
}
