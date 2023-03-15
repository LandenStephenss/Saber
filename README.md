# Saber

### Example Command Structure

```ts
class Example extends SlashCommand {
    autocompleteIDs = {
        bandKid: 'bandkid',
    };
    constructor(public client: Bot) {
        super({
            name: 'Example',
            description: 'Shows idiots how to make a command properly',
            options: [
                {
                    name: 'tpose',
                    description: 'Are you a band kid?',
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
            case autocompleteIDs.bandKid:
                console.log(option);
                return [
                    {
                        name: 'yes',
                        value: 'no',
                    },
                ]; // the choices you return. I can't be bothered to come up with dummy code.
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
