import {
    AdvancedMessageContent,
    ComponentInteraction,
    TextableChannel,
    type CommandInteraction
} from "eris";
import {
    type ConvertedCommandOptions
} from "../../events/interactionCreate.js";
import {
    Bot
} from "../../structures/Client.js";
import {
    SlashCommand
} from "../../structures/SlashCommand.js";
import {
    type InteractionAutocompleteChoices,
    SlashCommandOptionTypes,
    type Adventure as AdventureType,
    MessageComponentTypes,
    MessageComponentButtonStyles
} from "../../types.js";
import {
    Adventures,
    resolveAdventure
} from "../../adventures.js";

export default class Adventure extends SlashCommand {
    autocompleteNames = {
        viewAdventureName: 'viewAdventureName'
    }

    // todo; delete so i can add ID into custom_id
    customIDs = {
        resumeAdventure: 'adventure-resumeAdventure',
        declineResume: 'adventure-declineResume',
    }

    constructor(public client: Bot) {
        super({
            name: 'adventure',
            description: 'Check out adventures!',
            category: 'fun',
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View an adventure',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'adventure',
                            required: true,
                            description: 'Name of the adventure you\'d like to view',
                            autocomplete: true,
                        }
                    ]
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'start',
                    description: 'Start an adventure.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'adventure',
                            required: true,
                            description: 'Name of the adventure you\'d like to start.',
                            autocomplete: true
                        }
                    ]
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'resume',
                    description: 'Resume an on-going adventure.',
                    options: []
                }
            ]
        })
    }

    private searchAdventures(query: string = ''): AdventureType[] {
        if (query.trim().length === 0) {
            return Adventures.slice(0, 25);
        }

        let Result = Adventures.filter(({ name }) => name.includes(query.toLowerCase())).slice(0, 25);

        if (Result.length === 0) {
            return Adventures.slice(0, 25);
        }
        return Result
    }

    private createBulkAdventuresEmbed(page: number): AdvancedMessageContent {
        const AdventuresOnPage = Adventures.slice(page * 5, (page + 1) * 5);

        return {
            embeds: [
                {
                    color: 12473343,
                    title: 'All Adventures',
                    footer: {
                        text: `Page ${page + 1}`
                    },
                    fields: AdventuresOnPage.map((adventure) => {
                        let AdventureEmoji: string | null = null;
                        if (adventure.art?.emoji?.unicode) AdventureEmoji = adventure.art.emoji.unicode;
                        if (adventure.art?.emoji?.id && adventure.art.emoji.name) AdventureEmoji = `<:${adventure.art.emoji.name}:${adventure.art.emoji.id}>`
                        return ({
                            name: `${AdventureEmoji ? AdventureEmoji : ''}${adventure.name}`,
                            value: adventure.description
                        })
                    }).slice(0, 5) // there should not be more than 5 here anyways, but whatever.
                }
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.PRIMARY,
                            custom_id: `adventure-pagedown:${page}`,
                            label: 'Page Down'
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.PRIMARY,
                            custom_id: `adventure-pageup:${page}`,
                            label: 'Page Up'
                        }
                    ]
                }
            ]
        };
    }

    async handleMessageComponent(interaction: ComponentInteraction<TextableChannel>): Promise<void> {


        const Action = interaction.data.custom_id.split('-')[1].split(':')[0];
        const Data = interaction.data.custom_id.split(':')[1];
        const Page = parseInt(Data)
        const MaxPages = Math.ceil(Adventures.length / 5);

        if (Action === 'pageup' && Page + 1 !== MaxPages) {
            interaction.editOriginalMessage(this.createBulkAdventuresEmbed(Page + 1));
            return;
        } else if (Action === 'pagedown' && Page !== 0) {
            interaction.editOriginalMessage(this.createBulkAdventuresEmbed(Page - 1));
            return;
        }


        if (Action === 'acceptAdventure') {

            const User = await this.client.database.getUser(interaction.member!)
            if (User.adventures?.currentAdventure) {
                await interaction.editOriginalMessage(
                    {
                        content: '',
                        embeds: [
                            {
                                color: 12473343,
                                title: 'You already have an on-going adventure. Would you like to resume?',
                                fields: [
                                    {
                                        name: 'Adventure Name',
                                        value: User.adventures.currentAdventure.name
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
                                        style: MessageComponentButtonStyles.PRIMARY,
                                        label: 'Yes',
                                        custom_id: this.customIDs.resumeAdventure
                                    },
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: MessageComponentButtonStyles.DANGER,
                                        label: 'No',
                                        custom_id: this.customIDs.declineResume
                                    }
                                ]
                            }
                        ]
                    }
                );
                return;
            }

            const AdventureName = Data.replace(/-/g, ' ');
            const Adventure = resolveAdventure(({ name }) => name === AdventureName);

            if (!Adventure) {
                interaction.editOriginalMessage('An unexpected error has occured');
                return;
            }

            const FirstEnemey = Adventure.enemies[0]

            await this.client.database.editUser(interaction.member!, {
                'adventures.currentAdventure': {
                    name: AdventureName,
                    currentEnemey: {
                        currentHealth: FirstEnemey.health,
                        currentWeaponHealth: FirstEnemey.weapon.health,
                        currentArmorHealth: FirstEnemey.armor?.health,

                        health: FirstEnemey.health,
                        name: FirstEnemey.name,
                        weapon: FirstEnemey.weapon,
                        isItemDroppable: FirstEnemey.isItemDroppable,
                        armor: FirstEnemey.armor
                    }
                }
            })

            // todo; start moves embed.
            return;
        }

    }

    handleCommandAutocomplete(option: string, value: string, otherOptions: any): InteractionAutocompleteChoices[] | Promise<InteractionAutocompleteChoices[]> {
        switch (option) {
            case 'adventure':
                let SearchedAdventures = this.searchAdventures(value).map(({ name }) => ({
                    name,
                    value: name
                }))

                if (otherOptions.view) {
                    return [
                        {
                            name: 'All Adventures',
                            value: 'all'
                        },
                        ...SearchedAdventures
                    ]
                }
                return SearchedAdventures

            default:
                throw new Error('Autocomplete is not handled properly ' + option);
        }
    }


    run(interaction: CommandInteraction, options: ConvertedCommandOptions) {
        if (options.start && options.start.options?.adventure) {
            const AdventureQuery = options.start.options.adventure.value as string

            const ResolvedAdventure = resolveAdventure(({ name }) => name === AdventureQuery);
            if (!ResolvedAdventure) {
                return `Adventure \`${AdventureQuery}\` does not exist.`
            }

            this.startAdventure(interaction, ResolvedAdventure);
        }


        if (options.view && options.view.options?.adventure) {
            const AdventureQuery = options.view.options!.adventure.value;
            if (AdventureQuery === 'all') {
                return this.createBulkAdventuresEmbed(0);
            }

            const ResolvedAdventure = resolveAdventure(({ name }) => name === AdventureQuery);
            if (!ResolvedAdventure) {
                return `Adventure \`${AdventureQuery}\` does not exist.`
            }

            return {
                embeds: [
                    {
                        title: Adventure.name,
                        description: ResolvedAdventure.description,
                        fields: ResolvedAdventure.enemies.map((enemey) => ({
                            name: enemey.name,
                            value: `\`\`\`nestedtext
Health: ${enemey.health}
Weapon:
    Name: ${enemey.weapon.name}
    Damage: ${enemey.weapon.damage}
    Health: ${enemey.weapon.health}
\`\`\``,
                            inline: true
                        }))
                    }
                ]
            }
        }

        throw new Error('Not sure how you got here.');
    };

    async startAdventure(interaction: CommandInteraction, adventure: AdventureType) {
        await interaction.createFollowup('Attempting to start adventure...')
        const user = await this.client.database.getUser(interaction.member!);
        if (user.adventures?.currentAdventure) {
            await interaction.editOriginalMessage(
                {
                    content: '',
                    embeds: [
                        {
                            color: 12473343,
                            title: 'You already have an on-going adventure. Would you like to resume?',
                            fields: [
                                {
                                    name: 'Adventure Name',
                                    value: user.adventures.currentAdventure.name
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
                                    style: MessageComponentButtonStyles.PRIMARY,
                                    label: 'Yes',
                                    custom_id: this.customIDs.resumeAdventure
                                },
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    style: MessageComponentButtonStyles.DANGER,
                                    label: 'No',
                                    custom_id: this.customIDs.declineResume
                                }
                            ]
                        }
                    ]
                }
            );
        }

        await interaction.editOriginalMessage({
            embeds: [
                {
                    color: 12473343,
                    title: `Are you sure you'd like to start this adventure?`,
                    footer: {
                        text: adventure.name
                    }
                }
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.PRIMARY,
                            label: 'Yes',
                            custom_id: `adventure-acceptAdventure-${adventure.name.replace(/ /g, '%20')}-${interaction.member?.id}`
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'No',
                            custom_id: `adventure-declineAdventure-${interaction.member?.id}`
                        }
                    ]
                }
            ]
        });
    }

    // A prompt asking the user what they'd like to do.
    sendAdventurePrompt() { }

    // handle user attack;
    handleAttack() { };

    // handle user defend;
    handleDefend() { };

    handleSurender() { };
}