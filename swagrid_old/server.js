var Discord = require('discord.js'),
	Sequelize = require('sequelize'),
	config = require('./config.json'),
	http = require('http'),
	express = require('express'),
	fs = require('fs'),
	//rp = require('request-promise-native'),
	{ exec } = require('child_process'),
	ytdl = require('ytdl-core'),
	search = require('youtube-api-v3-search'),
	client = new Discord.Client();

var poudlard, // guild "Poudlard, l'école des boloss"
	roles, // Liste des rôles disponibles
	surveillants, // Liste des surveillants
	houses, // Liste des maisons
	test_bot, // Channel textuel de tests
	hall_des_sabliers,
	surveillants, // Modérateurs
	voiceConnection,
	voiceChannel = undefined,
	dispatcher,
	playing = false,
	local = (typeof process.env.TOKEN === 'undefined' ? true : false);

var sequelize, // DB
	app = express(); // Besoin d'express pour le keepalive

var House, // points des maisons
	User,
	Playlist,
	Link; // Tables

// ---

var Permission = {
	basic: {
		check_permission(message, command, args) { // Tout le monde
			return true;
		}
	},
	advanced: {
		check_permission(message, command, args) { // Surveillants
			return surveillants.members.find(e => e.user.id == message.author.id);
		}
	},
	expert: {
		check_permission(message, command, args) { // Moi
			return message.author.id == config.ownerID;
		}
	}
};

class Command {
	constructor(name, permission, apply, canBeLocal) {
		if(typeof canBeLocal === 'undefined')
			canBeLocal = true;
		
		this.permission = permission;
		this.apply = canBeLocal ? apply : function(message, args, resolve, reject) {
			local ? message.reply('Commande impossible en local') : apply(message, args, resolve, reject);
		};
		
		Command.commands.set(name, this);
	}
}

Command.commands = new Map();
Command.execute = function(name, message, args) {
	return new Promise((resolve, reject) => {
		try {
			Command.commands.get(name).apply(message, args, resolve, reject);
		} catch(err) {
			reject(err);
		}
	});
}

// ---

/*new Command('playsound', Permission.basic, (message, args, resolve, reject) => {
	if (typeof voiceConnection === 'undefined') {
		message.reply('Je doit être dans un channel vocal pour jouer un son');
		reject('Swagrid n\'est pas dans un channel');
		return;
	}
	
	dispatcher = voiceConnection.playStream(ytdl(args[0], {
		seek: 0,
		volume: 1
	}));
	
	let opt = {
		key: (local ? require('./env.json') : process.env).YT,
		type: 'video',
		maxResults: 1
	};
	search(args[0], opt, (err, results) => {
		if(err) {
			reject(err);
			return;
		}
		
		dispatcher = voiceConnection.playStream(ytdl(results[0].id, {
			seek: 0,
			volume: 1
		}));
		resolve();
	});
}, false);*/

new Command('yt', Permission.expert, (message, args, resolve, reject) => {
	if (typeof voiceConnection === 'undefined') {
		reject('Swagrid n\'est pas dans un channel');
		return;
	}
	
	search((local ? require('./env.json') : process.env).YT, {
		q: args.join(' '),
		maxResults: 1,
		part: 'snippet',
		type: 'video'
	}).then(res => {
		message.channel.send(`Recherche de \`${args.join(' ')}\``, new Discord.RichEmbed({
			author: {
				'name': 'Lecture en cours'
			},
			thumbnail: {
				'url': `https://img.youtube.com/vi/${res.items[0].id.videoId}/hqdefault.jpg`
			},
			title: `${res.items[0].snippet.title}`,
			url: `https://youtu.be/${res.items[0].id.videoId}/`
		}));
		
		dispatcher = voiceConnection.playStream(ytdl(res.items[0].id.videoId, {
			seek: 0,
			volume: 1
		}));
		resolve();
	}).catch((err) => {
		console.log('Erreur search:', err);
		reject(err);
	});
}, false);

/*new Command('playsound', Permission.basic, (message, args, resolve, reject) => {
	if (typeof voiceConnection === 'undefined') {
		message.reply('Je doit être dans un channel vocal pour jouer un son');
		reject('Swagrid n\'est pas dans un channel');
		return;
	}
	
	rp(`https://www.youtube.com/get_video_info?video_id=${args[0]}`).then(data => {
		var data = parse_str(data),
			streams = (data.url_encoded_fmt_stream_map + ',' + data.adaptive_fmts).split(','),
			audio_streams = {};

		streams.forEach(s => {
			var stream = parse_str(s),
				itag = stream.itag * 1,
				quality = false;
			//console.log('stream:', stream);
			switch (itag) {
				case 139:
					quality = '48kbps';
					break;
				case 140:
					quality = '128kbps';
					break;
				case 141:
					quality = '256kbps';
					break;
			}
			if (quality)
				audio_streams[quality] = stream.url;
		});
		
		dispatcher = voiceConnection.playArbitraryInput(audio_streams['128kbps'], err => {
			console.error(`Erreur playSound: ${err}`);
			playing = false;
			reject(err);
		});
		playing = true;
		dispatcher.on('end', reason => {
			console.log(`end sound: ${reason}`);
			playing = false;
			resolve();
		});
	}).catch(err => {
		reject(err);
	});
}, false);*/

