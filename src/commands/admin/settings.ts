import type {
    AdvancedMessageContent,
    CommandInteraction,
    GuildTextableChannel,
} from 'eris';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import {
    ChannelTypes,
    CommandOption,
    SlashCommandOptionTypes,
    SubCommandOption,
} from '../../types.js';
import { ConvertedCommandOptions } from '../../events/interactionCreate.js';

/**
 * {} = Optional Parameter
 * [] = Required Pareter
 *
 * Options layout example.
 *  - set (Set needs to be a sub command group so that all of the options can be the right style of option.)
 *      - welcome message
 *      - leave message
 *      - welcome channel
 *      - join role
 *
 * - view {setting name}
 * - reset {setting name}
 *
 *
 */

const SettingOptions: (SubCommandOption & { mongoPropName: string; id: string })[] = [
    {
        name: 'Welcome Message',
        id: 'welcomemsg',
        description: 'Message that gets sent whenever a user joins the guild.',
        mongoPropName: 'welcome.join',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                required: true,
                type: SlashCommandOptionTypes.STRING,
                description:
                    '{user} = User mention, {userid} = User ID, {guild} = Guild Name, {guildid} = Guild ID.',
            },
        ],
    },
    {
        name: 'Leave Message',
        id: 'leavemsg',
        description: 'Message that gets sent whenever a user leaves the guild.',
        mongoPropName: 'welcome.leave',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                required: true,
                type: SlashCommandOptionTypes.STRING,
                description:
                    '{user} = User mention, {userid} = User ID, {guild} = Guild Name, {guildid} = Guild ID',
            },
        ],
    },
    {
        name: 'Send DM on Join/Leave',
        id: 'joinleavedm',
        description: 'Whether or not the user gets a join/leave message in their DMs.',
        mongoPropName: 'welcome.dms',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.BOOLEAN,
                description:
                    "True if you'd like to send a DM to users upon joining/leaving.",
            },
        ],
    },
    {
        name: 'Join/Leave Channel',
        id: 'joinleavechannel',
        description: 'Channel that join/leave messages will get sent to.',
        mongoPropName: 'welcome.channel',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.CHANNEL,
                channel_types: [ChannelTypes.GUILD_TEXT],
                description: "Channel you'd like join/leave messages to be sent to.",
            },
        ],
    },
    {
        name: 'Join/Leave Messages',
        id: 'joinleave',
        description: 'Whether join/leave messages are enabled or not.',
        mongoPropName: 'welcome.enabled',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.BOOLEAN,
                description:
                    "Whether you'd like to have join/leave messages sent or not.",
            },
        ],
    },
    {
        name: 'Join/Leave Role',
        id: 'joinleaverole',
        description: 'Role that is applied when a user joins',
        mongoPropName: 'welcome.role',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.ROLE,
                description: "Role you'd like to be applied when a user joins",
            },
        ],
    },
];

export default class Ping extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'settings',
            description: 'Change bot settings for your guild.',
            category: 'admin',
            ephemeral: true,
            defaultMemberPermissions: 1 << 28,
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND_GROUP,
                    name: 'set',
                    description: 'Set a specific setting.',
                    options: SettingOptions.map(({ id, description, type, options }) => ({
                        name: id,
                        description,
                        type,
                        options: options.map((option) => ({
                            ...option,
                            required: true,
                        })),
                    })),
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View a current setting value.',
                    options: [],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'reset',
                    description: 'Reset a setting value.',
                    options: [
                        // make this the same as the set options, except not required
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'setting',
                            description: "Setting you'd like to reset",
                            autocomplete: true,
                            required: true,
                        },
                    ],
                },
            ],
        });
    }

    async run(
        interaction: CommandInteraction<GuildTextableChannel>,
        options: ConvertedCommandOptions
    ): Promise<AdvancedMessageContent | void> {
        if (options.set) {
            const optionName = Object.keys(options.set.options!)[0];
            const optionValue = options.set.options![optionName].options!.value.value;
            const { mongoPropName } = SettingOptions.find((o) => o.name === optionName)!;

            try {
                const guild = this.client.resolveGuild(interaction.guildID!);
                if (!guild) {
                    return {
                        content: 'what',
                    };
                }

                const toUpdate: any = {};

                toUpdate[mongoPropName] = optionValue;

                await this.client.database.editGuild(guild, {
                    $set: toUpdate,
                });

                return {
                    embeds: [
                        {
                            description: `${optionName} has been updated to \`${optionValue}\``,
                        },
                    ],
                };
            } catch (e: any) {
                throw new Error(e);
            }
        }

        if (options.view) {
            const guild = this.client.resolveGuild(interaction.guildID!);
            if (!guild) throw new Error('Command was not ran in a guild');
            const DatabaseGuild = await this.client.database.getGuild(guild);

            return {
                embeds: [
                    {
                        title: `${guild.name}'s settings!`,
                        fields: SettingOptions.map((opt) => {
                            // need to get setting value;

                            return {
                                name: `__${opt.name}__ (${opt.id})`,
                                value: 'WIP;',
                                inline: true,
                            };
                        }),
                    },
                ],
            };
        }
    }
}
