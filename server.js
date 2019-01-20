/** @type {boolean} */
const local = typeof process.env.TOKEN === 'undefined';

// Dependencies
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
/** @type {{prefix: string, owner: string}} */
const config = require('./config.json');
/** @type {{}|{TOKEN: string, YT: string}} */
const env = local ? require('./env.json') : {};

/** @type {Discord.Guild} */
var poudlard;
/** @type {Discord.Role} */
var surveillants;
/** @type {Sequelize} */
var sequelize;
/** @type {string} */
var ytKey = (local ? env : process.env).YT;

// Tables SQL
/** @type {Sequelize.Model} */
var Mio;
/** @type {Sequelize.Model} */
var Emoji;
//	BatchSuggestion,
//	RoleSuggestion;


/** @typedef {{url: string, title: string}} music */
/** @class */
class Music {
	/**
	 * Ajoute une vidéo à la file d'attente. Joue la vidéo si la file est vide
	 * @param {string} url L'URL de la vidéo
	 * @param {string} title Le titre de la vidéo
	 */
	static add(url, title) {
		this._musics.push({url: url, title: title});
		if(this._status == 'stop')
			this._play();
	}

	/** @private */
	static _play() {
		/** @type {music} */
		let song = this._musics.shift();
		this._status = 'play';
		this.playing = song;
		this._dispatcher = this.voiceConnection.playStream(ytdl(song.url, {
			seek: 0,
			volume: 1
		}));
		this._dispatcher.on('end', reason => {
			if(this._musics.length) {
				this._play();
			} else {
				this._status = 'stop';
				this.playing = null;
			}
		});
	}
	
	/** Annule la dernière action */
	static cancel() {
		if(this._status == 'play') {
			if(this._musics.length) {
				this._musics.pop();
			} else {
				this._status = 'stop';
				this.playing = null;
				this._dispatcher.end();
			}
		}
	}
	
	/** Passe la vidéo en cours de lecture */
	static skip() {
		if(this._status == 'play')
			this._dispatcher.end('_');
		if(this._musics.length)
			this._play();
	}
	
	/** Stoppe la vidéo en cours de lecture */
	static stop() {
		this._status = 'stop';
		this.playing = null;
		this._dispatcher.end('_');
		this._musics = [];
	}

	/**
	 * Retourne le nom de la vidéo en cours de lecture
	 * @returns {string}
	 */
	static get playing() {
		return this._playing.title;
	}
	
	/**
	 * Retourne les musiques à lire, séparée par un retour à la ligne, en commencant par celle en cours de lecture
	 * @returns {string}
	 */
	static get playlist() {
		/** @type {music[]} */
		let musicNames = Array.from(this._musics);
		musicNames.push(this._playing);
		return musicNames.reduce(el => `${el.title}\n`);
	}
}
/**
 * @type {music[]}
 * @private
 */
Music._musics = [];
/** @type {?Discord.VoiceChannel} */
Music.voiceChannel = null;
/** @type {?Discord.VoiceConnection} */
Music.voiceConnection = null;
/**
 * @type {string}
 * @private
 */
Music._status = 'stop';
/**
 * @type {?Discord.StreamDispatcher}
 * @private
 */
Music._dispatcher = null;
/**
 * @type {music}
 * @private
 */
Music._playing = null;


/**
 * @callback permissionCallback
 * @param {string} userId
 * @return {boolean}
 */
(()=>{})();
/** @class */
class Permission {
	/**
	 * @param {permissionCallback} fct
	 */
	constructor(fct) {
		/** @type {permissionCallback} */
		this.checkPermission = fct;
	}
}
Permission.basic = new Permission(userId => {
	return true;
});
Permission.advanced = new Permission(userId => {
	return surveillants.members.find(e => userId === e.user.id) !== null;
});
Permission.expert = new Permission(userId => {
	return userId === config.owner;
});


/**
 * @callback commandCallback
 * @param {Discord.Message} message
 * @param {string[]} args
 * @returns {Promise<void>}
 */
