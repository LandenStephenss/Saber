import {
    type AdvancedMessageContent,
    CommandInteraction
} from "eris";
import {
    Bot
} from "../../structures/Client.js";
import {
    SlashCommand
} from "../../structures/SlashCommand.js";
import {
    MessageComponentTypes
} from "../../types.js";

export default class Roles extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'roles',
            description: 'Setup self assignable roles.',
            category: 'admin',
            defaultMemberPermissions: 0 << 28,
            ephemeral: true
        })
    }


    run(interaction: CommandInteraction): AdvancedMessageContent {
        // todo;
        return {
            content: 'select roles you\'d like',
            components: [
                {
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [
                        {
                            // @ts-expect-error eris dum
                            type: MessageComponentTypes.ROLE_SELECT,
                            custom_id: `roles-roleselect-${interaction.member!.id}`,
                            max_values: 25
                        }
                    ]
                }
            ]
        };
    }
}