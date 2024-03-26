import type { ObjectId } from 'mongodb';

export type DatabaseUserType = {
    _id: string;
    experience: {
        value: number;
        updatedAt?: number;
    };
    level: number;
    // Command cooldowns
    commandCooldowns?: { [key: string]: number };
    // Different skills a player can have

    pingedGif?: {
        url: string; // must be an Tenor URL (Tenor because that's what Discord uses).
        updatedAt: Date;
        lastSent?: number;
    };
    // Discord user id.
    marriedTo?: string;
};

export type DatabaseGuildType = {
    _id: string;
    // Contains all modlog entries for the guild.
    modlog?: ModLogEntry[];

    /**
     * {user} = User Mention
     * {userID} = User ID
     * {guild} = Guild name
     * {guildID} = Guild ID
     */
    welcome?: {
        enabled: boolean;
        // If dms are set to true while there is a channel sent then it will be sent to the channel and the user.
        dms?: boolean;
        // Channel that the message will be sent to.
        channel?: string;
        // Message to be sent whenever a user joins.
        join?: string;
        // Message to be sent whenever a user leaves.
        leave?: string;
        // Role that is assigned to a user upon joining.
        // Will probably change this to an array at some point, but i don't think discord supports multi-role selections via slash command options.
        role?: string; // this is a role ID
    };

    // Moderation settings -- todo; automod;
    moderation: {
        roles: {
            // Used to mute members.
            muted?: string;
            // Used to check who's admin and who's not. Used only to send direct messages to administrators.
            admin?: string;
        };

        automod: {
            /**
             *  Wheter we want to detect spam or not.
             *  The things we will be looking for are as following
             * - Duplicate messages being sent
             * -
             */
            spamDetection: boolean;
        };
    };
};

export type ModLogEntry = {
    // Random object id that will be displayed on the ticket.
    _id: ObjectId;
    type: ModLogTypes;
    createdAt: Date;
    // Shouldn't be on anything that doesn't have a task assigned to.
    endsAt?: Date;
    ticketNumber: number;
};

export enum ModLogTypes {
    // Mute a user.
    MUTE = 1,
    // Kick a user.
    KICK = 2,
    // Ban a user.
    BAN = 3,
    // Timeout a user.
    TIMEOUT = 4,
    // Softban a user.
    SOFTBAN = 5,
    // Purge messages.
    PURGE = 6,
    // Delete message.
    DELETE_MESSAGE = 7,
    // Unmute a user.
    UNMUTE = 8,
    // Unban a user.
    UNBAN = 9,
}

export enum TaskTypes {
    UNBAN = 1,
    UNMUTE = 2,
}

export type DatabaseTask = SimpleTask;

// Will be used for queued processes using a cron loop.
export type SimpleTask = {
    // Same id as the mod log ticket that was created.
    _id: ObjectId;
    // If the task was edited, then it will be shown.
    updatedAt?: Date;
    // Whenever the task was created.
    createdAt: Date;
    // Whenever the task ends.
    endsAt: Date;
    // Task type
    type: TaskTypes;
    // User id with whom the task is assigned to.
    user: string;
    // Guild that it needs to happen in.
    guild: string;
};

export enum MessageComponentTypes {
    ACTION_ROW = 1,
    BUTTON = 2,
    STRING_SELECT = 3,
    TEXT_INPUT = 4,
    USER_SELECT = 5,
    ROLE_SELECT = 6,
    MENTIONABLE_SELECT = 7,
    CHANNEL_SELECT = 8,
}

export enum MessageComponentButtonStyles {
    PRIMARY = 1, // blurple
    SECONDARY = 2, // gray
    SUCCESS = 3, // green
    DANGER = 4, // red
    LINK = 5, // grey, navigates to url
}

export type SlashCommandData = {
    name: string;
    description: string;
    options?: CommandOption[];
    default_member_permissions: number | undefined;
    dm_permission: boolean;
    nsfw?: boolean;
};

type DiscordLocals = {
    id?: string; // Indonesian
    da?: string; // Danish
    de?: string; // German
    fr?: string; // French
    hr?: string; // Croatian
    it?: string; // Italian
    lt?: string; // Lithuanian
    hu?: string; // Hungarian
    nl?: string; // Dutch
    no?: string; // Norwegian
    pl?: string; // Polish
    vi?: string; // Vietnamese
    tr?: string; // Turkish
    cs?: string; // Czech
    el?: string; // Greek
    bg?: string; // Bulgarian
    ru?: string; // Russian
    uk?: string; // Ukrainian
    hi?: string; // Hindi
    th?: string; // Thai
    ro?: string; // Romanian, Romania
    fi?: string; // Finnish
    ko?: string; // Korean
    ja?: string; // Japanese
    'en-GB'?: string; // English, UK
    'en-US'?: string; // English, US
    'es-ES'?: string; // Spanish
    'zh-CN'?: string; //	Chinese, China
    'zh-TW'?: string; // Chinese, Taiwan
    'pt-BR'?: string; // Portuguese, Brazilian
    'sv-SE'?: string; // Swedish
};

export type SlashCommandConstructor = {
    // Discord things
    name: string;
    name_localizations?: DiscordLocals;
    description: string;
    description_localizations?: DiscordLocals;
    options?: CommandOption[];
    nsfw?: boolean;
    defaultMemberPermissions?: number;
    // Local things;
    category?: string;
    cooldown?: number;
    ephemeral?: boolean;
};

type BaseOption = {
    name: string;
    name_localizations?: DiscordLocals;
    description: string;
    description_localizations?: DiscordLocals;
    required?: boolean;
};

export enum ChannelTypes {
    GUILD_TEXT = 0,
    DM = 1,
    GUILD_VOICE = 2,
    GROUP_DM = 3,
    GUILD_CATEGORY = 4,
    GUILD_ANNOUNCEMENT = 5,
    ANNOUNCEMENT_THREAD = 10,
    PUBLIC_THREAD = 11,
    PRIVATE_THREAD = 12,
    GUILD_STAGE_VOICE = 13,
    GUILD_DIRECTORY = 14,
    GUILD_FORUM = 15,
}

export type CommandOption =
    | SubCommandOption
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
};

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
    ATTACHMENT = 11,
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
    max_length?: number; // Maximum of 6000
    autocomplete?: boolean;
} & BaseOption;
export type IntegerOption = {
    type: SlashCommandOptionTypes.INTEGER;
    choices?: CommandOptionChoice[];
    min_value?: number;
    max_value?: number;
    autocomplete?: boolean;
} & BaseOption;
export type BooleanOption = {
    type: SlashCommandOptionTypes.BOOLEAN;
} & BaseOption;
export type UserOption = {
    type: SlashCommandOptionTypes.USER;
} & BaseOption;
export type ChannelOption = {
    type: SlashCommandOptionTypes.CHANNEL;
    channel_types: ChannelTypes[];
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

export type SlashCommandLocalData = {
    category: string;
    cooldown: number;
    ephemeral: boolean;
};

export type InteractionAutocompleteChoices = {
    name: string;
    value: string;
};
