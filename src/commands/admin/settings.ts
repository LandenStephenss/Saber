import type {
    AdvancedMessageContent,
    CommandInteraction,
    GuildTextableChannel,
} from 'eris';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { ChannelTypes, SlashCommandOptionTypes, SubCommandOption } from '../../types.js';
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

// TODO; add categorys and sort them in the description + make it look good.
const SettingOptions: (SubCommandOption & {
    mongoPropName: string;
    id: string;
    defaultValue: string | boolean | undefined;
    category: string;
})[] = [
    {
        name: 'Welcome Message',
        id: 'welcomemsg',
        category: 'Join/Leave Messages',
        description: 'Message that gets sent whenever a user joins the guild.',
        mongoPropName: 'welcome.join',
        defaultValue: undefined,
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
        category: 'Join/Leave Messages',
        description: 'Message that gets sent whenever a user leaves the guild.',
        mongoPropName: 'welcome.leave',
        defaultValue: undefined,
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
        category: 'Join/Leave Messages',
        description: 'Whether or not the user gets a join/leave message in their DMs.',
        mongoPropName: 'welcome.dms',
        defaultValue: false,
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
        category: 'Join/Leave Messages',
        description: 'Channel that join/leave messages will get sent to.',
        mongoPropName: 'welcome.channel',
        defaultValue: undefined,
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
        category: 'Join/Leave Messages',
        description: 'Whether join/leave messages are enabled or not.',
        mongoPropName: 'welcome.enabled',
        defaultValue: false,
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
        category: 'Join/Leave Messages',
        description: 'Role that is applied when a user joins',
        mongoPropName: 'welcome.role',
        defaultValue: undefined,
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.ROLE,
                description: "Role you'd like to be applied when a user joins",
            },
        ],
    },
    {
        name: 'Muted Role',
        id: 'muterole',
        category: 'Moderation Roles',
        description: 'Role to mute people',
        mongoPropName: 'moderation.roles.muted',
        defaultValue: undefined,
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.ROLE,
                description: "Role you'd like to set as the muted role.",
            },
        ],
    },
    {
        name: 'Administrator Role',
        id: 'adminrole',
        category: 'Moderation Roles',
        description: 'Role for administrators',
        mongoPropName: 'moderation.roles.admin',
        defaultValue: undefined,
        type: SlashCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: 'value',
                type: SlashCommandOptionTypes.ROLE,
                description: "Role you'd like to set as the administrator role.",
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

    private fetchProp(propName: string, obj: any) {
        let prop = obj;

        propName.split('.').forEach((e: string) => {
            prop = prop[e];
        });

        return prop;
    }

    private readableSettingValue(
        opt: SubCommandOption & { mongoPropName: string; id: string },
        value: string | boolean | undefined
    ): string {
        if (!value) return '*Not Set*';

        switch (opt.options[0].type) {
            case SlashCommandOptionTypes.CHANNEL:
                return `<#${value.toString()}>`;

            case SlashCommandOptionTypes.ROLE:
                return `<@&${value.toString()}>`;
            default:
                return `\`${value.toString()}\``;
        }
    }

    async run(
        interaction: CommandInteraction<GuildTextableChannel>,
        options: ConvertedCommandOptions
    ): Promise<AdvancedMessageContent | void> {
        if (options.set) {
            const optionName = Object.keys(options.set.options!)[0];
            const optionValue = options.set.options![optionName].options!.value.value;
            const option = SettingOptions.find((o) => o.id === optionName)!;

            try {
                const guild = this.client.resolveGuild(interaction.guildID!);
                if (!guild) {
                    return {
                        content: 'what',
                    };
                }

                const toUpdate: any = {};

                toUpdate[option.mongoPropName] = optionValue;

                await this.client.database.editGuild(guild, {
                    $set: toUpdate,
                });

                return {
                    embeds: [
                        {
                            description: `${optionName} has been updated to ${this.readableSettingValue(
                                option,
                                optionValue as string | boolean | undefined
                            )}`,
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

            let SettingCategorys = SettingOptions.map((r) => r.category).filter(
                (val, index, arr) => arr.indexOf(val) === index
            );

            return {
                embeds: [
                    {
                        author: {
                            icon_url: this.client.user.dynamicAvatarURL() ?? undefined,
                            name: `${guild.name}'s settings!`,
                        },
                        description: `To change a setting run </${
                            this.slashCommandData.name
                        } set:${this.id}>.\n\n${SettingCategorys.map(
                            (cat) =>
                                `### ${cat}\n${SettingOptions.filter(
                                    (r) => r.category === cat
                                )
                                    .map((opt) => {
                                        const prop = this.fetchProp(
                                            opt.mongoPropName,
                                            DatabaseGuild
                                        );

                                        return `- __${opt.name}__ *(${
                                            opt.id
                                        })*\n<:reply:1222053196118102018> ${this.readableSettingValue(
                                            opt,
                                            prop
                                        )}`;
                                    })
                                    .join('\n')}`
                        ).join('\n\n')}`,
                        // fields: SettingOptions.map((opt) => {
                        //     // need to get setting value;

                        //     const value = this.fetchProp(
                        //         opt.mongoPropName,
                        //         DatabaseGuild
                        //     );

                        //     return {
                        //         name: `__${opt.name}__ (${opt.id})`,
                        //         value: this.readableSettingValue(opt, value),
                        //         inline: true,
                        //     };
                        // }),
                        timestamp: new Date(),
                        footer: {
                            text: `${guild.name}'s guild settings`,
                            icon_url: guild.dynamicIconURL() ?? undefined,
                        },
                    },
                ],
            };
        }
    }
}