new Command('stopsound', Permission.basic, (message, args, resolve, reject) => {
	try {
		dispatcher.end();
		resolve();
	} catch(err) {
		reject(err);
	}
});

new Command('totalpoints', Permission.basic, (message, args, resolve, reject) => {
	if (!args.length) {
		House.findAll().then(data => {
			data.sort((e1, e2) => e1.dataValues.points < e2.dataValues.points); // Tri du tableau pour afficher les points dans l'ordre décroissant

			let str = '';
			data.forEach(d => {
				var house = houses.find(e => e.name == d.dataValues.name);
				str += `${house.blason} ${house.text} possède ${d.dataValues.points} points\n`;
			});
			message.delete().catch(_ => {});
			message.channel.send(str).then(() => {
				resolve();
			}).catch(err => {
				console.error(`Erreur send totalpoints: ${err}`);
			});
		}).catch(err => {
			console.error(`Impossible de récupérer les données lors de totalpoints: ${err}`);
			reject(err);
		});
	} else {
		House.findAll({
			where: {
				name: args[0].toLowerCase()
			}
		}).then(data => {
			var house = houses.find(e => e.name == data[0].dataValues.name);
			message.delete().catch(_ => {});
			message.channel.send(`${house.blason} ${house.text} possède ${data[0].dataValues.points} points`).then(() => {
				resolve();
			}).catch(err => {
				console.error(`Erreur send totalpoints <${args[0].toLowerCase()}>: ${err}`);
				reject(err);
			});
		}).catch(err => {
			message.reply(config.error_messages.house_not_found);
			reject(err);
		});
	}
}, false);

new Command('list_playlists', Permission.basic, (message, args, resolve, reject) => {
	// 1: vérifier si l'utilisateur à déjà une ligne à son nom
	// 2: récupérer les playlists associées à cet utilisateur
	// 3: Envoyer le nom des playlists
	User.findById(message.author.id).then(data => {
		if(data === null) {
			User.create({
				id: message.author.id
			}).then(data => {
				console.log('user:', data);
				resolve();
			}).catch(err => {
				console.log('err_user:', err);
				reject(err);
			});
		} else {
			Playlist.findAll({
				where: {
					user_id: message.author.id
				}
			}).then(data => {
				console.log('playlist:', data);
				resolve();
			}).catch(err => {
				console.log('error:', err);
				reject(err);
			});
		}
	}).catch(err => {
		reject(err);
	});
});

new Command('create_playlist', Permission.basic, (message, args, resolve, reject) => {
	if(args.length < 1) {
		reject('Pas de nom de playlist spécifié');
		return;
	}
	
	Playlist.create({
		name: args[0],
		user_id: message.author.id
	}).then(() => {
		resolve();
	}).catch(err => {
		reject(err);
	});
});

// --

new Command('say', Permission.advanced, (message, args, resolve, reject) => {
	message.delete().catch(_ => {});
	message.channel.send(args.join(' ')).then(() => {
		resolve();
	}).catch((err) => {
		console.error(`Erreur say: ${err}`);
		reject(err);
	});
});

new Command('donnepoints', Permission.advanced, (message, args, resolve, reject) => {
	updatePoints(message, args[0].toLowerCase(), parseInt(args[1]), resolve, reject);
}, false);

new Command('retirepoints', Permission.advanced, (message, args, resolve, reject) => {
	updatePoints(message, args[0].toLowerCase(), -parseInt(args[1]), resolve, reject);
}, false);

new Command('join', Permission.advanced, (message, args, resolve, reject) => {
	try {
		//poudlard.channels.find('id', message.member.voiceChannelID).join().then(connection => {
		voiceChannel = poudlard.channels.get(message.member.voiceChannelID);
		voiceChannel.join().then(connection => {
			voiceConnection = connection;
			resolve();
		}).catch(err => {
			voiceChannel = undefined;
			console.error(`Erreur connection VoiceChannel: ${err}`);
			reject(err);
		});
	} catch(err) {
		reject(err);
	}
}, false);

new Command('leave', Permission.advanced, (message, args, resolve, reject) => {
	try {
		//poudlard.channels.find('id', message.member.voiceChannelID).leave();
		voiceChannel.leave();
		voiceConnection = undefined;
		resolve();
	} catch(err) {
		reject(err);
	}
}, false);

