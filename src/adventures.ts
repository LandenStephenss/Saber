import {
    AttackItemTypes,
    type Enemy,
    type Item,
    type Adventure,
    AttackItem,
} from './types.js';

// Means that a user will only have a 65% to successfully defend from an attack.
export const DefenseChance = 0.65;

let Items: Item[] = [
    {
        name: 'Wooden Sword',

        minPrice: 10,
        maxPrice: 25,
        type: AttackItemTypes.SWORD,
        damage: 7,
        health: 150,
    },
];

export const FistItem: AttackItem = {
    type: AttackItemTypes.FIST,
    name: `{username}'s Fists`,
    health: 100,
    damage: 5,
};

/**
 * We use this number with the following formula:
 * ((AdventureScalingPercentage * UserLevel) * Damage) + Damage
 *
 * This is so that a user cannot keep replaying a adventure to get insane amounts of XP.
 * The formula is used for health and damage.
 */
const AdventureScalingPercentage = 0.025;

const AllEnemies: Enemy[] = [
    {
        name: 'Mushroom Pawn',
        health: 25,
        weapon: {
            type: AttackItemTypes.DAGGER,
            name: 'Shroom Dagger',
            damage: 6,
            health: 100,
        },
    },
    {
        name: 'Forest King',
        health: 45,
        isItemDroppable: true,
        weapon: {
            type: AttackItemTypes.AXE,
            name: 'Axe of the Forest',
            damage: 14,
            health: 200,
        },
    },
];

/**
 * Scales a number (Can be health, damage, etc) according to the users level.
 * @param {number} amount Number to be scaled.
 * @param {number} level User level
 * @returns {number} The scaled number.
 */
export function scaleAmount(amount: number, level: number): number {
    return amount + AdventureScalingPercentage * level * amount;
}

export function scaleAdventure(adventure: Adventure, level: number): Adventure {
    // scale rewards, enemy health, enemy damage, etc;
    // todo; too lazy right now.
    return adventure;
}

/**
 * Resolve an adventure with a filter.
 * @param filter Filter to search the adventure for.
 * @returns {Adventure} Resulted adventure.
 */
export function resolveAdventure(
    filter: (adventure: Adventure) => boolean,
    level: number = 0
): Adventure {
    for (const Adventure of Adventures) {
        if (filter(Adventure)) {
            return scaleAdventure(Adventure, level);
        }
    }

    throw new Error(`Adventure does not exist. ${filter.toString()}`);
}

/**
 * Resolve an enemy with a filter.
 * @param filter Filter to search the enemy for.
 * @returns {Enemy} Resulted enemy.
 */
export function resolveEnemy(filter: (enemy: Enemy) => boolean): Enemy {
    for (const Enemy of AllEnemies) {
        if (filter(Enemy)) {
            return Enemy;
        }
    }

    throw new Error(`Enemy does not exist. ${filter.toString()}`);
}

Items = [...Items, ...AllEnemies.filter(({ isItemDroppable }) => isItemDroppable)];

export const Adventures: Adventure[] = [
    {
        name: 'Through the woods',
        description: 'A short journey through the woods, just you and your sword.',
        art: {
            emoji: {
                unicode: '🌲',
            },
        },
        enemies: [
            resolveEnemy(({ name }) => name === 'Mushroom Pawn'),
            resolveEnemy(({ name }) => name === 'Forest King'),
        ],
        requirements: {
            maxXP: 100,
        },
        rewards: {
            maxGold: 10,
            minGold: 0,
            maxExperience: 10,
            minExperience: 0,
            possibleCompletionRewards: [],
            possibleRewards: [],
        },
    },
];

// Best way to export items for the store, will include dropped items from enemies but only if they have min/max price values.
export const StoreItems: Item[] = Items.filter((i) => i.maxPrice || i.minPrice);

export { Items };
