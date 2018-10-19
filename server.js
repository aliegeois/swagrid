var local = typeof process.env.TOKEN === 'undefined';

const Discord = require('discord.js'),
	  config = require('./config.json'),
	  Sequelize = require('sequelize'),
	  env = local ? require('./env.json') : {},
	  search = require('youtube-api-v3-search'),
	  ytdl = require('ytdl-core'),
	  express = require('express'),
	  app = express(),
	  client = new Discord.Client();

var poudlard,
	surveillants,
	prefets,
	sequelize,
	
	voiceChannel = null,
	voiceConnection = null,
	ytKey = (local ? env : process.env).YT;

var User,
	Playlist,
	Link;

var Permission = {
	basic: {
		check_permission: (userID) => { // Tout le monde
			return true;
		}
	},
	advanced: {
		check_permission: (userID) => { // Surveillants
			return surveillants.members.find(e => e.user.id == userID);
		}
	},
	dj: {
		check_permission: (userID) => { // Surveillants ou préfets
			return surveillants.members.find(e => e.user.id == userID) || prefets.members.find(e => e.user.id == userID);
		}
	},
	expert: {
		check_permission: (userID) => { // Nero
			return userID == config.owner;
		}
	}
};

var Music = {
	musics: [],
	status: 'stop',
	dispatcher: null,
	playing: '',
	add: (url, title) => {
		Music.musics.push({url: url, title: title});
		if(Music.status == 'stop')
			Music.play();
	},
	play: () => {
		let music = Music.musics.splice(0, 1)[0];
		Music.status = 'play';
		Music.playing = music.title;
		Music.dispatcher = voiceConnection.playStream(ytdl(music.url, {
			seek: 0,
			volume: 1
		}));
		Music.dispatcher.on('end', reason => {
			if(!reason) {
				if(Music.musics.length) {
					Music.play();
				} else {
					Music.status = 'stop';
					Music.playing = '';
				}
			}
		});
	},
	cancel: () => {
		if(Music.status == 'play') {
			if(Music.musics.length) {
				Music.musics.pop();
			} else {
				Music.status = 'stop';
				Music.playing = '';
				Music.dispatcher.end();
			}
		}
	},
	skip: () => {
		if(Music.status == 'play')
			Music.dispatcher.end('_');
		if(Music.musics.length)
			Music.play();
	},
	stop: () => {
		Music.status = 'stop';
		Music.playing = '';
		Music.dispatcher.end('_');
		Music.musics = [];
	},
	playlist: () => {
		return Music.musics;
	}
};

class Command {
    constructor(permission, fct) {
        this.execute = function(message, args) {
            return new Promise((resolve, reject) => {
                if(permission.check_permission(message.author.id)) {
					fct(message, args).then(() => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    })
                } else {
                    reject('Permission insuffisante');
                }
            });
        };
    }
}

Command.commands = new Map();
Command.add = function(name, permission, fct) {
    Command.commands.set(name, new Command(permission, fct));
}
Command.execute = function(name, message, args) {
	var cmd = Command.commands.get(name);
	if(cmd) {
		return cmd.execute(message, args);
	} else {
		return new Promise((resolve, reject) => reject(`Comande inconnue "${name}"`));
	}
}

Command.add('say', Permission.advanced, (message, args) => {
    return new Promise((resolve, reject) => {
        message.delete().catch(_ => {});
		message.channel.send(args.join(' '));
		resolve();
    });
});

Command.add('tts', Permission.advanced, (message, args) => {
    return new Promise((resolve, reject) => {
        message.delete().catch(_ => {});
		message.channel.send(args.join(' '), {tts: true});
		resolve();
    });
});

Command.add('join', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        voiceChannel = poudlard.channels.get(message.member.voiceChannelID);
		voiceChannel.join().then(connection => {
			voiceConnection = connection;
			resolve();
		}).catch(err => {
			voiceChannel = null;
			voiceConnection = null;
			reject(err);
		});
    });
});

