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
const ytKey = process.env.YT;
/** @type {Sequelize} */
let sequelize;
/** @type {Sequelize.Model} */
let Emoji;
/** @type {Sequelize.Model} */
let Battle;
/** @type {Sequelize.Model} */
let GachaCard;
/** @type {Sequelize.Model} */
let GachaMember;
/** @type {Sequelize.Model} */
let GachaRelation;

Permission.expert = new Permission(source => source.message.member.id === config.owner);
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
							.catch(()=>{});
					});
				})
				.permission('advanced')
				.description('Comme "say" mais avec du tts en plus')
		)
);

// dispatcher.register(
// 	literal('fanta')
// 		.executes(source => {
// 			return new Promise(async (resolve, reject) => {
// 				/** @type {Discord.Message} */
// 				let message = source.message;
// 				/*if(Music.voiceChannel === null)
// 					await Music.join(message.member.voiceChannel);*/
// 				if(Music.voiceConnection === null)
// 					await dispatcher.parse(source, 'join');
// 				// Music.addSound('ta gueule', `${__dirname}/public/music/fanta.mp3`);
// 				Music.voiceConnection.playFile(`${__dirname}/public/music/fanta.mp3`);
// 				resolve();
// 			});
// 		})
// 		.description('TA GUEULE !')
// );

// dispatcher.register(
// 	literal('ouaismaiscestpastoiquidecides')
// 		.executes(source => {
// 			return new Promise(async (resolve, reject) => {
// 				/** @type {Discord.Message} */
// 				let message = source.message;
// 				/*if(Music.voiceChannel === null)
// 					await Music.join(message.member.voiceChannel);*/
// 				if(Music.voiceConnection === null)
// 					await dispatcher.parse(source, 'join');
// 				// Music.addSound('ouaismaiscestpastoiquidecides', `${__dirname}/public/music/ouaismaiscestpastoiquidecides.mp3`);
// 				Music.voiceConnection.playFile(`${__dirname}/public/music/ouaismaiscestpastoiquidecides.mp3`);
// 				resolve();
// 			});
// 		})
// 		.description('OUAIS MAIS C\'EST PAS TOI QUI DÉCIDES')
// );

// dispatcher.register(
// 	literal('sanglier')
// 		.executes(source => {
// 			return new Promise(async (resolve, reject) => {
// 				/** @type {Discord.Message} */
// 				let message = source.message;
// 				/*if(Music.voiceChannel === null)
// 					await Music.join(message.member.voiceChannel);*/
// 				if(Music.voiceConnection === null)
// 					await dispatcher.parse(source, 'join');
// 				// Music.addSound('sanglier', `${__dirname}/public/music/sanglier.mp3`);
// 				Music.voiceConnection.playFile(`${__dirname}/public/music/sanglier.mp3`);
// 				resolve();
// 			});
// 		})
// 		.description('SANGLIER')
// );

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
					source.message.reply('vous devez être dans un channel vocal pour invoquer Swagrid').catch(()=>{}); // TODO err
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
					message.reply('vous devez être dans le même channel vocal que Swagrid pour exécuter cette action') // TODO err
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
						if(Music.voiceConnection === null)
							await dispatcher.parse(source, 'join');
						
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
								Music.addMusic(res.items[0].id.videoId, res.items[0].snippet.title);
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
					message.channel.send('Aucune musique en cours de lecture') // TODO err
						.then(resolve)
						.catch(reject);
				} else {
					message.channel.send(`"${Music.playing}" est en cours de lecture`) // TODO msg
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
				message.channel.send(Music.playlist)
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
								if(guildMember !== undefined && message.member.voiceChannelID === guildMember.voiceChannelID && member.id !== client.user.id)
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
	literal('battle')
		.then(
			literal('start')
				.executes(source => {
					return new Promise((resolve, reject) => {
						emojiFight(source.message.channel);
						resolve();
					});
				})
				.permission('expert')
				.description('Lance la bataille des émojis ! (à n\'utiliser qu\'une seule fois en théorie)')
		)
		.then(
			literal('reset')
				.executes(source => {
					return new Promise((resolve, reject) => {
						Emoji.update({
							lastBattle: new Date(0),
							elo: 1000
						}, {
							where: {}
						}).then(() => source.message.channel.send('emoji.lastBattle & emoji.elo reset').catch(()=>{}));
						Battle.sync({force: true}).then(() => source.message.channel.send('battle reset').catch(()=>{}));
						resolve();
					});
				})
				.permission('expert')
				.description('Reset le elo des émojis et les précédentes batailles')
		)
);

