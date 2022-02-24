const { readdir } = require('fs/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

async function fetchCommands() {
	const commandFiles = await readdir('./commands');

	return commandFiles.filter(
		file => file.endsWith('.js')
	).map(file =>
		require(`./commands/${file}`).data.toJSON()
	);
}

async function fetchContextMenus() {
	const contextMenuFiles = await readdir('./contextmenus');

	return contextMenuFiles.filter(
		file => file.endsWith('.js')
	).map(file =>
		require(`./contextmenus/${file}`).data.toJSON()
	);
}

(async () => {
	const commands = await Promise.all([fetchCommands(), fetchContextMenus()]);
	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

	rest.put(Routes.applicationGuildCommands(process.env.APP_ID, process.env.POUDLARD_ID), { body: commands.flat() })
		.then(() => console.log('Commandes enregistrées avec succès !'))
		.catch(console.error);
})();