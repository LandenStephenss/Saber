import { Event } from '../structures/Event.js';
import type {
    PingInteraction,
    UnknownInteraction,
    CommandInteraction,
    ComponentInteraction,
    AutocompleteInteraction,
    User,
    GuildTextableChannel,
    AdvancedMessageContent,
    InteractionDataOptionsWithValue,
    InteractionDataOptions,
    InteractionDataOptionWithValue,
    InteractionDataOptionsSubCommand,
    ComponentInteractionSelectMenuData,
} from 'eris';
import {
    type InteractionAutocompleteChoices,
    SlashCommandOptionTypes,
} from '../types.js';
import { config } from '../config.js';

enum RoleEditedType {
    ADDED = 1,
    REMOVED = 2,
}

export type ConvertedCommandOptions = {
    [key: string]: {
        // Type of command option
        type: SlashCommandOptionTypes;
        value?: unknown;
        // Used for user type;
        user?: User;
        // Used for sub commands;
        options?: ConvertedCommandOptions;
        /**
         * This value is really just redundent. It's not used
         * anywhere in the code yet exists for giggles.
         */
        isSubCommand?: boolean;
    };
};

export type BulkInteraction =
    | PingInteraction
    | UnknownInteraction
    | CommandInteraction
    | ComponentInteraction
    | AutocompleteInteraction;

enum InteractionTypes {
    PING = 1,
    APPLICATION_COMMAND = 2,
    MESSAGE_COMPONENT = 3,
    APPLICATION_COMMAND_AUTOCOMPLETE = 4,
    MODAL_SUBMIT = 5,
}

export default class InteractionCreate extends Event {
    name = 'interactionCreate';

    /**
     * Handles the different types of possible interactions from Discord.
     * @param {BulkInteraction} interaction Interaction provided from Discord.
     */
    run(interaction: BulkInteraction) {
        try {
            switch (interaction.type) {
                case InteractionTypes.PING:
                    this.handlePing(interaction as PingInteraction);
                    break;

                case InteractionTypes.APPLICATION_COMMAND:
                    this.handleCommand(
                        interaction as CommandInteraction<GuildTextableChannel>
                    );
                    break;

                case InteractionTypes.MESSAGE_COMPONENT:
                    this.handleMessageComponent(interaction as ComponentInteraction);
                    break;

                case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE:
                    this.handleAutocomplete(
                        interaction as AutocompleteInteraction<GuildTextableChannel>
                    );
                    break;
                case InteractionTypes.MODAL_SUBMIT:
                    console.log('Modal submit interaction is not yet supported.');
                    break;
            }
        } catch (e: any) {
            throw new Error(e);
        }
    }

    /**
     * Finds which option is focused whenever typing a value into a command option.
     * @param {InteractionDataOptions[]} options Options provided by the interaction.
     * @returns {string} The name of the option that autocomplete is being used on.
     */
    private findFocusedAutocompleteOption(options: InteractionDataOptions[] = []): any {
        for (const option of options) {
            if ((option as InteractionDataOptionWithValue).focused) {
                return option;
            }

            if ((option as InteractionDataOptionsSubCommand).options) {
                return this.findFocusedAutocompleteOption(
                    (option as InteractionDataOptionsSubCommand).options
                );
            }
        }

        throw new Error('An unexpected error has occured');
    }

