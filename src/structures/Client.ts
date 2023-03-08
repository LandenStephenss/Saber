import {
    type ClientOptions,
    Client,
    ComponentInteraction
} from 'eris';
import {
    config
} from '../config.js';

import {
    Database
} from '../util/Database.js';
import {
    loadFiles
} from '../util/loadFiles.js';
import {
    type ExtendedEvent
} from './Event.js';
import {
    type ExtendedSlashCommand,
    type SlashCommand
} from './SlashCommand.js';

enum InteractionTypes {
    PING = 1,
    APPLICATION_COMMAND = 2,
    MESSAGE_COMPONENT = 3,
    APPLICATION_COMMAND_AUTOCOMPLETE = 5,
    MODAL_SUBMIT = 6
}

export class Bot extends Client {
    developers: string[] = config.developers;
    database = new Database(this)
    localCommands = new Map<string, SlashCommand>();

    constructor(opts: ClientOptions = {
        intents: ['all']
    }) {
        super(`Bot ${config.token}`, opts);
        delete config['token'];
    };

    async start() {
        await Promise.all([
            this.database.start(),
            this.loadEvents(),
            this.loadCommands(),
            this.getDevelopers()
        ])

        await this.connect();
    };

    public resolveUser(user: string) {
        return this.users.get(/<@!?(\d+)>/g.exec(user)?.[1] ?? user)
            ?? this.users.find((u) => u.username.toLowerCase() === user.toLowerCase());
    }

    public awaitComponentInteraction(
        filter: (interaction: ComponentInteraction) => boolean,
        timeout: number = 60000
    ) {

        return new Promise<ComponentInteraction>((resolve, reject) => {
            const listener = (interaction: ComponentInteraction) => {
                if (interaction.type === InteractionTypes.MESSAGE_COMPONENT && filter(interaction as ComponentInteraction)) {
                    this.off('interactionCreate', listener);
                    resolve(interaction);
                }

                this.on('interactionCreate', listener);
                setTimeout(() => {
                    this.off('interactionCreate', listener);
                    reject(new Error('No component interaction was collected in time.'))
                }, timeout)
            }
        })
    }


    private async loadCommands() {
        const commands = await loadFiles<ExtendedSlashCommand>('../commands');
        for (const commandClass of commands) {
            const command = new commandClass(this);
            this.localCommands.set(command.slashCommandData.name, command);
            console.log(`Command loaded: ${command.slashCommandData.name}`)
        }
    }

    private async loadEvents() {
        const events = await loadFiles<ExtendedEvent>('../events');
        for (const eventClass of events) {
            const event = new eventClass(this);
            this.on(event.name, (...args) => {
                try {
                    event.run(...args)
                } catch (e) {
                    console.error(e);
                }
            });
            console.log(`Loaded event: ${event.name}`)
        }
    }

    private async getDevelopers() {
        const appInfo = await this.getOAuthApplication();
        if (appInfo.team !== null) {
            for (const member of appInfo.team.members) {
                if (this.developers.includes(member.user.id)) continue;
                this.developers.push(member.user.id);
            }
        }
    };
};