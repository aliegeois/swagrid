const Discord = require('discord.js'),
	// eslint-disable-next-line no-unused-vars
	{ Sequelize, Model, DataTypes } = require('sequelize'),
	{ createCanvas, loadImage } = require('canvas'),
	ctx = createCanvas(174, 174),
	express = require('express'),
	app = express(),
	client = new Discord.Client();

const { Permission, CommandDispatcher, literal, argument } = require('./commandDispatcher');

/** @type {{prefix: string, owner: string, errorMessages: any, guilds: any}} */
const config = require('./config.json');

/** @type {Sequelize} */
let sequelize;
/** @type {Model} */
let GachaMeme;
/** @type {Model} */
let GachaUser;
/** @type {Model} */
let GachaOwn;

const tableName = {
	gachameme: 'gachameme',
	gachauser: 'gachauser',
	gachaown: 'gachaown',
	gachahistory: 'gachahistory'
};

const servicesName = {
	client: 'client',
	database: 'database'
};

Permission.expert = new Permission(source => source.message.member.id === config.owner);
const dispatcher = new CommandDispatcher();

// Commands

dispatcher.register(
	literal('say')
		.then(
			argument('message', true)
				.executes((source, ...args) => {
					return new Promise((resolve, reject) => {
						source.message.delete()
							.then(() => {
								source.message.channel.send(args.join(' '))
									.then(resolve)
									.catch(reject);
							})
							.catch(reject);
					});
				})
				.permission('advanced')
				.description('Fait dire des choses à Swagrid')
		)
);

dispatcher.register(
	literal('catch')
		.executes(() => {
			return Promise.resolve();
		})
		.description('Attrape le dernier meme qui est apparu')
);

dispatcher.register(
	literal('spawn')
		.executes(source => {
			return new Promise((resolve, reject) => {
				source.message.channel
					.send({
						files: [{
							attachment: '.data/doot.png',
							name: 'doot.png'
						}]
					})
					.then(resolve)
					.catch(reject);
			});
		})
		.description('Fait spawn un meme')
		.permission('expert')
);

dispatcher.register(
	literal('resetdb')
		.then(
			argument('databases', true)
				.executes((_, ...databases) => {
					return new Promise((resolve, reject) => {
						resetDB(databases)
							.then(resolve)
							.catch(reject);
					});
				})
				.permission('expert')
				.description('Réinitialise les bases de données sélectionnées')
		)
);

dispatcher.register(
	literal('help')
		.executes(source => {
			return new Promise((resolve, reject) => {
				let usableCommands = [];
				dispatcher.commands.forEach(command => usableCommands.push(...command.getUsages(config.prefix)));
				let descriptions = usableCommands
					.filter(({ command }) => Permission[command.getPermission()].checkPermission(source))
					.map(({ usage, description }) => `${usage}: ${description}`)
					.join('\n');

				source.message.channel.send(`Liste des commandes disponibles pour vous:\`\`\`${descriptions}\`\`\``)
					.then(resolve)
					.catch(reject);
			});
		})
		.description('Affiche ce message d\'aide')
);

// Helper functions

function ready(name) {
	console.log(name, 'ready');
	if ((++ready.servicesReady) === ready.nbServices) { // client et database ready
		console.info('Prêt à défoncer des mères');

		initGacha();
	}
}
ready.servicesReady = 0;
ready.nbServices = Object.keys(servicesName).length;

function initGacha() {

}

/**
 * @param {Discord.Message} message
 */
function coup(message) {
	if (message.content.match(/^coup| coup$|^cou | cou$| cou | coup /) !== null) { // Quelqu'un dit "coup"
		message.react('551153662827823104').catch(() => {});
	}
}

// Discord events

