import { AttackItemTypes, type Enemy, type Item, type Adventure } from './types.js';

let Items: Item[] = [];

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

/**
 * Resolve an adventure with a filter.
 * @param filter Filter to search the adventure for.
 * @returns {Adventure} Resulted adventure.
 */
export function resolveAdventure(
    filter: (adventure: Adventure) => boolean
): Adventure | void {
    for (const Adventure of Adventures) {
        if (filter(Adventure)) {
            return Adventure;
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

export { Items };
