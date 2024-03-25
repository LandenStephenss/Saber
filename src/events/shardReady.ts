import { Event } from '../structures/Event.js';
import type { SlashCommandData } from '../types.js';
import logger from '../util/logger.js';

export default class ShardReady extends Event {
    name = 'shardReady';

    run(id: string) {
        logger.debug(`Shard '${id}' is ready.`);
    }
}
