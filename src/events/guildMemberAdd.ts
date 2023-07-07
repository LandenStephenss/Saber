import type { Guild, Member } from 'eris';
import { Event } from '../structures/Event.js';
import { replaceShortcuts } from '../util/index.js';
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
                // dum

                this.client.database.editGuild(guild, {
                    $unset: {
                        'welcome.channel': true,
                    },
                });

                if (GuildEntry.moderation.roles.admin) {
                    if (!guild.roles.has(GuildEntry.moderation.roles.admin ?? 0)) {
                        this.client.database.editGuild(guild, {
                            $unset: {
                                'moderation.roles.admin': true,
                            },
                        });
                        // maybe dm server owner.
                        throw new Error('Admin role is invalid, role was deleted.');
                    }

                    //                    const AdminRole = guild.roles.get(GuildEntry.moderation.roles.admin);
                }

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
