import {
    type Collection,
    type DeleteResult,
    MongoClient,
    ObjectId
} from 'mongodb';
import { config } from '../config.js';
import {
    Member,
    type Guild,
    type User,
} from 'eris'
import { CronJob } from 'cron'
import { Bot } from '../structures/Client.js'


export type DatabaseUserType = {
    _id: string;
    gold: number;
    experience: number;
    // Command cooldowns
    commandCooldowns?: { [key: string]: number }
    // Adventure related things;
    adventures: {
        isCurrentlyAdventuring: boolean;
        // Will only show up whenever the user has an adventure going.
        adventureId?: string;
        stats?: {
            totalAdventures: number;
            adventuresWon: number;
        }
    }

    // Discord user id.
    marriedTo?: string;
};

export class DatabaseUser {
    gold = config.settings.economy.defaultGold;
    experience = 0;

    adventures = {
        isCurrentlyAdventuring: false,
    }

    constructor(public _id: string) { }
}

// Might be used for leveling, realistically won't be used for anything.
export type DatabaseGuild = {
    _id: string;
    // Contains all modlog entries for the guild.
    modlog: ModLogEntry[]

    // Moderation settings -- todo; automod;
    moderation: {
        roles: {
            muted: string | null
        }
    }
};

export type ModLogEntry = {
    // Random object id that will be displayed on the ticket.
    _id: ObjectId;
    type: ModLogTypes
    createdAt: Date;
    // Shouldn't be on anything that doesn't have a task assigned to.
    endsAt?: Date;
    ticketNumber: number;
}

export enum ModLogTypes {
    // Mute a user.
    MUTE = 1,
    // Kick a user.
    KICK = 2,
    // Ban a user.
    BAN = 3,
    // Timeout a user.
    TIMEOUT = 4,
    // Softban a user.
    SOFTBAN = 5,
    // Purge messages.
    PURGE = 6,
    // Delete message.
    DELETE_MESSAGE = 7,
    // Unmute a user.
    UNMUTE = 8,
    // Unban a user.
    UNBAN = 9,
}

export enum TaskTypes {
    UNBAN = 1,
    UNMUTE = 2,
    // Other RPG event things here.
}

// Will be used for queued processes using a cron loop.
export type DatabaseTask = {
    // Same id as the mod log ticket that was created.
    _id: ObjectId;
    // If the task was edited, then it will be shown.
    updatedAt?: Date;
    // Whenever the task was created.
    createdAt: Date;
    // Whenever the task ends.
    endsAt: Date;
    // Task type
    type: TaskTypes,
    // User id with whom the task is assigned to.
    user: string,
    // Guild that it needs to happen in.
    guild: string
}

export class Database {
    private users!: Collection<DatabaseUserType>;
    private guilds!: Collection<DatabaseGuild>;
    private tasks!: Collection<DatabaseTask>;
    private client: Bot

    constructor(client: Bot) {
        this.client = client;
    };
    async start() {
        const Mongo = new MongoClient(config.mongo.uri);
        await Mongo.connect()

        const Database = Mongo.db(config.mongo.database);

        this.users = Database.collection('users');
        this.guilds = Database.collection('guilds');
        this.tasks = Database.collection('tasks');

        this.startCronJob();
    }

    private startCronJob() {
        // This runs every 5 seconds.
        new CronJob(
            '*/5 * * * * *',
            async () => {
                const Tasks = await this.fetchAllTasks();
                for (const Task of Tasks) {
                    this.handleTask(Task);
                }
            },
            null,
            true,
            'America/Chicago'
        )
    }

    /* ---------- */
    /* User Stuff */
    /* ---------- */

    /** 
     * Ensure that a user exists in the database.
     * @param {User} user Discord user.
     * @returns {Promise<DatabaseUserType>}
     */
    private async ensureUser(user: User | Member): Promise<DatabaseUserType> {
        const ExistingUser = await this.users.findOne({ _id: user.id });
        if (ExistingUser) {
            return ExistingUser;
        }
        const NewUser: DatabaseUserType = new DatabaseUser(user.id)

        try {
            await this.users.insertOne(NewUser);
            // todo; event emitter whenever user is created for logging purposes.
            return NewUser;
        } catch (e) {
            throw new Error('Could not create the user. ' + e)
        }
    };

    /** 
     * Delete a user from the database.
     * @param {User} user Discord user.
     * @returns {Promise<DeleteResult>} 
     */
    async deleteUser(user: User | Member): Promise<DeleteResult> {
        try {
            const DeleteRes = await this.users.deleteOne({ _id: user.id }, {
                comment: `Deleted by Discord Bot. (${config.applicationId})`
            });
            return DeleteRes;
        } catch (e) {
            throw new Error('Could not delete user ' + e)
        }
    };

    /** 
     * Edit a user in the database.
     * @param {User} user Discord user.
     * @param {Partial<DatabaseUserType>} changes Changes you want to make to the user.
     * @returns {Promise<DatabaseUserType>}
     */
    async editUser(user: User | Member, changes: Partial<DatabaseUserType>): Promise<DatabaseUserType> {
        try {
            await this.ensureUser(user);
            await this.users.updateOne(
                { _id: user.id },
                { $set: changes },
                { comment: `Updated by Discord Bot. (${config.applicationId})` }
            )
            return await this.getUser(user);
        } catch (e) {
            throw new Error('Could not edit user ' + e);
        }
    };

    /**
     * Get a user in the database.
     * @param {User} user Discord user.
     * @returns {Promise<DatabaseUserType>}
     */
    async getUser(user: User | Member): Promise<DatabaseUserType> {
        try {
            const FetchedUser = await this.ensureUser(user);
            return FetchedUser;
        } catch (e) {
            throw new Error('Could not get user ' + e)
        }
    }

