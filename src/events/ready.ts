import { Event } from '../structures/Event.js';
import { type SlashCommandData } from '../types.js';

export default class Ready extends Event {
    name = 'ready';

    run() {
        const { username, discriminator, id } = this.client.user;
        console.log(`${username}#${discriminator} (${id}) is now online!`);

        this.editCommands(
            [...this.client.localCommands]
                .slice(0, 25)
                .map((command) => command[1].slashCommandData)
        );
    }

    async editCommands(commands: SlashCommandData[]) {
        try {
            const ResultedCommands = await this.client.bulkEditCommands(commands as any);
            for (const Command of ResultedCommands) {
                this.client.localCommands.get(Command.name)!.id = Command.id;
            }
        } catch (e) {
            throw new Error('Commands could not be edited.');
        }
    }
}
