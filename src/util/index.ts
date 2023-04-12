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
