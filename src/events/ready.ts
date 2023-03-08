import { Event } from "../structures/Event.js";
import {
    type SlashCommandData,
    type StringOption
} from '../structures/SlashCommand.js';

export default class Ready extends Event {
    name = "ready";

    run() {
        const { username, discriminator, id } = this.client.user;
        console.log(`${username}#${discriminator} (${id}) is now online!`)

        this.editCommands([...this.client.localCommands].slice(0, 25).map((command) => command[1].slashCommandData))
    }

    async editCommands(commands: SlashCommandData[]) {
        try {
            for await (const [index, command] of commands.entries()) {
                if (command.name === 'help') {
                    (commands[index].options![0] as StringOption).choices = [...commands.map((command) => ({ name: command.name, value: command.name }))]
                }
            }

            this.client.bulkEditCommands(commands as any);
        } catch (e) {
            throw new Error('Commands could not be edited.')
        }
    }
}