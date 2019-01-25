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

/** @type {string} */
var ytKey = (local ? env : process.env).YT;

/** @type {Sequelize} */
var sequelize;
/** @type {Sequelize.Model} */
var Emoji;

const dispatcher = new CommandDispatcher();

dispatcher.register(
	literal('say')
		.then(
			argument('message', true)
				.executes((source, args) => {
					return new Promise((resolve, reject) => {
						source.message.delete()
							.then(() => {
								source.message.channel.send(args.join(' '))
									.then(resolve)
									.catch(reject);
							})
							.catch(_=>{});
					});
				})
		)
		.permission(Permission.advanced)
		.description('Fait dire des choses à Swagrid')
);

dispatcher.register(
	literal('tts')
		.then(
			argument('message', true)
				.executes((source, args) => {
					return new Promise((resolve, reject) => {
						source.message.delete()
							.then(() => {
								source.message.channel.send(args.join(' '), {tts: true})
									.then(resolve)
									.catch(reject);
							})
							.catch(_=>{});
					});
				})
		)
		.permission(Permission.advanced)
		.description('Comme "say" mais avec du tts en plus')
);

dispatcher.register(
	literal('join')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.GuildMember} */
				let member = source.message.member;
				if(member.voiceChannelID == null) {
					source.message.reply('vous devez être dans un channel vocal pour invoquer Swagrid').catch(_=>{});
					resolve();
				} else {
					Music.voiceChannel = member.voiceChannel;
					Music.voiceChannel.join().then(connection => {
						Music.voiceConnection = connection;
						resolve();
					}).catch(err => {
						Music.voiceChannel = null;
						Music.voiceConnection = null;
						reject(err);
					});
				}
			});
		})
		.description('Invoque Swagrid dans le channel vocal')
);

dispatcher.register(
	literal('leave')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				if(message.member.voiceChannelID == null) {
					message.reply('vous devez être dans un channel vocal pour déplacer Swagrid').catch(_=>{});
				} else {
					Music.voiceChannel.leave();
					Music.voiceChannel = null;
					Music.voiceConnection = null;
				}
				resolve();
			});
		})
		.description('Renvoie Swagrid du channel vocal vers sa hutte')
);

dispatcher.register(
	literal('play')
		.then(
			argument('keywords')
				.executes((source, keywords) => {
					return new Promise((resolve, reject) => {
						/** @type {Discord.Message} */
						let message = source.message;
						if(Music.voiceConnection == null) {
							reject('Swagrid n\'est pas dans un channel');
						} else if(message.member.voiceChannelID != Music.voiceChannel.id) {
							message.reply('Petit boloss, arrête de mettre des sons si tu n\'es pas dans le channel')
								.then(resolve)
								.catch(reject);
						} else {
							keywords = keywords.join(' ');
							search(ytKey, {
								q: keywords,
								maxResults: 1,
								part: 'snippet',
								type: 'video'
							}).then(res => {
								message.channel.send(`Recherche de \`${keywords}\``, new Discord.RichEmbed({
									author: {
										'name': 'Ajout à la file d\'attente'
									},
									thumbnail: {
										'url': `https://img.youtube.com/vi/${res.items[0].id.videoId}/hqdefault.jpg`
									},
									title: `${res.items[0].snippet.title}`,
									url: `https://youtu.be/${res.items[0].id.videoId}/`
								})).then(() => {
									Music.add(res.items[0].id.videoId, res.items[0].snippet.title);
									resolve();
								}).catch(reject);
							}).catch(reject);
						}
					});
				})

		)
		.description('Effectue une recherche sur Youtube et joue la première vidéo trouvée, ou la met en attente si une vidéo est déjà en cours de lecture (vous devez être dans le même channel vocal que Swagrid)')
);

dispatcher.register(
	literal('playing')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				if(Music.playing == '') {
					message.reply('Aucune musique en cours de lecture')
						.then(resolve)
						.catch(reject);
				} else {
					message.reply(`"${Music.playing}" est en cours de lecture`)
						.then(resolve)
						.catch(reject);
				}
			});
		})
		.description('Permet d\'obtenir le nom de la vidéo qui passe actuellement')
);

dispatcher.register(
	literal('playlist')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				message.reply(Music.playlist())
					.then(resolve)
					.catch(reject);
			});
		})
		.description('Affiche le titre des vidéos dans la file d\'attente')
);

