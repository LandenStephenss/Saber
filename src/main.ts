import { Bot } from "./structures/Client.js";

const Client = new Bot({
    intents: [ 'all' ],
    messageLimit: 100,
    defaultImageFormat: 'png',
    defaultImageSize: 1024,
    restMode: true,
    getAllUsers: true
})
Client.start();