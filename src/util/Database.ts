import {
    type Collection,
    type DeleteResult,
    MongoClient,
    ObjectId,
    UpdateFilter,
} from 'mongodb';
import { config } from '../config.js';
import {
    type DatabaseUserType,
    type DatabaseGuildType,
    type DatabaseTask,
    type ModLogEntry,
    TaskTypes,
} from '../types.js';
import { type Guild, type User, Member } from 'eris';
import { CronJob } from 'cron';
import { Bot } from '../structures/Client.js';

export class DatabaseUser {
    gold = config.settings.economy.defaultGold;
    experience = 0;
    level = 0;

    constructor(public _id: string) {}
}

export class Database {
    private users!: Collection<DatabaseUserType>;
    private guilds!: Collection<DatabaseGuildType>;
    private tasks!: Collection<DatabaseTask>;
    private client: Bot;

    constructor(client: Bot) {
        this.client = client;
    }
    async start() {
        const Mongo = new MongoClient(config.mongo.uri);
        await Mongo.connect();

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
        );
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
        const NewUser: DatabaseUserType = new DatabaseUser(user.id);

        try {
            await this.users.insertOne(NewUser);
            return NewUser;
        } catch (e) {
            throw new Error('Could not create the user. ' + e);
        }
    }

    /**
     * Delete a user from the database.
     * @param {User} user Discord user.
     * @returns {Promise<DeleteResult>}
     */
    async deleteUser(user: User | Member): Promise<DeleteResult> {
        try {
            const DeleteRes = await this.users.deleteOne(
                { _id: user.id },
                {
                    comment: `Deleted by Discord Bot. (${config.applicationId})`,
                }
            );
            return DeleteRes;
        } catch (e) {
            throw new Error('Could not delete user ' + e);
        }
    }

    /**
     * Edit a user in the database.
     * @param {User} user Discord user.
     * @param {Partial<DatabaseUserType>} changes Changes you want to make to the user.
     * @returns {Promise<DatabaseUserType>}
     */
    async editUser(
        user: User | Member,
        changes: UpdateFilter<DatabaseUserType>
    ): Promise<DatabaseUserType> {
        try {
            await this.ensureUser(user);
            await this.users.updateOne({ _id: user.id }, changes, {
                comment: `Updated by Discord Bot. (${config.applicationId})`,
            });
            return await this.getUser(user);
        } catch (e) {
            throw new Error('Could not edit user ' + e);
        }
    }

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
            throw new Error('Could not get user ' + e);
        }
    }

    /* ------------ */
    /* Guild Stuff  */
    /* ------------ */

    /**
     * Ensure that a user exists in the database.
     * @param {Guild} guild Discord guild.
     * @returns {Promise<DatabaseGuildType>}
     */
    private async ensureGuild(guild: Guild): Promise<DatabaseGuildType> {
        const NewGuild: DatabaseGuildType = {
            _id: guild.id,
            modlog: [],
            moderation: {
                roles: {
                    // If the guild has a role called muted, then use that as default.
                    muted:
                        guild.roles.find((role) => role.name.toLowerCase() === 'muted')
                            ?.id ?? null,
                },
            },
        };

        try {
            await this.guilds.insertOne(NewGuild);
            return NewGuild;
        } catch (e) {
            throw new Error('Could not create the guild. ' + e);
        }
    }

    /**
     * Deletes a guild from the database.
     * @param {Guild} guild Discord guild.
     * @returns {Promise<DeleteResult>}
     */
    async deleteGuild(guild: Guild): Promise<DeleteResult> {
        try {
            const DeleteRes = await this.guilds.deleteOne(
                { _id: guild.id },
                {
                    comment: `Deleted by Discord Bot. (${config.applicationId})`,
                }
            );

            return DeleteRes;
        } catch (e) {
            throw new Error('Could not delete guild ' + e);
        }
    }

    /** Edit a guild in the database.
     * @param {Guild} guild Discord guild.
     * @param {Partial<DatabaseGuildType>} changes Changes you want to make to the guild.
     * @returns {Promise<DatabaseGuildType>}
     */
    async editGuild(
        guild: Guild,
        changes: Partial<DatabaseGuildType>
    ): Promise<DatabaseGuildType> {
        try {
            await this.ensureGuild(guild);
            await this.users.updateOne({ _id: guild.id }, changes, {
                comment: `Updated by Discord Bot. (${config.applicationId})`,
            });
            return await this.getGuild(guild);
        } catch (e) {
            throw new Error('Could not edit guild ' + e);
        }
    }

    /**
     * Get a guild in the database.
     * @param {Guild} guild Discord guild.
     * @returns {Promise<DatabaseGuildType>}
     */
    async getGuild(guild: Guild): Promise<DatabaseGuildType> {
        try {
            await this.ensureGuild(guild);
            const FetchedGuild = (await this.guilds.findOne({
                _id: guild.id,
            }))!;
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
        }
    }

    private handleTask(task: DatabaseTask) {
        if (!this.tasks || !this.users || !this.guilds) return;

        switch (task.type) {
            case TaskTypes.UNBAN:
                this.handleUnban(task);
                break;
            case TaskTypes.UNMUTE:
                // todo;
                console.log('unmute user');
                break;
            default:
                throw new Error(
                    `Could not process task type: ${task.type}. Task ID: ${task._id}`
                );
        }
    }

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
            throw new Error('Log entry does not have a specified ending');
        }

        try {
            const NewTask: DatabaseTask = {
                _id: logEntry._id,
                type: type,
                user: user.id,
                guild: guild.id,
                createdAt: new Date(),
                endsAt: logEntry.endsAt,
            };
            await this.tasks.insertOne(NewTask);
            return NewTask;
        } catch (e) {
            throw new Error('Could not create a new task ' + e);
        }
    }

    /**
     * Get specified tasks
     * @param {TaskFilter} filter
     * @returns {Promise<DatabaseTask[]>}
     */
    getTask(filter: any): Promise<DatabaseTask[]> {
        try {
            const FetchedTask = this.tasks.find(filter).toArray();
            return FetchedTask;
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
            console.error('Could not delete tasks ' + e);
        }
    }

    async editTask(task: ObjectId, changes: Partial<DatabaseTask>) {
        try {
            await this.tasks.updateOne({ _id: task }, changes);
            return await this.getTask({ _id: task });
        } catch (e) {
            throw new Error('Could not edit task ' + e);
        }
    }

    handleUnban(task: DatabaseTask) {
        const Guild = this.client.guilds.find((guild) => guild.id === task.guild);
        if (!Guild) {
            throw new Error('Could not unban user.');
        }
        try {
            Guild.unbanMember(
                task.user,
                `Automatically unbanned by ${this.client.user.username}#${this.client.user.discriminator} (${this.client.user.id})`
            );
        } catch (e) {
            throw new Error('Could not edit task ' + e);
        }
    }

    handleUnmute(task: DatabaseTask) {
        // todo; fetch mute role.
    }
}