dispatcher.register(
	literal('cancel')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				if(message.member.voiceChannelID == null) {
					message.reply('vous devez être dans un channel vocal pour déplacer Swagrid')
						.then(resolve)
						.catch(reject);
				} else {
					Music.cancel();
					resolve();
				}
			});
		})
		.description('Annule la dernière action (en rapport avec les vidéos)')
);

dispatcher.register(
	literal('skip')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				if(message.member.voiceChannelID == null) {
					message.reply('vous devez être dans un channel vocal pour déplacer Swagrid')
						.then(resolve)
						.catch(reject);
				} else {
					Music.skip();
					resolve();
				}
			});
		})
		.description('Fait passer la vidéo en cours de lecture')
);

dispatcher.register(
	literal('stop')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				if(message.member.voiceChannelID == null) {
					message.reply('vous devez être dans un channel vocal pour déplacer Swagrid')
						.then(resolve)
						.catch(reject);
				} else {
					Music.stop();
					resolve();
				}
			});
		})
		.description('Arrête la vidéo en cours et vide la file d\'attente')
);

dispatcher.register(
	literal('danbooru')
		.then(
			argument('keywords', true)
				.executes((source, keywords) => {
					return new Promise((resolve, reject) => {
						request(`https://danbooru.donmai.us/posts.json?tags=${keywords.join(' ')}&limit=1&random=true`)
							.then(result => {
								/** @type {Discord.Message} */
								let message = source.message;
								let post;

								try {
									post = JSON.parse(result);
								} catch(e) {
									reject('erreur durant l\'analyse des données');
								}

								if(post == []) {
									message.reply('aucun résultat')
										.then(resolve)
										.catch(reject);
								} else if(post.success === false) {
									if(post.message === 'You cannot search for more than 2 tags at a time') {
										message.reply('recherche limitée à 2 tags')
											.then(resolve)
											.catch(reject);
									} else {
										message.reply(`erreur: ${post.message}`)
											.then(resolve)
											.catch(reject);
									}
								} else {
									let url = post[0].file_url;
									message.channel.send({
										file: url
									}).then(resolve).catch(reject);
								}
							})
							.catch(reject);
					});
				})
				.description('effectue une recherche sur danbooru et affiche une image au hasard en rapport avec les tags indiqués')
		)
);

dispatcher.register(
	literal('emojipopularity')
		.executes((source, keyword) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;

				Emoji.findAll().then(emojis => {
					emojis.sort((e1, e2) => {
						return e2.count - e1.count;
					});

					let msg = 'Popularité des émojis par nombre d\'utilisations:';
					for(let emoji of emojis)
						if(emoji.count > 0)
							msg += `\n${emoji.count} : ${message.member.guild.emojis.get(emoji.emojiId)}`;

					message.channel.send(msg)
						.then(resolve)
						.catch(reject);
				}).catch(err => {
					console.error(`erreur retrieve all emojis: ${err}`);
					reject(err);
				});
			});
		})
		.description('Affiche la popularité des émojis du serveur')
);

/*dispatcher.register(
	literal('addpermission')
		.then(
			argument('name')
				.then(
					argument('role')
						.executes((message, name, role) => {
							return new Promise((resolve, reject) => {
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
);*/



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
							if(command.permission.checkPermission(source.message.member)) {
								/** @type {Discord.Message} */
								let message = source.message;
								message.channel.send(`-- Aide pour ${command.name} --\nDescription:\`\`\`\n${command.description}\`\`\``).then(resolve).catch(reject);
							} else {
								reject('permission insuffisante pour voir cette commande');
							}
						}
					});
				})
				.description('Affiche l\'aide d\'une commande en particulier')
		)
		.executes(source => {
			return new Promise((resolve, reject) => {
				let result = 'Liste des commandes disponibles pour vous:';

				for(let [name, command] of dispatcher.commands) {
					if(command.permission.checkPermission(source.message.member))
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
	},message.content.slice(config.prefix.length).trim());
});



sequelize = new Sequelize('database', {
	dialect: 'sqlite',
	storage: '.data/database.sqlite',
	logging: false
});

sequelize.authenticate().then(() => {
	console.info('Authentication to database successfull');
	
	Emoji = sequelize.define('emoji', {
		emojiId: {
			type: Sequelize.STRING,
			primaryKey: true
		},
		count: Sequelize.INTEGER
	});
	//resetDB(['mio', 'emoji']);
}).catch(err => {
	console.error(err);
});

app.get('/', (request, response) => {
	response.sendFile(`${__dirname}/index.html`);
});
var listener = app.listen(3000, () => {
	console.info('Swagrid présent sur le port ' + listener.address().port);
});


client.login((local ? env : process.env).TOKEN);