    /**
     * Ran whenever a user is attempting to use autocomplete from a
     * slash command through Discord.
     * @param {AutocompleteInteraction<GuildTextableChannel>} interaction
     */
    async handleAutocomplete(
        interaction: AutocompleteInteraction<GuildTextableChannel>
    ): Promise<void> {
        try {
            const Command = this.client.localCommands.get(interaction.data.name);
            if (!Command || !Command.handleCommandAutocomplete) {
                console.error(
                    'Could not handle autocomplete properly, ' + interaction.data.name
                );
                return;
            }
            const FocusedOption: InteractionDataOptionsWithValue =
                this.findFocusedAutocompleteOption(interaction.data.options);
            const OtherOptions: {
                [key: string]: InteractionDataOptions;
            } = {};
            for (const Option of interaction.data.options as InteractionDataOptions[]) {
                if ((Option as InteractionDataOptionWithValue).focused) {
                    continue;
                }

                OtherOptions[Option.name] = Option;
            }

            if (!FocusedOption) {
                throw new Error('Autocomplete interaction does not have focused option');
            }
            const Result: InteractionAutocompleteChoices[] =
                await Command.handleCommandAutocomplete(
                    FocusedOption.name,
                    FocusedOption.value as string,
                    OtherOptions
                );
            interaction.acknowledge(Result);
        } catch (e) {
            throw new Error('Could not handle autocomplete ' + e);
        }
    }

    /**
     * Creates a basic error message to relay to users whenever
     * somethings goes wrong.
     * @param {unknown} error The error message.
     * @param {boolean} isDeveloper Whether the user is a developer or not
     * developers will get the error included with the message.
     * @returns {AdvancedMessageContent} A message object that can be sent to the user.
     */
    createErrorMessage(
        error: unknown,
        isDeveloper: boolean = false
    ): AdvancedMessageContent {
        const Message: AdvancedMessageContent = {
            flags: 64,
            content: 'An unexpected error has occured',
        };

        if (isDeveloper) {
            Message.embeds = [
                {
                    color: 12473343,
                    title: 'Error:',
                    description: `\`\`\`\n${error}\`\`\``,
                },
            ];
        }

        return Message;
    }

    async handleMessageComponent(interaction: ComponentInteraction) {
        try {
            await interaction.acknowledge();

            // If it is a reaction role via the dropdown then it needs to be handled accordingly.
            if (interaction.data.custom_id === 'selfAssignableRolesDropdown') {
                const Guild = this.client.guilds.get(interaction.guildID!);
                if (!Guild) {
                    throw new Error('Could not get guild from interaction.');
                }

                const Roles = (
                    interaction.data as ComponentInteractionSelectMenuData
                ).values.map((roleID) => {
                    const Role = Guild.roles.get(roleID);
                    if (!Role) {
                        interaction.createFollowup({
                            flags: 64,
                            content: `Role \`${roleID}\` does not exist, please contact a server administrator.`,
                        });
                        throw new Error('Could not find role ' + roleID);
                    }
                    return Role;
                });

                if (!interaction.member) {
                    throw new Error('No member found, message was sent in DM.');
                }

                const RolesChanged: {
                    roleID: string;
                    action: RoleEditedType;
                }[] = [];

                for (const Role of Roles) {
                    if (interaction.member.roles.includes(Role.id)) {
                        interaction.member.removeRole(Role.id);
                        RolesChanged.push({
                            roleID: Role.id,
                            action: RoleEditedType.REMOVED,
                        });
                    } else {
                        interaction.member.addRole(Role.id);
                        RolesChanged.push({
                            roleID: Role.id,
                            action: RoleEditedType.ADDED,
                        });
                    }
                }

                let FollowupMessage: AdvancedMessageContent = {
                    flags: 64,
                    embeds: [
                        {
                            title: 'Roles Changed',
                            fields: [],
                        },
                    ],
                };

                // cancer af but it works might change later idk.

                if (
                    RolesChanged.filter(({ action }) => action === RoleEditedType.ADDED)
                        .length > 0
                ) {
                    FollowupMessage.embeds![0].fields!.push({
                        name: 'Roles Added',
                        value: RolesChanged.filter(
                            ({ action }) => action === RoleEditedType.ADDED
                        )
                            .map(({ roleID }) => `<@&${roleID}>`)
                            .join(', '),
                    });
                }

                if (
                    RolesChanged.filter(({ action }) => action === RoleEditedType.REMOVED)
                        .length > 0
                ) {
                    FollowupMessage.embeds![0].fields!.push({
                        name: 'Roles Removed',
                        value: RolesChanged.filter(
                            ({ action }) => action === RoleEditedType.REMOVED
                        )
                            .map(({ roleID }) => `<@&${roleID}>`)
                            .join(', '),
                    });
                }

                interaction.createFollowup(FollowupMessage);
                return;
            }

            const ParsedCustomId = this.parseIncomingComponentCustomID(
                interaction.data.custom_id
            );
            const Command = this.client.localCommands.get(ParsedCustomId.command);

            if (!Command || !Command.handleMessageComponent) {
                throw new Error(
                    'User is trying to use message component that is not yet handled. ' +
                        interaction.data.custom_id
                );
            }

            if (ParsedCustomId.user !== interaction.member!.id) {
                await interaction.createFollowup({
                    content: `You cannot interact with this message. Run </${Command.slashCommandData.name}:${Command.id}>`,
                    flags: 64,
                });
                return;
            }

            interaction.data.custom_id = ParsedCustomId.id;

            const Result = await Command.handleMessageComponent(
                interaction as ComponentInteraction<GuildTextableChannel>,
                ParsedCustomId
            );
            if (!Result) return;

            if (typeof Result === 'object') {
                if (Result.components) {
                    this.updateComponentsCustomID(
                        Result.components,
                        ParsedCustomId.command,
                        interaction.member!.id
                    );
                }

                if (Result.embeds) {
                    for (const [index, embed] of Result.embeds.entries()) {
                        if (!embed?.color) Result.embeds[index].color = 12473343;
                    }
                }
            }

            interaction.editOriginalMessage(Result);
        } catch (e: any) {
            if (!interaction.acknowledged) {
                await interaction.acknowledge();
            }

            await interaction.createFollowup(
                this.createErrorMessage(
                    e,
                    config.developers.includes(interaction.member!.id)
                )
            );
            throw new Error('Could not handle message component ' + e);
        }
    }

