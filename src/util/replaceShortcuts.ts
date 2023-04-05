import type { Member, Guild } from 'eris';

export function replaceShortcuts(string: string, member: Member, guild: Guild) {
    return string
        .replace(/{user}/i, member.mention)
        .replace(/{userid}/i, member.id)
        .replace(/{guild}/i, guild.name)
        .replace(/{guildid}/i, guild.id);
}
