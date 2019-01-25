/* jshint -W061 */

/** @type {boolean} */
const local = typeof process.env.TOKEN === 'undefined';

// Dependances
const Discord = require('discord.js'),
	Sequelize = require('sequelize'),
	search = require('youtube-api-v3-search'),
	request = require('request-promise-native'),
	parseString = require('xml2js').parseString,
	express = require('express'),
	ytdl = require('ytdl-core'),
	app = express(),
	client = new Discord.Client({
		disabledEvents: ['TYPING_START']
	});

const Music = require('./music'),
	Permission = require('./permission'),
	{ CommandDispatcher, literal, argument } = require('./commandDispatcher');

/** @type {{prefix: string, owner: string, guilds: [{id: string, permissions: [{name: string, roleId: string}]}]}} */
const config = require('./config.json');
/** @type {{}|{TOKEN: string, YT: string}} */
const env = local ? require('./env.json') : {};


const dispatcher = new CommandDispatcher();

dispatcher.register(
	literal('say')
		.then(
			argument('message', true)
				.executes((source, args) => {
					return new Promise((resolve, reject) => {
						source.message.delete().catch(_=>{});
						source.message.channel.send(args.join(' '));
						resolve();
					});
				})
		)
		.description('Fait dire des choses à Swagrid')
);

dispatcher.register(
	literal('tts')
		.then(
			argument('message', true)
				.executes((source, args) => {
					return new Promise((resolve, reject) => {
						source.message.delete().catch(_=>{});
						source.message.channel.send(args.join(' '), {tts: true}).catch(_=>{});
						resolve();
					});
				})
		)
		.description('Comme "say" mais avec du tts en plus')
);

dispatcher.register(
	literal('join')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				let member = source.message.member;
				if(member.voiceChannelID == null) {
					source.message.reply('vous devez être dans un channel vocal pour invoquer Swagrid').catch(_=>{});
					resolve();
				} else {
					source.music.voiceChannel = member.guild.channels.get(member.voiceChannelID);
					source.music.voiceChannel.join().then(connection => {
						source.music.voiceConnection = connection;
						resolve();
					}).catch(err => {
						source.music.voiceChannel = null;
						source.music.voiceConnection = null;
						reject(err);
					});
				}
			});
		})
		.description('Invoque Swagrid dans le channel vocal')
);

dispatcher.register(
	literal('leave')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('play')
		.then(
			argument('keywords')
				.executes((message, keywords) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('playing')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('playlist')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('cancel')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('skip')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('stop')
		.executes((message) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('r34')
		.then(
			argument('keywords', true)
				.executes((message, keywords) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('addpermission')
		.then(
			argument('name')
				.then(
					argument('role')
						.executes((message, name, role) => {
							return new Promise((resolve, reject) => {
								// ajoute un rôle
								resolve();
							});
						})
				)
				
		)
);

dispatcher.register(
	literal('setpermission')
		.then(
			argument('command')
				.then(
					argument('roleName')
						.executes((message, command, roleName) => {
							return new Promise((resolve, reject) => {
								// ajoute un rôle
								resolve();
							});
						})
				)
				
		)
);

dispatcher.register(
	literal('removepermission')
		.then(
			argument('name')
				.executes((message, name) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
		)
);

dispatcher.register(
	literal('emojipopularity')
		.executes((message, keyword) => {
			return new Promise((resolve, reject) => {
				resolve();
			});
		})
);

dispatcher.register(
	literal('eval')
		.then(
			argument('command', true)
				.executes((_, command) => {
					return new Promise((resolve, reject) => {
						try {
							eval(command.join(' '));
							resolve();
						} catch(err) {
							reject(err);
						}
					});
				})
				.permission(Permission.expert)
		)
);

dispatcher.register(
	literal('resetdb')
		.then(
			argument('databases', true)
				.executes((message, databases) => {
					return new Promise((resolve, reject) => {
						resolve();
					});
				})
				.permission(Permission.expert)
		)
);

dispatcher.register(
	literal('help')
		.then(
			argument('commandName', true)
				.executes((source, commandName) => {
					return new Promise((resolve, reject) => {
						let command = dispatcher.commands.get(commandName);
						if(command !== undefined) {
							/** @type {Discord.Message} */
							let message = source.message;
							message.channel.send(`-- Aide pour ${command.name} --\nDescription:\`\`\`\n${command.description}\`\`\``).then(resolve).catch(reject);
						} else if(!command.permission.checkPermission(source.message.member)) {
							reject('permission insuffisante pour voir cette commande');
						} else {
							reject('commande inconnue');
						}
					});
				})
				.description('Affiche l\'aide d\'une commande en particulier')
		)
		.executes(source => {
			return new Promise((resolve, reject) => {
				let result = 'Liste des commandes disponibles pour vous:';

				for(let [name, command] of dispatcher.commands) {
					result += `\n${name}: ${command.description}`;
				}
				result += `\n\nPour obtenir de l'aide sur une commande, entrez "${config.prefix}help <nom de la commande>"`;

				/** @type {Discord.Message} */
				let message = source.message;
				message.channel.send(result).then(resolve).catch(reject);
			});
		})
		.description('Affiche ce message d\'aide')
);

client.on('ready', _ => {
	console.log('Initialisation de Swagrid...');
	client.user.setActivity('de la magie', {type: 'WATCHING'});

	for(let [id, guild] of client.guilds) {
		let guildConfig = config.guilds[id];

		if(guildConfig === undefined)
			continue;
		if(typeof guildConfig.permissions !== 'object' || !(Symbol.iterator in guildConfig.permissions))
			continue;
		
		for(let perm of guildConfig.permissions) {
			if(typeof perm.name !== 'string' || typeof perm.roleId !== 'string')
				continue;
			if(Permission[perm.name] !== undefined)
				continue;
			if(!guild.roles.has(perm.roleId))
				continue;
			
			Permission[perm.name] = new Permission(user => {
				let role = guild.roles.get(perm.roleId);
				if(role === undefined)
					return false;

				return role.members.some(m => m.user.id === user.id);
			});
		}
	}

	console.info('Prêt à défoncer des mères');
});

client.on('message', message => {
	if(message.author.bot)
		return;
	
	if(message.content.indexOf(config.prefix) !== 0) {
		//testForMio(message);
		//countEmojis(message);
		return;
	}
	
	/*if(!(message.channel instanceof Discord.TextChannel))
		if(!Permission.expert.checkPermission(message.author.id))
			return;*/
	
	/** @type {string[]} */
	let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	/** @type {string} */
	let name = args.shift().toLowerCase();
	
	//Command.execute(name, message, args).catch(err => console.error(err));

	dispatcher.parse({
		message: message
	}, message.content);
});