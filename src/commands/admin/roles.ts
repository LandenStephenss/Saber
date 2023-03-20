import {
    type AdvancedMessageContent,
    CommandInteraction,
    ComponentInteraction,
    InteractionContentEdit,
    TextableChannel,
    InteractionDataOptionsRole,
    ComponentInteractionSelectMenuData,
    SelectMenuOptions,
} from 'eris';
import { Bot } from '../../structures/Client.js';
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

    sendRoleSelection() {
        return {
            content: "Select the roles that you'd like to be user assignable.",
            embeds: [],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
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

    private async sendChannelSelection(interaction: ComponentInteraction) {
        // This is gonna be really tacky but it'll work.
        const OriginalMessage = await interaction.getOriginalMessage();
        const RolesFieldValue = OriginalMessage.embeds[0].fields!.find(
            (fld) => fld.name === 'Roles'
        )!.value;
        // const RoleParseRegex = /(?<=<@&).*?(?=>)/g;
        // const SelectedRoles = RolesField.value;
        // .split(', ')
        // .map((MentionedRole) => RoleParseRegex.exec(MentionedRole)![0]);

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

    private async sendChannelConfirmation(
        interaction: ComponentInteraction
    ): Promise<InteractionContentEdit> {
        const OriginalMessage = await interaction.getOriginalMessage();
        // fetch mentioned roles.
        const RolesFieldValue = OriginalMessage.embeds[0].fields!.find(
            (fld) => fld.name === 'Roles'
        )!.value;
        // const RoleParseRegex = /(?<=<@&).*?(?=>)/g;
        // const SelectedRoles = RolesField.value;
        // .split(', ')
        // .map((MentionedRole) => RoleParseRegex.exec(MentionedRole)![0]);

        // fetch channels
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
                                emoji: {
                                    id: undefined,
                                    name: Role.unicodeEmoji ?? undefined,
                                },
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

    private async sendFinishedMessage(interaction: ComponentInteraction) {
        try {
            // this is really hacky, but it works
            const OriginalMessage = await interaction.getOriginalMessage();
            const Data = OriginalMessage.content.split('\n').slice(0, 2);
            console.log(Data);
            // todo; get roles.
            // should be the channel.
            const ChannelID = Data[0]
                .replace('Channel: ', '')
                .match(/(?<=<#).*?(?=>)/g)![0];
            const RoleIDs = Data[1]
                .replace('Roles: ', '')
                .split(',')
                .map((MentionedRole) => MentionedRole.match(/(?<=<@&).*?(?=>)/g)![0]);
            const Guild = this.client.guilds.get(interaction.guildID!);
            if (!Guild) {
                throw new Error('Bot could not fetch guild.');
            }

            const ResolvedRoles = RoleIDs.map((RoleID) => {
                console.log(RoleID);
                const Role = Guild.roles.get(RoleID);
                if (!Role) {
                    throw new Error(`Could not get role: ${RoleID}`);
                }
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
                                    emoji: {
                                        id: undefined,
                                        name: Role.unicodeEmoji ?? undefined,
                                    },
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
        interaction: ComponentInteraction<TextableChannel>,
        parsedCustomId: { command: string; user: string; id: string }
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
                // @ts-expect-error eris stupid
                return await this.sendChannelSelection(interaction);
            case roleDeny: // This is ran whenever a user denys the roles on the roles selected embed.
                // @ts-expect-error eris stupid
                return this.sendRoleSelection();
            case channelSelect: // This is ran once the user selects the channel
                return this.sendChannelConfirmation(interaction);
            case channelConfirm:
                return await this.sendPreviewConfirmation(interaction);
            case channelDeny:
                // @ts-expect-error eris stupid
                return await this.sendChannelSelection(interaction);
            case previewConfirm:
                return await this.sendFinishedMessage(interaction);
            case previewDeny:
                // @ts-expect-error eris stupid
                return this.sendRoleSelection();
            case cancel:
                interaction.deleteOriginalMessage();
        }
    }

    run(): AdvancedMessageContent {
        // @ts-expect-error eris dum af.
        return this.sendRoleSelection();
    }
}
