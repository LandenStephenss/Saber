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

        this.editCommands([...this.client.localCommands].map((command) => command[1].slashCommandData))
    }

    editCommands(commands: SlashCommandData[]) {
        try {
            for (const [index, command] of commands.entries()) {
                if (command.name === 'help') {
                    (commands[index].options![0] as StringOption).choices = [...this.client.localCommands]
                        .slice(0, 25)
                        .map((cmd) => ({
                            name: cmd[1].slashCommandData.name,
                            value: cmd[1].slashCommandData.name
                        }))
                }
            }
    
            this.client.bulkEditCommands(commands as any);
        } catch(e) {
            throw new Error('Commands could not be edited.')
        }
    }
}