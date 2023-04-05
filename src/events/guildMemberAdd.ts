import type { Guild, Member } from 'eris';
import { Event } from '../structures/Event.js';
import { replaceShortcuts } from '../util/replaceShortcuts.js';
import logger from '../util/logger.js';

export default class GuildMemberAdd extends Event {
    name = 'guildMemberAdd';

    async run(guild: Guild, member: Member) {
        const GuildEntry = await this.client.database.getGuild(guild);

        if (!GuildEntry) throw new Error('Could not get guild from database.');
        if (!GuildEntry.welcome?.enabled || !GuildEntry.welcome.join) return;

        const ParsedString = replaceShortcuts(GuildEntry.welcome.join, member, guild);

        if (GuildEntry.welcome.channel) {
            if (!guild.channels.has(GuildEntry.welcome.channel)) {
                // Should probably DM administrators and delete the channel in the database.
                throw new Error('Cannot get channel, could it have been deleted?');
            }

            this.client.createMessage(GuildEntry.welcome.channel, ParsedString);
        }

        if (GuildEntry.welcome.dms) {
            try {
                const DMChannel = await member.user.getDMChannel();
                await this.client.createMessage(DMChannel.id, ParsedString);
            } catch {
                logger.warn(`Could not DM user: ${member.id}`);
            }
        }
    }
}
