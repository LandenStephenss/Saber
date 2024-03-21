# Saber

A multi-purpose Discord bot for the [VPSNode](http://vpsnode.org/) community.

---

## Starting the bot

Clone the repository using `git clone https://github.com/LandenStephenss/Saber`.
Then run the following:

```
cd Saber
npm install
npm run build

pm2 start ./dist/main.js --name "Saber" --watch --ext .js -c "0 0 * * *"
```

## TO-DO List:

-   [x] Join/Leave messages.

    -   [x] Configurable through admin commands.
    -   [x] Send a message to a specific channel.
    -   [x] Send a DM to the user.

-   [x] Role menu allowing users to select self-assignable roles.

    -   [x] Admin setup command
    -   [x] Assigning users roles picked.

-   [x] Keyword GIF (Send a gif upon a keyword).

    -   [x] Setup using a command
    -   [x] Send a GIF when keyword is sent.

-   [x] Interaction Handling

    -   [x] Commands
        -   [x] Cooldowns
        -   [x] Permissions
    -   [x] Message Component Handling
        -   [x] Don't let users use another user's components.
        -   [x] Parse and update component `custom_id`'s when sending/receiving data.
    -   [x] Autocomplete
    -   [ ] Modal Submit

-   [ ] Commands

    -   [ ] Fun Commands
        -   [x] Marry (Lets user's marry eachother, user specific)
        -   [x] Pinged (When a user is pinged the bot sends a GIF that the user set)
        -   [ ] 8ball (Just an 8ball command)
    -   [ ] Moderation Commands
        -   [ ] Kick (Kick a user from the guild)
        -   [ ] Mute (Mute a user either permanently or with a time)
        -   [ ] Ban (Ban a user, also give a time period)
    -   [x] Admin
        -   [x] Settings (lets admins configure settings)
        -   [x] Roles (lets admins configure user selectable roles)
    -   [x] Information Commands
        -   [x] help (Shows all the bots commands)
        -   [x] ping (Shows the bot's ping to Discord)
        -   [x] status (Shows the status of the bot)
        -   [x] avatar (Shows the avatar of a user.)

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