(()=>{})();
/** @class */
class Command {
	/**
	 * @param {Permission} perm
	 * @param {commandCallback} fct
	 * @param {string} desc
	 * @param {string} util
	 */
	constructor(perm, fct, desc, util) {
		/** @type {Permission} */
		this.permission = perm;
		/** @type {commandCallback} */
		this.execute = (message, args) => {
			return new Promise((resolve, reject) => {
				if(perm.checkPermission(message.author.id)) {
					fct(message, args).then(() => {
						resolve();
					}).catch(err => {
						reject(err);
					});
				} else {
					message.reply('Permission insuffisante');
					reject();
				}
			});
		};
		/** @type {string} */
		this.description = desc;
		/** @type {string} */
		this.utilisation = util;
	}
}
/** @type {Map<string, Command>} */
Command.commands = new Map();
/**
 * @param {string} name Nom de la commande
 * @param {Permission} permission Persmission necéssaire pour exécuter la commande
 * @param {commandCallback} fct Fonction exécutée lors de l'appel de la commande
 * @param {string} desc Description de la commande
 * @param {string} util Exemples d'utilisation de la commande
 */
Command.add = (name, permission, fct, desc, util) => Command.commands.set(name, new Command(permission, fct, desc, util));
/**
 * @param {string} name Nom de la commande
 * @param {Discord.Message} message Message de la commande
 * @param {string[]} args Arguments de la commande
 * 
 * @returns {Promise<void>} La commande générée
 */
Command.execute = (name, message, args) => {
	/** @type {?Command} */
	let cmd = Command.commands.get(name);
	return cmd ? cmd.execute(message, args) : new Promise(r => r());
}

Command.add('say', Permission.advanced, (message, args) => {
	return new Promise((resolve, reject) => {
		message.delete().catch(_ => {});
		message.channel.send(args.join(' '));
		resolve();
	});
}, 'Pour faire dire des choses à Swagrid', 'say <texte>: Supprime le message de la commande et Swagrid envoie <texte>');

Command.add('tts', Permission.advanced, (message, args) => {
	return new Promise((resolve, reject) => {
		message.delete().catch(_ => {});
		message.channel.send(args.join(' '), {tts: true});
		resolve();
	});
}, 'Comme "say" mais avec du tts en plus', 'tts <texte>: Supprime le message de la commande et Swagrid envoie <texte> en tts');

Command.add('join', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(message.member.voiceChannelID == null) {
			message.reply('vous devez être dans un channel vocal pour invoquer Swagrid').catch(_=>{});
			resolve();
		} else {
			Music.voiceChannel = poudlard.channels.get(message.member.voiceChannelID);
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
}, 'Invoque Swagrid dans le channel vocal', 'join: Si vous êtes dans un channel vocal, Swagrid vous rejoint');

Command.add('leave', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(message.member.voiceChannelID == null) {
			message.reply('vous devez être dans un channel vocal pour déplacer Swagrid').catch(_=>{});
		} else {
			Music.voiceChannel.leave();
			Music.voiceChannel = null;
			Music.voiceConnection = null;
		}
		resolve();
	});
}, 'Renvoie Swagrid du channel vocal vers sa hutte', 'leave: Swagrid quitte son channel vocal, peut importe dans lequel vous êtes');

Command.add('play', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(Music.voiceConnection == null) {
			reject('Swagrid n\'est pas dans un channel');
		} else if(message.member.voiceChannelID != Music.voiceChannel.id) {
			message.reply('Petit boloss, arrête de mettre des sons si tu n\'es pas dans le channel');
			resolve();
		} else {
			search(ytKey, {
				q: args.join(' '),
				maxResults: 1,
				part: 'snippet',
				type: 'video'
			}).then(res => {
				message.channel.send(`Recherche de \`${args.join(' ')}\``, new Discord.RichEmbed({
					author: {
						'name': 'Ajout à la file d\'attente'
					},
					thumbnail: {
						'url': `https://img.youtube.com/vi/${res.items[0].id.videoId}/hqdefault.jpg`
					},
					title: `${res.items[0].snippet.title}`,
					url: `https://youtu.be/${res.items[0].id.videoId}/`
				}));
				Music.add(res.items[0].id.videoId, res.items[0].snippet.title);
				resolve();
			}).catch(err => {
				reject(err);
			});
		}
	});
}, 'Effectue une recherche sur Youtube et joue la première vidéo trouvée, ou la met en attente si une vidéo est déjà en cours de lecture (vous devez être dans le même channel vocal que Swagrid)', 'play <recherche>: Recherche <recherche> sur youtube et lit la première vidéo trouvée. <recherche> peut être constitué de plusieurs mots (ex: "Rick Astley - Never Gonna Give You Up"). <recherche> peut être une url mais le résultat n\'est pas garantit');

Command.add('playing', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(Music.playing == '') {
			message.reply('Aucune musique en cours de lecture');
		} else {
			message.reply(`"${Music.playing}" est en cours de lecture`);
		}
		resolve();
	});
}, 'Permet d\'obtenir le nom de la vidéo qui passe actuellement');