    /* ------------ */
    /* Guild Stuff  */
    /* ------------ */

    /**
     * Ensure that a user exists in the database.
     * @param {Guild} guild Discord guild.
     * @returns {Promise<DatabaseGuild>}
     */
    private async ensureGuild(guild: Guild): Promise<DatabaseGuild> {
        const NewGuild: DatabaseGuild = {
            _id: guild.id,
            modlog: [],
            moderation: {
                roles: {
                    // If the guild has a role called muted, then use that as default.
                    muted: guild.roles.find((role) => role.name.toLowerCase() === 'muted')?.id
                        ?? null
                }
            }
        }

        try {
            await this.guilds.insertOne(NewGuild);
            return NewGuild
        } catch (e) {
            throw new Error('Could not create the guild. ' + e);
        }
    };

    /**
     * Deletes a guild from the database.
     * @param {Guild} guild Discord guild.
     * @returns {Promise<DeleteResult>}
     */
    async deleteGuild(guild: Guild): Promise<DeleteResult> {
        try {
            const DeleteRes = await this.guilds.deleteOne({ _id: guild.id }, {
                comment: `Deleted by Discord Bot. (${config.applicationId})`
            })

            return DeleteRes;
        } catch (e) {
            throw new Error('Could not delete guild ' + e)
        }
    };

    /** Edit a guild in the database.
     * @param {Guild} guild Discord guild.
     * @param {Partial<DatabaseGuild>} changes Changes you want to make to the guild.
     * @returns {Promise<DatabaseGuild>}
     */
    async editGuild(guild: Guild, changes: Partial<DatabaseGuild>): Promise<DatabaseGuild> {
        try {
            await this.ensureGuild(guild);
            await this.users.updateOne({ _id: guild.id }, changes, {
                comment: `Updated by Discord Bot. (${config.applicationId})`
            });
            return await this.getGuild(guild);
        } catch (e) {
            throw new Error('Could not edit guild ' + e);
        }
    };

    /**
     * Get a guild in the database.
     * @param {Guild} guild Discord guild. 
     * @returns {Promise<DatabaseGuild>}
     */
    async getGuild(guild: Guild): Promise<DatabaseGuild> {
        try {
            await this.ensureGuild(guild);
            const FetchedGuild = (await this.guilds.findOne({ _id: guild.id }))!;
            return FetchedGuild;
        } catch (e) {
            throw new Error('Could not get user ' + e);
        }
    }

    /* ----------- */
    /* Task Stuff  */
    /* ----------- */

    /**
     * Fetch all the tasks in the database.
     * @returns {Promise<DatabaseTask[]>}
     */
    private async fetchAllTasks(): Promise<DatabaseTask[]> {
        try {
            return await this.tasks.find().toArray();
        } catch (e) {
            throw new Error('Could not fetch tasks ' + e);
        };
    }

    private handleTask(task: DatabaseTask) {
        if (
            !this.tasks ||
            !this.users ||
            !this.guilds) return;

        switch (task.type) {
            case TaskTypes.UNBAN:
                this.handleUnban(task);
                break;
            case TaskTypes.UNMUTE:
                // todo;
                console.log('unmute user');
                break;
            default:
                throw new Error(`Could not process task type: ${task.type}. Task ID: ${task._id}`)
        }
    };

    /**
     * Create a new task to be processed
     * @param {ModLogEntry} logEntry Modlog entry, used for reference. 
     * @param {TaskTypes} type Type of task that needs to be created.
     * @param {User} user Discord user.
     * @returns {Promise<DatabaseTask>}
     */
    async createTask(
        logEntry: ModLogEntry,
        type: TaskTypes,
        user: User | Member,
        guild: Guild
    ): Promise<DatabaseTask> {
        if (!logEntry.endsAt) {
            throw new Error('Log entry does not have a specified ending')
        }

        try {
            const NewTask: DatabaseTask = {
                _id: logEntry._id,
                type: type,
                user: user.id,
                guild: guild.id,
                createdAt: new Date(),
                endsAt: logEntry.endsAt
            }
            await this.tasks.insertOne(NewTask)
            return NewTask
        } catch (e) {
            throw new Error('Could not create a new task ' + e)
        }
    };

    /**
     * Get specified tasks
     * @param {TaskFilter} filter 
     * @returns {Promise<DatabaseTask[]>}
     */
    getTask(filter: any): Promise<DatabaseTask[]> {
        try {
            const FetchedTask = this.tasks.find(filter).toArray();
            return FetchedTask
        } catch (e) {
            throw new Error('Could not fetch task ' + e);
        }
    }

    /**
     * Delete's all the tasks that match the filter.
     * @param {TaskFilter} filter 
     */
    async deleteTask(filter: any) {
        try {
            await this.tasks.deleteMany(filter);
        } catch (e) {
            console.error('Could not delete tasks ' + e)
        }
    };

    async editTask(task: ObjectId, changes: Partial<DatabaseTask>) {
        try {
            await this.tasks.updateOne({ _id: task }, changes);
            return await this.getTask({ _id: task })
        } catch (e) {
            throw new Error('Could not edit task ' + e)
        }
    }

    handleUnban(task: DatabaseTask) {
        const Guild = this.client.guilds.find((guild) => guild.id === task.guild);
        if (!Guild) {
            throw new Error('Could not unban user.')
        }
        try {
            Guild.unbanMember(task.user, `Automatically unbanned by ${this.client.user.username}#${this.client.user.discriminator} (${this.client.user.id})`)
        } catch (e) {
            throw new Error('Could not edit task ' + e)
        }
    };

    handleUnmute(task: DatabaseTask) {
        // todo; fetch mute role.
    };
}
