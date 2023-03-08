import { readFile } from "fs/promises";
import {
    type Adventure,
    type Item
} from './types.js'

export type Cfg = {
    applicationId: string,
    /** Discord bot token - Optional because it is deleted at startup. */
    token?: string;
    /** List of developers by Discord id. */
    developers: string[];

    mongo: {
        uri: string;
        database: string;
    },

    settings: {
        economy: {
            defaultGold: number;
        }
    }

    adventures: { [key: string]: Adventure }
    // Items that will be in the store. Other items *can* exist, but they may not be dropped or even aquired in some cases.
    storeItems: { [key: string]: Item }
};


let config: Cfg;

try {
    const configFile = await readFile('./config.json', 'utf-8')
    config = JSON.parse(configFile);
} catch (e: any) {
    throw new Error('Could not load config! ' + e);
}

if (!config) {
    throw new Error('Config file is missing!')
}

export { config }