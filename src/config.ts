import { readFile } from "fs/promises";

export type Cfg = {
    applicationId: string,
    /** Discord bot token - Optional because it is deleted at startup. */
    token?: string;
    /** List of developers by Discord id. */
    developers: string[];

    mongo: {
        uri: string;
        database: string;
    },

    settings: {
        economy: {
            defaultGold: number;
        }
    }

    adventures: { [key: string]: Adventure }
    items: { [key: string]: Item }
};

type Item = AttackItem | PotionItem | SplashPotionItem | ShieldItem | ArmorItem;

enum AttackItemTypes {
    SWORD = 1,
    AXE = 2,
    LONG_SWORD = 3,
    SHORT_SWORD = 4,
    DAGGER = 5,
    // Bow does not have limited amount of arrows
    BOW = 6
}

type BaseItem = {
    name: string;

    // Price in the store will fluctuate.
    minPrice: number;
    maxPrice: number;
}

// Crit booster of attack items is 10%
type AttackItem = {
    type: AttackItemTypes;
    damage: number;
    // Health will be removed whenever a user blocks or attacks.
    health: number;
} & BaseItem;

enum PotionItemTypes {
    HEALING = 1,
    DAMAGE = 2,
    // Slow potion will stun the enemy making them unable to attack for a short time.
    SLOW = 3
}

type PotionItem = {
    type: PotionItemTypes,

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
    slowness: 1 | 2 | 3
} & BaseItem;

// Splash potions only affect the enemy.
type SplashPotionItem = {
    // The radius affects the likelyhood both players receiving the effects.
    radius: number;
} & PotionItem & BaseItem;

type ShieldItem = {
    health: number;
} & BaseItem;

enum ArmorTypes {
    HELMET = 1,
    CHESTPLATE = 2,
    PANTS = 3,
    BOOTS = 4,
}

type ArmorItem = {
    type: ArmorTypes
} & BaseItem;

type Adventure = {
    // Display name of the adventure;
    name: string;
    // Enemies on the adventure;
    enemies: Enemey[];
    // Most amount of gold one can recieve.
    maxGold: number;
    // Max amount of experience a player can recieve.
    maxExperience: number;
    // The possible rewards a user can recieve for completing the adventure.
    possibleCompletionRewards: Item[];
    // Possible failure rewards, given to users so they're not left with nothing; Could also be mixed with completion rewards if completed.
    possibleRewards: Item[];

}

type Enemey = {
    health: number;
    name: string;
    weapon: AttackItem;
    armor?: ArmorItem;
}

let config: Cfg;

try {
    const configFile = await readFile('./config.json', 'utf-8')
    config = JSON.parse(configFile);
} catch (e: any) {
    throw new Error('Could not load config! ' + e);
}

if (!config) {
    throw new Error('Config file is missing!')
}

export { config }