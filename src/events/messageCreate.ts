import type { GuildTextableChannel, Message, User } from 'eris';
import { Event } from '../structures/Event.js';

export default class MessageCreate extends Event {
    name = 'messageCreate';

    async handleMentions(message: Message<GuildTextableChannel>) {
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

    // TODO; handle levels (Need to actually make the levels and then update them if a user has leveled up, also send a message.)
    async handleLeveling(message: Message<GuildTextableChannel>) {
        const DatabaseUser = await this.client.database.getUser(message.member);

        if (
            !DatabaseUser.experience.updatedAt ||
            DatabaseUser.experience.updatedAt + 15000 < Date.now()
        ) {
            await this.client.database.editUser(message.member, {
                $set: {
                    'experience.updatedAt': Date.now(),
                    'experience.value':
                        DatabaseUser.experience.value + Math.floor(Math.random() * 15),
                },
            });
        }
    }

    // todo; setup automod and do automod settings.
    async autoMod() {}

    async run(message: Message<GuildTextableChannel>) {
        if (message.type !== 0 && message.author.bot) return;

        // Pinged command stuff;
        if (message.mentions.length > 0) {
            this.handleMentions(message);
        }

        // Leveling stuff.
        this.handleLeveling(message);
    }
}