    handlePing(interaction: PingInteraction) {
        interaction.acknowledge();
    }

    async handleCommand(interaction: CommandInteraction<GuildTextableChannel>) {
        try {
            if (!interaction.member) {
                throw new Error('An unexpected error occured, please try again.');
            }
            const Command = this.client.localCommands.get(interaction.data.name);
            if (!Command) {
                await interaction.acknowledge(64);
                throw new Error(
                    `User ${
                        interaction.member === undefined
                            ? ''
                            : `(${interaction.member.id})`
                    } tried to use ${
                        interaction.data.name
                    } command. Command does not exist.`
                );
            }
            // Check to see if the command is on a cooldown;
            let { commandCooldowns } = await this.client.database.getUser(
                interaction.member
            );
            if (
                commandCooldowns &&
                commandCooldowns[interaction.data.name] &&
                Date.now() < commandCooldowns[interaction.data.name]
            ) {
                await interaction.acknowledge(64);
                interaction.createFollowup(
                    `You're on cooldown till <t:${Math.round(
                        commandCooldowns[interaction.data.name] / 1000
                    )}>`
                );
                return;
            }

            await interaction.acknowledge(Command?.localData.ephemeral ? 64 : 0);

            let options: ConvertedCommandOptions = {};
            if (interaction.data.options) {
                options = this.parseInteractionOptions(interaction.data.options);
            }

            let CommandResult = await Command.run(interaction, options);
            if (CommandResult) {
                // todo; probably append the user id to all custom_id here, so that command code doesn't look ugly.
                if (typeof CommandResult === 'object') {
                    if (CommandResult.embeds) {
                        for (const [index, embed] of CommandResult.embeds.entries()) {
                            if (!embed?.color)
                                CommandResult.embeds[index].color = 12473343;
                        }
                    }

                    if (CommandResult.components) {
                        CommandResult.components = this.updateComponentsCustomID(
                            CommandResult.components as any[],
                            Command.slashCommandData.name,
                            interaction.member!.id
                        );
                    }
                }
                if (
                    typeof CommandResult === 'object' &&
                    CommandResult.embed &&
                    !CommandResult.embed?.color
                )
                    CommandResult.embed.color = 12473343;

                interaction.createFollowup(CommandResult);

                // Add the user's cooldown;
                if (!commandCooldowns) {
                    commandCooldowns = {};
                }
                commandCooldowns[interaction.data.name] =
                    Date.now() + Command.localData.cooldown;

                this.client.database.editUser(interaction.member, {
                    commandCooldowns,
                });
            }
        } catch (err) {
            if (!interaction.acknowledged) {
                await interaction.acknowledge(64);
            }

            await interaction.createFollowup(
                this.createErrorMessage(
                    err,
                    config.developers.includes(interaction.member!.id)
                )
            );
            throw new Error('Could not handle command');
        }
    }

