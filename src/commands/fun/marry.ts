import {
    AdvancedMessageContent,
    CommandInteraction,
    ComponentInteraction,
    GuildTextableChannel,
    InteractionContent,
    InteractionContentEdit,
} from 'eris';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand, parsedCustomId } from '../../structures/SlashCommand.js';
import {
    MessageComponentButtonStyles,
    MessageComponentTypes,
    SlashCommandOptionTypes,
} from '../../types.js';
import { ConvertedCommandOptions } from '../../events/interactionCreate.js';

export default class Marry extends SlashCommand {
    customIDs = {
        accept: 'accept',
        reject: 'reject',
    };

    constructor(public client: Bot) {
        super({
            name: 'marry',
            description: 'Marry a user.',
            category: 'fun',
            ephemeral: false,
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
                    options: [
                        {
                            type: SlashCommandOptionTypes.USER,
                            description: "User'd like to view status of.",
                            name: 'user',
                            required: false,
                        },
                    ],
                    name: 'status',
                    description: 'See the status of your marriage.',
                },
            ],
        });
    }

    async handleMessageComponent(
        interaction: ComponentInteraction<GuildTextableChannel>,
        { id }: parsedCustomId
    ): Promise<string | InteractionContentEdit | void> {
        const CommandUserId = id.split('_')[1];
        const MentionedUserId = id.split('_')[2];

        const CommandUser = this.client.resolveUser(CommandUserId);

        if (!CommandUser) throw new TypeError('Command user is not defined.');
        const MentionedUser = this.client.resolveUser(MentionedUserId);
        if (!MentionedUser) throw new TypeError('Mentioned user is not defined');

        if (interaction.member?.id !== MentionedUser?.id) {
            interaction.createMessage({
                flags: 64,
                embeds: [
                    {
                        description: 'That is not for you!',
                        color: 12473343,
                    },
                ],
            });
            return;
        }

        const CommandDatabaseUser = await this.client.database.getUser(CommandUser);
        const MentionedDatabaseUser = await this.client.database.getUser(MentionedUser);

        switch (id.split('_')[0]) {
            case this.customIDs.accept:
                if (CommandDatabaseUser.marriedTo) {
                    interaction.createMessage({
                        flags: 64,
                        embeds: [
                            {
                                description: `<@${CommandUser.id}> is already married to <@${CommandDatabaseUser.marriedTo}>`,
                            },
                        ],
                    });
                    return;
                }

                if (MentionedDatabaseUser.marriedTo) {
                    interaction.createMessage({
                        embeds: [
                            {
                                description: `You're already married to <@${MentionedDatabaseUser.marriedTo}>`,
                            },
                        ],
                    });

                    return;
                }

                // do the marriage stuff. set both user's and send message;

                try {
                    await this.client.database.editUser(MentionedUser, {
                        $set: {
                            marriedTo: CommandUser.id,
                        },
                    });

                    await this.client.database.editUser(CommandUser, {
                        $set: {
                            marriedTo: MentionedUser.id,
                        },
                    });

                    return {
                        embeds: [
                            {
                                description: `<@${CommandUser.id}> and <@${MentionedUser.id}> are now married!`,
                            },
                        ],
                        components: [],
                    };
                } catch (e: any) {
                    throw new Error('Could not update user marriages. ' + e);
                }
            case this.customIDs.reject:
                return {
                    embeds: [
                        {
                            description: `<@${MentionedUser.id}> has rejected <@${CommandUser.id}>`,
                        },
                    ],
                };
        }
    }

    async run(
        interaction: CommandInteraction,
        options: ConvertedCommandOptions
    ): Promise<AdvancedMessageContent | void> {
        if (!interaction.member) throw new TypeError('No member specified');

        // Command should always be ran in guild so this doesn't really matter.
        const DatabaseUser = await this.client.database.getUser(interaction.member!);

        if (options.propose) {
            if (DatabaseUser.marriedTo) {
                return {
                    embeds: [
                        {
                            description: `You're already married to <@${DatabaseUser.marriedTo}>`,
                        },
                    ],
                };
            }

            if (!options.propose.options?.user)
                throw new TypeError('User is not defined');
            // should always exist
            const MentionedUserValue = options.propose.options.user.user!;
            const MentionedDatabaseUser = await this.client.database.getUser(
                MentionedUserValue
            );

            if (MentionedUserValue.bot) {
                return {
                    flags: 64,
                    embeds: [
                        {
                            description: 'You cannot marry a bot!',
                        },
                    ],
                };
            }

            if (MentionedDatabaseUser.marriedTo) {
                return {
                    embeds: [
                        {
                            description: `Already married to <@${MentionedDatabaseUser.marriedTo}>`,
                        },
                    ],
                };
            } else if (interaction.member.id === MentionedUserValue.id) {
                return {
                    content: 'You cannot marry yoursenpmlf!',
                    flags: 64,
                };
            } else {
                // need to send message to accept.
                return {
                    embeds: [
                        {
                            description: `<@${interaction.member.id}> has proposed to <@${MentionedUserValue.id}>!`,
                        },
                    ],
                    components: [
                        {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    style: MessageComponentButtonStyles.PRIMARY,
                                    // Appending the original member's ID to the custom_id so that it can get handled properly.
                                    custom_id: `${this.customIDs.accept}_${interaction.member.id}_${MentionedUserValue.id}`,
                                    label: 'Accept!',
                                },
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    style: MessageComponentButtonStyles.DANGER,
                                    // Appending the original member's ID to the custom_id so that it can get handled properly.
                                    custom_id: `${this.customIDs.reject}_${interaction.member.id}_${MentionedUserValue.id}`,
                                    label: 'Decline!',
                                },
                            ],
                        },
                    ],
                };
            }
        }
        if (options.divorce) {
            if (!DatabaseUser.marriedTo) {
                return {
                    embeds: [
                        {
                            description: "You're not married to anybody!",
                        },
                    ],
                };
            }

            // The user that the command runner is married to.
            const MarriedUser = this.client.resolveUser(DatabaseUser.marriedTo);
            if (!MarriedUser) {
                throw new TypeError('Could not resolve user.');
            }

            const MarriedDatabaseUser = await this.client.database.getUser(MarriedUser);

            // The other user's married to is undefined or not correct.
            if (
                !MarriedDatabaseUser.marriedTo ||
                MarriedDatabaseUser.marriedTo !== DatabaseUser._id
            ) {
                // might check for other errors, but it should not really be possible so shrug. (famous last words);
                try {
                    await this.client.database.editUser(interaction.member, {
                        $set: {
                            marriedTo: undefined,
                        },
                    });

                    return {
                        embeds: [
                            {
                                description:
                                    "It seems you there was an error in the marriage process, it has been corrected and you're not married.",
                            },
                        ],
                    };
                } catch (e: any) {
                    throw new Error('Marriage process gone wrong! ' + e);
                }
            }

            // Try to divorce the user.
            try {
                await this.client.database.editUser(interaction.member, {
                    $set: {
                        marriedTo: undefined,
                    },
                });

                await this.client.database.editUser(MarriedUser, {
                    $set: {
                        marriedTo: undefined,
                    },
                });

                return {
                    embeds: [
                        {
                            description: `You've divorced <@${MarriedUser.id}>.`,
                        },
                    ],
                };
            } catch (e: any) {
                throw new Error('Could not divorce users! ' + e);
            }

            // need to make both users 'marriedTo' value to undefined
        }
        if (options.status) {
            // Need to check if there's a user mentioned and if there is show the user their married to, if not make it show the user who ran the command
            if (options.status.options?.user) {
                const UserOption = options.status.options.user.user;
                if (!UserOption) throw new TypeError('User is undefined');
                const UserDatabaseOption = await this.client.database.getUser(UserOption);

                if (UserDatabaseOption.marriedTo) {
                    return {
                        embeds: [
                            {
                                description: `<@${UserOption.id}> is married to <@${UserDatabaseOption.marriedTo}>.`,
                            },
                        ],
                    };
                } else {
                    return {
                        embeds: [
                            {
                                description: `<@${UserOption.id}> is not married.`,
                            },
                        ],
                    };
                }
            } else {
                if (DatabaseUser.marriedTo) {
                    return {
                        embeds: [
                            {
                                description: `You're married to <@${DatabaseUser.marriedTo}>`,
                            },
                        ],
                    };
                } else {
                    return {
                        embeds: [
                            {
                                description: "You're not married to anybody.",
                            },
                        ],
                    };
                }
            }
        }

        throw new Error(
            'Slash command not handled properly ' + this.slashCommandData.name
        );
    }
}
