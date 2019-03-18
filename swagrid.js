//* jshint -W061 */
//* jshint -W083 */
// glitch: node v10.15.0, npm 6.4.1

//** @type {boolean} */
//const local = process.env.LOCAL === 'true';

// Dependencies
const Discord = require('discord.js'),
	Sequelize = require('sequelize'),
	search = require('youtube-api-v3-search'),
	request = require('request-promise-native'),
	//parseString = require('xml2js').parseString,
	express = require('express'),
	app = express(),
	client = new Discord.Client({
		disabledEvents: ['TYPING_START']
	});

const Music = new (require('./music'))(),
	{ Permission, CommandDispatcher, literal, argument } = require('./commandDispatcher');

//** @type {{prefix: string, owner: string, guilds: [{id: string, permissions: [{name: string, roleId: string}]}]}} */
/** @type {{prefix: string, owner: string, errorMessages: any, guilds: any}} */
const config = require('./config.json');

/** @type {string} */
var ytKey = process.env.YT;
/** @type {Sequelize} */
var sequelize;
/** @type {Sequelize.Model} */
var Emoji;

Permission.expert = new Permission(user => user.id === config.owner);
const dispatcher = new CommandDispatcher();

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
	literal('tts')
		.then(
			argument('message', true)
				.executes((source, ...args) => {
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
				.permission('advanced')
				.description('Comme "say" mais avec du tts en plus')
		)
);

dispatcher.register(
	literal('fanta')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				Music.voiceConnection.playFile('fanta.m4a');
				resolve();
				/*dispatcher.parse(source, 'play tSKCyEOESCI')
					.then(resolve)
					.catch(reject);*/
			});
		})
		.description('MAIS TA GUEULE !')
);

dispatcher.register(
	literal('force')
		.then(
			argument('command', true)
				.executes((source, ...command) => {
					return new Promise((resolve, reject) => {
						dispatcher.parse({...source, ...{ force: true }}, command.join(' '))
							.then(resolve)
							.catch(reject);
					});
				})
				.permission('expert')
				.description('Force une commande')
		)
);

dispatcher.register(
	literal('join')
		.then(
			argument('channel', true)
				.executes((source, ...channel) => {
					return new Promise((resolve, reject) => {
						/** @type {Discord.Guild} */
						let guild = source.message.guild;
						/** @type {Map<string, [Discord.VoiceChannel, number]} */
						let count = new Map();

						for(let [,chan] of guild.channels) {
							if(chan instanceof Discord.VoiceChannel) {
								for(let word of channel) {
									if(chan.name.match(new RegExp(word, 'i')) !== null) {
										if(count.has(chan.id)) {
											count.set(chan.id, [chan, count.get(chan.id)[1] + 1]);
										} else {
											count.set(chan.id, [chan, 1]);
										}
									}
								}
							}
						}

						let sorted = [...count.entries()].sort(([ ,[ ,v1 ] ], [ ,[ ,v2 ] ]) => {
							return v2 - v1;
						}).map(([ ,[ chan ] ]) => chan);

						if(sorted.length > 0) {
							Music.join(sorted[0])
								.then(resolve)
								.catch(reject);
						} else {
							reject('channel non trouvé'); // TODO err
						}
					});
				})
				.permission('expert')
				.description('Fait rejoindre à Swagrid le channel passé en paramètre')
		)
		.executes(source => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.GuildMember} */
				let member = source.message.member;
				if(member.voiceChannelID === null) {
					source.message.reply('vous devez être dans un channel vocal pour invoquer Swagrid').catch(_=>{}); // TODO err
					resolve();
				} else {
					Music.join(member.voiceChannel)
						.then(resolve)
						.catch(reject);
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
				if(message.member.voiceChannelID === null && !source.force) {
					message.reply('vous devez être dans le même channel vocal que Swagrid pour exécuter cetet action') // TODO err
						.then(resolve)
						.catch(reject);
				} else {
					Music.leave();
					resolve();
				}
			});
		})
		.description('Renvoie Swagrid du channel vocal vers sa hutte')
);

