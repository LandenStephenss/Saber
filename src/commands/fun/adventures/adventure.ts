import type {
    AdvancedMessageContent,
    ComponentInteraction,
    InteractionContentEdit,
    TextableChannel,
    CommandInteraction,
    Member,
} from 'eris';
import type { ConvertedCommandOptions } from '../../../events/interactionCreate.js';
import type { Bot } from '../../../structures/Client.js';
import { type parsedCustomId, SlashCommand } from '../../../structures/SlashCommand.js';
import {
    type Adventure as AdventureType,
    type AdventureState,
    type InteractionAutocompleteChoices,
    SlashCommandOptionTypes,
    MessageComponentTypes,
    MessageComponentButtonStyles,
    AttackItem,
} from '../../../types.js';
import { Adventures, resolveAdventure, DefenseChance } from '../../../adventures.js';

export default class Adventure extends SlashCommand {
    autocompleteNames = {
        viewAdventureName: 'viewAdventureName',
    };

    customIDs = {
        resumeAdventure: 'resumeAdventure',
        declineResume: 'declineResume',
        acceptAdventure: 'acceptAdventure',
        declineAdventure: 'declineAdventure',

        startAdventure: 'startAdventure',

        adventureAttack: 'adventureAttack',
        adventureDefend: 'adventureDefend',
        adventureSurrender: 'adventureSurrender',

        confirmSurrender: 'confirmSurrender',
        declineSurrender: 'declineSurrender',

        decline: 'decline',
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
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'surrender',
                    description: 'Surrender an on-going adventure.',
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

        if (!interaction.member) {
            throw new Error('Interaction has no member.');
        }

        switch (Value) {
            case this.customIDs.acceptAdventure: {
                const User = await this.client.database.getUser(interaction.member!);
                if (User.adventures?.currentState) {
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
                                        custom_id: this.customIDs.decline,
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

                if (
                    !User.adventures.inventory.equipped.attack ||
                    User.adventures.inventory.equipped.attack.length === 0
                ) {
                    return {
                        // todo; link user to inventory command.
                        content: 'You do not have any items equipped.',
                    };
                }

                const CurrentState = {
                    name: Adventure.name,
                    equipped: {
                        attack: User.adventures.inventory.equipped.attack.map(
                            (att: AttackItem) => ({
                                ...att,
                                currentHealth: att.health,
                            })
                        ),
                        armor: {
                            helmet: User.adventures.inventory.equipped.armor?.helmet
                                ? {
                                      currentHealth:
                                          User.adventures.inventory.equipped.armor.helmet
                                              .health,
                                      ...User.adventures.inventory.equipped.armor.helmet,
                                  }
                                : undefined,
                            chestplate: User.adventures.inventory.equipped.armor
                                ?.chestplate
                                ? {
                                      currentHealth:
                                          User.adventures.inventory.equipped.armor
                                              .chestplate.health,
                                      ...User.adventures.inventory.equipped.armor
                                          .chestplate,
                                  }
                                : undefined,
                            pants: User.adventures.inventory.equipped.armor?.pants
                                ? {
                                      currentHealth:
                                          User.adventures.inventory.equipped.armor.pants
                                              .health,
                                      ...User.adventures.inventory.equipped.armor.pants,
                                  }
                                : undefined,
                            boots: User.adventures.inventory.equipped.armor?.boots
                                ? {
                                      currentHealth:
                                          User.adventures.inventory.equipped.armor.boots
                                              .health,
                                      ...User.adventures.inventory.equipped.armor.boots,
                                  }
                                : undefined,
                        },
                    },

                    currentEnemy: {
                        currentHealth: Adventure.enemies[0].health,
                        currentWeapon: {
                            ...Adventure.enemies[0].weapon,
                            currentHealth: 0,
                        },
                        currentArmor: {
                            // todo;
                            helmet: undefined,
                            chestplate: undefined,
                            pants: undefined,
                            boots: undefined,
                        },
                        ...Adventure.enemies[0],
                    },
                };

                try {
                    await this.client.database.editUser(interaction.member!, {
                        $set: {
                            'adventures.currentState': CurrentState,
                        },
                        $unset: {
                            'adventures.inventory.equipped.attack': true,
                            'adventures.inventory.equipped.potion': true,
                            'adventures.inventory.equipped.shield': true,
                            'adventures.inventory.equipped.armor': true,
                        },
                    });

                    return this.sendAdventurePrompt(CurrentState);
                } catch (e) {
                    throw new Error('Could not set adventure state.');
                }
            }
            case this.customIDs.resumeAdventure: {
                return this.resumeAdventure(interaction.member);
            }

            case this.customIDs.adventureAttack: {
                return this.handleAttack(interaction.member!);
            }
            case this.customIDs.adventureDefend: {
                return this.handleDefend(interaction.member!);
            }
            case this.customIDs.adventureSurrender: {
                return {
                    content: "Are you sure you'd like to surrender?",
                    embeds: [],
                    components: [
                        {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    style: MessageComponentButtonStyles.PRIMARY,
                                    label: 'Yes',
                                    custom_id: this.customIDs.confirmSurrender,
                                },
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    style: MessageComponentButtonStyles.DANGER,
                                    label: 'No',
                                    custom_id: this.customIDs.declineSurrender,
                                },
                            ],
                        },
                    ],
                };
            }
            case this.customIDs.confirmSurrender: {
                return this.handleSurrender(interaction.member!);
            }
            case this.customIDs.declineSurrender: {
                return this.resumeAdventure(interaction.member);
            }
            case this.customIDs.decline: {
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
        if (!interaction.member) {
            throw new Error('Interaction has no member');
        }

        if (options.start && options.start.options?.adventure) {
            const AdventureQuery = options.start.options.adventure.value as string;

            const ResolvedAdventure = resolveAdventure(
                ({ name }) => name === AdventureQuery
            );
            if (!ResolvedAdventure)
                return `Adventure \`${AdventureQuery}\` does not exist.`;

            return this.startAdventure(interaction, ResolvedAdventure);
        }

        if (options.view) {
            if (!options.view.options?.adventure) {
                return this.createBulkAdventuresEmbed(0);
            }

            const AdventureQuery = options.view.options!.adventure?.value;
            console.log(AdventureQuery);

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

        if (options.resume) {
            return this.resumeAdventure(interaction.member);
        }

        if (options.surrender) {
            return this.handleSurrender(interaction.member!);
        }

        throw new Error('Could not handle sub command');
    }

    // Resume the user's adventure.
    async resumeAdventure(member: Member): Promise<AdvancedMessageContent> {
        const user = await this.client.database.getUser(member);
        if (!user) {
            throw new Error('Could not get user.');
        }

        if (!user.adventures?.currentState) {
            return {
                content: '',
                embeds: [
                    {
                        color: 12473343,
                        title: `You do not currently have an adventure started. Start one by running the command </${this.slashCommandData.name} start:${this.id}>`,
                    },
                ],
                components: [],
            };
        }

        return this.sendAdventurePrompt(user.adventures.currentState);
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
                                custom_id: this.customIDs.decline,
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
                            custom_id: this.customIDs.decline,
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
    sendAdventurePrompt(currentState: AdventureState): AdvancedMessageContent {
        try {
            // todo; prompt the user to make a move
            const Adventure = Adventures.find((i) => i.name === currentState.name);

            if (!Adventure) {
                throw new Error('Adventure no longer exists!');
            }

            return {
                content: 'WIP;',
                embeds: [
                    {
                        title: Adventure.name,
                        fields: [
                            {
                                name: 'Current Enemey',
                                value: `\`\`\`nestedtext
Health: ${currentState.currentEnemy.currentHealth}/${currentState.currentEnemy.health}
Weapon:
    Name: ${currentState.currentEnemy.weapon.name}
    Damage: ${currentState.currentEnemy.weapon.damage}
    Health: ${currentState.currentEnemy.currentWeapon.currentHealth}/${currentState.currentEnemy.weapon.health}
\`\`\``,
                                inline: true,
                            },
                            // TODO; add armor to this embed field.
                            {
                                name: 'Equipped Items',
                                value: `\`\`\`nestedtext
Attack: ${currentState.equipped.attack
                                    .map(
                                        (i) => `
    Name: ${i.name}
        Health: ${i.currentHealth}/${i.health}
        Damage: ${i.damage}
        Type: ${i.type.split('')[0].toUpperCase() + i.type.split('').slice(1).join('')}`
                                    )
                                    .join('\n')}

Armor:
    Helmet: ${
        currentState.equipped.armor?.helmet
            ? `
        Name: ${currentState.equipped.armor.helmet.name}
        Health: ${currentState.equipped.armor.helmet.currentHealth}/${currentState.equipped.armor.helmet.health}`
            : 'N/A'
    }
    Chestplate: ${
        currentState.equipped.armor?.chestplate
            ? `
        Name: ${currentState.equipped.armor.chestplate.name}
        Health: ${currentState.equipped.armor.chestplate.currentHealth}/${currentState.equipped.armor.chestplate.health}`
            : 'N/A'
    }
    Pants: ${
        currentState.equipped.armor?.pants
            ? `
        Name: ${currentState.equipped.armor.pants.name}
        Health: ${currentState.equipped.armor.pants.currentHealth}/${currentState.equipped.armor.pants.health}`
            : 'N/A'
    }
    Boots: ${
        currentState.equipped.armor?.boots
            ? `
        Name: ${currentState.equipped.armor.boots.name}
        Health: ${currentState.equipped.armor.boots.currentHealth}/${currentState.equipped.armor.boots.health}`
            : 'N/A'
    }
\`\`\``,
                                inline: true,
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
                                label: 'Attack',
                                custom_id: this.customIDs.adventureAttack,
                            },
                            {
                                type: MessageComponentTypes.BUTTON,
                                style: MessageComponentButtonStyles.PRIMARY,
                                label: 'Defend',
                                custom_id: this.customIDs.adventureDefend,
                            },
                            {
                                type: MessageComponentTypes.BUTTON,
                                style: MessageComponentButtonStyles.DANGER,
                                label: 'Surrender',
                                custom_id: this.customIDs.adventureSurrender,
                            },
                        ],
                    },
                ],
            };
        } catch (e: any) {
            throw new Error(e);
        }
    }

    // handle user attack;
    handleAttack(member: Member) {
        console.log('user is attacking');
    }

    // handle user defend;
    handleDefend(member: Member) {
        const CanDefend = parseInt(Math.random().toFixed(2)) <= DefenseChance;

        if (CanDefend) {
            console.log('user has defended successfully');
        } else {
            console.log('user could not defend');
        }
    }

    // handed user surrender;
    // todo; if user has not made a move, give them back their equipped items.
    async handleSurrender(member: Member) {
        const CurrentAdventureState = await this.client.database.getUser(member);
        if (!CurrentAdventureState.adventures.currentState) {
            return {
                content:
                    'Could not surrender because you do not currently have an adventure started.',
                embeds: [],
                components: [],
            };
        }

        const Adventure = resolveAdventure(
            (a) => a.name === CurrentAdventureState.adventures.currentState!.name
        );

        if (!Adventure) {
            this.client.database.editUser(member, {
                $unset: {
                    'adventures.currentState': true,
                },
            });
            throw new Error('Adventure does not exist anymore.');
        }

        // unsetting it like this **will** lose the players inventory even if they have not made a move yet.
        // Should probably fix that, or let the user know that their inventory is non-recoverable unless they complete the adventure.
        this.client.database.editUser(member, {
            $unset: {
                'adventures.currentState': true,
            },
        });

        return {
            content: `You have surrendered the adventure \`${Adventure.name}\``,
            embeds: [],
            components: [],
        };
    }
}
