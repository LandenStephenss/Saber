import { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import {
    InteractionAutocompleteChoices,
    Item,
    SlashCommandOptionTypes,
} from '../../types.js';

import { Items } from '../../adventures.js';
import { CommandInteraction } from 'eris';
import { ConvertedCommandOptions } from '../../events/interactionCreate.js';

export default class Shop extends SlashCommand {
    shopItems = Items;

    constructor(public client: Bot) {
        super({
            name: 'shop',
            description: "View Saber's shop.",
            category: 'economy',
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View an item in the shop or all items in the shop.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            description: "Item you'd like to view.",
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'buy',
                    description: 'Buy an item from the shop',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            description: "Item you'd like to buy.",
                            required: true,
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'sell',
                    description: 'Sell an item.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            description: "Item you'd like to sell.",
                            required: true,
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'gift',
                    description: 'Gift an item to a user.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            description: "Item you'd like to gift.",
                            required: true,
                            autocomplete: true,
                        },
                        {
                            type: SlashCommandOptionTypes.USER,
                            name: 'user',
                            description: "User you'd like to send a gift to.",
                        },
                    ],
                },
            ],
        });
    }

    searchItems(query: string = ''): Item[] {
        if (query.trim().length === 0) {
            return Items;
        }

        let Result = Items.filter(({ name }) =>
            name.toLowerCase().includes(query.toLowerCase())
        );
        if (Result.length === 0) {
            return Items;
        }

        return Result;
    }

    handleCommandAutocomplete(
        option: string,
        value: string
    ): InteractionAutocompleteChoices[] | Promise<InteractionAutocompleteChoices[]> {
        switch (option) {
            case 'item':
                return this.searchItems(value).map(({ name }) => ({
                    name,
                    value: name,
                }));

            default:
                throw new Error('Autocomplete not handled properly. ' + option);
        }
    }

    run(_: CommandInteraction, options: ConvertedCommandOptions) {
        if (options.view) {
            if (options.view.options!.item) return 'return specific item';

            return 'return all items';
        }

        if (options.buy) return 'buy an item';

        if (options.sell) return 'sell an item';

        if (options.gift) return 'gift an item';

        throw new Error('SubCommand not handled properly ' + options);
    }
}