dispatcher.register(
	literal('play')
		.then(
			argument('keywords', true)
				.executes((source, ...keywords) => {
					return new Promise(async (resolve, reject) => {
						/** @type {Discord.Message} */
						let message = source.message;
						if(Music.voiceConnection === null) {
							await dispatcher.parse(source, 'join');
						}
						if(message.member.voiceChannelID !== Music.voiceChannel.id && !source.force) {
							message.reply('Petit boloss, arrête de mettre des sons si tu n\'es pas dans le channel') // TODO err
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
								Music.add(res.items[0].id.videoId, res.items[0].snippet.title);
								message.channel.send(`Recherche de \`${keywords}\``, new Discord.RichEmbed({
									author: {
										'name': 'Ajout à la file d\'attente'
									},
									thumbnail: {
										'url': `https://img.youtube.com/vi/${res.items[0].id.videoId}/hqdefault.jpg`
									},
									title: `${res.items[0].snippet.title}`,
									url: `https://youtu.be/${res.items[0].id.videoId}/`
								})).then(resolve).catch(reject);
							}).catch(reject);
						}
					});
				})
				.description('Effectue une recherche sur Youtube et joue la première vidéo trouvée, ou la met en attente si une vidéo est déjà en cours de lecture (vous devez être dans le même channel vocal que Swagrid)')
		)
);

dispatcher.register(
	literal('playing')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				if(Music.playing === '') {
					message.reply('Aucune musique en cours de lecture') // TODO err
						.then(resolve)
						.catch(reject);
				} else {
					message.reply(`"${Music.playing}" est en cours de lecture`) // TODO msg
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
				message.reply(Music.playlist)
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
				if(message.member.voiceChannelID === null && !source.force) {
					message.reply('vous devez être dans un channel vocal pour effectuer cette action') // TODO err
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
				if(message.member.voiceChannelID === null && !source.force) {
					message.reply('vous devez être dans un channel vocal pour effectuer cette action') // TODO err
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
				if(message.member.voiceChannelID === null) {
					message.reply('vous devez être dans un channel vocal pour effectuer cette action') //TODO err
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
				.executes((source, ...keywords) => {
					return new Promise((resolve, reject) => {
						request(`https://danbooru.donmai.us/posts.json?tags=${keywords.join(' ')}&limit=1&random=true`)
							.then(result => {
								/** @type {Discord.Message} */
								let message = source.message;

								try {
									let post = JSON.parse(result);

									if(post.length === 0) {
										message.reply('aucun résultat') // TODO err
											.then(resolve)
											.catch(reject);
									} else if(post.success === false) {
										if(post.message === 'You cannot search for more than 2 tags at a time') {
											message.reply('recherche limitée à 2 tags') // TODO err
												.then(resolve)
												.catch(reject);
										} else {
											message.reply(`erreur: ${post.message}`) // TODO err
												.then(resolve)
												.catch(reject);
										}
									} else {
										let url = post[0].file_url;
										message.channel.send({
											file: url
										}).then(resolve).catch(reject);
									}
								} catch(e) {
									reject('erreur durant l\'analyse des données'); // TODO err
								}
							})
							.catch(reject);
					});
				})
				.description('effectue une recherche sur danbooru et affiche une image au hasard en rapport avec les tags indiqués')
		)
);

dispatcher.register(
	literal('delete')
		.then(
			argument('names', true)
				.executes((source, ...names) => {
					return new Promise((resolve, reject) => {
						/** @type {Discord.Message} */
						let message = source.message;

						if(!message.member.voiceChannel && !source.force) {
							reject('Vous devez être dans un channel vocal pour exécuter cette commande'); // TODO err
						} else {
							let deletable = Array.from(message.mentions.members.values()).filter(member => {
								let guildMember = message.member.voiceChannel.members.get(member.id);
								if(guildMember !== undefined && message.member.voiceChannelID === guildMember.voiceChannelID)
									return guildMember;
							});
	
							if(deletable.length) {
								message.guild.createChannel('SUCC', 'voice')
									.then(channel => {
										let remaining = deletable.length;
										for(let member of deletable) {
											member.setVoiceChannel(channel)
												.then(() => {
													remaining--;
													if(remaining === 0) {
														channel.delete()
															.then(resolve)
															.catch(reject);
													}
												}).catch(reject);
										}
									}).catch(reject);
							} else {
								message.reply('Personne à supprimer') // TODO err
									.then(resolve)
									.catch(reject);
							}
						}
					});
				})
				.permission('advanced')
				.description('Vire une personne du vocal')
		)
);

dispatcher.register(
	literal('emojipopularity')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;

				Emoji.findAll().then(emojis => {
					emojis.sort((e1, e2) => e2.count - e1.count);

					let msg = 'Popularité des émojis par nombre d\'utilisations:'; // TODO msg
					for(let emoji of emojis)
						if(emoji.count > 0)
							msg += `\n${emoji.count} : ${message.member.guild.emojis.get(emoji.emojiId)}`;

					message.channel.send(msg)
						.then(resolve)
						.catch(reject);
				}).catch(err => {
					console.error(`erreur retrieve all emojis: ${err}`); // TODO err
					reject(err);
				});
			});
		})
		.description('Affiche la popularité des émojis du serveur')
);