Command.add('leave', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        voiceChannel.leave();
		voiceChannel = null;
		voiceConnection = null;
		resolve();
    });
});

Command.add('stop', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        Music.stop();
		resolve();
    });
});

Command.add('skip', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        Music.skip();
		resolve();
    });
});

Command.add('playing', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        if(Music.playing == '') {
			message.reply('Aucune musique en cours de lecture');
		} else {
			message.reply(`"${Music.playing}" est en cours de lecture`);
		}
    });
});

Command.add('play', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        if(voiceConnection == null) {
			reject('Swagrid n\'est pas dans un channel');
		} else if(message.member.voiceChannelID != voiceChannel.id) {
			message.reply('Petit boloss, arrête de mettre des sons si tu n\'es pas dans le channel');
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
});

Command.add('cancel', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        Music.cancel();
    });
});

Command.add('playlist', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        message.reply(Music.playlist());
    });
});

Command.add('search', Permission.expert, (message, args) => {
    return new Promise((resolve, reject) => {
        search((local ? env : process.env).YT, {
            q: args.join(' '),
            maxResults: 1,
            part: 'snippet',
            type: 'video'
        }).then(res => {
            message.channel.send(`Recherche de \`${args.join(' ')}\``, new Discord.RichEmbed({
                thumbnail: {
                    url: `https://img.youtube.com/vi/${res.items[0].id.videoId}/hqdefault.jpg`
                },
                title: `${res.items[0].snippet.title}`,
                url: `https://youtu.be/${res.items[0].id.videoId}/`
            }));
            User.update({
                lastVideoSearched: res.items[0].id.videoId
            }, {
                where: {
                    id: message.author.id
                }
            }).then(() => {
                resolve();
            }).catch(err => {
                console.error('Erreur dans l\'update');
                reject(err);
            });
        });
    });
});

