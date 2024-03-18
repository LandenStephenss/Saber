import type {
    AdvancedMessageContent,
    ComponentInteraction,
    InteractionContentEdit,
    TextableChannel,
    ComponentInteractionSelectMenuData,
} from 'eris';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { MessageComponentButtonStyles, MessageComponentTypes } from '../../types.js';

export default class Roles extends SlashCommand {
    componentCustomIDs = {
        roleSelect: 'roleselect',
        roleConfirm: 'rolesconfirm',
        roleDeny: 'roledeny',
        channelSelect: 'channelselect',
        channelConfirm: 'channelconfirm',
        channelDeny: 'channeldeny',
        previewConfirm: 'previewconfirm',
        previewDeny: 'previewdeny',

        cancel: 'cancel',
    };

    constructor(public client: Bot) {
        super({
            name: 'roles',
            description: 'Setup self assignable roles.',
            category: 'admin',
            defaultMemberPermissions: 1 << 28,
            ephemeral: true,
        });
    }

    /**
     * Send's a prompt for the user to select up to 25 roles.
     * @returns {InteractionContentEdit} Edited message object.
     */
    sendRoleSelection(): InteractionContentEdit {
        return {
            content: "Select the roles that you'd like to be user assignable.",
            embeds: [],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            // @ts-expect-error eris issue
                            type: MessageComponentTypes.ROLE_SELECT,
                            custom_id: this.componentCustomIDs.roleSelect,
                            max_values: 25,
                        },
                    ],
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Cancel',
                            custom_id: this.componentCustomIDs.cancel,
                        },
                    ],
                },
            ],
        };
    }

    /**
     * Sends a prompt asking the user if the selected roles are correct.
     * @param {ComponentInteraction} interaction
     * @returns {InteractionContentEdit} Edited message object.
     */
    private sendRoleConfirmation(
        interaction: ComponentInteraction
    ): InteractionContentEdit {
        const RoleIDs = (interaction.data as ComponentInteractionSelectMenuData).values;
        const MentionedRoles = RoleIDs.map((roleId) => `<@&${roleId}>`);

        return {
            content: '',
            embeds: [
                {
                    title: 'Are the following roles correct?',
                    fields: [
                        {
                            name: 'Roles',
                            value: MentionedRoles.join(', '),
                        },
                    ],
                },
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            custom_id: this.componentCustomIDs.roleConfirm,
                            style: MessageComponentButtonStyles.PRIMARY,
                            label: 'Correct',
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            custom_id: this.componentCustomIDs.roleDeny,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Incorrect',
                        },
                    ],
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Cancel',
                            custom_id: this.componentCustomIDs.cancel,
                        },
                    ],
                },
            ],
        };
    }

    /**
     * Send's a prompt for the user to select what channel the **fianl** message should be sent to.
     * @param {ComponentInteraction} interaction
     * @returns {Promise<InteractionContentEdit>} Edited message object.
     */
    private async sendChannelSelection(
        interaction: ComponentInteraction
    ): Promise<InteractionContentEdit> {
        const OriginalMessage = await interaction.getOriginalMessage();
        const RolesFieldValue = OriginalMessage.embeds[0].fields!.find(
            (fld) => fld.name === 'Roles'
        )!.value;

        return {
            content: '',
            embeds: [
                {
                    title: 'Please select a channel.',
                    fields: [
                        {
                            name: 'Roles',
                            value: RolesFieldValue,
                        },
                    ],
                },
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            // @ts-expect-error
                            type: MessageComponentTypes.CHANNEL_SELECT,
                            custom_id: this.componentCustomIDs.channelSelect,
                        },
                    ],
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Cancel',
                            custom_id: this.componentCustomIDs.cancel,
                        },
                    ],
                },
            ],
        };
    }

    /**
     * Send's a prompt so the user make sure the channel is correct.
     * @param {ComponentInteraction} interaction
     * @returns {Promise<InteractionContentEdit>}
     */
    private async sendChannelConfirmation(
        interaction: ComponentInteraction
    ): Promise<InteractionContentEdit> {
        const OriginalMessage = await interaction.getOriginalMessage();

        const RolesFieldValue = OriginalMessage.embeds[0].fields!.find(
            (fld) => fld.name === 'Roles'
        )!.value;

        const ChannelIDs = (interaction.data as ComponentInteractionSelectMenuData)
            .values;
        const MentionedChannels = ChannelIDs.map((channelId) => `<#${channelId}>`); // This should literally never be more than one, but who knows.

        return {
            content: '',
            embeds: [
                {
                    title: 'Is the following information correct?',
                    fields: [
                        {
                            name: 'Roles',
                            value: RolesFieldValue,
                        },
                        {
                            name: 'Channel',
                            value: MentionedChannels.join(', '), // This should literally never be more than one, but who knows.
                        },
                    ],
                },
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            custom_id: this.componentCustomIDs.channelConfirm,
                            style: MessageComponentButtonStyles.PRIMARY,
                            label: 'Correct',
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            custom_id: this.componentCustomIDs.channelDeny,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Incorrect',
                        },
                    ],
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Cancel',
                            custom_id: this.componentCustomIDs.cancel,
                        },
                    ],
                },
            ],
        };
    }

    /**
     * Sends the user a preview confirmation message.
     * @param {ComponentInteraction} interaction
     * @returns {Promise<InteractionContentEdit>}
     */
    private async sendPreviewConfirmation(
        interaction: ComponentInteraction
    ): Promise<InteractionContentEdit> {
        const OriginalMessage = await interaction.getOriginalMessage();
        const RolesFieldValue = OriginalMessage.embeds[0].fields!.find(
            (fld) => fld.name === 'Roles'
        )!.value;
        const RoleParseRegex = /(?<=<@&).*?(?=>)/g;
        const SelectedRoles = RolesFieldValue.split(', ').map(
            (MentionedRole) => MentionedRole.match(RoleParseRegex)![0]
        );
        const ResolvedRoles = SelectedRoles.map(
            (roleID) => this.client.guilds.get(interaction.guildID!)!.roles.get(roleID)!
        );

        const ChannelsFieldValue = OriginalMessage.embeds[0].fields!.find(
            (fld) => fld.name === 'Channel'
        )!.value!;
        const ChannelParseRegex = /(?<=<#).*?(?=>)/g;
        const SelectedChannel = ChannelsFieldValue.split(', ').map(
            (MentionedChannel) => MentionedChannel.match(ChannelParseRegex)![0]
        );

        return {
            content: `Channel: <#${SelectedChannel}>\nRoles: ${ResolvedRoles.map(
                (Role) => `<@&${Role.id}>`
            )}\n\nPREVIEW`,
            embeds: [
                {
                    title: 'Click the dropdown to start assigning roles to yourself.',
                    footer: {
                        text: `${ResolvedRoles.length} available roles.`,
                    },
                },
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.STRING_SELECT,
                            custom_id: 'previewDropdown', // this really shouldn't be getting used anyways.
                            options: ResolvedRoles.map((Role) => ({
                                label: Role.name,
                                value: Role.id,
                                // emoji: {
                                //     id: undefined,
                                //     name: Role.unicodeEmoji
                                //         ? Role.unicodeEmoji
                                //         : undefined,
                                // },
                            })),
                            max_values: ResolvedRoles.length, // should never be over 25
                        },
                    ],
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            custom_id: this.componentCustomIDs.previewConfirm,
                            style: MessageComponentButtonStyles.PRIMARY,
                            label: 'Correct',
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            custom_id: this.componentCustomIDs.previewDeny,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Incorrect',
                        },
                    ],
                },
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            custom_id: this.componentCustomIDs.cancel,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'Cancel',
                        },
                    ],
                },
            ],
        };
    }

    /**
     * Sends the fianl role selection message to the specified channel.
     * @param {ComponentInteraction} interaction
     */
    private async sendFinishedMessage(interaction: ComponentInteraction) {
        try {
            const OriginalMessage = await interaction.getOriginalMessage();

            const Data = OriginalMessage.content.split('\n').slice(0, 2);
            const ChannelID = Data[0]
                .replace('Channel: ', '')
                .match(/(?<=<#).*?(?=>)/g)![0];
            const RoleIDs = Data[1]
                .replace('Roles: ', '')
                .split(',')
                .map((MentionedRole) => MentionedRole.match(/(?<=<@&).*?(?=>)/g)![0]);

            const Guild = this.client.guilds.get(interaction.guildID!);
            if (!Guild) throw new Error('Bot could not fetch guild.');

            const ResolvedRoles = RoleIDs.map((RoleID) => {
                const Role = Guild.roles.get(RoleID);
                if (!Role) throw new Error(`Could not get role: ${RoleID}`);

                return Role;
            });

            this.client.createMessage(ChannelID, {
                content: '',
                embeds: [
                    {
                        title: 'Click the dropdown to start assigning roles to yourself.',
                        footer: {
                            text: `${ResolvedRoles.length} available roles.`,
                        },
                        color: 12473343,
                    },
                ],
                components: [
                    {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.STRING_SELECT,
                                custom_id: 'selfAssignableRolesDropdown',
                                options: ResolvedRoles.map((Role) => ({
                                    label: Role.name,
                                    value: Role.id,
                                    // emoji: {
                                    //     id: undefined,
                                    //     name: Role.unicodeEmoji
                                    //         ? Role.unicodeEmoji
                                    //         : undefined,
                                    // },
                                })),
                                max_values: ResolvedRoles.length, // should never be over 25
                            },
                        ],
                    },
                ],
            });
        } catch (e) {
            throw new Error('An error has occured ' + e);
        }
    }

    async handleMessageComponent(
        interaction: ComponentInteraction<TextableChannel>
    ): Promise<string | void | InteractionContentEdit> {
        const {
            roleSelect,
            roleConfirm,
            roleDeny,
            channelSelect,
            channelConfirm,
            channelDeny,
            previewConfirm,
            previewDeny,
            cancel,
        } = this.componentCustomIDs;
        switch (interaction.data.custom_id) {
            case roleSelect: // This is ran once a user has made a selection of roles.
                return this.sendRoleConfirmation(interaction);
            case roleConfirm: // This is ran whenever a user confirms the roles on the roles selected embed.
                return await this.sendChannelSelection(interaction);
            case roleDeny: // This is ran whenever a user denys the roles on the roles selected embed.
                return this.sendRoleSelection();
            case channelSelect: // This is ran once the user selects the channel
                return this.sendChannelConfirmation(interaction);
            case channelConfirm:
                return await this.sendPreviewConfirmation(interaction);
            case channelDeny:
                return await this.sendChannelSelection(interaction);
            case previewConfirm:
                return await this.sendFinishedMessage(interaction);
            case previewDeny:
                return this.sendRoleSelection();
            case cancel:
                interaction.deleteOriginalMessage();
        }
    }

    run(): AdvancedMessageContent {
        return this.sendRoleSelection();
    }
}
