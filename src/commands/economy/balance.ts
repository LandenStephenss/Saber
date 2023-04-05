import type { CommandInteraction, User } from 'eris';
import type { ConvertedCommandOptions } from '../../events/interactionCreate.js';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../types.js';

export default class Ping extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'balance',
            description: 'See how much gold you have.',
            category: 'economy',
            options: [
                {
                    type: SlashCommandOptionTypes.USER,
                    name: 'user',
                    description: "User you'd like to check",
                },
            ],
        });
    }

    async run(interaction: CommandInteraction, options: ConvertedCommandOptions) {
        let ResolvedUser: User | undefined;
        if (options?.user)
            ResolvedUser = this.client.resolveUser(options.user.value as string);

        const { gold } = await this.client.database.getUser(
            ResolvedUser ?? interaction.member!
        );

        return {
            embed: {
                title: `${
                    options?.user?.user?.username ?? interaction.member?.username
                } has ${gold} gold!`,
            },
            flags: 64,
        };
    }
}
