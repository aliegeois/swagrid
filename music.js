const ytdl = require('ytdl-core');
//const ytdl = require('ytdl-core-discord');
const Discord = require('discord.js');

/** @typedef {{type: string, title: string, url: string}} music */
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
	 * Fait rejoindre un channel vocal
	 * @param {Discord.VoiceChannel} voiceChannel Le channel vocal à rejoindre
	 * @returns {Promise<Discord.VoiceConnection>}
	 */
	join(voiceChannel) {
		return new Promise((resolve, reject) => {
			this.voiceChannel = voiceChannel;
			this.voiceChannel.join()
				.then(connection => {
					this.voiceConnection = connection;
					resolve(connection);
				}).catch(err => {
					this.voiceChannel = null;
					this.voiceConnection = null;
					reject(err);
				});
		});
	}

	/** Fait quitter le channel vocal */
	leave() {
		if(this.voiceChannel instanceof Discord.VoiceChannel)
			this.voiceChannel.leave();
		this.voiceChannel = null;
		this.voiceConnection = null;
	}

	/**
	 * Ajoute une vidéo à la file d'attente. Joue la vidéo si la file est vide
	 * @param {string} url L'URL de la vidéo
	 * @param {string} title Le titre de la vidéo
	 */
	addMusic(url, title) {
		this.__add__({ type: 'music', title: title, url: url });
	}

	/**
	 * Ajoute un son custom à la file d'attente. Joue le son si la file est vide
	 * @param {string} name Nom du son
	 * @param {string} location Emplacement du son
	 */
	addSound(name, location) {
		this.__add__({ type: 'sound', title: name, url: location });
	}

	/**
	 * @param {music} music
	 * @private
	 */
	__add__(music) {
		this.__musics__.push(music);
		if(this.__status__ === 'stop')
			this.__play__();
	}

	/** @private */
	__play__() {
		let song = this.__musics__.shift();
		this.__status__ = 'play';
		this.__playing__ = song;

		/** @param {string} reason */
		let end = reason => {
			switch(reason) {
			case 'Stream is not generating quickly enough.':
				console.log('Stream génère pas assez vite');
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
		};

		switch(song.type) {
		case 'music':
			// console.log('playStream', song);
			this.__dispatcher__ = this.voiceConnection.playStream(ytdl(song.url, {
				filter: 'audio'
			}), {
				bitrate: 'auto'
			}).on('end', end);
			break;
		case 'sound':
			// console.log('playFile', song);
			this.__dispatcher__ = this.voiceConnection.playFile(song.url).on('end', end);
			break;
		default:
			this.__dispatcher__ = null;
			end('_');
			console.log('error type music');
		}

		/*this.__dispatcher__ = this.voiceConnection.playStream(ytdl(song.url, {
			filter: 'audio'
		}), {
			seek: 0,
			volume: 1
		}).on('end', reason => {
			
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
				this.__dispatcher__.end('cancel');
			}
		}
	}
	
	/** Passe la vidéo en cours de lecture */
	skip() {
		if(this.__status__ === 'play')
			this.__dispatcher__.end('skip');
		if(this.__musics__.length)
			this.__play__();
	}
	
	/** Stoppe la vidéo en cours de lecture */
	stop() {
		this.__status__ = 'stop';
		this.__playing__ = null;
		this.__dispatcher__.end('stop');
		this.__musics__ = [];
	}

	/**
	 * Retourne le nom de la vidéo en cours de lecture
	 * @returns {string}
	 */
	get playing() {
		if(this.__playing__ === null)
			return 'Rien ne joue';
		return this.__playing__.title;
	}
	
	/**
	 * Retourne les musiques à lire, séparée par un retour à la ligne, en commencant par celle en cours de lecture
	 * @returns {string}
	 */
	get playlist() {
		let musicNames = Array.from(this.__musics__);

		if(this.__playing__)
			musicNames.push(this.__playing__);

		return musicNames.reduce((acc, el) => `${acc}${el.title}\n`, '');
	}
};