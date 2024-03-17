import { readFile } from 'fs/promises';

export type Cfg = {
    applicationId: string;
    /** Discord bot token - Optional because it is deleted at startup. */
    token?: string;
    /** List of developers by Discord id. */
    developers: string[];

    mongo: {
        uri: string;
        database: string;
    };
};

let config: Cfg;

try {
    const configFile = await readFile('./config.json', 'utf-8');
    config = JSON.parse(configFile);
} catch (e: any) {
    throw new Error('Could not load config! ' + e);
}

if (!config) {
    throw new Error('Config file is missing!');
}

export { config };
