import type { Member, Guild } from 'eris';
import { readdir } from 'fs/promises';

/**
 * Adds commas to numbers so that it is better to read.
 * @param {number | string} number
 * @returns {string} A more human readable number.
 */
export function humanifyNumber(number: number | string): string {
    return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

const Methods = [
    { name: 'Days', count: 86400 },
    { name: 'Hours', count: 3600 },
    { name: 'Minutes', count: 60 },
    { name: 'Seconds', count: 1 },
];

/**
 * Parse uptime from a number (in seconds);
 * @param {number} time Time in seconds.
 * @returns {string} A human readable time.
 */
export function parseUptime(time: number): string {
    const timeStr = [Math.floor(time / Methods[0].count).toString() + Methods[0].name];
    for (let i = 0; i < 3; i++) {
        timeStr.push(
            `${Math.floor((time % Methods[i].count) / Methods[i + 1].count).toString()} ${
                Methods[i + 1].name
            }`
        );
    }

    return timeStr.filter((val) => !val.startsWith('0')).join(' ');
}

/**
 * Replaces different shortcuts with identifiers.
 * @param {string} string String that has shortcuts in it.
 * @param {Member} member Member object
 * @param {Guild} guild Guild object
 * @returns {string} A string with all the shortcuts in it replaced
 */
export function replaceShortcuts(string: string, member: Member, guild: Guild) {
    return string
        .replace(/{user}/i, member.mention)
        .replace(/{userid}/i, member.id)
        .replace(/{guild}/i, guild.name)
        .replace(/{guildid}/i, guild.id);
}

/**
 * Loads modules from a specific directory.
 * @param {string} path Directory that the folder should be loaded into.
 * @returns {Promise<T[]>}
 */
export const loadFiles = async <T>(path: string): Promise<T[]> => {
    const files = await readdir(new URL(path, import.meta.url), {
        withFileTypes: true,
    });

    const modules = [];
    for (const file of files) {
        const filePath = `${path}/${file.name}`;
        if (file.isDirectory()) {
            modules.push(...(await loadFiles<T>(filePath)));
        } else if (filePath.endsWith('.js')) {
            const imported = await import(filePath);
            modules.push(imported.default ?? imported);
        }
    }

    return modules;
};