new Command('mur', Permission.advanced, (message, args, resolve, reject) => {
	updateScores(resolve, reject);
});

// --

new Command('ping', Permission.expert, (message, args, resolve, reject) => {
	message.channel.send('Ping ?').then(msg => {
		msg.edit(`Pong ! ${msg.createdTimestamp - message.createdTimestamp}ms de latence. API: ${Math.round(client.ping)}ms`).then(() => {
			resolve();
		}).catch(err => {
			console.error(`Erreur edit ping message: ${err}`);
			reject(err);
		});
	}).catch(err => {
		console.error(`Erreur send ping message: ${err}`);
		reject(err);
	});
});

new Command('addsound', Permission.expert, (message, args, resolve, reject) => {
	try {
		var attachment = message.attachments.first();
		if(!attachment) {
			reject('Pas de fichier joint');
			return;
		}
		var file = fs.createWriteStream(`./.sounds/${attachment.filename}`);
		http.get(attachment.url, response => {
			response.pipe(file);
			resolve();
		});
	} catch(err) {
		reject(err);
	}
});

new Command('eval', Permission.expert, (message, args, resolve, reject) => {
	try {
		eval(args.join(' '));
	} catch (err) {
		console.log(`Erreur dans eval: ${err}`);
		reject(err);
	}
});

new Command('resetstorage', Permission.expert, (message, args, resolve, reject) => {
	resetDataBase(message, args, resolve, reject);
}, false);

new Command('exit', Permission.expert, (message, args, resolve, reject) => {
	process.exit();
});

// ---

function updatePoints(message, maison, number, resolve, reject) {
	if (isNaN(number)) {
		message.reply(config.error_messages.invalid_points_number);
		reject('Montant incorrect');
		return;
	}

	if (number == 0) {
		message.reply(config.error_messages.zero_points);
		resolve();
		return;
	}

	let house = houses.find(e => e.name == maison);
	if (!house) {
		message.reply(config.error_messages.house_not_found);
		reject('Maison non trouvée');
		return;
	}

	House.findAll({
		where: {
			name: maison
		}
	}).then(data => {
		var pts = data[0].dataValues.points;
		House.update({
			points: (pts + number > 0 ? pts + number : 0)
		}, {
			where: {
				name: maison
			}
		}).then(_ => {
			message.delete().catch(_ => {});
			message.channel.send(`${(number > 0 ? '+' : '-')} ${Math.abs(number)} points pour ${house.blason} ${house.text} ! (total: ${pts + number} points)`).then(() => {
				updateScores(resolve, reject);
			}).catch(err => {
				console.error(`Erreur send updatepoints: ${err}`);
				reject(err);
			});
		}).catch(err => {
			console.log(`Erreur dans la mise à jour de la maison ${maison}: ${err}`);
			reject(err);
		});
	}).catch(err => {
		console.log(`Erreur dans la recherche de la maison ${maison}: ${err}`);
		reject(err);
	});
}

function updateRoles(messageReaction, user, action) {
	if (messageReaction.message.id != '472082352177283074')
		return;

	//let guildMember = poudlard.members.find('user', user);
	let guildMember = poudlard.members.get(user.id);

	for (let i in roles)
		if (messageReaction.emoji.name == roles[i].emoji)
			guildMember[action ? 'addRole' : 'removeRole'](roles[i].name);
}

function resetDataBase(message, args, resolve, reject) {
	if (args.includes('house')) {
		House.sync({
			force: true
		}).then(() => {
			var maisons = ['gryffondor', 'serdaigle', 'poufsouffle', 'serpentard'];
			for (let i = 0; i < maisons.length; i++) {
				House.create({
					name: maisons[i],
					points: 0
				});
			}
			message.channel.send('Reset de la BDD effectué').then(() => {
				resolve();
			}).catch(err => {
				reject(err);
			});
		}).catch(err => {
			console.log(`Erreur lors du reset de la base de données: ${err}`);
			reject(err);
		});
	}
	if(args.includes('user'))
		User.sync();
	if(args.includes('playlist'))
		Playlist.sync();
	if(args.includes('link'))
		Link.sync();
}

function parse_str(str) {
	return str.split('&').reduce((params, param) => {
		var paramSplit = param.split('=').map(value => {
			return decodeURIComponent(value.replace('+', ' '));
		});
		params[paramSplit[0]] = paramSplit[1];
		return params;
	}, {});
}