dispatcher.register(
	literal('eval')
		.then(
			argument('command', true)
				.executes((_, ...command) => {
					return new Promise((resolve, reject) => {
						try {
							eval(command.join(' '));
							resolve();
						} catch(err) {
							reject(err);
						}
					});
				})
				.permission('expert')
		)
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
		)
);

dispatcher.register(
	literal('help')
		.then(
			argument('command')
				.executes((source, command) => {
					return new Promise((resolve, reject) => {
						/** @type {Discord.Message} */
						
						let message = source.message;
						if(dispatcher.commands.has(command)) {
							command = dispatcher.commands.get(command);
							message.channel.send(`-- Aide pour la commande ${command.getName()} --\n${command.getUsages(config.prefix).map(({ usage, description }) => usage + ': ' + description).join('\n')}`)
								.then(resolve)
								.catch(reject);
						} else {
							message.reply(`commande inconnue: "${command}"`) // TODO err
								.then(resolve)
								.catch(reject);
						}
					});
				})
				.description('Affiche l\'aide d\'une commande en particulier')
		)
		.executes(source => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;

				let descriptions = Array.from(dispatcher.commands.values())
					.filter(command => Permission[command.getPermission()].checkPermission(message.member))
					.map(command =>
						command.getUsages(config.prefix)
							.map(({ usage, description }) => usage + ': ' + description)
							.join('\n')
					)
					.join('\n');

				message.channel.send(`Liste des commandes disponibles pour vous:\`\`\`${descriptions}\`\`\``) // TODO msg
					.then(resolve)
					.catch(reject);
			});
		})
		.description('Affiche ce message d\'aide')
);

/** @param {Discord.Message} message */
function countEmojis(message) {
	/** @type {RegExpMatchArray} */
	let strs = message.content.match(/<:[A-Za-z]+:[0-9]+>/g);
	if(strs !== null) {
		strs.reduce((previous, current) => {
			//let [name, id] = current.slice(2, -1).split(':');
			let [, id] = current.slice(2, -1).split(':');
			if(message.guild.emojis.has(id)) {
				return previous.then(() => {
					return new Promise((resolve, reject) => {
						Emoji.findOne({
							where: {
								emojiId: id
							}
						}).then(emoji => {
							if(emoji === null) {
								Emoji.create({
									emojiId: id,
									count: 1
								}).then(() => {
									resolve();
								}).catch(err => {
									console.error(`erreur create emoji: ${err}`); // TODO err
									reject(err);
								});
							} else {
								Emoji.update({
									count: emoji.count + 1
								}, {
									where: {
										emojiId: id
									}
								}).then(() => {
									resolve();
								}).catch(err => {
									console.error(`erreur update emoji: ${err}`); // TODO err
									reject(err);
								});
							}
						}).catch(err => {
							console.error(`erreur find emoji: ${err}`); // TODO err
							reject(err);
						});
					});
				}).catch(err => {
					console.error(`arg: ${err}`); // TODO err
					return Promise.resolve();
				});
			} else {
				console.error('Emoji invalide'); // TODO err
				return Promise.resolve();
			}
		}, Promise.resolve());
	}
}

/** @param {string[]} tables */
function resetDB(tables) {
	let synced = 0;
	return new Promise((resolve, reject) => {
		for(let table of tables) {
			if(tables.includes(table)) {
				console.log('reset ' + table);
				Emoji.sync({force: true})
					.then(() => {
						console.log(table + ' has been reset');
					})
					.catch(err => {
						reject(err);
					}).finally(() => {
						synced++;
						if(synced === tables.length)
							resolve();
					});
			}
		}
	});
}

client.on('ready', () => {
	console.log('Initialisation de Swagrid...');
	client.user.setActivity('de la magie', {type: 'WATCHING'});

	// Récupérer la config de chaque guild
	for(let [id, guild] of client.guilds) {
		/** @type {{permissions: Array.<{name: string, roleId: string}>, loggingChannel: string}} */
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

		// Se reconnecter après un timeout
		for(let [,channel] of guild.channels) {
			if(channel instanceof Discord.VoiceChannel && channel.members.find(member => member.id === client.user.id)) {
				Music.voiceChannel = channel;
				Music.voiceChannel.join().then(connection => {
					Music.voiceConnection = connection;
				}).catch(_ => {
					Music.voiceChannel = null;
					Music.voiceConnection = null;
				});
			}
		}
	}

	console.info('Prêt à défoncer des mères');
});

