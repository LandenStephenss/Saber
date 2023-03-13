import {
    AttackItemTypes,
    type Enemey,
    type Item,
    type Adventure
} from './types.js';

let Items: Item[] = []

const AllEnemies: Enemey[] = [
    {
        name: "Mushroom Pawn",
        health: 25,
        weapon: {
            type: AttackItemTypes.DAGGER,
            name: "Shrrom Dagger",
            damage: 6,
            health: 100
        }
    },
    {
        name: "Forest King",
        health: 45,
        isItemDroppable: true,
        weapon: {
            type: AttackItemTypes.AXE,
            name: "Axe of the Forest",
            damage: 14,
            health: 200
        },
    }
]

export function resolveAdventure(filter: (adventure: Adventure) => boolean): Adventure | void {
    for (const Adventure of Adventures) {
        if (filter(Adventure)) {
            return Adventure;
        }
    }
}

export function resolveEnemey(filter: (enemey: Enemey) => boolean): Enemey {
    for (const Enemey of AllEnemies) {
        if (filter(Enemey)) {
            return Enemey;
        }
    }

    throw new Error(`Enemey does not exist. ${filter.toString()}`);
}



Items = [...Items, ...AllEnemies.filter(({ isItemDroppable }) => isItemDroppable)]

export const Adventures: Adventure[] = [
    {
        name: 'Through the woods',
        description: 'A short journey through the woods, just you and your sword.',
        art: {
            emoji: {
                unicode: '🌲'
            }
        },
        enemies: [
            resolveEnemey(({ name }) => name === 'Mushroom Pawn'),
            resolveEnemey(({ name }) => name === 'Forest King')
        ],
        requirments: {
            maxXP: 100
        },
        rewards: {
            maxGold: 10,
            minGold: 0,
            maxExperience: 10,
            minExperience: 0,
            possibleCompletionRewards: [],
            possibleRewards: []
        }
    }
]

export { Items }