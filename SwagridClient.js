const { readdirSync } = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { findAllSchedules } = require('./utils/databaseUtils');
const Reddit = require('reddit');
const { generateSchedulePostMessageContent } = require('./utils/messageUtils');

/** @typedef {{ data: import('@discordjs/builders').SlashCommandBuilder, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').CommandInteraction, client: import('./SwagridClient')) => Promise<void> }} SwagridCommand */
/** @typedef {{ name: string, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').ButtonInteraction, client: import('./SwagridClient')) => Promise<void> }} SwagridButton */
/** @typedef {{ data: import('@discordjs/builders').ContextMenuCommandBuilder, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').ContextMenuInteraction, client: import('./SwagridClient')) => Promise<void> }} SwagridContextMenu */

module.exports = class SwagridClient extends Client {
	/** @type {Reddit} */
	#redditClient;
	/** @type {Collection<string, Collection<string, NodeJS.Timer>>} */
	#schedulesId = new Collection();

	/** @type {{userId: string, guildId: string, createdTimestamp: number}[]} */
	lastMessageSent = [];
	/** @type {Collection<string, number>} */
	messageCounter = new Collection();
	/** @type {Collection<string, import('./dto/CardSuggestionDTO')>} */
	temporaryCardSuggestions = new Collection();

	/** @type {Collection<string, SwagridCommand>} */
	commands = new Collection();
	/** @type {Collection<string, SwagridButton>} */
	buttons = new Collection();
	/** @type {Collection<string, SwagridContextMenu>} */
	contextMenus = new Collection();

	constructor() {
		super({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ] });

		this.once('ready', () => {
			this.user.setActivity({
				type: 'COMPETING',
				name: 'Quidditch'
			});

			// this.#definePermissions();
			this.#setupSchedules();
		});

		this.#loadCommands();
		this.#loadEvents();
		this.#loadButtons();
		this.#loadContextMenus();

		this.#redditClient = new Reddit({
			username: process.env.REDDIT_USERNAME,
			password: process.env.REDDIT_PASSWORD,
			appId: process.env.REDDIT_APP_ID,
			appSecret: process.env.REDDIT_APP_SECRET,
			userAgent: 'Ultra-Swagrid/1.0.0 (https://www.swagrid.fr/)'
		});
	}

	#loadCommands() {
		console.log('Récupération des commandes...');

		const files = readdirSync('./commands');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./commands/${file}`)
		).forEach(command =>
			this.commands.set(command.data.name, command)
		);

		console.log('Commandes récupérées !');
	}

	#loadEvents() {
		console.log('Récupération des événements...');

		const files = readdirSync('./events');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./events/${file}`)
		).forEach(event =>
			this.on(event.name, event.execute)
		);

		console.log('Événements récupérées !');
	}

	#loadButtons() {
		console.log('Récupération des boutons...');

		const files = readdirSync('./buttons');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./buttons/${file}`)
		).forEach(button =>
			this.buttons.set(button.name, button)
		);

		console.log('Boutons récupérés !');
	}

	#loadContextMenus() {
		console.log('Récupération des menus contextuel...');

		const files = readdirSync('./context-menus');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./context-menus/${file}`)
		).forEach(contextMenu =>
			this.contextMenus.set(contextMenu.data.name, contextMenu)
		);

		console.log('Menus contextuel récupérés !');
	}

	async #definePermissions() {
		console.log('Définition des permissions...');

		const poudlard = await this.guilds.fetch(process.env.POUDLARD_ID);
		const poudlardCommands = await poudlard.commands.fetch();
		for (const command of poudlardCommands.values()) {
			if (this.commands.has(command.name)) {
				const permissions = this.commands.get(command.name).permissions;
				if (permissions !== undefined) {
					await command.permissions.set({ permissions });
				}
			}
		}

		console.log('Permissions définies !');
	}

	/** @param {import('./dto/ScheduleDTO')} schedule */
	async #executeSchedule(schedule) {
		/** @type {import('discord.js').TextChannel} */
		const channel = await this.channels.fetch(schedule.channelId);

		const infos = await this.#redditClient.get(`/r/${schedule.subreddit}/${schedule.category}`);
		const posts = infos.data.children.filter(post => post.data.url.match(/^\/r\//) === null);
		const post = posts[Math.floor(Math.random() * posts.length)];
		const url = post.data.url;
		if (typeof url === 'string' && url.length > 0) {
			await channel.send(generateSchedulePostMessageContent(post.data));
			await channel.send(post.data.url);
		} else {
			await channel.send(`Aucune donnée exploitable dans ce post (${post.data.id})`);
		}
	}

	async #setupSchedules() {
		console.log('Chargement des programmes...');

		const now = Date.now();

		const schedules = await findAllSchedules();
		for (const schedule of schedules) {
			const nextExecution = schedule.lastExecution.getTime() + schedule.frequency * 1000;
			const timeBeforeNextExecution = nextExecution - now;

			if (!this.#schedulesId.has(schedule.userId)) {
				this.#schedulesId.set(schedule.userId, new Collection());
			}
			const userSchedules = this.#schedulesId.get(schedule.userId);

			userSchedules.set(schedule.name, setTimeout(() => {
				this.#executeSchedule(schedule);
				this.addSchedule(schedule);
			}, timeBeforeNextExecution < 0 ? 0 : timeBeforeNextExecution));
		}

		console.log('Programmes chargés !');
	}

	/** @param {import('./dto/ScheduleDTO')} schedule */
	addSchedule(schedule) {
		if (!this.#schedulesId.has(schedule.userId)) {
			this.#schedulesId.set(schedule.userId, new Collection());
		}
		const userSchedules = this.#schedulesId.get(schedule.userId);

		clearInterval(userSchedules.get(schedule.name));
		userSchedules.set(schedule.name, setInterval(() => {
			this.#executeSchedule(schedule);
		}, schedule.frequency * 1000));
	}

	/** @param {import('./dto/ScheduleDTO')} schedule */
	removeSchedule(schedule) {
		const userSchedules = this.#schedulesId.get(schedule.userId);
		if (userSchedules === undefined) {
			throw new Error(`Il n'y a pas de programmes pour l'utilisateur '${schedule.userId}'`);
		}
		const scheduleTimer = userSchedules.get(schedule.name);
		if (scheduleTimer === undefined) {
			throw new Error(`Le programme '${schedule.name}' de l'utilisateur '${schedule.userId}' n'exsite pas`);
		}

		clearInterval(scheduleTimer);
	}

	async login() {
		console.log('Connexion à Discord...');
		await super.login(process.env.DISCORD_TOKEN);
		console.log('Connecté à Discord !');
	}
};