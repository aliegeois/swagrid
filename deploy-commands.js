const { readdirSync } = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

function fetchCommands() {
	const commandFiles = readdirSync('./commands');

	return commandFiles.filter(
		file => file.endsWith('.js')
	).map(file =>
		require(`./commands/${file}`).data.toJSON()
	);
}

function fetchContextMenus() {
	const contextMenuFiles = readdirSync('./context-menus');

	return contextMenuFiles.filter(
		file => file.endsWith('.js')
	).map(file =>
		require(`./context-menus/${file}`).data.toJSON()
	);
}

(() => {
	const body = [
		...fetchCommands(),
		...fetchContextMenus()
	];
	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

	rest.put(Routes.applicationGuildCommands(process.env.APP_ID, process.env.POUDLARD_ID), { body })
		.then(() => console.log('Commandes enregistrées avec succès !'))
		.catch(console.error);
})();