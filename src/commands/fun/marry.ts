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
                }

                if (MentionedDatabaseUser.marriedTo) {
                    interaction.createMessage({
                        embeds: [
                            {
                                description: `You're already married to <@${MentionedDatabaseUser.marriedTo}>`,
                            },
                        ],
                    });
                }

                // do the marriage stuff. set both user's and send message;

                break;
            case this.customIDs.reject:
                return {
                    embeds: [
                        {
                            description: `<@${MentionedUser.id}> has rejected <@${CommandUser.id}>`,
                        },
                    ],
                };
                break;
        }

        // default:
        //     // The ID of the user that was proposed to.
        //     const MentionedUserValue = this.client.resolveUser(user);
        //     if (!MentionedUserValue) return 'Sorry, that user no longer exists';

        //     // The ID of the person that ran the slash command, should be identified in the custom id.
        //     const OriginalCommandUserId = id.split('_')[2];

        //     console.log(id.split('_'));
        //     console.log(OriginalCommandUserId);
        //     // Eris user object of the orignal user.
        //     const OriginalCommandUser =
        //         this.client.resolveUser(OriginalCommandUserId);

        //     if (!OriginalCommandUser || !OriginalCommandUserId)
        //         throw new TypeError('Original user is not defined in custom id.');

        //     // MongoDB database object of orignal user.
        //     const OriginalCommandDatabaseUser = await this.client.database.getUser(
        //         OriginalCommandUser
        //     );

        //     const MentionedDatabaseUser = await this.client.database.getUser(
        //         MentionedUserValue
        //     );

        //     if (id.startsWith(this.customIDs.accept)) {
        //         if (MentionedDatabaseUser.marriedTo) {
        //             return {
        //                 embeds: [
        //                     {
        //                         description: `Already married to <@${MentionedDatabaseUser.marriedTo}>`,
        //                     },
        //                 ],
        //             };
        //         }

        //         if (OriginalCommandDatabaseUser.marriedTo) {
        //             return {
        //                 embeds: [
        //                     {
        //                         description: `Already married to <@${OriginalCommandDatabaseUser.marriedTo}>`,
        //                     },
        //                 ],
        //             };
        //         }

        //         try {
        //             await this.client.database.editUser(OriginalCommandUser, {
        //                 $set: {
        //                     marriedTo: MentionedUserValue.id,
        //                 },
        //             });

        //             await this.client.database.editUser(MentionedUserValue, {
        //                 $set: {
        //                     marriedTo: OriginalCommandUser.id,
        //                 },
        //             });

        //             return {
        //                 embeds: [
        //                     {
        //                         description: `<@${OriginalCommandUser.id}> and <@${MentionedUserValue.id}> are now married!`,
        //                     },
        //                 ],
        //             };
        //         } catch (e: any) {
        //             throw new Error("Could not set user's 'marriedTo' " + e);
        //         }
        //     }

        //     if (id.startsWith(this.customIDs.reject)) {
        //         return {
        //             embeds: [
        //                 {
        //                     description: `<@${MentionedUserValue.id}> has rejected <@${OriginalCommandUser.id}>, sorry!`,
        //                 },
        //             ],
        //         };
        //     }
        //     break;
    }

    async run(
        interaction: CommandInteraction,
        options: ConvertedCommandOptions
    ): Promise<AdvancedMessageContent> {
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
                    content: 'You cannot marry yourself!',
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
            // need to make both users 'marriedTo' value to undefined
        }
        if (options.status) {
            // Need to check if there's a user mentioned and if there is show the user their married to, if not make it show the user who ran the command
            return {
                embeds: [],
            };
        }

        throw new Error(
            'Slash command not handled properly ' + this.slashCommandData.name
        );
    }
}
