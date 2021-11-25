// Dependencies
const { readdir } = require('fs/promises');
const { Client, Collection, Intents } = require('discord.js');
const { init: initDatabase } = require('./utils/database-utils');

// Local objects
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
/** @type {{userId: string, guildId: string, createdTimestamp: number}[]} */
client.lastMessageSent = [];
/** @type {Collection<string, number>} */
client.messageCounter = new Collection();

const masterPermission = {
	id: process.env.OWNER_ID,
	type: 'USER',
	permission: true
};

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

async function definePermissions() {
	console.log('Définition des permissions...');

	const poudlardCommands = await client.guilds.cache.get(process.env.POUDLARD_ID).commands.fetch();
	for (const command of poudlardCommands.values()) {
		if (['resetdb', 'populate', 'spawnchannel', 'channel'].includes(command.name)) {
			command.permissions.set({ permissions: [masterPermission] });
		}
	}

	console.log('Permissions définies !');
}

client.once('ready', async () => {
	client.user.setActivity({
		type: 'WATCHING',
		name: 'du Quidditch'
	});
});

async function loginBot() {
	console.log('Connexion à Discord...');
	await client.login(process.env.DISCORD_TOKEN);
	console.log('Connecté à Discord !');
}

process.on('SIGINT', () => {
	client.destroy();
	process.exit();
});

(async () => {
	await initDatabase();
	await Promise.all([loadCommands(), loadEvents(), loadButtons()]);
	await loginBot();
	await definePermissions();
})();