function updateScores(resolve, reject) {
	House.findAll().then(data => {
		let serp, serd, gryf, pouf;
		
		data.forEach(d => {
			switch(d.dataValues.name) {
				case 'serpentard':
					serp = d.dataValues.points;
					break;
				case 'serdaigle':
					serd = d.dataValues.points;
					break;
				case 'gryffondor':
					gryf = d.dataValues.points;
					break;
				case 'poufsouffle':
					pouf = d.dataValues.points;
					break;
			}
		});
		
		exec(`java -jar sabliers.jar ${serp} ${serd} ${gryf} ${pouf}`, (err, stdout, stderr) => {
			if(err) {
				console.log(`stderr: ${stderr}`);
				reject(err);
			}
			
			let last_msg = hall_des_sabliers.messages.find(msg => msg.author.id == client.user.id);
			if(last_msg != null) // Si message déjà posté
				last_msg.delete();
			
			hall_des_sabliers.send({
				files: [{
					attachment: 'mur.png',
					name: 'Scores.png'
				}]
			}).then(() => {
				resolve();
			}).catch(err => {
				console.log(err);
				reject(err);
			})
		});
	}).catch(err => {
		console.error(`Impossible de récupérer les données lors de updateScores: ${err}`);
		reject(err);
	});
}

// ---

client.on('ready', () => {
	console.log('Swagrid est dans la place !');
	client.user.setActivity(config.activities[Math.floor(Math.random() * config.activities.length)]);
	client.channels.get('442762703958835200').fetchMessages(); // Récupère les messages du règlement intérieur
	client.channels.get('480841212912205825').fetchMessages(); // Récupère les messages du hall des sabliers

	poudlard = client.guilds.get('307821648835248130'); // "Poudlard, l'école des boloss"
	roles = [];
	for (let i = 0; i < config.roles.length; i++) {
		roles.push({
			//name: poudlard.roles.find('name', config.roles[i].name),
			name: poudlard.roles.find(e => e.name == config.roles[i].name),
			emoji: config.roles[i].emoji
		});
	}
	houses = [];
	for (let i = 0; i < config.houses.length; i++) {
		houses.push({
			name: config.houses[i].name,
			text: config.houses[i].text,
			//blason: poudlard.emojis.find('name', config.houses[i].blason)
			blason: poudlard.emojis.find(e => e.name == config.houses[i].blason)
		});
	}
	test_bot = client.channels.get('470676824532320256');
	hall_des_sabliers = client.channels.get('480841212912205825');
	surveillants = poudlard.roles.get('469496344558698506');
	client.channels.get('486879516816441354'); // bot-music
});

client.on('message', message => {
	if (message.author.bot) return;
	
	if (message.content.indexOf(config.prefix) !== 0) return;
	
	var commands = message.content.split('\n');
	
	commands.reduce((previous, current, index, array) => {
		var args = current.slice(config.prefix.length).trim().split(/ +/g),
			name = args.shift().toLowerCase();

		return previous.then(() => {
			return Command.execute(name, message, args);
		}).catch(err => {
			console.log(`Erreur promise: ${err}`);
			//test_bot.send(err);
			message.channel.send(err);
			array = [];
		});
	}, new Promise((resolve, reject) => {
		resolve()
	}));
});

client.on('messageReactionAdd', (messageReaction, user) => {
	updateRoles(messageReaction, user, true);
});

client.on('messageReactionRemove', (messageReaction, user) => {
	updateRoles(messageReaction, user, false);
});

process.on('exit', (m) => {
	console.log('Extinction du bot', m);
});

// ---

try {
	sequelize = new Sequelize('database', 'username', 'password', {
		host: '0.0.0.0',
		dialect: 'sqlite',
		pool: {
			max: 5,
			min: 0,
			idle: 10000
		},
		storage: '.data/database.sqlite',
		logging: false
	});

	sequelize.authenticate().then(() => {
		console.log('Authentication success');

		House = sequelize.define('house', {
			name: {
				type: Sequelize.STRING
			},
			points: {
				type: Sequelize.INTEGER
			}
		});
		User = sequelize.define('user', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true
			}
		});
		Playlist = sequelize.define('playlist', {
			name: {
				type: Sequelize.STRING,
				primaryKey: true
			},
			user_id: {
				type: Sequelize.BIGINT,
				references: {
					model: User,
					key: 'id'
				},
				primaryKey: true
			}
		});
		Link = sequelize.define('link', {
			value: {
				type: Sequelize.CHAR(11),
				primaryKey: true
			},
			playlist_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Playlist,
					key: 'id'
				}
			}
		});
	}).catch(err => {
		console.log('Authentication fail:', err);
	});
} catch (e) { // En local
	local = true;
}

// ---

app.use(express.static('public'));
app.get('/', (request, response) )> {
	response.sendFile(__dirname + '/main.html');
});
var listener = app.listen(3000, () => {
	console.log('Swagrid présent sur le port ' + listener.address().port);
});

// ---
client.login((local ? require('./env.json') : process.env).TOKEN);