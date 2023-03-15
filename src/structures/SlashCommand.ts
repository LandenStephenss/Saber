import { type Bot } from './Client.js';
import type {
    GuildTextableChannel,
    AdvancedMessageContent,
    CommandInteraction,
    MessageContent,
    ComponentInteraction,
    InteractionDataOptions,
    InteractionContentEdit,
} from 'eris';
import { ConvertedCommandOptions } from '../events/interactionCreate.js';
import type {
    InteractionAutocompleteChoices,
    SlashCommandConstructor,
    SlashCommandData,
    SlashCommandLocalData,
} from '../types.js';

export type parsedCustomId = {
    command: string;
    user: string;
    id: string;
};

export abstract class SlashCommand {
    slashCommandData: SlashCommandData;
    localData: SlashCommandLocalData;
    id?: string; // this should get set at ready event.

    handleCommandAutocomplete?(
        option: string,
        value: string,
        otherOptions?: { [key: string]: InteractionDataOptions }
    ): InteractionAutocompleteChoices[] | Promise<InteractionAutocompleteChoices[]>;
    handleMessageComponent?(
        interaction: ComponentInteraction,
        parsedCustomId: {
            command: string;
            user: string;
            id: string;
        }
    ):
        | Promise<string | InteractionContentEdit | void>
        | string
        | InteractionContentEdit
        | void;

    constructor({
        // Discord stuff
        name,
        description,
        options,
        defaultMemberPermissions,
        nsfw,
        // Local stuff
        category = 'miscellaneous',
        cooldown = 3000,
        ephemeral = false,
    }: SlashCommandConstructor) {
        this.slashCommandData = {
            name,
            description,
            options,
            default_member_permissions: defaultMemberPermissions,
            // no commands should be able to be ran in a DM;
            dm_permission: false,
            nsfw,
        };

        this.localData = {
            category,
            cooldown: cooldown,
            ephemeral,
        };
    }

    abstract run(
        interaction: CommandInteraction<GuildTextableChannel>,
        options?: ConvertedCommandOptions
    ):
        | AdvancedMessageContent
        | MessageContent
        | Promise<AdvancedMessageContent | MessageContent>;
}

export type ExtendedSlashCommand = new (client: Bot) => SlashCommand;
