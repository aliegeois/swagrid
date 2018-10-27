var local = typeof process.env.TOKEN === 'undefined';

const Discord = require('discord.js'),
	  config = require('./config.json'),
	  Sequelize = require('sequelize'),
	  env = local ? require('./env.json') : {},
	  search = require('youtube-api-v3-search'),
	  request = require('request-promise-native'),
	  parseString = require('xml2js').parseString,
	  ytdl = require('ytdl-core'),
	  express = require('express'),
	  //music = require('./music'),
	  app = express(),
	  client = new Discord.Client();

var poudlard,
	surveillants,
	prefets,
	sequelize,
	ytKey = (local ? env : process.env).YT;

var musics = [],
	voiceChannel = null,
	voiceConnection = null,
	status = 'stop',
	dispatcher = null,
	playing = '';

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

let add = (url, title) => {
	musics.push({url: url, title: title});
	if(status == 'stop')
		play();
}

let play = () => {
	let song = musics.splice(0, 1)[0];
	status = 'play';
	playing = song.title;
	dispatcher = voiceConnection.playStream(ytdl(song.url, {
		seek: 0,
		volume: 1
	}));
	dispatcher.on('end', reason => {
		if(!reason) {
			if(musics.length) {
				play();
			} else {
				status = 'stop';
				playing = '';
			}
		}
	});
}

let cancel = () => {
	if(status == 'play') {
		if(musics.length) {
			musics.pop();
		} else {
			status = 'stop';
			playing = '';
			dispatcher.end();
		}
	}
}

let skip = () => {
	if(status == 'play')
		dispatcher.end('_');
	if(musics.length)
		play();
}

let stop = () => {
	status = 'stop';
	playing = '';
	dispatcher.end('_');
	musics = [];
}

let playlist = () => {
	return musics;
}

class Command {
    constructor(permission, fct) {
        this.execute = (message, args) => {
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
Command.add = (name, permission, fct) => {
    Command.commands.set(name, new Command(permission, fct));
}
Command.execute = (name, message, args) => {
	var cmd = Command.commands.get(name);
	if(cmd) {
		return cmd.execute(message, args);
	} else {
		return new Promise((resolve, reject) => resolve());
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
        stop();
		resolve();
    });
});

Command.add('skip', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        skip();
		resolve();
    });
});

Command.add('playing', Permission.basic, (message, args) => {
    return new Promise((resolve, reject) => {
        if(playing == '') {
			message.reply('Aucune musique en cours de lecture');
		} else {
			message.reply(`"${playing}" est en cours de lecture`);
		}
		resolve();
    });
});

Command.add('play', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        if(voiceConnection == null) {
			reject('Swagrid n\'est pas dans un channel');
		} else if(message.member.voiceChannelID != voiceChannel.id) {
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
				
				add(res.items[0].id.videoId, res.items[0].snippet.title);
				
				resolve();
			}).catch(err => {
				reject(err);
			});
		}
    });
});

Command.add('cancel', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        cancel();
		resolve();
    });
});

Command.add('playlist', Permission.dj, (message, args) => {
    return new Promise((resolve, reject) => {
        message.reply(playlist());
		resolve();
    });
});

/*Command.add('search', Permission.expert, (message, args) => {
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
        }).catch(err => {
			reject(err);
		});
    });
});*/

/*Command.add('addtoplaylist', Permission.expert, (message, args) => {
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
});*/

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

/*Command.add('createplaylist', Permission.expert, (message, args) => {
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
});*/

/*Command.add('editplaylist', Permission.expert, (message, args) => {
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
});*/

/*Command.add('listplaylist', Permission.expert, (message, args) => {
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
});*/

Command.add('r34', Permission.basic, (message, args) => {
	return new Promise((resolve, reject) => {
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
							var post_number = Math.floor(Math.random()*count),
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

Command.add('yt', Permission.expert, (message, args) => {
	return new Promise((resolve, reject) => {
		if(music.voiceConnection == null) {
			reject('Swagrid n\'est pas dans un channel');
		} else if(message.member.voiceChannelID != music.voiceChannel.id) {
			message.reply('Petit boloss, arrête de mettre des sons si tu n\'es pas dans le channel');
			resolve();
		} else {
			search((local ? env : process.env).YT, {
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

				let dispatcher = music.voiceConnection.playStream(ytdl(res.items[0].id.videoId, {
					seek: 0,
					volume: 1
				}));
				resolve();
			}).catch((err) => {
				reject(err);
			});
		}
	});
}, false);

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
		console.log(err);
		if(err == 'Permission insuffisante')
			message.reply(err);
    });
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

app.get('/', (request, response) => {
	response.sendFile(`${__dirname}/index.html`);
});
app.get('/anime', (request, response) => {
	response.sendFile(`${__dirname}/anime`);
})
var listener = app.listen(3000, () => {
	console.log('Swagrid présent sur le port ' + listener.address().port);
});

client.login((local ? env : process.env).TOKEN);