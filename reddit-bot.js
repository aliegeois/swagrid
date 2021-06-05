const Discord = require('discord.js'),
	Reddit = require('reddit'),
	express = require('express'),
	path = require('path'),
	config = require('./config.json');

const { Permission, CommandDispatcher, literal, argument } = require('./commandDispatcher');
const client = new Discord.Client({
	disabledEvents: ['TYPING_START']
});
const app = express();
const reddit = new Reddit({
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
	appId: process.env.REDDIT_APPID,
	appSecret: process.env.REDDIT_APPSECRET
});

const MAX_FORM_BODY = 2048;

/**
 * 
 * @param {number} number 
 * @param {number} length 
 * @returns 
 */
function padLeft(number, length) {
	return number.toString().padStart(length, 0);
}

/** @param {number} timestamp  */
function toDiscordTimestamp(timestamp) {
	const date = new Date(timestamp);
	return `${date.getUTCFullYear()}-${padLeft(date.getUTCMonth(), 2)}-${padLeft(date.getUTCDate(), 2)}T${padLeft(date.getUTCHours(), 2)}:${padLeft(date.getUTCMinutes(), 2)}:${padLeft(date.getUTCSeconds(), 2)}Z`;
}

function createResponse(post) {
	const response = {
		embed: {
			title: post.title,
			url: `https://www.reddit.com${post.permalink}`,
			timestamp: toDiscordTimestamp(post.created_utc),
			footer: {
				text: post.subreddit_name_prefixed
			},
			image: {
				url: post.url
			}
		}
	};
	if (post.selftext !== '') {
		let description;
		if (post.selftext.length >= MAX_FORM_BODY) {
			description = post.selftext.slice(0, MAX_FORM_BODY);
		} else {
			description = post.selftext;
		}
		response.embed.description = description;
	}
	
	return response;
}

const dispatcher = new CommandDispatcher();

// Random hot post
dispatcher.register(
	literal('rr').then(
		argument('subredditname', true).executes((source, ...args) => {
			return new Promise((resolve, reject) => {
				reddit.get(`/r/${args[0]}/hot`, {
					g: 'FR',
					limit: 1,
					sr_detail: false
				}).then(value => {
					source.message.channel.startTyping();

					const post = value.data.children[value.data.dist - 1].data;
					const response = createResponse(post);
					source.message.channel.send(response).then(resolve).catch(reject)
						.finally(source.message.channel.stopTyping());
				}).catch(reject);
			});
		}).description('Récupère un post dans un subreddit (hot)')
	)
);

// Random top all time post
dispatcher.register(
	literal('tr').then(
		argument('subredditname', true).executes((source, ...args) => {
			return new Promise((resolve, reject) => {
				reddit.get(`/r/${args[0]}/top`, {
					g: 'FR',
					limit: 1,
					sr_detail: false
				}).then(value => {
					source.message.channel.startTyping();

					const post = value.data.children[value.data.dist - 1].data;
					const response = createResponse(post);
					source.message.channel.send(response).then(resolve).catch(reject)
						.finally(source.message.channel.stopTyping());
				}).catch(reject);
			});
		})
	)
);

// Random new post
dispatcher.register(
	literal('nr').then(
		argument('subredditname', true).executes((source, ...args) => {
			return new Promise((resolve, reject) => {
				reddit.get(`/r/${args[0]}/new`, {
					g: 'FR',
					limit: 1,
					sr_detail: false
				}).then(value => {
					source.message.channel.startTyping();

					const post = value.data.children[value.data.dist - 1].data;
					const response = createResponse(post);
					source.message.channel.send(response).then(resolve).catch(reject)
						.finally(source.message.channel.stopTyping());
				}).catch(reject);
			});
		})
	)
);

dispatcher.register(
	literal('prefix').executes((source, ...args) => {
		// Affiche le préfix
	}).then(
		literal('set').then(
			argument('newprefix', true).executes((source, ...args) => {
				// Change le prefix
			}).description('Change le prefix du bot')
		)
	).description('Affiche le préfix du bot')
);

dispatcher.register(
	literal('help')
		.executes(source => {
			return new Promise((resolve, reject) => {
				let usableCommands = [];
				dispatcher.commands.forEach(command => usableCommands.push(...command.getUsages(config.prefix)));
				let descriptions = usableCommands
					.filter(({ command }) => Permission[command.getPermission()].checkPermission(source))
					.map(({ usage, description }) => `${usage}: ${description}`)
					.join('\n');
																																				
				source.message.channel.send(`Liste des commandes disponibles:\`\`\`${descriptions}\`\`\``) // TODO msg
					.then(resolve)
					.catch(reject);
			});
		})
);

client.on('ready', () => {
	console.log('Initialisation de Swagrid...');
	client.user.setActivity('de la magie', { type: 'WATCHING' });
	console.info('Prêt à défoncer des mères');
});

client.on('message', message => {
	if (message.author.bot)
		return;

	let content = message.content.trim();
	
	if (content.indexOf(config.prefix) !== 0 || content.length > 1 && content[1] === ' ') {
		return;
	}
	
	let command = content.slice(config.prefix.length);

	dispatcher.parse({ message: message }, command)
		.catch(err => {
			if (!(err instanceof CommandDispatcher.UnknownCommandError))
				message.channel.send('```' + err + '```').catch(() => {});
			console.error(err);
		});
});

app.use(express.static(`${path.resolve()}/public`));

const listener = app.listen(process.env.PORT, () => {
	console.info('Swagrid présent sur le port ' + listener.address().port);
});

process.on('SIGINT', () => {
	client.destroy();
	process.exit();
});

client.login(process.env.DISCORD_TOKEN);