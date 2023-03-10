import {
    Event
} from "../structures/Event.js";
import {
    type PingInteraction,
    type UnknownInteraction,
    type CommandInteraction,
    type ComponentInteraction,
    type AutocompleteInteraction,
    type User,
    type GuildTextableChannel,
    type AdvancedMessageContent,
    type InteractionDataOptionsWithValue
} from 'eris'
import {
    type InteractionAutocompleteChoices,
    SlashCommandOptionTypes
} from "../types.js";
import {
    config
} from '../config.js';

export type ConvertedCommandOptions = {
    [key: string]: {
        value: unknown;
        type: SlashCommandOptionTypes,
        // Used for user type;
        user?: User
    }
}

export type BulkInteraction = PingInteraction
    | UnknownInteraction
    | CommandInteraction
    | ComponentInteraction
    | AutocompleteInteraction

enum InteractionTypes {
    PING = 1,
    APPLICATION_COMMAND = 2,
    MESSAGE_COMPONENT = 3,
    APPLICATION_COMMAND_AUTOCOMPLETE = 4,
    MODAL_SUBMIT = 5
}

export default class InteractionCreate extends Event {
    name = "interactionCreate";

    run(interaction: BulkInteraction) {
        switch (interaction.type) {
            case InteractionTypes.PING:
                this.handlePing(interaction as PingInteraction)
                break;

            case InteractionTypes.APPLICATION_COMMAND:
                this.handleCommand(interaction as CommandInteraction<GuildTextableChannel>);
                break;

            case InteractionTypes.MESSAGE_COMPONENT:
                this.handleMessageComponent(interaction as ComponentInteraction)
                break;

            case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE:
                this.handleAutocomplete(interaction as AutocompleteInteraction<GuildTextableChannel>)
                break;
            case InteractionTypes.MODAL_SUBMIT:
                console.log('Modal submit interaction is not yet supported.');
                break;
        }
    }

    async handleAutocomplete(interaction: AutocompleteInteraction<GuildTextableChannel>) {
        try {
            const Command = this.client.localCommands.get(interaction.data.name);
            if (!Command || !Command.handleCommandAutocomplete) {
                console.error('Could not handle autocomplete properly, ' + interaction.data.name);
                return;
            }
            // @ts-expect-error
            const FocusedOption: InteractionDataOptionsWithValue = interaction.data.options.find((opt) => opt.focused)
            const OtherOptions: {
                [key: string]: InteractionDataOptionsWithValue
            } = {};
            for (const Option of interaction.data.options as InteractionDataOptionsWithValue[]) {
                if (Option.focused) {
                    continue;
                }

                OtherOptions[Option.name] = Option
            }
            if (!FocusedOption) {
                throw new Error('Autocomplete interaction does not have focused option');
            }
            const Result: InteractionAutocompleteChoices[] = await Command.handleCommandAutocomplete(FocusedOption.name, FocusedOption.value as string, OtherOptions)
            interaction.acknowledge(Result);

        } catch (e) {
            throw new Error('Could not handle autocomplete ' + e);
        }


    }

    createErrorMessage(error: any, isDeveloper: boolean = false): AdvancedMessageContent {
        const Message: AdvancedMessageContent = {
            flags: 64,
            content: 'An unexpected error has occured'
        }

        if (isDeveloper) {
            Message.embeds = [
                {
                    color: 12473343,
                    title: 'Error:',
                    description: `\`\`\`\n${error}\`\`\``
                }
            ]
        }

        return Message;
    }

    async handleMessageComponent(interaction: ComponentInteraction) {
        try {
            await interaction.acknowledge();

            const Command = this.client.localCommands.get(interaction.data.custom_id.split('-')[0]);
            if (!Command || !Command.handleMessageComponent) {
                throw new Error('User is trying to use message component that is not handled properly. ' + interaction.data.custom_id)
            }

            await Command.handleMessageComponent(interaction as ComponentInteraction<GuildTextableChannel>)
        } catch (e: any) {
            if (!interaction.acknowledged) {
                await interaction.acknowledge();
            }

            await interaction.createFollowup(this.createErrorMessage(e, config.developers.includes(interaction.member!.id)))
            throw new Error('Could not handle message component ' + e);
        }
    }

    handlePing(interaction: PingInteraction) {
        interaction.acknowledge();
    }

    async handleCommand(interaction: CommandInteraction<GuildTextableChannel>) {
        try {
            if (!interaction.member) {
                throw new Error('An unexpected error occured, please try again.')
            }
            const Command = this.client.localCommands.get(interaction.data.name);
            if (!Command) {
                await interaction.acknowledge(64);
                throw new Error(`User ${interaction.member === undefined ? '' : `(${interaction.member.id})`} tried to use ${interaction.data.name} command. Command does not exist.`);
            }
            // Check to see if the command is on a cooldown;
            let { commandCooldowns } = await this.client.database.getUser(interaction.member);
            if (commandCooldowns && commandCooldowns[interaction.data.name] && Date.now() < commandCooldowns[interaction.data.name]) {
                await interaction.acknowledge(64);
                interaction.createFollowup(`You're on cooldown till <t:${Math.round(commandCooldowns[interaction.data.name] / 1000)}>`)
                return;
            }

            await interaction.acknowledge(Command?.localData.ephemeral ? 64 : 0);

            let options: ConvertedCommandOptions = {};
            if (interaction.data.options) {
                for (const option of interaction.data.options) {
                    switch (option.type) {
                        case SlashCommandOptionTypes.USER:
                            const UserID = (option as any).value;
                            const User = this.client.resolveUser(UserID);

                            // there should never be a user that the bot doesn't have.
                            if (!User) {
                                throw new Error('User cannot be found.')
                            }

                            options[option.name] = {
                                value: (option as any).value,
                                type: option.type,
                                user: User
                            }
                            break;
                        default:
                            options[option.name] = {
                                value: (option as any).value,
                                type: option.type as any
                            }
                            break;
                    }
                }
            }

            let CommandResult = await Command.run(interaction, options);
            if (typeof CommandResult === 'object' && CommandResult?.embeds) {
                for (const [index, embed] of CommandResult.embeds.entries()) {
                    if (!embed?.color) {
                        CommandResult.embeds[index].color = 12473343
                    }
                }
            }
            if (typeof CommandResult === 'object' && CommandResult.embed && !CommandResult.embed?.color) CommandResult.embed.color = 12473343

            interaction.createFollowup(CommandResult);

            // Add the user's cooldown;
            if (!commandCooldowns) {
                commandCooldowns = {};
            }
            commandCooldowns[interaction.data.name] = Date.now() + Command.localData.cooldown;

            this.client.database.editUser(interaction.member, { commandCooldowns })
        } catch (err) {
            if (!interaction.acknowledged) {
                await interaction.acknowledge(64);
            }

            await interaction.createFollowup(this.createErrorMessage(err, config.developers.includes(interaction.member!.id)));
            throw new Error('Could not handle command');
        }
    }
}