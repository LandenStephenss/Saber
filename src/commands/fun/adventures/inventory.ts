// TODO; make actual command.

import { AdvancedMessageContent } from 'eris';
import type { Bot } from '../../../structures/Client.js';
import { SlashCommand } from '../../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../../types.js';

export default class Inventory extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'inventory',
            description: 'View your inventory',
            category: 'fun',
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View your inventory',
                    options: [],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'equip',
                    description: 'Equip an item.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            required: true,
                            description: "Name of the item you'd like to equip.",
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'trash',
                    description: 'Trash an item',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            required: true,
                            description: "Name of the item you'd like to trash.",
                            autocomplete: true,
                        },
                    ],
                },
            ],
        });
    }

    run(): AdvancedMessageContent {
        return {
            content: 'todo;',
        };
    }
}