Command.add('playlist', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		message.reply(Music.playlist());
		resolve();
	});
}, 'Affiche le titre des vidéos dans la file d\'attente');

Command.add('cancel', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(message.member.voiceChannelID == null)
			message.reply('vous devez être dans un channel vocal pour déplacer Swagrid').catch(_=>{});
		else
			Music.cancel();
		resolve();
	});
}, 'Annule la dernière action (en rapport avec les vidéos)');

Command.add('skip', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(message.member.voiceChannelID == null)
			message.reply('vous devez être dans un channel vocal pour déplacer Swagrid').catch(_=>{});
		else
			Music.skip();
		resolve();
	});
}, 'Pour faire passer la vidéo en cours de lecture');

Command.add('stop', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(message.member.voiceChannelID == null)
			message.reply('vous devez être dans un channel vocal pour déplacer Swagrid').catch(_=>{});
		else
			Music.stop();
		resolve();
	});
}, 'Arrête la vidéo en cours et vide la file d\'attente');

/*Command.add('goto', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(!message.member.voiceChannelID) {
			message.reply('vous n\'êtes pas dans un channel vocal');
		} else {
			let res = {};
			for(let chan of poudlard.channels.filter(ch => ch.type == 'voice')) {
				res[chan.id] = 0;
				for(let arg of args)
					if(chan.name.toLowerCase().split(' ').contains(arg.toLowerCase()))
						res[chan.id]++;
			}

			let max = {
				chan: null,
				qty: 0
			}
			for(let [chan, qty] of Object.entries(res)) {
				if(qty > max.quantity) {
					max.chan = chan;
					max.qty = qty;
				}
			}

			if(max.chan == null) {
				message.reply('channel inconnu');
			} else {
				for(let member of message.member.voiceChannel.members) {
					member.setVoiceChannel(max.chan.id);
				}
			}
		}
		
		resolve();
	});
}, 'Déplace toutes les personnes de votre channel vers un autre');*/

Command.add('r34', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(message.channel.nsfw || !(message.channel instanceof Discord.TextChannel)) {
			request(`https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${args.join('+')}+-scat`).then(data => {
				parseString(data, (err, result) => {
					if(err) {
						reject(err);
					} else {
						/** @type {number} */
						let count = parseInt(result.posts.$.count, 10);
						if(count == NaN) {
							reject('Erreur dans la récupération des posts');
						} else {
							if(count == 0) {
								message.reply('Aucun résultat');
								resolve();
							} else {
								/** @type {number} */
								let post_number = Math.floor(Math.random() * count);
								request(`https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${args.join('+')}+-scat`).then(data2 => {
									parseString(data2, (err2, result2) => {
										if(err2) {
											reject(err2);
										} else {
											/** @type {number} */
											let count2 = parseInt(result2.posts.$.count, 10);
											if(count2 == NaN) {
												reject('Erreur dans la récupération des posts (2)');
											} else {
												if(count2 == 0) {
													message.reply('Aucun résultat (2)');
												} else {
													let post = result2.posts.post[post_number % 100];
													message.channel.send({
														file: post.$.file_url
													});
												}
												resolve();
											}
										}
									});
								}).catch(err => {
									reject(err);
								});
							}
						} 
					}
				});
			}).catch(err => {
				reject(err);
			});
		} else {
			message.reply('Pas de ça dans un chan SFW !!');
			resolve();
		}
	});
}, 'Effectue une recherche sur rule34 (xxx pas paheal) et affiche une image au hasard en rapport avec les tags indiqués', 'r34 <mot-clé-1> <mot-clé-2> ... <mot-clé-n>: Effectue une recherche sur https://rule34.xxx/ avec les mots-clés passés en paramètre (ex: "lucina chrom" affiche une image contenant Lucina ET Chrom). Ces mots-clés ne doivent pas contenir d\'espaces, sinon les remplacer par des "_" (ex: "devil may cry" => "devil_may_cry")');

Command.add('emojipopularity', Permission.advanced, (message, args) => {
	return new Promise((resolve, reject) => {
		Emoji.findAll().then(emojis => {
			emojis.sort((e1, e2) => {
				return e2.count - e1.count;
			});
			let msg = "Popularité des émojis par nombre d'utilisations:";
			for(let emoji of emojis)
				if(emoji.count > 0)
					msg += `\n${emoji.count} : ${poudlard.emojis.get(emoji.emojiId)}`;
			message.channel.send(msg);

			resolve();
		}).catch(err => {
			console.error(`erreur retrieve all emojis: ${err}`);
			reject(err);
		})
	});
}, 'Affiche la popularité des émojis du serveur');

