//const ytdl = require('ytdl-core');
const ytdl = require('ytdl-core-discord');
const Discord = require('discord.js');

/** @typedef {{url: string, title: string}} music */
/** @class */
module.exports = class Music {
	constructor() {
		/**
		 * @type {music[]}
		 * @private
		 */
		this.__musics__ = [];
		/** @type {?Discord.VoiceChannel} */
		this.voiceChannel = null;
		/** @type {?Discord.VoiceConnection} */
		this.voiceConnection = null;
		/**
		 * @type {string}
		 * @private
		 */
		this.__status__ = 'stop';
		/**
		 * @type {?Discord.StreamDispatcher}
		 * @private
		 */
		this.__dispatcher__ = null;
		/**
		 * @type {music}
		 * @private
		 */
		this.__playing__ = null;

		this.__lastTime__ = -1;
	}

	/**
	 * Ajoute une vidéo à la file d'attente. Joue la vidéo si la file est vide
	 * @param {string} url L'URL de la vidéo
	 * @param {string} title Le titre de la vidéo
	 */
	add(url, title) {
		this.__musics__.push({url: url, title: title});
		if(this.__status__ == 'stop')
			this.__play__();
	}

	/** @private */
	__play__() {
		/** @type {music} */
		let song = this.__musics__.shift();
		this.__status__ = 'play';
		this.__playing__ = song;
		ytdl(song.url).then(stream => {
			//console.log('stream', stream);
			this.__dispatcher__ = this.voiceConnection.playOpusStream(stream);
			this.__dispatcher__.on('end', reason => {
				switch(reason) {
				case '_': // Arrêt manuel
					break;
				case 'Stream is not generating quickly enough.':
					console.log('Stream génère pas assez vite');
					/*this.__musics__.unshift(song);
					this.__lastTime__ = this.__dispatcher__.time;
					this.__play__();*/
					break;
				default:
					console.log(`music ended with reason "${reason}"`);
				}
				
				if(this.__musics__.length) {
					this.__play__();
				} else {
					this.__status__ = 'stop';
					this.__playing__ = null;
				}
			});
		}).catch(console.log);
		/*this.__dispatcher__ = this.voiceConnection.playStream(ytdl(song.url, {
			filter: 'audioonly'
		}), {
			seek: 0,
			volume: 1
		});*/
	}
	
	/** Annule la dernière action */
	cancel() {
		if(this.__status__ === 'play') {
			if(this.__musics__.length) {
				this.__musics__.pop();
			} else {
				this.__status__ = 'stop';
				this.__playing__ = null;
				this.__dispatcher__.end();
			}
		}
	}
	
	/** Passe la vidéo en cours de lecture */
	skip() {
		if(this.__status__ === 'play')
			this.__dispatcher__.end('_');
		if(this.__musics__.length)
			this.__play__();
	}
	
	/** Stoppe la vidéo en cours de lecture */
	stop() {
		this.__status__ = 'stop';
		this.__playing__ = null;
		this.__dispatcher__.end('_');
		this.__musics__ = [];
	}

	/**
	 * Retourne le nom de la vidéo en cours de lecture
	 * @returns {string}
	 */
	get playing() {
		return this.__playing__.title;
	}
	
	/**
	 * Retourne les musiques à lire, séparée par un retour à la ligne, en commencant par celle en cours de lecture
	 * @returns {string}
	 */
	get playlist() {
		/** @type {music[]} */
		let musicNames = Array.from(this.__musics__);

		musicNames.push(this.__playing__);

		return musicNames.reduce((total, el) => `${total}${el.title}\n`);
	}
};