const { readdirSync } = require('fs');
const { Client, Collection, Intents } = require('discord.js');

/** @typedef {{ data: import('@discordjs/builders').SlashCommandBuilder, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').CommandInteraction, client: import('./SwagridClient')) => Promise<void> }} SwagridCommand */
/** @typedef {{ name: string, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').ButtonInteraction, client: import('./SwagridClient')) => Promise<void> }} SwagridButton */
/** @typedef {{ data: import('@discordjs/builders').ContextMenuCommandBuilder, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').ContextMenuInteraction, client: import('./SwagridClient')) => Promise<void> }} SwagridContextMenu */

module.exports = class SwagridClient extends Client {
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
		super({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] });

		this.once('ready', () => {
			this.user.setActivity({
				type: 'COMPETING',
				name: 'Quidditch'
			});

			this.#definePermissions();
		});

		this.#loadCommands();
		this.#loadEvents();
		this.#loadButtons();
		this.#loadContextMenus();
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

	async login() {
		console.log('Connexion à Discord...');
		await super.login(process.env.DISCORD_TOKEN);
		console.log('Connecté à Discord !');
	}
};