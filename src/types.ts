import type { ObjectId } from 'mongodb';

export type Item = AttackItem | PotionItem | ShieldItem | ArmorItem;

export enum AttackItemTypes {
    SWORD = 1,
    AXE = 2,
    LONG_SWORD = 3,
    SHORT_SWORD = 4,
    DAGGER = 5,
    // Bow does not have limited amount of arrows
    BOW = 6,
}

export type BaseItem = {
    name: string;
    // Price in the store will fluctuate - Not all items are available;
    minPrice?: number;
    maxPrice?: number;
};

// Crit booster of attack items is 10%
export type AttackItem = {
    type: AttackItemTypes;
    damage: number;
    // Health will be removed whenever a user blocks or attacks.
    health: number;
} & BaseItem;

export enum PotionItemTypes {
    HEALING = 1,
    DAMAGE = 2,
    // Slow potion will stun the enemy making them unable to attack for a short time.
    SLOW = 3,
}

export type PotionItem = {
    type: PotionItemTypes;

    // Amount of healing that needs to be given;
    heal: number;
    // Amount of damage that needs to be given;
    damage: number;
    // Level of the slowness potion
    /**
     * Level 1: Slowed for 1 move;
     * Level 2: Slowed for 2 moves;
     * Level 3: Slowed for 3 moves;
     */
    slowness: 1 | 2 | 3;
} & BaseItem;

export type ShieldItem = {
    health: number;
} & BaseItem;

export enum ArmorTypes {
    HELMET = 1,
    CHESTPLATE = 2,
    PANTS = 3,
    BOOTS = 4,
}

export type ArmorItem = {
    type: ArmorTypes;
    health: number;
} & BaseItem;

export type Adventure = {
    // Display name of the adventure;
    name: string;
    description: string;
    // Different artwork the adventure may contain;
    art?: {
        emoji?: {
            id?: string;
            unicode?: string;
            name?: string;
        };
        icon?: unknown;
        thumbnail?: unknown;
    };
    // Enemies on the adventure -- Will only be null if the enemy could not be resolved.
    enemies: Enemy[];

    // If requirements is not defined then there are none.
    requirements?: {
        // Minimum amount of XP a user needs to be allowed to play.
        minXP?: number;
        // Maximum XP a user can have to be allowed to play.
        maxXP?: number;
        // If it costs the user to start the adventure or not.
        cost?: number;
    };

    rewards: {
        // Maximum amount of gold a player can receive.
        maxGold: number;
        // Minimum amount of gold a player can receive.
        minGold: number;
        // Maximum amount of experience a player can receive.
        maxExperience: number;
        // Minimum amount of experience a player can receive.
        minExperience: number;
        // The possible rewards a user can receive for completing the adventure.
        possibleCompletionRewards: Item[];
        // Possible failure rewards, given to users so they're not left with nothing; Could also be mixed with completion rewards if completed.
        possibleRewards: Item[];
    };
};

export type Enemy = {
    health: number;
    name: string;
    weapon: AttackItem;
    // Whether the player is able to obtain the item.
    // Items are obtainable upon completion.
    isItemDroppable?: boolean;
    armor?: ArmorItem;
};

export type PlayerSkill = {
    experience: number;
    level: number;
};

export type AdventureState = {
    name: string;
    equipped: {
        item: Item;
        // Armor is not required because not all players will have armor.
        armor?: {
            helmet?: ArmorItem & { type: ArmorTypes.HELMET };
            chestplate?: ArmorItem & { type: ArmorTypes.CHESTPLATE };
            pants?: ArmorItem & { type: ArmorTypes.PANTS };
            boots?: ArmorItem & { type: ArmorTypes.BOOTS };
        };
    };
    currentEnemy: {
        currentHealth: number;
        currentWeaponHealth: number;
        currentArmorHealth?: number;
    } & Enemy;
};

export type DatabaseUserType = {
    _id: string;
    gold: number;
    experience: number;
    level: number;
    // Command cooldowns
    commandCooldowns?: { [key: string]: number };
    // Different skills a player can have
    skills?: {
        mining?: PlayerSkill;
        fishing?: PlayerSkill;
        woodcutting?: PlayerSkill;
    };
    pingedGif?: {
        url: string; // must be an Tenor URL (Tenor because that's what Discord uses).
        updatedAt: Date;
        lastSent?: number;
    };

    // Adventure related things;
    adventures?: {
        inventory?: {
            equipped: {
                // A user can bring up to 2 attack items.
                attack: AttackItem[];
                // A user can bring multiple potions
                potion: PotionItem[];
                // A user can only have one shield
                shield: ShieldItem;
                // A user can have a full set of armor.
                armor: ArmorItem[];
            };
            other: Item[];
        };
        currentState?: AdventureState;
        stats?: {
            totalAdventures: number;
            adventuresWon: number;
        };
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
        channel?: string;
        join?: string;
        leave?: string;
    };

    // Moderation settings -- todo; automod;
    moderation: {
        roles: {
            muted: string | null;
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
    // Other RPG event things here.

    ADVENTURE_REMINDER = 3, // Remind a user that they have an on-going adventure after a couple hours of inactivity.
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

export type ReminderTask = {
    type: TaskTypes.ADVENTURE_REMINDER;
} & SimpleTask;

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

export type SlashCommandLocalData = {
    category: string;
    cooldown: number;
    ephemeral: boolean;
};

export type InteractionAutocompleteChoices = {
    name: string;
    value: string;
};
