import { CommandInteraction, GuildTextableChannel } from 'eris';
import type { Bot } from '../../../structures/Client.js';
import { SlashCommand } from '../../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../../types.js';
import { ConvertedCommandOptions } from '../../../events/interactionCreate.js';

export default class Roles extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'roleinfo',
            description: 'View information about a specific role.',
            category: 'information',
            ephemeral: true,
            options: [
                {
                    type: SlashCommandOptionTypes.ROLE,
                    name: 'role',
                    description: "Role you'd like information about",
                    required: true,
                },
            ],
        });
    }

    run(
        interaction: CommandInteraction<GuildTextableChannel>,
        options: ConvertedCommandOptions
    ) {
        if (!interaction.guildID) throw new TypeError('Command not ran in a guild');
        const guild = this.client.resolveGuild(interaction.guildID);
        if (!guild) throw new TypeError('Command not ran in a guild');

        const roleId = options.role.value as string;
        const role = guild.roles.get(roleId);

        if (!role) {
            return {
                content: 'not a valid role',
            };
        }

        return {
            embeds: [
                {
                    title: `Information About ${role.name}`,
                    color: role.color ?? undefined,
                    fields: [
                        {
                            name: 'ID',
                            value: role.id.toString(),
                        },
                        {
                            name: 'Color',
                            value: role.color.toString(),
                        },
                        {
                            name: 'Mention',
                            value: `\`<@&${role.id}>\``,
                        },
                        {
                            name: 'Hoisted',
                            value: role.hoist ? 'Yes' : 'No',
                        },
                        {
                            name: 'Posistion',
                            value: role.position.toString(),
                        },
                    ],
                    footer: {
                        text: 'Role Created',
                    },
                    timestamp: new Date(role.createdAt),
                },
            ],
        };
    }
}
