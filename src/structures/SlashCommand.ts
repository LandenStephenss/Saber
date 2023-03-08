// TODO;
import {
    type Bot
} from './Client.js'
import {
    type GuildTextableChannel,
    type Message,
    type AdvancedMessageContent,
    type CommandInteraction,
    type MessageContent,
    ComponentInteraction
} from 'eris'
import {
    ConvertedCommandOptions
} from '../events/interactionCreate.js';

export type SlashCommandData = {
    name: string;
    description: string;
    options?: CommandOption[];
    default_member_permissions?: string | undefined;
    dm_permission: boolean;
    nsfw?: boolean;
}

type DiscordLocals = {
    id?: string // Indonesian
    da?: string	// Danish
    de?: string	// German
    fr?: string // French	
    hr?: string // Croatian	
    it?: string // Italian	
    lt?: string // Lithuanian	
    hu?: string // Hungarian	
    nl?: string // Dutch	
    no?: string // Norwegian	
    pl?: string // Polish	
    vi?: string // Vietnamese	
    tr?: string // Turkish	
    cs?: string // Czech	
    el?: string // Greek	
    bg?: string // Bulgarian	
    ru?: string // Russian	
    uk?: string // Ukrainian	
    hi?: string // Hindi	
    th?: string // Thai	
    ro?: string // Romanian, Romania
    fi?: string // Finnish	
    ko?: string // Korean
    ja?: string // Japanese	
    "en-GB"?: string // English, UK
    "en-US"?: string // English, US
    "es-ES"?: string // Spanish
    "zh-CN"?: string //	Chinese, China
    "zh-TW"?: string // Chinese, Taiwan
    "pt-BR"?: string // Portuguese, Brazilian
    "sv-SE"?: string // Swedish	
}

type SlashCommandConstructor = {
    // Discord things
    name: string;
    name_localizations?: DiscordLocals
    description: string;
    description_localizations?: DiscordLocals
    options?: CommandOption[],
    nsfw?: boolean;
    defaultMemberPermissions?: string;
    // Local things;
    category?: string;
    cooldown?: number;
    ephemeral?: boolean;

}

type BaseOption = {
    name: string;
    name_localizations?: DiscordLocals
    description: string;
    description_localizations?: DiscordLocals
    required?: boolean;
}

export enum ChannelTypes {
    GUILD_TEXT = 0,
    DM = 1,
    GUILD_VOICE = 2,
    GROUP_DM = 3,
    GUILD_CATEGORY = 4,
    GUILD_ANNOUCEMENT = 5,
    ANNOUNCEMENT_THREAD = 10,
    PUBLIC_THREAD = 11,
    PRIVATE_THREAD = 12,
    GUILD_STAGE_VOICE = 13,
    GUILD_DIRECTORY = 14,
    GUILD_FORUM = 15,
}

type CommandOption = SubCommandOption
    | SubCommandGroupOption
    | StringOption
    | IntegerOption
    | BooleanOption
    | UserOption
    | ChannelOption
    | RoleOption
    | MentionableOption
    | NumberOption
    | AttachmentOption;

type CommandOptionChoice = {
    name: string;
    value: string;
}

export enum SlashCommandOptionTypes {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
    MENTIONABLE = 9,
    NUMBER = 10,
    ATTACHMENT = 11
}

export type SubCommandOption = {
    type: SlashCommandOptionTypes.SUB_COMMAND;
    options: CommandOption[];
} & BaseOption;
export type SubCommandGroupOption = {
    type: SlashCommandOptionTypes.SUB_COMMAND_GROUP;
    options: CommandOption[];
} & BaseOption;
export type StringOption = {
    type: SlashCommandOptionTypes.STRING;
    choices?: CommandOptionChoice[];
    min_length?: number; // Minimum of 1
    max_length?: number // Maximum of 6000
    autocomplete?: boolean;
} & BaseOption;
export type IntegerOption = {
    type: SlashCommandOptionTypes.INTEGER;
    choices?: CommandOptionChoice[];
    min_value?: number;
    max_value?: number;
    autocomplete?: boolean;
} & BaseOption
export type BooleanOption = {
    type: SlashCommandOptionTypes.BOOLEAN;
} & BaseOption
export type UserOption = {
    type: SlashCommandOptionTypes.USER;
} & BaseOption;
export type ChannelOption = {
    type: SlashCommandOptionTypes.CHANNEL;
    channel_types: ChannelTypes;
} & BaseOption;
export type RoleOption = {
    type: SlashCommandOptionTypes.ROLE;
} & BaseOption;
export type MentionableOption = {
    type: SlashCommandOptionTypes.MENTIONABLE;
} & BaseOption;
export type NumberOption = {
    type: SlashCommandOptionTypes.NUMBER;
    choices?: CommandOptionChoice[];
    min_value?: number;
    max_value?: number;
    autocomplete?: boolean;
} & BaseOption;
export type AttachmentOption = {
    type: SlashCommandOptionTypes.ATTACHMENT;
} & BaseOption;

type SlashCommandLocalData = {
    category: string;
    cooldown: number;
    ephemeral: boolean;
}

export type MessageComponentData = {
    values: string[];
    custom_id?: string;
    component_type: number;
}

export abstract class SlashCommand {
    slashCommandData: SlashCommandData;
    localData: SlashCommandLocalData;

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

    handleMessageComponent(interaction: ComponentInteraction): void | Promise<void> {};

    abstract run(interaction: CommandInteraction<GuildTextableChannel>, options?: ConvertedCommandOptions): AdvancedMessageContent | MessageContent | Promise<AdvancedMessageContent | MessageContent>
}

export type ExtendedSlashCommand = new (client: Bot) => SlashCommand;