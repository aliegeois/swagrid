// Dependances
const Discord = require('discord.js'),
	Sequelize = require('sequelize'),
	search = require('youtube-api-v3-search'),
	request = require('request-promise-native'),
	parseString = require('xml2js').parseString,
	express = require('express'),
	ytdl = require('ytdl-core'),
	app = express();

const Music = require('./music');



module.exports = class Swagrid {
	/**
	 * @param {{prefix: string, owner: string}} config
	 * @param {{}|{TOKEN: string, YT: string}} env
	*/
	constructor(config, env) {
		this.__local = typeof process.env.TOKEN === 'undefined';
		/**
		 * @type {{prefix: string, owner: string}}
		 * @private
		*/
		this.__config = config;
		/** @private */
		this.__client = new Discord.Client({
			disabledEvents: ['TYPING_START']
		});
		/**
		 * @type {{}|{TOKEN: string, YT: string}}
		 * @private
		 * */
		this.__env = env;
		/**
		 * @type {Discord.Guild[]}
		 * @private
		 */
		this.__servers = [];
		/**
		 * @type {Music}
		 * @private
		 */
		this.__music = new Music();

		this.__dispatcher = {};
	}

	on(event, listener) {
		switch(event) {
		case 'ready':
		case 'message':
		case 'messageReactionAdd':
		case 'messageReactionRemove':
		case 'voiceStateUpdate':
			this.__client.on(event, listener);
			break;
		default:
			throw new Error('unknow/unsupported event');
		}
	}

	start() {
		this.__client.login((this.__local ? this.__env : process.env).TOKEN);
	}
	
};