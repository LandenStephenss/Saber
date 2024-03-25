import { CommandInteraction, GuildTextableChannel } from 'eris';
import type { Bot } from '../../../structures/Client.js';
import { SlashCommand } from '../../../structures/SlashCommand.js';

export default class Roles extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'roles',
            description: 'View all the roles in the guild.',
            category: 'information',
            ephemeral: true,
        });
    }

    run(interaction: CommandInteraction<GuildTextableChannel>) {
        if (!interaction.guildID) throw new TypeError('Command not ran in a guild');
        const guild = this.client.resolveGuild(interaction.guildID);
        if (!guild) throw new TypeError('Command not ran in a guild');

        return {
            embeds: [
                {
                    title: `Roles in ${guild.name}`,
                    description: guild.roles
                        .filter((role) => role.id !== guild.id)
                        .map((role) => `<@&${role.id}>`)
                        .join(', '),
                    footer: {
                        text: `${guild.roles.size} total roles`,
                    },
                },
            ],
        };
    }
}
