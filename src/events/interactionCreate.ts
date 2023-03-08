import { Event } from "../structures/Event.js";
import {
    type PingInteraction,
    type UnknownInteraction,
    type CommandInteraction,
    type ComponentInteraction,
    type AutocompleteInteraction,
    type User,
    type GuildTextableChannel,
    type Message
} from 'eris'
import {
    MessageComponentData,
    SlashCommandOptionTypes
} from "../structures/SlashCommand.js";
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
    APPLICATION_COMMAND_AUTOCOMPLETE = 5,
    MODAL_SUBMIT = 6
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
        }
    }

    async handleMessageComponent(interaction: ComponentInteraction) {
        await interaction.acknowledge();

        const Command = this.client.localCommands.get(interaction.data.custom_id.split('-')[0]);
        if (!Command) {
            throw new Error('User is trying to use message component that is not handled properly. ' + interaction.data.custom_id)
        }

        await Command.handleMessageComponent(interaction as ComponentInteraction<GuildTextableChannel>)

        // try {
        //     await interaction.acknowledge()


        //     if (!interaction.data.custom_id) {
        //         throw new Error('Message component interaction is missing custom_id')
        //     }

        //     const Command = this.client.localCommands.get(interaction.data.custom_id.split('-')[0]);
        //     if (!Command) {
        //         throw new Error(`User trying to use message component that is not handled properly. \nCustom ID: ${interaction.data.custom_id}\nMessage ID: ${interaction.message.id}`)
        //     }

        //     await Command?.handleMessageComponent(interaction);
        // } catch (e) {
        //     // figure out why this is erroring.
        //     throw new Error('Could not handle message component' + e);
        // }
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
                interaction.createFollowup('An error has occured. Please report it to a developer.');
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

            if (config.developers.includes(interaction.member?.id as string)) {
                interaction.createFollowup(`\`\`\`\nAn error has occured\n\n${err}\`\`\``)
                console.error(err);
                return;
            }

            interaction.createFollowup('An error has occured. Please report it to a developer.');
            console.error(err);
        }
    }
}