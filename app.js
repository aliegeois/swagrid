// Dependencies
const { readdir } = require('fs/promises');
const { Client, Collection, Intents } = require('discord.js');
const express = require('express');
const { init: initDatabase } = require('./utils/database-utils');
const { MASTER_PERMISSION } = require('./constants');
const path = require('path');

// Local objects
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
/** @type {{userId: string, guildId: string, createdTimestamp: number}[]} */
client.lastMessageSent = [];
/** @type {Collection<string, number>} */
client.messageCounter = new Collection();
/** @type {Collection<string, import('./dto/CardSuggestionDTO')} */
client.temporaryCardSuggestions = new Collection();

const app = express();

async function loadCommands() {
	console.log('Récupération des commandes...');
	client.commands = new Collection();

	const files = await readdir('./commands');
	files.filter(file =>
		file.endsWith('.js')
	).map(file =>
		require(`./commands/${file}`)
	).forEach(command =>
		client.commands.set(command.data.name, command)
	);

	console.log('Commandes récupérées !');
}

async function loadEvents() {
	console.log('Récupération des événements...');

	const files = await readdir('./events');
	files.filter(file =>
		file.endsWith('.js')
	).map(file =>
		require(`./events/${file}`)
	).forEach(event =>
		client.on(event.name, event.execute)
	);

	console.log('Événements récupérées !');
}

async function loadButtons() {
	console.log('Récupération des boutons...');
	client.buttons = new Collection();

	const files = await readdir('./buttons');
	files.filter(file =>
		file.endsWith('.js')
	).map(file =>
		require(`./buttons/${file}`)
	).forEach(button =>
		client.buttons.set(button.name, button)
	);

	console.log('Boutons récupérés !');
}

async function loadContextMenus() {
	console.log('Récupération des menus contextuel...');
	client.contextMenus = new Collection();

	const files = await readdir('./contextmenus');
	files.filter(file =>
		file.endsWith('.js')
	).map(file =>
		require(`./contextmenus/${file}`)
	).forEach(contextMenu =>
		client.contextMenus.set(contextMenu.data.name, contextMenu)
	);

	console.log('Menus contextuel récupérés !');
}

async function loginBot() {
	console.log('Connexion à Discord...');
	await client.login(process.env.DISCORD_TOKEN);
	console.log('Connecté à Discord !');
}

async function definePermissions() {
	console.log('Définition des permissions...');

	const poudlard = await client.guilds.fetch(process.env.POUDLARD_ID);
	const poudlardCommands = await poudlard.commands.fetch();
	for (const command of poudlardCommands.values()) {
		if (['resetdb', 'invalidatecache', 'populate', 'channel', 'updateconfig'].includes(command.name)) {
			command.permissions.set({ permissions: [MASTER_PERMISSION] });
		}
	}

	console.log('Permissions définies !');
}

function initWebsite() {
	console.log('lancement du serveur HTTP...');

	app.use(express.static(path.join(__dirname, '/public')));

	const listener = app.listen(process.env.PORT, () => {
		console.log(`Serveur HTTP lancé sur le port ${listener.address().port} !`);
	});
}

client.once('ready', async () => {
	client.user.setActivity({
		type: 'WATCHING',
		name: 'du Quidditch'
	});
});

process.on('SIGINT', () => {
	client.destroy();
	process.exit();
});

(async () => {
	await initDatabase();
	await Promise.all([loadCommands(), loadEvents(), loadButtons(), loadContextMenus()]);
	await loginBot();
	await definePermissions();
	initWebsite();
})();