client.on('message', message => {
	if(message.author.bot)
		return;
	
	let content = message.content.trim();
	
	if(content.indexOf(config.prefix) !== 0 || content.length > 1 && content[1] === ' ') {
		countEmojis(message);
		return;
	}

	let command = content.slice(config.prefix.length);

	dispatcher.parse({ message: message }, command)
		.catch(err => {
			message.channel.send('```' + err + '```').catch(()=>{});
			console.error(err.message);
		});
});

client.on('messageReactionAdd', (reaction, _) => {
	let emojiId = reaction.emoji.id;
	if(reaction.message.member.guild.emojis.has(emojiId)) {
		Emoji.findOne({
			where: {
				emojiId: emojiId
			}
		}).then(emoji => {
			if(emoji === null) {
				Emoji.create({
					emojiId: emojiId,
					count: 1
				}).catch(err => {
					console.error(`erreur create emoji: ${err}`); // TODO err
				});
			} else {
				Emoji.update({
					count: emoji.count + 1
				}, {
					where: {
						emojiId: emojiId
					}
				}).catch(err => {
					console.error(`erreur update emoji: ${err}`); // TODO err
				});
			}
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`); // TODO err
		});
	}
});

client.on('messageReactionRemove', (reaction, _) => {
	/** @type {string} */
	let emojiId = reaction.emoji.id;
	if(reaction.message.member.guild.emojis.has(emojiId)) {
		Emoji.findOne({
			where: {
				emojiId: emojiId
			}
		}).then(emoji => {
			if(emoji !== null) {
				Emoji.update({
					count: emoji.count - 1
				}, {
					where: {
						emojiId: emojiId
					}
				}).catch(err => {
					console.error(`erreur update emoji: ${err}`); // TODO err
				});
			}
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`); // TODO err
		});
	}
});

client.on('voiceStateUpdate', (oldmember, newmember) => { // Update packages
	try {
		let oldvoice = oldmember.voiceChannel;
		let newvoice = newmember.voiceChannel;
		
		if(!oldvoice && newvoice) {
			//join
		} else if(oldvoice && !newvoice) {
			//leave
		} else {
			if(oldvoice.id !== newvoice.id) {
				// move
				if(newvoice.id === client.user.id) {
					// Swagrid a été déplacé
					Music.voiceChannel = newvoice;
					Music.voiceConnection = newvoice.connection;
				} else {
					// Quelqu'un d'autre est déplacé
					if(newvoice.id === '520211457481113610') {
						newmember.addRole('520210711767678977').catch(()=>{});
					}
					// Vestiges du 10s
					/*if(newvoice.id === '539072415704154132') {
						newmember.guild.channels.get('470676824532320256').send(`${newmember.user.username}#${newmember.user.tag} va devenir prisonnier`);
						newmember.addRole('520210711767678977')
							.then(() => {
								newmember.guild.channels.get('470676824532320256').send(`${newmember.user.username}#${newmember.user.tag} est devenu prisonnier`);
							})
							.catch(()=>{
								newmember.guild.channels.get('470676824532320256').send(`${newmember.user.username}#${newmember.user.tag} n'est pas devenu prisonnier :'(`);
							});
						setTimeout(() => {
							newmember.removeRole('520210711767678977')
								.then(() => {
									newmember.guild.channels.get('470676824532320256').send(`${newmember.user.username}#${newmember.user.tag} a perdu le rôle prisonnier (normal)`);
								})
								.catch(()=>{
									newmember.guild.channels.get('470676824532320256').send(`impossible d'enlever le rôle prisonnier à ${newmember.user.username}#${newmember.user.tag} (???)`);
								});
							newmember.setVoiceChannel(oldvoice).catch(()=>{});
						}, 10000);
					}*/
				}
			} else {
				// update genre mute/demute
			}
		}
	} catch(e) {
		// Channel supprimé entre temps
	}
});

sequelize = new Sequelize(process.env.DATABASE_URL, {
	dialect: 'postgres',
	operatorsAliases: false/*,
	logging: false*/
});

sequelize.authenticate().then(() => {
	console.info('Authentication to database successful');
	
	Emoji = sequelize.define('emoji', {
		emojiId: {
			type: Sequelize.STRING,
			primaryKey: true
		},
		count: Sequelize.INTEGER
	});
}).catch(console.log);

app.get('/', (_, response) => {
	response.sendFile(`${__dirname}/index.html`);
});
var listener = app.listen(process.env.PORT, () => {
	console.info('Swagrid présent sur le port ' + listener.address().port);
});

client.login(process.env.TOKEN);