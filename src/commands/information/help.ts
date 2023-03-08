import {
    SlashCommand,
    SlashCommandOptionTypes
} from "../../structures/SlashCommand.js";
import {
    type Bot
} from "../../structures/Client.js";
import {
    AdvancedMessageContent,
    type ComponentInteraction,
    type CommandInteraction,
    type GuildTextableChannel,
    ComponentInteractionSelectMenuData,
} from "eris";
import {
    ConvertedCommandOptions
} from "../../events/interactionCreate.js";
import {
    MessageComponentTypes
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
                    // Choices will be automatically added whenever commands are edited.
                    choices: []
                }
            ],
            category: 'information',
            ephemeral: true
        })
    }

    async handleMessageComponent(interaction: ComponentInteraction<GuildTextableChannel>): Promise<void> {
        switch (interaction.data.custom_id) {
            case this.customIDs.all:
                console.log('display all commands');
                break;
            case this.customIDs.select:
                interaction.editOriginalMessage(this.createCommandEmbed((interaction.data as ComponentInteractionSelectMenuData).values[0]));
                break;
        }
    }

    createCommandEmbed(command: string = 'help'): AdvancedMessageContent {

        return { content: command, embeds: [] }
    };

    createBulkEmbed(): AdvancedMessageContent {
        const Fields: string[] = []

        for (const [, { localData: { category } }] of this.client.localCommands) {
            if (!Fields.includes(category)) {
                Fields.push(category)
            }
        }

        return {
            embeds: [
                {
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

    run(interaction: CommandInteraction<GuildTextableChannel>, options: ConvertedCommandOptions) {
        // const action = this.client.awaitComponentInteraction(this.handleComponentInteraction);
        if (options.command) {
            return this.createBulkEmbed();
        } else {
            return this.createBulkEmbed();
        }
    }
}