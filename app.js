// Dependencies
const express = require('express');
const { init: initDatabase, findAllCardTemplates } = require('./utils/databaseUtils');
const path = require('path');
const SwagridClient = require('./SwagridClient');

const client = new SwagridClient();
const app = express();

function initWebsite() {
	console.log('lancement du serveur HTTP...');

	if (process.env.NODE_ENV === 'production') {
		// Force https en prod
		app.use((req, res, next) => {
			if (req.headers['x-forwarded-proto'] == 'https') {
				next();
			} else {
				res.redirect(`https://${req.headers.host}${req.url}`);
			}
		});
	}

	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/cards', async (_, res) => {
		const cardTemplates = await findAllCardTemplates();
		const jsonified = cardTemplates.map(cardTemplate => cardTemplate.toJSON());
		res.json(jsonified);
	});

	const listener = app.listen(process.env.PORT, () => {
		console.log(`Serveur HTTP lancé sur le port ${listener.address().port} !`);
	});
}

process.on('SIGINT', () => {
	client.destroy();
	process.exit();
});

(async () => {
	await initDatabase();
	await client.login();
	initWebsite();
})();