/*Command.add('changementrole', Permission.advanced, (message, args) => {
	return new Promise((resolve, reject) => {
		if(currentSuggestions != null) {
			message.reply('déjà des propositions en cours, peut pas en avoir 2 en même temps');
		} else {
			let dateCreated = new Date();
			BatchSuggestion.create({
				startDate: dateCreated.getTime()
			}).then(() => {
				currentSuggestions = dateCreated.getTime();
				annonce_roles.send('Venez proposez des noms pour les rôles du serveur !');
				let dateFin = new Date(dateCreated.getTime());
				dateFin.setTime(dateFin.getTime() + 20000);
				let timeDifference = dateFin.getTime() - new Date().getTime();
				setTimeout(endSuggestions, timeDifference);
			}).catch(err => {
				console.error(`erreur create: ${err.toString()}`);
			});
		}
		resolve();
	});
}, '(placeholder)');

Command.add('suggestrole', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(currentSuggestions != null) {
			if(args.length < 2) {
				message.channel.send('Syntace correcte: "+suggestrole <nom du rôle> <couleur en hexadécimal>"\n'
								   + 'Exemple: "+suggestrole Gobeur de chibres #20a78f" pour proposer le rôle "Gobeur de chibres" avec une couleur turquoise\n'
								   + 'Pour avoir la palette de couleur, suivre ce lien: https://www.w3schools.com/colors/colors_picker.asp');
			} else {
				let color = args.pop();
				if(color.length != 7 || color[0] != '#') {
					// format de couleur invalide
					message.channel.send('Format de couleur correct: "#xxxxxx" où les x sont des caractèrs compris dans l\'intervalle 0-9 ou a-f\n'
									   + 'Exemple: "#20a78f" pour une couleur turquoise\n'
									   + 'Pour avoir la palette de couleur, suivre ce lien: https://www.w3schools.com/colors/colors_picker.asp');
				} else {
					let name = args.join(' '),
						id = message.author.id;
					RoleSuggestion.findOrCreate({
						where: {
							dateBatch: currentSuggestions
						},
						defaults: {
							dateBatch: currentSuggestions,
								userId: id,
								name: name,
								color: color
						}
					}).spread((suggestion, created) => {
						if(created) {
							// Suggestion déjà effectuée
							message.channel.send(new Discord.RichEmbed({
								description: `Proposition de rôle acceptée avec le nom "${suggestion.name}"`,
								color: suggestion.color.slice(1)
							}));
						} else {
							message.reply('Proposition déjà effectuée');
						}
					});
				}
			}
		} else {
			message.channel.send('Bro c\'est pas le moment');
		}
		resolve();
	});
}, '(placeholder)');*/

Command.add('eval', Permission.expert, (message, args) => {
	console.log(args.join(' '));
	return new Promise((resolve, reject) => {
		try {
			eval(args.join(' '));
			resolve();
		} catch(err) {
			reject(err);
		}
	});
}, '');

Command.add('resetdb', Permission.expert, (message, args) => {
	return new Promise((resolve, reject) => {
		resetDB(args);
		resolve();
	});
}, '');

Command.add('help', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		/** @type {string} */
		let msg;
		if(args.length == 0) {
			msg = 'Liste des commandes disponibles pour vous:';
			Command.commands.forEach((cmd, name) => {
				if(cmd.permission.checkPermission(message.author.id))
					msg += `\n${name}: ${cmd.description}`;
			});
			msg += `\n\nPour obtenir de l\'aide sur une commande, entrez "${config.prefix}help <nom de la commande>"`;
		} else {
			let cmdName = args[0],
				cmd = Command.commands.get(cmdName);
			msg = `-- Aide pour ${cmdName} --\nDescription:\`\`\`\n${cmd.description}\`\`\``;
			if(cmd.utilisation)
				msg += `\nUtilisation:\`\`\`\n${config.prefix}${cmd.utilisation}\`\`\``;
		}
		message.channel.send(msg);
	});
}, 'Affiche ce message d\'aide');

/**
 * 
 * @param {Discord.Message} message 
 */
