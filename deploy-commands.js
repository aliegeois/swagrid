const { readdir } = require('fs/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

readdir('./commands').then(files => {
	const commands = files.filter(file => file.endsWith('.js')).map(file =>
		require(`./commands/${file}`).data.toJSON()
	);

	const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

	rest.put(Routes.applicationGuildCommands(process.env.APP_ID, process.env.POUDLARD_ID), { body: commands })
		.then(() => console.log('Commandes enregistrées avec succès !'))
		.catch(console.error);
});