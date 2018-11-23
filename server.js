var local = typeof process.env.TOKEN === 'undefined';

const Discord = require('discord.js'),
	  config = require('./config.json'),
	  Sequelize = require('sequelize'),
	  env = local ? require('./env.json') : {},
	  search = require('youtube-api-v3-search'),
	  request = require('request-promise-native'),
	  parseString = require('xml2js').parseString,
	  express = require('express'),
	  music = require('./music'),
	  app = express(),
	  client = new Discord.Client({
		  disabledEvents: ['TYPING_START']
	  });

var poudlard,
	surveillants,
	//prefets,
	sequelize,
	ytKey = (local ? env : process.env).YT;

var /*User,
	Playlist,
	Link,*/
	Mio,
	Emoji;

/**
 * @class
 */
var Permission = {
	basic: {
		/**
		 * @param {string} userID
		 * @return {boolean}
		 */
		check_permission: (userID) => { // Tout le monde
			return true;
		}
	},
	advanced: {
		/**
		 * @param {string} userID
		 * @return {boolean}
		 */
		check_permission: (userID) => { // Surveillants
			return surveillants.members.find(e => e.user.id == userID);
		}
	},
	expert: {
		/**
		 * @param {string} userID
		 * @return {boolean}
		 */
		check_permission: (userID) => { // Nero
			return userID == config.owner;
		}
	}
};

/**
 * @class
 */
class Command {
	/**
	 * 
	 * @param {Permission} perm 
	 * @param {function(Discord.Message, string[]) : void} fct 
	 * @param {string} desc 
	 * @param {string} util 
	 */
    constructor(perm, fct, desc, util) {
		this.permission = perm;
		/**
		 * @param {Discord.Message} message
		 * @param {string[]} args
		 */
		this.execute = (message, args) => {
			return new Promise((resolve, reject) => {
				if(perm.check_permission(message.author.id)) {
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
		this.description = desc;
		this.utilisation = util;
    }
}

Command.commands = new Map();
/**
 * @param {string} name
 * @param {Permission} permission
 * @param {function(Discord.Message, string[]) : Promise} fct
 * @param {string} desc
 * @param {string} util
 */
Command.add = (name, permission, fct, desc, util) => Command.commands.set(name, new Command(permission, fct, desc, util));
/**
 * @param {string} name
 * @param {Discord.Message} message
 * @param {string[]} args
 */
Command.execute = (name, message, args) => {
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
			music.voiceChannel = poudlard.channels.get(message.member.voiceChannelID);
			music.voiceChannel.join().then(connection => {
				music.voiceConnection = connection;
				resolve();
			}).catch(err => {
				music.voiceChannel = null;
				music.voiceConnection = null;
				reject(err);
			});
		}
    });
}, 'Invoque Swagrid dans le channel vocal', 'join: Si vous êtes dans un channel vocal, Swagrid vous rejoint');

Command.add('leave', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        music.voiceChannel.leave();
		music.voiceChannel = null;
		music.voiceConnection = null;
		resolve();
    });
}, 'Renvoie Swagrid du channel vocal vers sa hutte', 'leave: Swagrid quitte son channel vocal, peut importe dans lequel vous êtes');

Command.add('play', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        if(music.voiceConnection == null) {
			reject('Swagrid n\'est pas dans un channel');
		} else if(message.member.voiceChannelID != music.voiceChannel.id) {
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
				music.add(res.items[0].id.videoId, res.items[0].snippet.title);
				resolve();
			}).catch(err => {
				reject(err);
			});
		}
    });
}, 'Effectue une recherche sur Youtube et joue la première vidéo trouvée, ou la met en attente si une vidéo est déjà en cours de lecture (vous devez être dans le même channel vocal que Swagrid)', 'play <recherche>: Recherche <recherche> sur youtube et lit la première vidéo trouvée. <recherche> peut être constitué de plusieurs mots (ex: "Rick Astley - Never Gonna Give You Up"). <recherche> peut être une url mais le résultat n\'est pas garantit');

Command.add('playing', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        if(music.playing == '') {
			message.reply('Aucune musique en cours de lecture');
		} else {
			message.reply(`"${music.playing}" est en cours de lecture`);
		}
		resolve();
    });
}, 'Permet d\'obtenir le nom de la vidéo qui passe actuellement');

Command.add('playlist', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        message.reply(music.playlist());
		resolve();
    });
}, 'Affiche le titre des vidéos dans la file d\'attente');

Command.add('cancel', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        music.cancel();
		resolve();
    });
}, 'Annule la dernière action (en rapport avec les vidéos)');

Command.add('skip', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        music.skip();
		resolve();
    });
}, 'Pour faire passer la vidéo en cours de lecture');

Command.add('stop', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        music.stop();
		resolve();
    });
}, 'Arrête la vidéo en cours et vide la file d\'attente');

