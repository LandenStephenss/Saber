const info = (str: string) => {
    const Tag = `\u001b[32m${writeTag('INFO')}\u001b[0m`;
    writeLogLines(Tag, getTime(), str);
};

const error = (str: string) => {
    const Tag = `\u001b[31m${writeTag('ERROR')}\u001b[0m`;
    writeLogLines(Tag, getTime(), str);
};

const warn = (str: string) => {
    const Tag = `\u001b[33m${writeTag('ERROR')}\u001b[0m`;
    writeLogLines(Tag, getTime(), str);
};

const debug = (str: string) => {
    const Tag = `\u001b[38;5;241m${writeTag('DEBUG')}\u001b[0m`;
    writeLogLines(Tag, getTime(), str);
};

const writeLogLines = (tag: string, time: string, str: string) => {
    const Lines = str.split('\n');
    for (const Line of Lines) {
        console.log(`${tag} | ${time} >> ${Line}`);
    }
};

const writeTag = (tag: string) => {
    return `[${tag}]`.padEnd(7);
};

const getTime = () => {
    const date = new Date();
    return `\u001b[35m[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]\u001b[0m`.padEnd(
        10
    );
};

export default {
    error,
    warn,
    debug,
    info,
};
