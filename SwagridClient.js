const { readdir } = require('fs/promises');
const { Client, Collection, Intents } = require('discord.js');

/** @typedef {{ data: import('@discordjs/builders').SlashCommandBuilder, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').CommandInteraction, client: SwagridClient) => Promise<void> }} SwagridCommand */
/** @typedef {{ name: string, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').ButtonInteraction, client: SwagridClient) => Promise<void> }} SwagridButton */
/** @typedef {{ data: import('@discordjs/builders').ContextMenuCommandBuilder, permissions?: import('discord.js').ApplicationCommandPermissionData[], execute: (interaction: import('discord.js').ContextMenuInteraction, client: SwagridClient) => Promise<void> }} SwagridContextMenu */

module.exports = class SwagridClient extends Client {
	/** @type {{userId: string, guildId: string, createdTimestamp: number}[]} */
	lastMessageSent = [];
	/** @type {Collection<string, number>} */
	messageCounter = new Collection();
	/** @type {Collection<string, { cardSuggestion: import('./dto/CardSuggestionDTO'), attachment: import('discord.js').MessageAttachment }} */
	temporaryCardSuggestions = new Collection();

	/** @type {Collection<string, SwagridCommand>} */
	commands = new Collection();
	/** @type {Collection<string, SwagridButton>} */
	buttons = new Collection();
	/** @type {Collection<string, SwagridContextMenu>} */
	contextMenus = new Collection();
	constructor() {
		super({
			intents: [ Intents.FLAGS.GUILD_MESSAGES ]
		});
	}

	async loadCommands() {
		console.log('Récupération des commandes...');

		const files = await readdir('./commands');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./commands/${file}`)
		).forEach(command =>
			this.commands.set(command.data.name, command)
		);

		console.log('Commandes récupérées !');
	}

	async loadEvents() {
		console.log('Récupération des événements...');

		const files = await readdir('./events');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./events/${file}`)
		).forEach(event =>
			this.on(event.name, event.execute)
		);

		console.log('Événements récupérées !');
	}

	async loadButtons() {
		console.log('Récupération des boutons...');

		const files = await readdir('./buttons');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./buttons/${file}`)
		).forEach(button =>
			this.buttons.set(button.name, button)
		);

		console.log('Boutons récupérés !');
	}

	async loadContextMenus() {
		console.log('Récupération des menus contextuel...');

		const files = await readdir('./context-menus');
		files.filter(file =>
			file.endsWith('.js')
		).map(file =>
			require(`./context-menus/${file}`)
		).forEach(contextMenu =>
			this.contextMenus.set(contextMenu.data.name, contextMenu)
		);

		console.log('Menus contextuel récupérés !');
	}

	async login() {
		console.log('Connexion à Discord...');
		await super.login(process.env.DISCORD_TOKEN);
		console.log('Connecté à Discord !');
	}

	async definePermissions() {
		console.log('Définition des permissions...');

		const poudlard = await this.guilds.fetch(process.env.POUDLARD_ID);
		const poudlardCommands = await poudlard.commands.fetch();
		for (const command of poudlardCommands.values()) {
			if (this.commands.has(command.name)) {
				const permissions = this.commands.get(command.name).permissions;
				if (permissions !== undefined) {
					command.permissions.set({ permissions });
				}
			}
		}

		console.log('Permissions définies !');
	}
};