dispatcher.register(
	literal('update')
		.then(
			literal('tier-list')
				.executes(source => {
					return new Promise((resolve, reject) => {
						updateTierList(source.message.guild);
						resolve();
					});
				})
				.permission('expert')
				.description('Met à jour la tier-list')
		)
);

dispatcher.register(
	literal('init')
		.executes(source => {
			return new Promise((resolve, reject) => {
				resetDB(['battle']);
				initEmoji();
				resolve();
			});
		})
		.permission('expert')
		.description('Reset les batailles (+resetdb battle et initEmoji())')
);

/*dispatcher.register(
	literal('fix')
		.executes(source => {
			return new Promise(async (resolve, reject) => {
				try {
					await Emoji.update({ // haram
						elo: 985
					}, {
						where: {
							id: '476318657018855425'
						}
					});
				
					await Emoji.update({ // boi
						elo: 1015
					}, {
						where: {
							id: '519147196181118976'
						}
					});
				
					await Emoji.update({ // mesyeux
						elo: 985
					}, {
						where: {
							id: '431252859263385612'
						}
					});
				
					await Emoji.update({ // drakeyeah
						elo: 1015
					}, {
						where: {
							id: '498930418058395649'
						}
					});
				
					await Emoji.update({ // betel
						elo: 1015
					}, {
						where: {
							id: '479390965509914624'
						}
					});
				
					await Emoji.update({ // robotnik
						elo: 985
					}, {
						where: {
							id: '531873527251337237'
						}
					});

					resolve();
				} catch(err) {
					reject(err);
				}
			});
		})
		.permission('expert')
);*/

