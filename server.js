var Discord = require('discord.js'),
    config = require('./config.json'),
    env = require('./env.json'),
    Sequelize = require('sequelize'),
    search = require('youtube-api-v3-search'),/*
    http = require('http'),
	express = require('express'),*/
    client = new Discord.Client();

var poudlard,
    surveillants,
    sequelize;

var User,
    Playlist,
    Link;

var local = true;

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
	expert: {
		check_permission: (message) => { // Moi
			return message.author.id == config.owner;
		}
	}
};

/* Exemple
Command.add('createplaylist', Permission.advanced, (message, args) => {
    return new Promise((resolve, reject) => {
        
    });
});
*/

class Command {
    constructor(permission, fct) {
        this.execute = function(message, args) {
            return new Promise((resolve, reject) => {
                if(permission.check_permission(message.author.id)) {
                    fct(message, args).then(() => {
                        resolve()
                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    reject('Permission insuffisante')
                }
            })
        }
    }
}

Command.commands = new Map();
Command.add = function(name, permission, fct) {
    Command.commands.set(name, new Command(permission, fct));
}
Command.execute = function(name, message, args) {
    return Command.commands.get(name).execute(message, args);
}

Command.add('test', Permission.expert, (message, args) => {
    return new Promise((resolve, reject) => {
        message.reply(args).then(() => {
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
});

Command.add('search', Permission.advanced, (message, args) => {
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

Command.add('addtoplaylist', Permission.advanced, (message, args) => {
    console.log('...');
    User.findAll({
		where: {
			id: message.author.id
		}
	}).then(data => {
        message.reply(JSON.stringify(data));
    }).catch(err => {
        reject(err);
    });
});

Command.add('createplaylist', Permission.advanced, (message, args) => {
    return new Promise((resolve, reject) => {
        
    });
});

function updateRoles(messageReaction, user, action) {
    return new Promise((resolve, reject) => {
        if (messageReaction.message.id != '472082352177283074') {
            resolve();
        }
        
        let guildMember = poudlard.members.get(user.id);
        
        for (let i in roles)
            if (messageReaction.emoji.name == roles[i].emoji)
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
    
    console.log(':\')');
});

client.on('message', message => {
    if(message.author.bot)
        return;
    
    if(message.content.indexOf(config.prefix) !== 0)
        return;
    
    var args = message.content.slice(config.prefix.length).trim().split(/ +/g),
        name = args.shift().toLowerCase();
    
    Command.execute(name, message, args).catch(err => {
        message.reply(`Erreur: ${err}`);
    });
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
        lastVideoSearched: {
            type: Sequelize.CHAR(11)
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
    
    resetDB(['user', 'playlist', 'link']);
}).catch(err => {
    console.error(err);
});

client.login((local ? env : process.env).TOKEN);