function testForMio(message) {
	/** @type {RegExpMatchArray} */
	let mios;
	if((mios = (message.content.match(/^mio | mio | mio$|^mio$|^tio | tio | tio$|^tio$|^viola | viola | viola$|^viola$/ig) || [])).length > 0) {
		Mio.findOne({
			where: {
				userId: message.author.id
			}
		}).then(mio => {
			if(mio == null) {
				Mio.create({
					userId: message.author.id,
					count: mios.length
				}).catch(err => {
					console.error(`erreur create: ${err.toString()}`);
				});
				message.channel.send(`Compteur de mio/tio/viola pour <@${message.author.id}>: \`${mios.length}\``).catch(_ => {});
			} else {
				Mio.update({
					count: mio.count + mios.length
				}, {
					where: {
						userId: message.author.id
					}
				}).then(() => {
					message.channel.send(`Compteur de mio/tio/viola pour <@${message.author.id}>: \`${mio.count+mios.length}\``).catch(_ => {});
				}).catch(err => {
					console.error(`erreur update: ${err}`)
				});
			}
		}).catch(err => {
			console.error(`erreur find: ${err}`);
		});
	}
};

/**
 * 
 * @param {Discord.Message} message 
 */
function countEmojis(message) {
	/** @type {RegExpMatchArray} */
	let strs = message.content.match(/<:[A-Za-z]+:[0-9]+>/g);
	if(strs != null) {
		strs.reduce((previous, current, index, array) => {
			let [name, id] = current.slice(2, -1).split(':');
			if(poudlard.emojis.has(id)) {
				return previous.then(() => {
					return new Promise((resolve, reject) => {
						Emoji.findOne({
							where: {
								emojiId: id
							}
						}).then(emoji => {
							if(emoji == null) {
								Emoji.create({
									emojiId: id,
									count: 1
								}).then(() => {
									resolve();
								}).catch(err => {
									console.error(`erreur create emoji: ${err}`);
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
									console.error(`erreur update emoji: ${err}`);
									reject(err);
								});
							}
						}).catch(err => {
							console.error(`erreur find emoji: ${err}`);
							reject(err);
						});
					});
				}).catch(err => {
					console.error(`arg: ${err}`);
					return new Promise((resolve, reject) => {
						resolve();
					});
				});
			} else {
				console.error('Emoji invalide');
				return new Promise((resolve, reject) => {
					resolve();
				});
			}
		}, new Promise((resolve, reject) => {
			resolve();
		}));
	}
};

/*function endSuggestions() {
	RoleSuggestion.findAll({
		where: {
			dateBatch: currentSuggestions
		}
	}).then(suggestions => {
		if(suggestions == null) {
			annonce_roles.send('Aucun suggestion proposée :(');
		} else {
			shuffle(suggestions);
			let msg = 'Fin du temps imparti pour proposer vos suggestions !\nListe des noms proposés:\n';
			for(let i = 0; i < suggestions.length; i++)
				msg += `${i+1}. ${suggestions[i].name} (${suggestions[i].color})\n`;
			annonce_roles.send(msg);
		}
		currentSuggestions = null;
	}).catch(err => {
		console.error(`error create: ${err}`);
	});
}*/

/**
 * 
 * @param {string[]} tables 
 */
function resetDB(tables) {
	if(tables.includes('mio')) {
		Mio.sync({force: true});
		console.log('reset mio');
	}
	if(tables.includes('emoji')) {
		Emoji.sync({force: true});
		console.log('reset emoji');
	}
	/*if(tables.includes('batchsuggestion')) {
		BatchSuggestion.sync({force: true});
		console.log('reset batchsuggestion');
	}
	if(tables.includes('rolesuggestion')) {
		RoleSuggestion.sync({force: true});
		console.log('reset rolesuggestion');
	}*/
};

/**
 * 
 * @param {any[]} array 
 */
/*function shuffle(array) {
	for(let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}*/

client.on('ready', () => {
	console.log('Initialisation de Swagrid...');
	
	client.user.setActivity('de la magie', {type: 'WATCHING'});
	
	poudlard = client.guilds.get('307821648835248130');
	surveillants = poudlard.roles.get('469496344558698506');
	//prefets = poudlard.roles.get('501438461341990913');
	
	//client.channels.get('442762703958835200').fetchMessages(); // Récupère les messages du règlement intérieur
	//annonce_roles = client.channels.get('522057339176615936');

	/*BatchSuggestion.findOne({
		order: [
			['dateStart', 'DESC']//,
			//sequelize.fn('max', sequelize.col('dateStart'), 'DESC')
		]
	}).then(batch => {
		if(batch != null) {
			let dateEnd = new Date(batch.dateStart);
			//dateEnd.setDate(dateEnd.getDate() + 1);
			dateEnd.setTime(dateEnd.getTime() + 60000);
			let timeTillEnd = dateEnd.getTime() - new Date().getTime();
			if(timeTillEnd > 0) {
				currentSuggestions = batch.dateStart;
				setTimeout(endSuggestions, timeTillEnd);
			}
		} else {
			// Table vide
			//console.log('table batch vide');
		}
	}).catch(err => {
		console.error(`error find (client.ready): ${err}`);
	});*/
	
	console.info('Prêt à défoncer des mères');
});