Command.add('r34', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		if(message.channel.nsfw || !(message.channel instanceof Discord.TextChannel)) {
			request(`https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${args.join('+')}+-scat`).then(data => {
				parseString(data, (err, result) => {
					if(err) {
						reject(err);
					} else {
						let count = parseInt(result.posts.$.count);
						if(count == NaN) {
							reject('Erreur dans la récupération des posts');
						} else {
							if(count == 0) {
								message.reply('Aucun résultat');
								resolve();
							} else {
								let post_number = Math.floor(Math.random()*count),
									pid = Math.floor(post_number / 100);
								request(`https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${args.join('+')}+-scat`).then(data2 => {
									parseString(data2, (err2, result2) => {
										if(err2) {
											reject(err2);
										} else {
											let count2 = parseInt(result2.posts.$.count);
											if(count2 == NaN) {
												reject('Erreur dans la récupération des posts (2)');
											} else {
												if(count2 == 0) {
													message.reply('Aucun résultat (2)');
												} else {
													let nb_post = post_number % 100,
														post = result2.posts.post[nb_post];
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
				msg += `\n${emoji.count} : ${poudlard.emojis.get(emoji.emojiId)}`;
			message.channel.send(msg);

			resolve();
		}).catch(err => {
			console.error(`erreur retrieve all emojis: ${err}`);
			reject(err);
		})
	});
}, 'Affiche la popularité des émojis du serveur');

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
}, 'Exécute la commande en brut sur le serveur');

Command.add('resetDB', Permission.expert, (message, args) => {
	resetDB(args);
});

Command.add('help', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
		let msg;
		if(args.length == 0) {
			msg = 'Liste des commandes disponibles pour vous:';
			Command.commands.forEach((cmd, name) => {
				if(cmd.permission.check_permission(message.author.id))
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
let testForMio = message => {
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
let countEmojis = message => {
	for(let emostr of message.content.match(/<:[A-Za-z]+:[0-9]+>/g)) {
		let [name, id] = emostr.slice(2, -1).split(':');
		if(poudlard.emojis.get(id) != undefined) {
			Emoji.findOne({
				where: {
					emojiId: id
				}
			}).then(emoji => {
				if(emoji == null) {
					Emoji.create({
						emojiId: id,
						count: 1
					}).catch(err => {
						console.error(`erreur create emoji: ${err}`);
					});
				} else {
					Emoji.update({
						count: emoji.count + 1
					}, {
						where: {
							emojiId: id
						}
					}).catch(err => {
						console.error(`erreur update emoji: ${err}`);
					});
				}
			}).catch(err => {
				console.error(`erreur find emoji: ${err}`);
			});
		}
	}
};

/**
 * 
 * @param {string[]} tables 
 */
let resetDB = tables => {
	if(tables.includes('mio'))
		Mio.sync({force: true});
	if(tables.includes('emoji'))
		Emoji.sync({force: true});
};

client.on('ready', () => {
    console.log('Initialisation de Swagrid...');
    
    client.user.setActivity('de la magie', {type: 'WATCHING'});
    
    poudlard = client.guilds.get('307821648835248130');
    surveillants = poudlard.roles.get('469496344558698506');
	prefets = poudlard.roles.get('501438461341990913');
	
	//client.channels.get('442762703958835200').fetchMessages(); // Récupère les messages du règlement intérieur
    
    console.info('Started');
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
		if(!Permission.expert.check_permission(message.author.id))
			return;*/
	
    var args = message.content.slice(config.prefix.length).trim().split(/ +/g),
        name = args.shift().toLowerCase();
    
    Command.execute(name, message, args).catch(err => console.error(err));
});

client.on('messageReactionAdd', (reaction, user) => {
	let emojiId = reaction.emoji.id;
	if(poudlard.emojis.get(emojiId) != undefined) {
		Emoji.findOne({
			where: {
				emojiId: emojiId
			}
		}).then(emoji => {
			Emoji.update({
				count: emoji.count + 1
			}, {
				where: {
					emojiId: emojiId
				}
			}).catch(err => {
				console.error(`erreur update emoji: ${err}`);
			});
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`);
		});
	}
});

client.on('messageReactionRemove', (reaction, user) => {
	let emojiId = reaction.emoji.id;
	if(poudlard.emojis.get(emojiId) != undefined) {
		Emoji.findOne({
			where: {
				emojiId: emojiId
			}
		}).then(emoji => {
			Emoji.update({
				count: emoji.count - 1
			}, {
				where: {
					emojiId: emojiId
				}
			}).catch(err => {
				console.error(`erreur update emoji: ${err}`);
			});
		}).catch(err => {
			console.error(`erreur find emoji: ${err}`);
		});
	}
});

client.on('voiceStateUpdate', (oldmember, newmember) => { // Update packages
	let oldvoice = oldmember.voiceChannel;
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
				music.voiceChannel = newvoice;
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
    
    /*User = sequelize.define('user', {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true
        },
        lastVideoSearched: Sequelize.CHAR(11),
        activePlaylist: Sequelize.STRING
    });
    Playlist = sequelize.define('playlist', {
        name: Sequelize.STRING,
        user_id: Sequelize.BIGINT
    });
    Link = sequelize.define('link', {
        value: Sequelize.CHAR(11),
        playlist_name: Sequelize.STRING,
        playlist_user_id: Sequelize.BIGINT
    });*/
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
    //resetDB(['user', 'playlist', 'link', 'mio']);
}).catch(err => {
    console.error(err);
});

app.get('/', (request, response) => {
	response.sendFile(`${__dirname}/index.html`);
});
app.get('/anime', (request, response) => {
	response.sendFile(`${__dirname}/anime`);
})
var listener = app.listen(3000, () => {
	console.info('Swagrid présent sur le port ' + listener.address().port);
});

client.login((local ? env : process.env).TOKEN);