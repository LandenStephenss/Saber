import type { GuildTextableChannel, Message } from 'eris';
import { Event } from '../structures/Event.js';
export default class MessageCreate extends Event {
    name = 'messageCreate';

    async run(message: Message<GuildTextableChannel>) {
        if (message.type !== 0 && message.author.bot) return;

        if (message.mentions.length > 0) {
            for (const mention of message.mentions) {
                if (mention.id === message.member.id) continue;
                const DatabaseUser = await this.client.database.getUser(mention);
                if (
                    !DatabaseUser.pingedGif ||
                    (DatabaseUser.pingedGif.lastSent &&
                        DatabaseUser.pingedGif.lastSent + 3e5 > Date.now())
                )
                    continue;

                await this.client.database.editUser(mention, {
                    $currentDate: {
                        'pingedGif.lastSent': { $type: 'timestamp' },
                    },
                });
                this.client.createMessage(message.channel.id, DatabaseUser.pingedGif.url);
            }
        }
    }
}
