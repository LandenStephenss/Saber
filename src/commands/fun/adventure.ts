import type {
    AdvancedMessageContent,
    ComponentInteraction,
    InteractionContentEdit,
    TextableChannel,
    CommandInteraction,
} from 'eris';
import type { ConvertedCommandOptions } from '../../events/interactionCreate.js';
import type { Bot } from '../../structures/Client.js';
import { type parsedCustomId, SlashCommand } from '../../structures/SlashCommand.js';
import {
    type Adventure as AdventureType,
    type AdventureState,
    type InteractionAutocompleteChoices,
    SlashCommandOptionTypes,
    MessageComponentTypes,
    MessageComponentButtonStyles,
} from '../../types.js';
import { Adventures, resolveAdventure } from '../../adventures.js';

export default class Adventure extends SlashCommand {
    autocompleteNames = {
        viewAdventureName: 'viewAdventureName',
    };

    customIDs = {
        resumeAdventure: 'resumeAdventure',
        declineResume: 'declineResume',
        acceptAdventure: 'acceptAdventure',
        declineAdventure: 'declineAdventure',
    };

    constructor(public client: Bot) {
        super({
            name: 'adventure',
            description: 'Check out adventures!',
            category: 'fun',
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View an adventure.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'adventure',
                            required: true,
                            description: "Name of the adventure you'd like to view.",
                            autocomplete: true,
                        },
                    ],
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
                            description: "Name of the adventure you'd like to start.",
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'resume',
                    description: 'Resume an on-going adventure.',
                    options: [],
                },
            ],
        });
    }

    private searchAdventures(query: string = ''): AdventureType[] {
        if (query.trim().length === 0) return Adventures.slice(0, 24);

        let Result = Adventures.filter(({ name }) =>
            name.includes(query.toLowerCase())
        ).slice(0, 25);

        if (Result.length === 0) return Adventures.slice(0, 24);

        return Result;
    }

    private createBulkAdventuresEmbed(page: number): AdvancedMessageContent {
        const AdventuresOnPage = Adventures.slice(page * 5, (page + 1) * 5);

        return {
            embeds: [
                {
                    color: 12473343,
                    title: 'All Adventures',
                    footer: {
                        text: `Page ${page + 1}`,
                    },
                    fields: AdventuresOnPage.map((adventure) => {
                        let AdventureEmoji: string | null = null;
                        if (adventure.art?.emoji?.unicode)
                            AdventureEmoji = adventure.art.emoji.unicode;
                        if (adventure.art?.emoji?.id && adventure.art.emoji.name)
                            AdventureEmoji = `<:${adventure.art.emoji.name}:${adventure.art.emoji.id}>`;
                        return {
                            name: `${AdventureEmoji ? AdventureEmoji : ''}${
                                adventure.name
                            }`,
                            value: adventure.description,
                        };
                    }).slice(0, 5), // there should not be more than 5 here anyways, but whatever.
                },
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.PRIMARY,
                            // some fucky that i didn't want to have to deal with.
                            custom_id: `page${page == 0 ? 0 : page - 1}`,
                            label: 'Page Down',
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.PRIMARY,
                            custom_id: `page${page + 1}`,
                            label: 'Page Up',
                        },
                    ],
                },
            ],
        };
    }

    async handleMessageComponent(
        interaction: ComponentInteraction<TextableChannel>,
        { id }: parsedCustomId
    ): Promise<InteractionContentEdit | void | string> {
        const Value = id;

        if (Value.startsWith('page')) {
            const MaxPages = Math.ceil(Adventures.length / 5);
            const Page = Value.match(/(\d+)$/);

            if (!Page) return;
            if (parseInt(Page[0]) >= MaxPages) return;

            return this.createBulkAdventuresEmbed(
                parseInt(Page[0])
            ) as InteractionContentEdit;
        }

        switch (Value) {
            case this.customIDs.acceptAdventure: {
                const User = await this.client.database.getUser(interaction.member!);
                if (User.adventures?.currentState) {
                    // This get's sent if a user has an on-going adventure.
                    return {
                        content: '',
                        embeds: [
                            {
                                color: 12473343,
                                title: 'You already have an on-going adventure. Would you like to resume?',
                                fields: [
                                    {
                                        name: 'Adventure Name',
                                        value: User.adventures.currentState.name,
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
                                        style: MessageComponentButtonStyles.PRIMARY,
                                        label: 'Yes',
                                        custom_id: this.customIDs.resumeAdventure,
                                    },
                                    {
                                        type: MessageComponentTypes.BUTTON,
                                        style: MessageComponentButtonStyles.DANGER,
                                        label: 'No',
                                        custom_id: this.customIDs.declineResume,
                                    },
                                ],
                            },
                        ],
                    };
                }

                const OriginalMessage = await interaction.getOriginalMessage();
                if (!OriginalMessage) {
                    throw new Error('Could not find original message.');
                }
                const Adventure = resolveAdventure(
                    // this is really scuffed but it works:tm:
                    ({ name }) => name === OriginalMessage.embeds[0]!.footer!.text
                );

                if (!Adventure) {
                    return {
                        content: `Could not find the adventure.`,
                    };
                }

                return this.sendAdventurePrompt(Adventure);
            }
            case this.customIDs.resumeAdventure: {
                // parse the adventure name from the footer.
                return {
                    content: 'test',
                };
            }

            case this.customIDs.declineAdventure: {
                interaction.deleteOriginalMessage();
            }
        }
    }

    handleCommandAutocomplete(
        option: string,
        value: string,
        otherOptions: any
    ): InteractionAutocompleteChoices[] | Promise<InteractionAutocompleteChoices[]> {
        switch (option) {
            case 'adventure':
                let SearchedAdventures = this.searchAdventures(value).map(({ name }) => ({
                    name,
                    value: name,
                }));

                if (otherOptions.view)
                    return [
                        {
                            name: 'All Adventures',
                            value: 'all',
                        },
                        ...SearchedAdventures,
                    ];

                return SearchedAdventures;

            default:
                throw new Error('Autocomplete is not handled properly ' + option);
        }
    }

    run(interaction: CommandInteraction, options: ConvertedCommandOptions) {
        if (options.start && options.start.options?.adventure) {
            const AdventureQuery = options.start.options.adventure.value as string;

            const ResolvedAdventure = resolveAdventure(
                ({ name }) => name === AdventureQuery
            );
            if (!ResolvedAdventure)
                return `Adventure \`${AdventureQuery}\` does not exist.`;

            return this.startAdventure(interaction, ResolvedAdventure);
        }

        if (options.view && options.view.options?.adventure) {
            const AdventureQuery = options.view.options!.adventure.value;
            if (AdventureQuery === 'all') return this.createBulkAdventuresEmbed(0);

            const ResolvedAdventure = resolveAdventure(
                ({ name }) => name === AdventureQuery
            );
            if (!ResolvedAdventure)
                return `Adventure \`${AdventureQuery}\` does not exist.`;

            return {
                embeds: [
                    {
                        title: Adventure.name,
                        description: ResolvedAdventure.description,
                        fields: ResolvedAdventure.enemies.map((enemy) => ({
                            name: enemy.name,
                            value: `\`\`\`nestedtext
  Health: ${enemy.health}
  Weapon:
      Name: ${enemy.weapon.name}
      Damage: ${enemy.weapon.damage}
      Health: ${enemy.weapon.health}
  \`\`\``,
                            inline: true,
                        })),
                    },
                ],
            };
        }

        throw new Error('Could not handle sub command');
    }

    async startAdventure(
        interaction: CommandInteraction,
        adventure: AdventureType
    ): Promise<InteractionContentEdit> {
        const user = await this.client.database.getUser(interaction.member!);
        if (!user) {
            throw new Error('Could not get user');
        }
        if (user.adventures?.currentState)
            return {
                content: '',
                embeds: [
                    {
                        color: 12473343,
                        title: 'You already have an on-going adventure. Would you like to resume?',
                        fields: [
                            {
                                name: 'Adventure Name',
                                value: user.adventures.currentState.name,
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
                                style: MessageComponentButtonStyles.PRIMARY,
                                label: 'Yes',
                                custom_id: this.customIDs.resumeAdventure,
                            },
                            {
                                type: MessageComponentTypes.BUTTON,
                                style: MessageComponentButtonStyles.DANGER,
                                label: 'No',
                                custom_id: this.customIDs.declineResume,
                            },
                        ],
                    },
                ],
            };

        return {
            embeds: [
                {
                    color: 12473343,
                    title: `Are you sure you'd like to start this adventure?`,
                    footer: {
                        text: adventure.name,
                    },
                },
            ],
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.PRIMARY,
                            label: 'Yes',
                            custom_id: this.customIDs.acceptAdventure,
                        },
                        {
                            type: MessageComponentTypes.BUTTON,
                            style: MessageComponentButtonStyles.DANGER,
                            label: 'No',
                            custom_id: this.customIDs.declineAdventure,
                        },
                    ],
                },
            ],
        };
    }

    /**
     * A prompt asking the user what they'd like to do
     * Whenever a user responds to this prompt, it will handle the enemy attack and then resend itself.
     *
     * Example Options
     *
     * 1 - Attack
     * 2 - Defend
     * 3 - Surrender
     */
    sendAdventurePrompt(
        adventure: AdventureType,
        currentState?: AdventureState
    ): AdvancedMessageContent {
        return {
            content: 'adventure prompt',
        };
    }

    // handle user attack;
    handleAttack() {}

    // handle user defend;
    handleDefend() {}

    // handed user surrender;
    handleSurrender() {}
}