Command.add('addtoplaylist', Permission.expert, (message, args) => {
    return new Promise((resolve, reject) => {
        User.findAll({
            where: {
                id: message.author.id
            }
        }).then(data => {
            console.log(`addtoplaylist, data length: ${data.length}`);
            if(data[0].activePlaylist && data[0].lastVideoSearched) {
                Playlist.findAll({
                    where: {
                        name: data[0].activePlaylist,
                        user_id: message.author.id
                    }
                }).then(d2 => {
                    Link.create({
                        value: data[0].lastVideoSearched,
                        playlist_name: data[0].activePlaylist,
                        playlist_user_id: message.author.id
                    }).then(() => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    })
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve();
            }
        }).catch(err => {
            reject(err);
        });
    });
});

Command.add('init', Permission.expert, (message, args) => {
    return new Promise((resolve, reject) => {
        User.create({
            id: message.author.id
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(err);
        })
    });
});

Command.add('createplaylist', Permission.expert, (message, args) => {
    return new Promise((resolve, reject) => {
        let name = args.join(' ').trim();
        if(name == '') {
            message.reply('Veuillez entrer un nom de playlist').then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        } else {
            Playlist.create({
                name: args.join(' '),
                user_id: message.author.id
            }).then(() => {
                User.update({
                    activePlaylist: args.join(' ')
                }, {
                    where: {
                        id: message.author.id
                    }
                }).then(() => {
                    message.reply(`playlist "${name}" créée`).then(() => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    })
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        }
    });
});

Command.add('editplaylist', Permission.expert, (message, args) => {
    return new Promise((resolve, reject) => {
        let name = args.join(' ').trim();
        if(name == '') {
            message.reply('Veuillez entrer un nom de playlist').then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        } else {
            Playlist.findAll({
                where: {
                    name: args[0],
                    user_id: message.author.id
                }
            }).then(data => {
                console.log(`editplaylist, data length: ${data.length}`);
                User.update({
                    activePlaylist: data[0].name
                }, {
                    where: {
                        id: message.author.id
                    }
                }).then(() => {
                    message.reply(`playlist en cours d\'édition: ${data[0].name}`);
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            });
        }
    });
});

Command.add('listplaylist', Permission.expert, (message, args) => {
    return new Promise((resolve, reject) => {
        let name = args.join(' ').trim();
        if(name == '') {
            message.reply('Veuillez entrer un nom de playlist').then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        } else {
            Playlist.findAll({
                where: {
                    name: name,
                    user_id: message.author.id
                }
            }).then(data => {
                message.reply(JSON.stringify(data)).then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        }
    });
});

Command.add('r34', Permission.expert, (message, args) => {
	return new Promise((resolve, reject) => {
		/*let init = {
			method: 'GET',
			mode: 'cors'
		};
		fetch(`https://rule34.xxx/index.php?page=dapi&s=post&q=index&limit=1&tags=${args.join('_')}`, init).then(content => {
			message.reply(`content: ${content}`);
			let doc = new DOMParser().parseFromString(content, 'text/xml');
			message.reply(`doc: ${doc}`);
			resolve();
		}).catch(err => {
			message.reply(`error: ${err}`);
			reject(err);
		});*/
		let req = new XMLHttpRequest();
		req.onreadystatechange = function(event) {
			if(this.readyState === XMLHttpRequest.DONE && this.status == 200) {
				console.log(`réponse: ${this.responseXML}`);
			}
		}
		
		req.open('GET', `https://rule34.xxx/index.php?page=dapi&s=post&q=index&limit=1&tags=${args.join('_')}`);
		req.send(null);
		
    });
});

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
});

function updateRoles(messageReaction, user, action) {
    return new Promise((resolve, reject) => {
        if(messageReaction.message.id != '472082352177283074') {
            resolve();
        }
        
        let guildMember = poudlard.members.get(user.id);
        
        for(let i in roles)
            if(messageReaction.emoji.name == roles[i].emoji)
                guildMember[action ? 'addRole' : 'removeRole'](roles[i].name);
    });
}

function resetDB(tables) {
    if(tables.includes('user'))
        User.sync({force: true});
    if(tables.includes('playlist'))
        Playlist.sync({force: true});
    if(tables.includes('link'))
        Link.sync({force: true});
}

client.on('ready', () => {
    console.log('Initialisation de Swagrid...');
    
    client.user.setActivity('de la magie', {type: 'WATCHING'});
    
    poudlard = client.guilds.get('307821648835248130');
    surveillants = poudlard.roles.get('469496344558698506');
	prefets = poudlard.roles.get('501438461341990913');
	
	client.channels.get('442762703958835200').fetchMessages(); // Récupère les messages du règlement intérieur
    
    console.log('Started');
});

client.on('message', message => {
    if(message.author.bot)
        return;
    
    if(message.content.indexOf(config.prefix) !== 0)
        return;
    
	/*if(!(message.channel instanceof Discord.TextChannel))
		if(!Permission.expert.check_permission(message.author.id))
			return;*/
	
    var args = message.content.slice(config.prefix.length).trim().split(/ +/g),
        name = args.shift().toLowerCase();
    
    Command.execute(name, message, args).catch(err => {
        message.reply(err);
    });
});

client.on('voiceStateUpdate', (oldmember, newmember) => {
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
				voiceChannel = newmember.voiceChannel;
				poudlard.voiceConnection;
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
    console.log('Authentication success');
    
    User = sequelize.define('user', {
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
    });
    
    //resetDB(['user', 'playlist', 'link']);
}).catch(err => {
    console.error(err);
});

app.get('/', function(request, response) {
	response.sendFile(__dirname + '/index.html');
});
var listener = app.listen(3000, () => {
	console.log('Swagrid présent sur le port ' + listener.address().port);
});

client.login((local ? env : process.env).TOKEN);