client.on('message', message => {
	if(message.author.bot)
		return;
	
	if(message.content.indexOf(config.prefix) !== 0) {
		testForMio(message);
		countEmojis(message);
		return;
	}
	
	/*if(!(message.channel instanceof Discord.TextChannel))
		if(!Permission.expert.checkPermission(message.author.id))
			return;*/
	
	/** @type {string[]} */
	let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	/** @type {string} */
	let name = args.shift().toLowerCase();
	
	Command.execute(name, message, args).catch(err => console.error(err));
});

client.on('messageReactionAdd', (reaction, user) => {
	/** @type {string} */
	let emojiId = reaction.emoji.id;
	if(poudlard.emojis.has(emojiId)) {
		Emoji.findOne({
			where: {
				emojiId: emojiId
			}
		}).then(emoji => {
			if(emoji == null) {
				Emoji.create({
					emojiId: emojiId,
					count: 1
				}).catch(err => {
					console.error(`erreur create emoji: ${err}`);
				});
			} else {
				Emoji.update({
					count: emoji.count + 1
				}, {
					where: {
						emojiId: emojiId
					}
				}).catch(err => {
					console.error(`erreur update emoji: ${err}`);
				});
			}
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`);
		});
	}
});

client.on('messageReactionRemove', (reaction, user) => {
	/** @type {string} */
	let emojiId = reaction.emoji.id;
	if(poudlard.emojis.has(emojiId)) {
		console.log(`remove ${reaction.emoji.name}`);
		Emoji.findOne({
			where: {
				emojiId: emojiId
			}
		}).then(emoji => {
			if(emoji != null) {
				console.log(`emoji number (before): ${emoji.count}`);
				Emoji.update({
					count: emoji.count - 1
				}, {
					where: {
						emojiId: emojiId
					}
				}).catch(err => {
					console.error(`erreur update emoji: ${err}`);
				});
				console.log(`emoji number (after): ${emoji.count - 1}`);
			}
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`);
		});
	}
});

client.on('voiceStateUpdate', (oldmember, newmember) => { // Update packages
	/** @type {Discord.VoiceChannel} */
	let oldvoice = oldmember.voiceChannel;
	/** @type {Discord.VoiceChannel} */
	let newvoice = newmember.voiceChannel;
	
	if(!oldvoice && newvoice) {
		//join
	} else if(oldvoice && !newvoice) {
		//leave
	} else {
		if(oldvoice.id != newvoice.id) {
			// move
			if(newvoice.id == client.user.id) {
				// Swagrid a été déplacé
				Music.voiceChannel = newvoice;
			} else {
				if(newvoice.id == '520211457481113610')
					newmember.addRole('520210711767678977');
			}
		} else {
			// update genre mute/demute
		}
	}
});

sequelize = new Sequelize('database', 'nero', null, {
	dialect: 'sqlite',
	storage: '.data/database.sqlite',
	logging: false
});

sequelize.authenticate().then(() => {
	console.info('Authentication success');
	
	Mio = sequelize.define('mio', {
		userId: {
			type: Sequelize.STRING,
			primaryKey: true
		},
		count: Sequelize.INTEGER
	});
	Emoji = sequelize.define('emoji', {
		emojiId: {
			type: Sequelize.STRING,
			primaryKey: true
		},
		count: Sequelize.INTEGER
	});
	/*BatchSuggestion = sequelize.define('batchsuggestion', {
		dateStart: {
			type: Sequelize.INTEGER,
			primaryKey: true
		}
	});
	RoleSuggestion = sequelize.define('rolesuggestion', {
		dateBatch: {
			type: Sequelize.INTEGER,
			primaryKey: true
		},
		userId: {
			type: Sequelize.INTEGER,
			primaryKey: true
		},
		name: Sequelize.STRING,
		color: Sequelize.STRING
	});*/
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