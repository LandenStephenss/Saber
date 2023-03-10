import {
    AttackItemTypes,
    Enemey,
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

function resolveEnemey(filter: (enemey: Enemey) => boolean): Enemey | null {
    for (const Enemey of AllEnemies) {
        if (filter(Enemey)) {
            return Enemey;
        }
    }

    return null;
}



Items = [...Items, ...AllEnemies.filter(({ isItemDroppable }) => isItemDroppable)]

export const Adventures: Adventure[] = [
    {
        name: 'Through the woods',
        enemies: [
            resolveEnemey(({ name }) => name === 'Mushroom Pawn'),
            resolveEnemey(({ name }) => name === 'Forest King')
        ],
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