dispatcher.register(
	literal('eval')
		.then(
			argument('command', true)
				.executes((source, ...command) => {
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
				.description('Exécute une commande en brut')
		)
);

dispatcher.register(
	literal('resetdb')
		.then(
			argument('databases', true)
				.executes((source, ...databases) => {
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
		/*.then(
			argument('command')
				.executes((source, command) => {
					return new Promise((resolve, reject) => {
						// @type {Discord.Message}
						
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
		)*/
		.executes(source => {
			return new Promise((resolve, reject) => {
				/** @type {Discord.Message} */
				let message = source.message;
				
				//** @type {{command: Command, usage: string, description: string}[]} */
				/** @type {command.getUsages} */
				let usableCommands = [];
				dispatcher.commands.forEach(command => usableCommands.push(...command.getUsages(config.prefix)));
				let descriptions = usableCommands
					.filter(({command}) => Permission[command.getPermission()].checkPermission(source))
					.map(({usage, description}) => `${usage}: ${description}`)
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
			let [, emojiId] = current.slice(2, -1).split(':');
			if(message.guild.emojis.has(emojiId)) {
				return previous.then(() => {
					return new Promise((resolve, reject) => {
						Emoji.findByPk(emojiId).then(emoji => {
							if(emoji === null) {
								addEmoji(emojiId, message.guild.id);
								Emoji.create({
									id: emojiId,
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
										id: emojiId
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
		if(tables.includes('gachacard'))
			max++;
		if(tables.includes('gachamember'))
			max++;
		if(tables.includes('gacharelation'))
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
		if(tables.includes('gachacard')) {
			console.log('reset gachacard');
			GachaCard.sync({force: true})
				.then(() => {
					console.log('gachacard has been reset');
				})
				.catch(reject)
				.finally(increment);
		}
		if(tables.includes('gachamember')) {
			console.log('reset gachamember');
			GachaMember.sync({force: true})
				.then(() => {
					console.log('gachamember has been reset');
				})
				.catch(reject)
				.finally(increment);
		}
		if(tables.includes('gacharelation')) {
			console.log('reset gacharelation');
			GachaRelation.sync({force: true})
				.then(() => {
					console.log('gacharelation has been reset');
				})
				.catch(reject)
				.finally(increment);
		}

		if(max === 0)
			resolve();
	});
}

/**
 * 
 * @param {Discord.TextChannel} channel
 * @param {number} quantity 
 * @returns {Promise<[{id: string, count: number, elo: number, lastBattle: Date, guildId: string}, {id: string, count: number, elo: number, lastBattle: Date, guildId: string}][]>}
 */
function selectEmojisPairs(channel, quantity) {
	return new Promise((resolve, reject) => {
		/** @type {[{id: string, count: number, elo: number, lastBattle: Date, guildId: string}, {id: string, count: number, elo: number, lastBattle: Date, guildId: string}][]} */
		let battles = new Array(quantity).fill(0);
		//console.log('selectEmojisPairs, recherche des émojis (args:', channel.id, quantity, ')');

		Emoji.findAll({
			where: {
				guildId: channel.guild.id
			},
			order: [
				[ 'lastBattle', 'ASC' ] // du plus ancien au plus récent
			]
		}).then(emojis => {
			let now = new Date();
			
			//emojis.forEach(emo => console.log('lastBattle:', (now - emo.lastBattle) / emojis[0].lastBattle));
			//console.log('émojis trouvés:', emojis.length);
			/** @type {[{id: string, count: number, elo: number, lastBattle: Date, guildId: string}, number][]} */
			let d_emojis = emojis.map(emoji => [emoji, Math.random() * (now - emoji.lastBattle) / (now - emojis[0].lastBattle)]).sort((e1, e2) => e2[1] - e1[1]);
			
			//console.log('d_emojis', d_emojis);

			for(let i = 0; i < quantity; i++) {
				let e1 = d_emojis.shift()[0],
					e2 = d_emojis.shift()[0];

				//console.log('e1', e1, 'e2', e2);
				
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
	const nbFights = 5;

	selectEmojisPairs(channel, nbFights).then(pairs => {
		let dateEnd = new Date();
		console.log('date', dateEnd);
		dateEnd.setDate(dateEnd.getDate() + 1);
		dateEnd.setHours(22); // ?
		dateEnd.setMinutes(0);
		//dateEnd.setMinutes(dateEnd.getMinutes() + 1);
		dateEnd.setSeconds(0);
		dateEnd.setMilliseconds(0);

		//let tmpDateEnd = new Date(dateEnd.setHours(dateEnd.getHours() + 1));
		let tmpDateEnd = new Date(dateEnd);
		// tmpDateEnd.setHours(tmpDateEnd.getHours() + 1);
		// Test
		

		let finished = 0,
			ids = [];
		let after = (index, battleId) => {
			ids[index] = battleId;
			if((++finished) === nbFights) {
				setTimeout(endFights, dateEnd.getTime() - new Date().getTime(), channel, ids);
			}
		};

		for(let i = 0; i < pairs.length; i++) {
			let emos = pairs[i];
			let e1 = channel.guild.emojis.get(emos[0].id),
				e2 = channel.guild.emojis.get(emos[1].id);
			
			channel.send({
				embed: {
					description: 'Nouvelle bataille !',
					footer: {
						text: 'Date limite'
					},
					timestamp: tmpDateEnd,
					fields: [
						{
							name: `${e1}`,
							value: `elo: ${emos[0].elo}`,
							inline: true
						}, {
							name: `${e2}`,
							value: `elo: ${emos[1].elo}`,
							inline: true
						}
					]
				}
			}).then(message => {
				message.react(e1).then(() => {
					message.react(e2).catch(()=>{});
				}).catch(()=>{});

				Battle.create({
					messageId: message.id,
					end: dateEnd.getTime(),
					emoji1: e1.id,
					emoji2: e2.id,
					channelId: message.channel.id,
					ended: false
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
			if((++realEnded) === battles.length) {
				// Mise à jour de la tier-list
				updateTierList(channel.guild);

				// Fin de la bataille, lancement de la prochaine
				Battle.update({
					ended: true
				}, {
					where: {
						id: battlesId
					}
				}).catch(console.log).finally(() => setTimeout(emojiFight, 1, channel));
			}
		};

		let now = new Date();

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
					if(emoji1.id === battle.emoji2)
						[emoji1, emoji2] = [emoji2, emoji1];
					let nElo = calculateElo(emoji1.elo, emoji2.elo, n1 === n2 ? .5 : n1 > n2 ? 1 : 0);
					
					let finished = 0;
					let after = () => {
						if((++finished) === 2) {
							let e1 = channel.guild.emojis.get(emoji1.id),
								e2 = channel.guild.emojis.get(emoji2.id);
							channel.send(`Mise à jour du elo:\n${e1}: ${emoji1.elo} -> ${nElo[0]}, ${e2}: ${emoji2.elo} -> ${nElo[1]}`);

							realEnd();
						}
					};

					Emoji.update({
						elo: nElo[0],
						lastBattle: now
					}, {
						where: {
							id: emoji1.id
						}
					}).catch(console.log).finally(after);
					Emoji.update({
						elo: nElo[1],
						lastBattle: now
					}, {
						where: {
							id: emoji2.id
						}
					}).catch(console.log).finally(after);
				}).catch(console.log);
			}).catch(() => channel.send('Qui est l\'abruti qui supprime mes messages !?').catch(()=>{}));
		}
	}).catch(console.log);
}

/**
 * Met à jour la tier list
 * @param {Discord.Guild} guild
 */
function updateTierList(guild) {
	let guildId = guild.id,
		messageTiers = config.guilds[guildId].battle.tiers;
	/** @type {Discord.TextChannel} */
	let outputChannel = guild.channels.get(config.guilds[guildId].battle.channel);
	Emoji.findAll({
		where: {
			guildId: guildId
		}
	}).then(async emojis => {
		emojis.sort((e1, e2) => e2.elo - e1.elo);

		let min = 1000, max = 1000;
		for(let e of emojis) {
			if(e.elo < min)
				min = e.elo;
			if(e.elo > max)
				max = e.elo;
		}

		let t = Math.floor((max - min) / (messageTiers.length - 1)); // nb elo entre chaque tier

		let m = {};
		for(let e of emojis) {
			let n = Math.floor(e.elo / t) * t,
				s = Math.floor((e.elo + t) / t) * t,
				k = `${s-1}-${n}`;
			
			if(m[k] !== undefined)
				m[k].push(e);
			else
				m[k] = [e];
		}

		let tiers = Object.entries(m);

		for(let i = 0; i < messageTiers.length; i++) {
			let message = await outputChannel.fetchMessage(messageTiers[i].messageId); // Message à modifier
			/** @type {Discord.Emoji} */
			let desc = tiers[i][1].reduce((acc, emo) => `${acc}  ${guild.emojis.get(emo.id)}: ${emo.elo}`, '');
			
			message.edit({
				embed: {
					description: desc,
					color: messageTiers[i].color,
					author: {
						name: `${messageTiers[i].name} (${tiers[i][0]})`,
						icon_url: `https://twemoji.maxcdn.com/2/72x72/${messageTiers[i].code}.png`
					}
				}
			}).catch(console.log);
		}
	}).catch(console.log);
}

/**
 * Met à jour un émoji dans la BDD (+/-1 au count)
 * @param {Discord.Emoji} emoji
 * @param {boolean} add Ajout ou retrait ?
 * @param {number} init Valeur initiale si l'émoji n'existe pas
 */
function updateEmoji(emoji, add, init) { // Modifier cette merde pour prendre en compte le nouveau shéma de BDD
	Emoji.findByPk(emoji.id).then(emoji => {
		if(emoji === null) {
			addEmoji(emoji.id, emoji.guild.id);
			/*Emoji.create({
				id: emoji.id,
				count: init
			}).catch(err => {
				console.error(`erreur create emoji: ${err}`); // TODO err
			});*/
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

function addEmoji(emojiId, guildId) {
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

function removeEmoji(emojiId) {
	Emoji.destroy({
		where: {
			id: emojiId
		}
	}).catch(console.log);
}

function initEmoji() {
	for(let [guildId, guild] of client.guilds) {
		for(let [emojiId] of guild.emojis) {
			// Ajoute dans la BBD les émojis ajoutés depuis le dernier arrêt
			/*try {
				await Emoji.findOrCreate({
					where: {
						id: emojiId,
						guildId: guildId
					},
					defaults: {
						count: 0,
						elo: 1000,
						lastBattle: new Date(0)
					}	
				});
			} catch(err) {
				console.log(err);
			}*/
			addEmoji(emojiId, guildId);
		}
		
		// Supprime de la BDD les émojis supprimés
		Emoji.findAll({
			where: {
				guildId: guildId
			}
		}).then(emojis => {
			for(let emoji of emojis) {
				if(!guild.emojis.get(emoji.id)) {
					/*Emoji.destroy({
						where: {
							id: emoji.id
						}
					}).catch(console.log);*/
					removeEmoji(emoji.id);
				}
			}
		}).catch(console.log);
	}
}

function initGacha() {
	/*for(let [guildId, guild] of client.guilds) {
		for(let [memberId, member] of guild.members) {

		}
	}*/
}

/**
 * @param {Discord.Message} message
 */
function coup(message) {
	if(message.author.id === '207937954880946176' && message.content.match(/^coup| coup$|^cou | cou$| cou | coup /) !== null) { // Darki dit "coup"
		message.react('551153662827823104');
	}
}

/**
 * @param {Discord.Message} message
 */
function underage(message) {
	if(message.author.id === '435545162433822720' && message.channel.nsfw) { // Si Katraz poste dans un channel nsfw
		message.react(':underage:');
	}
}

let pready = 0;
function ready(name) {
	console.log(name, 'ready');
	if((++pready) === 2) { // client et database ready
		console.log('database et client prêts');

		initEmoji();
		initGacha();
		
		let now = new Date().getTime();
		console.log('recherche de battles');
		Battle.findAll({
			where: {
				ended: false
			}
		}).then(battles => {
			if(battles.length) {
				let channel = client.channels.get(battles[0].channelId);
				if(channel) {
					console.log('retrieve battle, end:', battles[0].end);
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
	client.user.setActivity('de la magie', { type: 'WATCHING' });

	// Récupérer la config de chaque guild
	for(let [id, guild] of client.guilds) {
		/** @type {{permissions: Array.<{name: string, roleId: string}>, loggingChannel: string}} */
		let guildConfig = config.guilds[id];

		if(guildConfig === undefined)
			continue;
		if(typeof guildConfig.permissions === 'object' && (Symbol.iterator in guildConfig.permissions)) {
			for(let perm of guildConfig.permissions) {
				if(typeof perm.name !== 'string' || typeof perm.roleId !== 'string')
					continue;
				if(Permission[perm.name] !== undefined)
					continue;
				if(!guild.roles.has(perm.roleId))
					continue;
				
				Permission[perm.name] = new Permission(source => {
					let role = guild.roles.get(perm.roleId);
	
					if(role === undefined)
						return false;
	
					return role.members.some(m => m.id === source.message.member.id) || source.message.member.id === config.owner;
				});
			}
		}

		// Se reconnecter après un timeout
		for(let [,channel] of guild.channels) {
			// if(channel instanceof Discord.VoiceChannel && channel.members.find(member => member.id === client.user.id)) {
			if(channel instanceof Discord.VoiceChannel && channel.members.get(client.user.id)) {
				Music.voiceChannel = channel;
				Music.voiceChannel.join().then(connection => {
					Music.voiceConnection = connection;
				}).catch(() => {
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
		coup(message);
		underage(message);

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
	if(reaction.message.member.guild.emojis.has(emoji.id))
		updateEmoji(emoji, true, 1);
});

client.on('messageReactionRemove', (reaction, user) => {
	if(user.bot)
		return;
	
	let emoji = reaction.emoji;
	if(reaction.message.member.guild.emojis.has(emoji.id))
		updateEmoji(emoji, false, 0);
});

client.on('voiceStateUpdate', (oldmember, newmember) => {
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

client.on('emojiCreate', emoji => {
	addEmoji(emoji.id, emoji.guild.id);
});

client.on('emojiDelete', emoji => {
	removeEmoji(emoji.id);
});

sequelize = new Sequelize(process.env.DATABASE_URL, {
	dialect: 'postgres',
	logging: false
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
		channelId: Sequelize.STRING,
		ended: Sequelize.BOOLEAN // La bataille est-elle terminée ?
	});

	GachaCard = sequelize.define('gachacard', {
		internalName: { // Nom interne pour les différencer, ne pas changer
			type: Sequelize.STRING,
			primaryKey: true
		},
		funnyName: Sequelize.STRING, // Nom utilisé par les membres
		rarity: Sequelize.INTEGER, // [1-5] étoiles
		src: Sequelize.STRING // url de l'image
	});
	
	GachaMember = sequelize.define('gachamember', {
		id: { // ID Discord
			type: Sequelize.STRING,
			primaryKey: true
		},
		lastGacha: Sequelize.DATE // Dernière fois qu'il a attrapé une carte
	});

	GachaRelation = sequelize.define('gacharelation', {
		memberId: Sequelize.STRING, // ID Discord du membre
		cardname: Sequelize.STRING, // Nom (interne) de la carte
		catched: Sequelize.DATE // Date où la carte a été attrapée
	});

	ready('database');
}).catch(console.log);

app.use(express.static(`${__dirname}/public`));

/*app.get('/', (request, response) => {
	response.sendFile(`${__dirname}/index.html`);
});*/

app.get('/ping', (request, response) => {
	response.send({ok: 'ok'});
});

app.get('/emojis', async (request, response) => {
	response.setHeader('Content-Type', 'application/json');
	try {
		response.end(JSON.stringify(await Emoji.findAll()));
	} catch(error) {
		response.end(JSON.stringify({ error }));
	}
});

let listener = app.listen(process.env.PORT, () => {
	console.info('Swagrid présent sur le port ' + listener.address().port);
});

process.on('SIGINT', () => {
	client.destroy().finally(() => {
		process.exit();
	});
});

client.login(process.env.TOKEN);