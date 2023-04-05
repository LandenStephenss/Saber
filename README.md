# Saber

A multi-purpose Discord bot for the [VPSNode](http://vpsnode.org/) community.

---

## TO-DO List:

-   [ ] Join/Leave messages.
    -   [ ] Configurable through admin commands.
    -   [x] Send a message to a specific channel.
    -   [x] Send a DM to the user.
-   [x] Role menu allowing users to select self-assignable roles.
    -   [x] Admin setup command
    -   [x] Assigning users roles picked.
-   [x] Keyword GIF (Send a gif upon a keyword).
    -   [x] Setup using a command
    -   [x] Send a GIF when keyword is sent.
-   [ ] Economy (**Gold Coins**)
    -   [ ] Shop System
    -   [ ] Trading with other users
    -   [x] Balance Command
-   [ ] Skills
    -   [ ] Chance to gain items whenever training skills.
    -   [ ] Skills leaderboard.
-   [ ] Marriage
    -   [ ] Allow users to marry other users.
    -   [ ] Marriage based events, children, child death, etc.
-   [ ] Adventures
    -   [x] View a list of all adventures.
    -   [ ] Play an adventure.
    -   [x] Configure each adventure via the `adventures.ts` file.
    -   [ ] Scale adventure/enemy difficulty with the users level.
-   [x] Interaction Handling
    -   [x] Commands
        -   [x] Cooldowns
        -   [x] Permissions
    -   [x] Message Component Handling
        -   [x] Don't let users use another user's components.
        -   [x] Parse and update component `custom_id`'s when sending/receiving data.
    -   [x] Autocomplete
    -   [ ] Modal Submit
-   [ ] Moderation Commands
    -   [ ] Kick/(Soft)ban.
    -   [ ] Mute.
        -   [ ] Configurable through admin commands (setting `mute` role).
-   [ ] Database things
    -   [x] Add, Delete, and Edit users from database through code.
    -   [ ] Automatically find usable channels and roles in the guild upon joining.

### Example Command Structure

```ts
class Example extends SlashCommand {
    autocompleteIDs = {
        exampleId: 'exampleId',
    };
    constructor(public client: Bot) {
        super({
            name: 'Example',
            description: 'Shows idiots how to make a command properly',
            options: [
                {
                    name: 'example-name',
                    description: 'Are you an absolute troglodyte or what.',
                    required: true,
                    type: SlashCommandOptionTypes.STRING,
                    autocomplete: true,
                },
            ],
            category: 'earth',
            ephermal: true,
        });
    }

    handleAutocomplete(option: string, value: string) {
        switch (option) {
            case autocompleteIDs.exampleId:
                console.log(option);
                return [
                    {
                        name: 'yes',
                        value: 'no',
                    },
                ];
            default:
                return [];
        }
    }

    // TODO;
    handleMessageComponent() {}

    // TODO;
    run() {}
}
```
