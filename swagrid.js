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
/** @type {Sequelize.Model} */
var Battle;

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
			return new Promise(async (resolve, reject) => {
				if(Music.voiceChannel === null)
					await Music.join();
				Music.voiceConnection.playFile('fanta.m4a');
			});
		})
		.description('MAIS TA GUEULE !')
);

dispatcher.register(
	literal('ouaismaiscestpastoiquidecide')
		.executes((source) => {
			return new Promise((resolve, reject) => {
				dispatcher.parse(source, 'join')
					.then(() => {
						Music.voiceConnection.playFile('ouaismaiscestpastoiquidecide.m4a');
						resolve();
					})
					.catch(reject);
			});
		})
		.description('OUAIS MAIS C\'EST PAS TOI QUI DÉCIDE !')
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

				Emoji.findAll({
					where: {
						guildId: message.guild.id
					}
				}).then(emojis => {
					emojis.sort((e1, e2) => e2.count - e1.count);

					let msg = 'Popularité des émojis par nombre d\'utilisations:'; // TODO msg
					for(let emoji of emojis)
						if(emoji.count > 0)
							msg += `\n${emoji.count} : ${message.member.guild.emojis.get(emoji.id)}`;

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
	literal('startBattle')
		.executes(source => {
			emojiFight(source.message.channel);
		})
		.permission('expert')
		.description('Lance la bataille des émojis ! (à n\'utiliser qu\'une seule fois en théorie')
);

dispatcher.register(
	literal('init')
		.executes(source => {
			resetDB(['battle']);
			initEmoji();
		})
		.permission('expert')
		.description('Reset les batailles (+resetdb battle et initEmoji())')
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
						Emoji.findByPk(id).then(emoji => {
							if(emoji === null) {
								Emoji.create({
									id: id,
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
										id: id
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
	return new Promise((resolve, reject) => {
		let max = 0;
		
		if(tables.includes('emoji'))
			max++;
		if(tables.includes('battle'))
			max++;

		let synced = 0;
		let increment = () => {
			if((++synced) === max)
				resolve();
		};

		if(tables.includes('emoji')) {
			console.log('reset emoji');
			Emoji.sync({force: true})
				.then(() => {
					console.log('emoji has been reset');
				})
				.catch(reject)
				.finally(increment);
		}
		if(tables.includes('battle')) {
			console.log('reset battle');
			Battle.sync({force: true})
				.then(() => {
					console.log('battle has been reset');
				})
				.catch(reject)
				.finally(increment);
		}
	});
}

/**
 * 
 * @param {Discord.TextChannel} channel
 * @param {number} quantity 
 * @returns {Promise<[number, number][]>}
 */
function selectEmojisPairs(channel, quantity) {
	return new Promise((resolve, reject) => {
		let battles = new Array(quantity).fill(0);
		console.log('selectEmojisPairs, recherche des émojis (args:', channel.id, quantity, ')');

		Emoji.findAll({
			where: {
				guildId: channel.guild.id
			},
			order: [
				[ 'lastBattle', 'ASC' ] // du plus ancien au plus récent
			]
		}).then(emojis => {
			console.log('émojis trouvés:', emojis.length);
			let now = new Date().getTime(),
				d_emojis = emojis.map(emoji => [emoji.id, Math.random() * (now - emoji.lastBattle) / emojis[0].lastBattle]).sort((e1, e2) => e2[1] - e1[1]);
			
			console.log('d_emojis', d_emojis);

			for(let i = 0; i < quantity; i++) {
				let e1 = d_emojis.shift()[0],
					e2 = d_emojis.shift()[0];

				console.log('e1', e1, 'e2', e2);
				
				battles[i] = [e1, e2];
			}

			resolve(battles);
		}).catch(reject);
	});
}

/**
 * Lance une bataille entre des émojis pris "au hasard"
 * @param {Discord.TextChannel} channel 
 */
function emojiFight(channel) {
	const nbFights = 3;

	selectEmojisPairs(channel, nbFights).then(pairs => {
		let dateEnd = new Date();
		/*dateEnd.setDate(dateEnd.getDate() + 1);
		dateEnd.setHours(0);
		dateEnd.setMinutes(0);
		dateEnd.setSeconds(0);
		dateEnd.setMilliseconds(0);*/
		// Test
		dateEnd.setMinutes(dateEnd.getMinutes() + 1);

		let finished = 0,
			ids = [];
		let after = (index, battleId) => {
			ids[index] = battleId;
			if((++finished) === nbFights) {
				setTimeout(endFights, dateEnd.getTime() - new Date().getTime(), channel, ids);
			}
		};

		for(let i = 0; i < pairs.length; i++) {
			console.log('emojiFight.selectEmojisPairs, channel:', channel.id);
			console.log(JSON.stringify(pairs[i]));
			let e1 = channel.guild.emojis.get(pairs[i][0]),
				e2 = channel.guild.emojis.get(pairs[i][1]);
			channel.send(`Bataille entre ${e1} et ${e2} !\nVotez pour votre préféré (fin: ${dateEnd})`).then(message => {
				message.react(e1).then(() => {
					message.react(e2).catch(()=>{});
				}).catch(()=>{});

				Battle.create({
					messageId: message.id,
					end: dateEnd.getTime(),
					emoji1: e1.id,
					emoji2: e2.id,
					channelId: message.channel.id
				}).then(battle => {
					after(i, battle.id);
				}).catch(console.log);
			}).catch(console.log);
		}
	});
}

/**
 * Calcule des elos
 * @param {number} elo1 Elo de 1
 * @param {number} elo2 Elo de 2
 * @param {number} win 1 - 0 ou .5
 */
function calculateElo(elo1, elo2, win) {
	let p = d => 1 / (1 + Math.pow(10, d / 400));
	const k = 30;
	
	let nElo1 = elo1 + k * (win - p(elo2 - elo1)),
		nElo2 = elo2 + k * ((1 - win) - p(elo1 - elo2));
	
	return [ Math.round(nElo1), Math.round(nElo2) ];
}

/**
 * Termine une bataille d'émojis puis passe à la suivante
 * @param {Discord.TextChannel} channel 
 * @param {number[]} battlesId 
 */
function endFights(channel, battlesId) {
	Battle.findAll({
		where: {
			id: battlesId
		}
	}).then(battles => {
		let realEnded = 0;
		let realEnd = () => {
			if((++realEnded) === battles.length)
				setTimeout(emojiFight, 1, channel);
		};

		for(let battle of battles) {
			channel.fetchMessage(battle.messageId).then(message => {
				let react1 = message.reactions.find(r => r.emoji.id === battle.emoji1),
					react2 = message.reactions.find(r => r.emoji.id === battle.emoji2);
				let n1 = react1 ? react1.count - 1 : 0,
					n2 = react2 ? react2.count - 1 : 0;

				Emoji.findAll({
					where: {
						id: [battle.emoji1, battle.emoji2]
					}
				}).then(([emoji1, emoji2]) => {
					let nElo = calculateElo(emoji1.elo, emoji2.elo, n1 === n2 ? .5 : n1 > n2 ? 1 : 0);
					
					let finished = 0;
					let after = () => {
						if((++finished) == 2) {
							let e1 = channel.guild.emojis.get(emoji1.id),
								e2 = channel.guild.emojis.get(emoji2.id);
							channel.send(`Mise à jour du elo:\n${e1}: ${nElo[0]}, ${e2}: ${nElo[1]}`);

							realEnd();
						}
					};

					Emoji.update({
						elo: nElo[0]
					}, {
						where: {
							id: emoji1.id
						}
					}).catch(console.log).finally(after);
					Emoji.update({
						elo: nElo[1]
					}, {
						where: {
							id: emoji2.id
						}
					}).catch(console.log).finally(after);
				}).catch(console.log);
			}).catch(() => channel.send('Qui est l\'abruti qui supprime mes messages !?'));
		}
	}).catch(console.log);
}

/**
 * Met à jour un émoji dans la BDD (+/-1 au count)
 * @param {Discord.Emoji} emoji
 * @param {boolean} add Ajout ou retrait ?
 * @param {number} init Valeur initiale si l'émoji n'existe pas
 */
function updateEmoji(emoji, add, init) {
	Emoji.findByPk(emoji.id).then(emoji => {
		if(emoji === null) {
			Emoji.create({
				id: emoji.id,
				count: init
			}).catch(err => {
				console.error(`erreur create emoji: ${err}`); // TODO err
			});
		} else {
			Emoji.update({
				count: emoji.count += add ? 1 : -1
			}, {
				where: {
					id: emoji.id
				}
			}).catch(err => {
				console.error(`erreur update emoji: ${err}`); // TODO err
			});
		}
	}).catch(err => {
		console.error(`erreur find emoji: ${err}`); // TODO err
	});
}

function initEmoji() {
	for(let [guildId, guild] of client.guilds) {
		for(let [emojiId] of guild.emojis) {
			Emoji.findOrCreate({
				where: {
					id: emojiId,
					guildId: guildId
				},
				defaults: {
					count: 0,
					elo: 1000,
					lastBattle: new Date(0)
				}
			}).catch(console.log);
		}
	}
}

let pready = 0;
function ready(name) {
	console.log(name, 'ready');
	if((++pready) == 2) { // client et database ready
		console.log('database et client prêts');
		let now = new Date().getTime();
		initEmoji();
		console.log('recherche de battles');
		Battle.findAll({
			where: {
				end: {
					[Sequelize.Op.lt]: now // date fin < maintenant
				}
			}
		}).then(battles => {
			if(battles.length) {
				let channel = client.channels.get(battles[0].channelId);
				if(channel) {
					console.log('retrive battle, end:', battles[0].end);
					let interval = battles[0].end - now;
					console.log(`start timeout of ${interval / 1000} seconds`);
					setTimeout(endFights, interval, channel, battles.map(battle => battle.id));
				} else {
					console.log('Erreur récupération channel', battles);
				}
			}
		}).catch(console.log);
	}
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
			
			Permission[perm.name] = new Permission(member => {
				let role = guild.roles.get(perm.roleId);
				if(role === undefined)
					return false;

				return role.members.some(m => m.id === member.id);
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

	ready('client');

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

client.on('messageReactionAdd', (reaction, user) => {
	if(user.bot)
		return;
	
	let emoji = reaction.emoji;
	if(reaction.message.member.guild.emojis.has(emoji.id)) {
		/*Emoji.findOne({
			where: {
				id: emojiId
			}
		}).then(emoji => {
			if(emoji === null) {
				Emoji.create({
					id: emojiId,
					count: 1
				}).catch(err => {
					console.error(`erreur create emoji: ${err}`); // TODO err
				});
			} else {
				Emoji.update({
					count: emoji.count + 1
				}, {
					where: {
						id: emojiId
					}
				}).catch(err => {
					console.error(`erreur update emoji: ${err}`); // TODO err
				});
			}
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`); // TODO err
		});*/
		updateEmoji(emoji, true, 1);
	}
});

client.on('messageReactionRemove', (reaction, user) => {
	if(user.bot)
		return;
	
	let emoji = reaction.emoji;
	if(reaction.message.member.guild.emojis.has(emoji.id)) {
		/*Emoji.findOne({
			where: {
				id: emojiId
			}
		}).then(emoji => {
			if(emoji !== null) {
				Emoji.update({
					count: emoji.count - 1
				}, {
					where: {
						id: emojiId
					}
				}).catch(err => {
					console.error(`erreur update emoji: ${err}`); // TODO err
				});
			}
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`); // TODO err
		});*/
		updateEmoji(emoji, false, 0);
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
				if(newmember.id === client.user.id) {
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
		id: { // Son identifiant, donné par Discord
			type: Sequelize.STRING,
			primaryKey: true
		},
		count: Sequelize.INTEGER, // Nombre d'utilisations de cet émoji
		elo: Sequelize.INTEGER, // son elo
		lastBattle: Sequelize.DATE, // Date (timestamp) de la dernière bataille dans laquelle il a participé
		guildId: Sequelize.STRING
	});
	Battle = sequelize.define('battle', {
		id: {
			type: Sequelize.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		messageId: Sequelize.STRING, // Id du message de bataille
		end: Sequelize.DATE, // Date de fin (timestamp)
		emoji1: Sequelize.STRING, // Id de l'émoji 1
		emoji2: Sequelize.STRING, // Id de l'émoji 2
		channelId: Sequelize.STRING
	});

	ready('database');
}).catch(console.log);

app.get('/', (_, response) => {
	response.sendFile(`${__dirname}/index.html`);
});
var listener = app.listen(process.env.PORT, () => {
	console.info('Swagrid présent sur le port ' + listener.address().port);
});

client.login(process.env.TOKEN);