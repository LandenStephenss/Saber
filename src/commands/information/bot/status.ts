import type { Bot } from '../../../structures/Client.js';
import { SlashCommand } from '../../../structures/SlashCommand.js';
import { humanifyNumber, parseUptime } from '../../../util/index.js';

export default class Ping extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'status',
            description: 'View information about the bot.',
            category: 'information',
            ephemeral: true,
        });
    }

    run() {
        const { username, discriminator } = this.client.user;
        return {
            embeds: [
                {
                    title: `${username}#${discriminator} Status`,
                    fields: [
                        {
                            name: 'Guilds',
                            value: humanifyNumber(this.client.guilds.size),
                            inline: true,
                        },
                        {
                            name: 'Users',
                            value: humanifyNumber(this.client.users.size),
                            inline: true,
                        },
                        {
                            name: '',
                            value: '',
                        },
                        {
                            name: 'Memory Usage',
                            value: `${(
                                process.memoryUsage().heapUsed /
                                1024 /
                                1024
                            ).toFixed(2)} MB`,
                            inline: true,
                        },
                        {
                            name: 'Uptime',
                            value: parseUptime(this.client.uptime / 1000),
                            inline: true,
                        },
                    ],
                    footer: {
                        text: `Ping: ${
                            this.client.shards.get(0)?.latency === Infinity
                                ? 0
                                : this.client.shards.get(0)?.latency
                        }ms`,
                    },
                },
            ],
        };
    }
}
