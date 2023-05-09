import type { AdvancedMessageContent } from 'eris';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { ChannelTypes, CommandOption, SlashCommandOptionTypes } from '../../types.js';

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

const SettingOptions: (CommandOption & { mongoPropName: string })[] = [
    {
        name: 'welcomemsg',
        description: 'Message that gets sent whenever a user joins the guild.',
        mongoPropName: 'welcome.join',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.STRING,
                description:
                    '{user} = User mention, {userid} = User ID, {guild} = Guild Name, {guildid} = Guild ID.',
            },
        ],
    },
    {
        name: 'leavemsg',
        description: 'Message that gets sent whenever a user leaves the guild.',
        mongoPropName: 'welcome.leave',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.STRING,
                description:
                    '{user} = User mention, {userid} = User ID, {guild} = Guild Name, {guildid} = Guild ID',
            },
        ],
    },
    {
        name: 'joinleavedm',
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
        name: 'channel',
        description: 'Channel that join/leave messages will get sent to.',
        mongoPropName: 'welcome.channel',
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.CHANNEL,
                channel_types: ChannelTypes.GUILD_TEXT,
                description: "Channel you'd like join/leave messages to be sent to.",
            },
        ],
    },
    {
        name: 'joinleave',
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
                    options: [],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View a current setting value.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'setting',
                            description: "Setting you'd like to see",
                            autocomplete: true,
                            required: true,
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'reset',
                    description: 'Reset a setting value.',
                    options: [
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

    run(): AdvancedMessageContent {
        return {
            content: 'todo',
        };
    }
}
