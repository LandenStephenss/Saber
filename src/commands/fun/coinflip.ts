import type { Bot } from '../../structures/Client.js';
import { SlashCommand } from '../../structures/SlashCommand.js';

export default class CoinFlip extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'coinflip',
            description: 'Flip a coin',
            category: 'fun',
        });
    }

    run() {
        return {
            content: Math.floor(Math.random() * 10) > 5 ? '__Heads__' : '__Tails__',
        };
    }
}