    // really need to type this correctely but i cant be bothered right now.
    private updateComponentsCustomID(
        components: any[],
        commandName: string,
        memberId: string
    ): any[] {
        for (const component of components) {
            if (component?.components) {
                component.components = this.updateComponentsCustomID(
                    component.components,
                    commandName,
                    memberId
                );
            } else if (component.custom_id) {
                component.custom_id = `${commandName}-${component.custom_id}-${memberId}`;
            }
        }
        return components;
    }

    private parseIncomingComponentCustomID(custom_id: string): {
        command: string;
        user: string;
        id: string;
    } {
        return {
            command: custom_id.split('-')[0],
            user: custom_id.split('-')[2],
            id: custom_id.split('-')[1],
        };
    }

    private parseInteractionOptions(
        options: InteractionDataOptions[]
    ): ConvertedCommandOptions {
        let ConvertedOptions: ConvertedCommandOptions = {};
        for (const option of options) {
            switch (option.type) {
                case SlashCommandOptionTypes.SUB_COMMAND:
                    ConvertedOptions[option.name] = {
                        type: option.type,
                        options: this.parseInteractionOptions(option.options ?? []),
                        isSubCommand: true,
                    };
                    break;
                case SlashCommandOptionTypes.SUB_COMMAND_GROUP:
                    throw new Error(
                        'Sub command group type has not been handled properly yet.'
                    );
                    break;
                case SlashCommandOptionTypes.STRING:
                    ConvertedOptions[option.name] = {
                        type: option.type,
                        value: option.value as string,
                    };
                    break;
                case SlashCommandOptionTypes.INTEGER:
                    ConvertedOptions[option.name] = {
                        type: option.type,
                        value: option.value as number,
                    };
                    break;
                case SlashCommandOptionTypes.BOOLEAN:
                    ConvertedOptions[option.name] = {
                        type: option.type,
                        value: option.value as boolean,
                    };
                    break;
                case SlashCommandOptionTypes.USER:
                    const User = this.client.resolveUser(option.value);
                    if (!User) {
                        throw new Error('User could not be found.');
                    }
                    ConvertedOptions[option.name] = {
                        value: option.value,
                        type: option.type,
                        user: User,
                    };
                    break;
                case SlashCommandOptionTypes.CHANNEL:
                    throw new Error('Channel type has not been handled properly yet.');
                    break;
                case SlashCommandOptionTypes.ROLE:
                    throw new Error('Role type has not been handled properly yet.');
                    break;
                case SlashCommandOptionTypes.MENTIONABLE:
                    break;
                case SlashCommandOptionTypes.NUMBER:
                    ConvertedOptions[option.name] = {
                        type: option.type,
                        value: option.value as number,
                    };
                    break;
                // @ts-expect-error dum eris
                case SlashCommandOptionTypes.ATTACHMENT:
                    break;
                default:
                    throw new Error('Slash command option type is not yet supported.');
            }
        }
        return ConvertedOptions;
    }
}
