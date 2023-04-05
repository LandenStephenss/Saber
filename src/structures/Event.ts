import type { Bot } from './Client.js';

export abstract class Event {
    abstract name: string;
    abstract run(...args: unknown[]): void;

    constructor(public client: Bot) {}
}

export type ExtendedEvent = new (client: Bot) => Event;