client.on('ready', async () => {
	console.log('Initialisation de Swagrid...');

	// Récupérer la config de chaque guild
	for (let [id, guild] of client.guilds.cache) {
		/** @type {{permissions: Array.<{name: string, roleId: string}>, loggingChannel: string}} */
		let guildConfig = config.guilds[id];

		if (guildConfig === undefined)
			continue;
		if (typeof guildConfig.permissions === 'object' && (Symbol.iterator in guildConfig.permissions)) {
			await guild.roles.fetch();

			for (let perm of guildConfig.permissions) {
				if (typeof perm.name !== 'string' || typeof perm.roleId !== 'string')
					continue;
				if (Permission[perm.name] !== undefined)
					continue;
				if (!guild.roles.cache.has(perm.roleId))
					continue;

				Permission[perm.name] = new Permission(source => {
					let role = guild.roles.cache.get(perm.roleId);

					if (role === undefined)
						return false;

					return role.members.some(m => m.id === source.message.member.id) || source.message.member.id === config.owner;
				});
			}
		}
	}

	ready(servicesName.client);
});

client.on('message', message => {
	if (message.author.bot)
		return;

	let content = message.content.trim();

	if (content.indexOf(config.prefix) !== 0 || content.length > 1 && content[1] === ' ') {
		coup(message);

		return;
	} else if (content.indexOf(config.prefix) === 0 && (content.length <= 1 || content[1] !== ' ')) {

	}

	let command = content.slice(config.prefix.length);

	dispatcher.parse({ message: message }, command)
		.catch(err => {
			if (!(err instanceof CommandDispatcher.UnknownCommandError)) {
				message.channel.send('```' + err + '```').catch(() => {});
			}
			console.error(err.message);
		});
});

// Sequelize

/** @param {string[]} tables */
function resetDB(tables) {
	return new Promise((resolve, reject) => {
		let max = 0;
		for(let t of Object.values(tableName))
			if (tables.includes(t))
				max++;

		let synced = 0;
		let increment = () => {
			if ((++synced) === max)
				resolve();
		};

		if (tables.includes(tableName.gachameme)) {
			console.log('reset', tableName.gachameme);
			GachaMeme.sync({ force: true })
				.then(() => {
					console.log(tableName.gachameme, 'has been reset');
				})
				.catch(reject)
				.finally(increment);
		}
		if (tables.includes(tableName.gachauser)) {
			console.log('reset', tableName.gachauser);
			GachaUser.sync({ force: true })
				.then(() => {
					console.log(tableName.gachauser, 'has been reset');
				})
				.catch(reject)
				.finally(increment);
		}
		if (tables.includes(tableName.gachaown)) {
			console.log('reset', tableName.gachaown);
			GachaOwn.sync({ force: true })
				.then(() => {
					console.log(tableName.gachaown, 'has been reset');
				})
				.catch(reject)
				.finally(increment);
		}

		if (max === 0)
			resolve();
	});
}

sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false
});

sequelize.authenticate().then(() => {
	console.info('Authentication to database successful');

	GachaMeme = sequelize.define(tableName.gachameme, {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		name: DataTypes.STRING,
		rarity: DataTypes.INTEGER
	});

	GachaUser = sequelize.define(tableName.gachauser, {
		id: {
			type: DataTypes.STRING,
			primaryKey: true
		}
	});

	GachaOwn = sequelize.define(tableName.gachaown, {
		meme_id: {
			type: DataTypes.INTEGER,
			references: {
				model: GachaMeme,
				key: 'id'
			}
		},
		user_id: {
			type: DataTypes.STRING,
			references: {
				model: GachaUser,
				key: 'id'
			}
		}
	});

	ready(servicesName.database);
}).catch(console.error);

// Web server

app.use(express.static(`${__dirname}/public`));

let listener = app.listen(process.env.PORT, () => {
	console.info('Swagrid présent sur le port ' + listener.address().port);
});

// Technical

function exit() {
	client.destroy();
	process.exit();
}

process.on('SIGINT', exit);
process.on('SIGTERM', exit);

client.login(process.env.TOKEN);