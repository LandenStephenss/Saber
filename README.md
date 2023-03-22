# Saber

A multi-purpose Discord bot for the [VPSNode](http://vpsnode.org/) community.

---

## TO-DO List:

-   [ ] Join/Leave messages.
    -   [ ] Configurablity through admin commands.
-   [ ] Role menu allowing users to select self-assignable roles.
    -   [x] Admin setup command
    -   [ ] Assigning users roles picked.
-   [ ] Keyword GIF (Send a gif upon a keyword).
    -   [ ] Setup using a command
    -   [ ] Send a GIF when keyword is sent.
-   [ ] Economy (**Gold Coins**)
    -   [ ] Shop System
    -   [ ] Trading with other users
-   [ ] Skills
    -   [ ] Chance to gain items whenever training skills.
-   [ ] Marriage
    -   [ ] Allow users to marry other users.
    -   [ ] Marriage based events, children, child death, etc.
-   [ ] Adventures
    -   [ ] View a list of all adventures.
    -   [x] Configure each adventure via the `adventures.ts` file.
    -   [ ] Scale adventure/enemey difficulty with the users level.
-   [x] Interaction Handling
    -   [x] Commands
        -   [x] Cooldowns
    -   [x] Components
        -   [x] Parse and update component `custom_id`'s when sending/recieving data.
    -   [x] Autocomplete
    -   [ ] Modal Submit
-   [ ] Moderation Commands
    -   [ ] Kick/(Soft)ban.
    -   [ ] Mute.
        -   [ ] Configurablity through admin commands (setting `mute` role).

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
