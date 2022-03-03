// Dependencies
const express = require('express');
const { init: initDatabase, findAllCardTemplates } = require('./utils/databaseUtils');
const path = require('path');
const SwagridClient = require('./SwagridClient');

const client = new SwagridClient();
const app = express();

function initWebsite() {
	console.log('lancement du serveur HTTP...');

	app.use(express.static(path.join(__dirname, '/public')));

	app.get('/cards', async (_, res) => {
		const cardTemplates = await findAllCardTemplates();
		const jsonified = cardTemplates.map(cardTemplate => cardTemplate.toJSON());
		res.json(jsonified);
	});

	const listener = app.listen(process.env.PORT, () => {
		console.log(`Serveur HTTP lancé sur le port ${listener.address().port} !`);
	});
}

async function initClient() {
	client.once('ready', () => {
		client.user.setActivity({
			type: 'COMPETING',
			name: 'Quidditch'
		});

		client.definePermissions();
	});

	await Promise.all([client.loadCommands(), client.loadEvents(), client.loadButtons(), client.loadContextMenus()]);
	await client.login();
}

process.on('SIGINT', () => {
	client.destroy();
	process.exit();
});

(() => {
	initDatabase();
	initClient();
	initWebsite();
})();