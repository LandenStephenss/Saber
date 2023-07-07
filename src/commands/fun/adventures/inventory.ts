// TODO; make actual command.

import {
    AdvancedMessageContent,
    CommandInteraction,
    EmbedField,
    GuildTextableChannel,
} from 'eris';
import type { Bot } from '../../../structures/Client.js';
import { SlashCommand } from '../../../structures/SlashCommand.js';
import { Item, SlashCommandOptionTypes } from '../../../types.js';
import { ConvertedCommandOptions } from '../../../events/interactionCreate.js';
import { ArmorItem } from '../../../types.js';

export default class Inventory extends SlashCommand {
    constructor(public client: Bot) {
        super({
            name: 'inventory',
            description: 'View your inventory',
            category: 'fun',
            options: [
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'view',
                    description: 'View your inventory',
                    options: [],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'equip',
                    description: 'Equip an item.',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            required: true,
                            description: "Name of the item you'd like to equip.",
                            autocomplete: true,
                        },
                    ],
                },
                {
                    type: SlashCommandOptionTypes.SUB_COMMAND,
                    name: 'trash',
                    description: 'Trash an item',
                    options: [
                        {
                            type: SlashCommandOptionTypes.STRING,
                            name: 'item',
                            required: true,
                            description: "Name of the item you'd like to trash.",
                            autocomplete: true,
                        },
                    ],
                },
            ],
        });
    }

    async run(
        interaction: CommandInteraction,
        options: ConvertedCommandOptions
    ): Promise<AdvancedMessageContent> {
        if (!interaction.member) {
            return { content: 'This command can only be ran in a guild. ' };
        }

        const {
            adventures: { inventory },
        } = await this.client.database.getUser(interaction.member!);

        if (options.trash) {
            // trash an item;
        }

        if (options.view) {
            const EmbedFields: EmbedField[] = [];

            const ArmorItems: ArmorItem[] = inventory.equipped.armor
                ? Object.entries(inventory.equipped.armor).map(([key, item]) => {
                      console.log(key, item);
                      return item;
                  })
                : [];

            if (ArmorItems.length !== 0) {
                EmbedFields.push({
                    name: 'Armor',
                    value: ArmorItems.map(
                        (itm) =>
                            `${itm.type.toString()} - ${itm.name}
    Health: ${itm.health}
    `
                    ).join('\n'),
                });
            }

            // if a user has no items at all.
            // if (ArmorItems.length === 0 && !inventory.equipped) {
            //     return {
            //         embeds: [
            //             {
            //                 author: {
            //                     name: `${interaction.member.username} has no items in their inventory.`,
            //                     icon_url: !interaction.member.user.avatar
            //                         ? interaction.member.defaultAvatarURL
            //                         : interaction.member.user.dynamicAvatarURL(),
            //                 },
            //             },
            //         ],
            //     };
            // }

            return {
                embeds: [
                    {
                        author: {
                            name: `${interaction.member.username}'s Inventory`,
                            icon_url: !interaction.member.user.avatar
                                ? interaction.member.defaultAvatarURL
                                : interaction.member.user.dynamicAvatarURL(),
                        },
                        fields: EmbedFields,
                        description: `__**Currently Eqipped**__:
\`\`\`nestedtext
Armor:
  Helmet: ${
      inventory.equipped.armor?.helmet
          ? this.humanReadableItem(inventory.equipped.armor.helmet)
          : 'N/A'
  }
  Chestplate: ${
      inventory.equipped.armor?.chestplate
          ? this.humanReadableItem(inventory.equipped.armor.chestplate)
          : 'N/A'
  }
  Pants: ${
      inventory.equipped.armor?.pants
          ? this.humanReadableItem(inventory.equipped.armor.pants)
          : 'N/A'
  }
  Boots: ${
      inventory.equipped.armor?.boots
          ? this.humanReadableItem(inventory.equipped.armor.boots)
          : 'N/A'
  }
Attack: ${
                            inventory.equipped.attack
                                ? inventory.equipped.attack
                                      .map((itm) => this.humanReadableItem(itm))
                                      .join('\n')
                                : 'N/A'
                        }
Potion: ${
                            inventory.equipped.potion
                                ? inventory.equipped.potion
                                      .map((itm) => this.humanReadableItem(itm))
                                      .join('\n')
                                : 'N/A'
                        }
Shield: ${
                            inventory.equipped.shield
                                ? this.humanReadableItem(inventory.equipped.shield)
                                : 'N/A'
                        }
\`\`\``,
                    },
                ],
            };
        }

        if (options.equip) {
            // equip an item.
        }

        throw new Error('Sub command not handled properly.');
    }

    humanReadableItem(itm: Partial<Item>) {
        return 'this is a sick item.';
    }
}
