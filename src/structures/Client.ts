import { type ClientOptions, Client, type ComponentInteraction } from 'eris';
import { config } from '../config.js';
import { Database } from '../util/Database.js';
import { loadFiles } from '../util/index.js';
import type { ExtendedEvent } from './Event.js';
import type { ExtendedSlashCommand, SlashCommand } from './SlashCommand.js';
import logger from '../util/logger.js';

enum InteractionTypes {
    PING = 1,
    APPLICATION_COMMAND = 2,
    MESSAGE_COMPONENT = 3,
    APPLICATION_COMMAND_AUTOCOMPLETE = 5,
    MODAL_SUBMIT = 6,
}

export class Bot extends Client {
    developers: string[] = config.developers;
    database = new Database(this);
    localCommands = new Map<string, SlashCommand>();

    constructor(
        opts: ClientOptions = {
            intents: ['all'],
        }
    ) {
        super(`Bot ${config.token}`, opts);
        delete config['token'];
    }

    async start() {
        await Promise.all([
            this.database.start(),
            this.loadEvents(),
            this.loadCommands(),
            this.getDevelopers(),
        ]);

        await this.connect();
    }

    public resolveUser(user: string) {
        return (
            this.users.get(/<@!?(\d+)>/g.exec(user)?.[1] ?? user) ??
            this.users.find((u) => u.username.toLowerCase() === user.toLowerCase())
        );
    }

    public resolveGuild(guild: string) {
        return this.guilds.get(/<@!?(\d+)>/g.exec(guild)?.[1] ?? guild);
    }

    public awaitComponentInteraction(
        filter: (interaction: ComponentInteraction) => boolean,
        timeout: number = 60000
    ) {
        return new Promise<ComponentInteraction>((resolve, reject) => {
            const listener = (interaction: ComponentInteraction) => {
                if (
                    interaction.type === InteractionTypes.MESSAGE_COMPONENT &&
                    filter(interaction as ComponentInteraction)
                ) {
                    this.off('interactionCreate', listener);
                    resolve(interaction);
                }

                this.on('interactionCreate', listener);
                setTimeout(() => {
                    this.off('interactionCreate', listener);
                    reject(new Error('No component interaction was collected in time.'));
                }, timeout);
            };
        });
    }

    private async loadCommands() {
        const commands = await loadFiles<ExtendedSlashCommand>('../commands');
        let loadedCommands = new Array();
        for (const commandClass of commands) {
            const command = new commandClass(this);
            this.localCommands.set(command.slashCommandData.name, command);
            loadedCommands.push(command.slashCommandData.name);
        }

        logger.info(
            `Commands Loaded: ${loadedCommands
                .map((name) => `\u001b[33m${name}\u001b[0m`)
                .join(', ')}.`
        );
    }

    private async loadEvents() {
        const events = await loadFiles<ExtendedEvent>('../events');
        const loadedEvents = new Array();
        for (const eventClass of events) {
            const event = new eventClass(this);
            this.on(event.name, (...args) => {
                try {
                    event.run(...args);
                } catch (e) {
                    logger.error(e as string);
                }
            });
            loadedEvents.push(event.name);
        }

        logger.info(
            `Events Loaded: ${loadedEvents
                .map((name) => `\u001b[33m${name}\u001b[0m`)
                .join(', ')}.`
        );
    }

    private async getDevelopers() {
        const appInfo = await this.getOAuthApplication();
        if (appInfo.team !== null) {
            for (const member of appInfo.team.members) {
                if (this.developers.includes(member.user.id)) continue;
                this.developers.push(member.user.id);
            }
        }
    }
}
