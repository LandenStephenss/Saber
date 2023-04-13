import type { AdvancedMessageContent } from 'eris';
import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../types.js';

/**
 * Options layout example.
 *  - set
 *      - welcome message
 *      - leave message
 *      - welcome channel
 *      - join role
 *      -
 */

export default class Ping extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'settings',
            description: 'Change bot settings for your guild.',
            category: 'admin',
            ephemeral: true,
            defaultMemberPermissions: 1 << 28,
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND_GROUP,
                    name: 'set',
                    description: 'Set a specific setting.',
                    options: [
                        // todo; make a system to make all the settings options dynamic.
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND_GROUP,
                    name: 'delete',
                    description: 'Deletes a setting value so that it is default or null.',
                    options: [
                        // todo; make a system to make all the settings options dynamic.
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND_GROUP,
                    name: 'reset',
                    description: 'Reset all settings.',
                    options: [],
                },
            ],
        });
    }

    run(): AdvancedMessageContent {
        return {
            content: 'todo',
        };
    }
}
