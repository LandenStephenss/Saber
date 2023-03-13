import {
    SlashCommand,
} from "../../structures/SlashCommand.js";
import {
    type Bot
} from "../../structures/Client.js";
import {
    type ComponentInteraction,
    type CommandInteraction,
    type GuildTextableChannel,
    type AdvancedMessageContent,
    type ComponentInteractionSelectMenuData,
} from "eris";
import {
    ConvertedCommandOptions
} from "../../events/interactionCreate.js";
import {
    type InteractionAutocompleteChoices,
    MessageComponentButtonStyles,
    MessageComponentTypes,
    SlashCommandOptionTypes
} from '../../types.js'

export default class Help extends SlashCommand {
    customIDs = {
        all: 'help-allcommands',
        select: 'help-selectcommand'
    }

    constructor(public client: Bot) {
        super({
            name: 'help',
            description: 'View a list of commands that the bot has.',
            options: [
                {
                    name: 'command',
                    description: 'Command you\'d like information about',
                    required: false,
                    type: SlashCommandOptionTypes.STRING,
                    autocomplete: true
                }
            ],
            category: 'information',
            ephemeral: true
        })
    }

    private searchCommands(query: string) {
        if (query && query.trim().length == 0) {
            return [...this.client.localCommands];
        }

        return [...this.client.localCommands]
            .filter(([, { slashCommandData: { name } }]) => name.includes(query.toLowerCase()))


    };

    handleCommandAutocomplete(option: string, value: string, options: any): InteractionAutocompleteChoices[] | Promise<InteractionAutocompleteChoices[]> {
        switch (option) {
            case 'command':
                return this.searchCommands(value).map(([, { slashCommandData: { name } }]) => ({
                    name: name,
                    value: name
                })).slice(0, 25);

            default:
                return [];
        }
    }

    async handleMessageComponent(interaction: ComponentInteraction<GuildTextableChannel>) {
        switch (interaction.data.custom_id) {
            case this.customIDs.all:
                interaction.editOriginalMessage(this.createBulkEmbed());
                break;
            case this.customIDs.select:
                try {
                    interaction.editOriginalMessage(this.createCommandEmbed((interaction.data as ComponentInteractionSelectMenuData).values[0]));
                } catch (e) {
                    interaction.createMessage(`Command \`${(interaction.data as ComponentInteractionSelectMenuData).values[0]}\` does not exist.`)
                }
                break;
        }
    }

    private createCommandEmbed(query: string = 'help'): AdvancedMessageContent {
        try {
            const Command = this.client.localCommands.get(query.toLowerCase());
            if (!Command) {
                throw new Error('Command does not exist');
            }
            return {
                embeds: [
                    {
                        color: 12473343,
                        title: Command.slashCommandData.name.split('')[0].toUpperCase() + Command.slashCommandData.name.split('').slice(1).join(''),
                        fields: [
                            {
                                name: 'Description',
                                value: Command.slashCommandData.description
                            }
                        ]
                    }
                ],
                components: [
                    {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.BUTTON,
                                style: MessageComponentButtonStyles.SECONDARY,
                                custom_id: this.customIDs.all,
                                label: 'View All Commands',
                                emoji: {
                                    id: null,
                                    name: '📖'
                                }
                            }
                        ]
                    }
                ]
            }
        } catch (e) {
            return {
                embeds: [],
                content: `Command \`${query}\` does not exist`,
                components: [
                    {
                        type: MessageComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: MessageComponentTypes.BUTTON,
                                style: MessageComponentButtonStyles.SECONDARY,
                                custom_id: this.customIDs.all,
                                label: 'View All Commands',
                                emoji: {
                                    id: null,
                                    name: '📖'
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    private createBulkEmbed(): AdvancedMessageContent {
        const Fields: string[] = []

        for (const [, { localData: { category } }] of this.client.localCommands) {
            if (!Fields.includes(category)) {
                Fields.push(category)
            }
        }

        return {
            embeds: [
                {
                    color: 12473343,
                    title: `${this.client.user.username}'s available commands!`,
                    fields: Fields.map((field) => ({
                        name: `${field.split('')[0].toUpperCase() + field.split('').slice(1).join('')}`,
                        value: `\`${[...this.client.localCommands]
                            .filter(([, { localData: { category } }]) => category === field)
                            .map(([, { slashCommandData: { name } }]) => name)
                            .join('`, `')
                            }\``
                    }))
                },
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.STRING_SELECT,
                            custom_id: this.customIDs.select,
                            options: [...this.client.localCommands]
                                .map(([, { slashCommandData: {
                                    name,
                                    description
                                } }]) => ({
                                    label: name.split('')[0].toUpperCase() + name.split('').slice(1).join(''),
                                    value: name,
                                    description: description
                                }))
                        }
                    ]
                }
            ]
        }
    };

    run(_: CommandInteraction<GuildTextableChannel>, options: ConvertedCommandOptions) {
        try {
            if (options.command) {
                return this.createCommandEmbed(options.command.value as string);
            }
            return this.createBulkEmbed();

        } catch (e: any) {
            throw new Error(e);
        }
    }
}