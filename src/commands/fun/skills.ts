import { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';
import { SlashCommandOptionTypes } from '../../types.js';

export default class Skills extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'skills',
            description: 'View and train your skills!',
            category: 'fun',
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View your skills.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.USER,
                            name: 'user',
                            required: false,
                            description: "User who's skills you'd like to view.",
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'train',
                    description: 'Train a specific skill',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'skill',
                            required: true,
                            description: "Skill you'd like to train.",
                        },
                    ],
                },
            ],
        });
    }

    run() {
        return 'todo;';
    }
}
