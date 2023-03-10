// TODO;
import {
    type Bot
} from './Client.js'
import {
    type GuildTextableChannel,
    type AdvancedMessageContent,
    type CommandInteraction,
    type MessageContent,
    type ComponentInteraction,
    type InteractionDataOptionWithValue,
} from 'eris'
import {
    ConvertedCommandOptions
} from '../events/interactionCreate.js';
import { InteractionAutocompleteChoices, SlashCommandConstructor, SlashCommandData, SlashCommandLocalData } from '../types.js';


export abstract class SlashCommand {
    slashCommandData: SlashCommandData;
    localData: SlashCommandLocalData;

    handleCommandAutocomplete?(option: string, value: string, otherOptions?: { [key: string]: InteractionDataOptionWithValue }): InteractionAutocompleteChoices[] | Promise<InteractionAutocompleteChoices[]>;
    handleMessageComponent?(interaction: ComponentInteraction): void;

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
        }

        this.localData = {
            category,
            cooldown: cooldown,
            ephemeral
        }
    }

    abstract run(interaction: CommandInteraction<GuildTextableChannel>, options?: ConvertedCommandOptions): AdvancedMessageContent | MessageContent | Promise<AdvancedMessageContent | MessageContent>
}

export type ExtendedSlashCommand = new (client: Bot) => SlashCommand;