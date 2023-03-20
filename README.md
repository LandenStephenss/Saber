# Saber

A multi-purpose Discord bot for the [VPSNode](http://vpsnode.org/) community.

---

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
