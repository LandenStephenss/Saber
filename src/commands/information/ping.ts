import { Bot } from "../../structures/Client.js";
import { SlashCommand } from "../../structures/SlashCommand.js";

export default class Ping extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'ping',
            description: 'See the bot\'s latency to Discord.',
            category: 'information',
            cooldown: 5000,
            ephemeral: true
        })
    }


    run() {
        return {
            embeds: [
                {
                    title: `Pong! ${this.client.shards.get(0)?.latency === Infinity ?
                        '0' :
                        this.client.shards.get(0)?.latency
                        }ms`
                }
            ]
        };
    }
}