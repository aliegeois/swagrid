const ytdl = require('ytdl-core');
const Discord = require('discord.js');

/** @typedef {{url: string, title: string}} music */
/** @class */
module.exports = class Music {
	constructor() {
		/**
		 * @type {music[]}
		 * @private
		 */
		this.__musics = [];
		/** @type {?Discord.VoiceChannel} */
		this.voiceChannel = null;
		/** @type {?Discord.VoiceConnection} */
		this.voiceConnection = null;
		/**
		 * @type {string}
		 * @private
		 */
		this.__status = 'stop';
		/**
		 * @type {?Discord.StreamDispatcher}
		 * @private
		 */
		this.__dispatcher = null;
		/**
		 * @type {music}
		 * @private
		 */
		this.__playing = null;
	}

	/**
	 * Ajoute une vidéo à la file d'attente. Joue la vidéo si la file est vide
	 * @param {string} url L'URL de la vidéo
	 * @param {string} title Le titre de la vidéo
	 */
	add(url, title) {
		this.__musics.push({url: url, title: title});
		if(this.__status == 'stop')
			this._play();
	}

	/** @private */
	_play() {
		/** @type {music} */
		let song = this.__musics.shift();
		this.__status = 'play';
		this.__playing = song;
		this.__dispatcher = this.voiceConnection.playStream(ytdl(song.url, {
			seek: 0,
			volume: 1
		}));
		this.__dispatcher.on('end', reason => {
			if(this.__musics.length) {
				this._play();
			} else {
				this.__status = 'stop';
				this.__playing = null;
			}
		});
	}
	
	/** Annule la dernière action */
	cancel() {
		if(this.__status == 'play') {
			if(this.__musics.length) {
				this.__musics.pop();
			} else {
				this.__status = 'stop';
				this.__playing = null;
				this.__dispatcher.end();
			}
		}
	}
	
	/** Passe la vidéo en cours de lecture */
	skip() {
		if(this.__status == 'play')
			this.__dispatcher.end('_');
		if(this.__musics.length)
			this._play();
	}
	
	/** Stoppe la vidéo en cours de lecture */
	stop() {
		this.__status = 'stop';
		this.__playing = null;
		this.__dispatcher.end('_');
		this.__musics = [];
	}

	/**
	 * Retourne le nom de la vidéo en cours de lecture
	 * @returns {string}
	 */
	get playing() {
		return this.__playing.title;
	}
	
	/**
	 * Retourne les musiques à lire, séparée par un retour à la ligne, en commencant par celle en cours de lecture
	 * @returns {string}
	 */
	get playlist() {
		/** @type {music[]} */
		let musicNames = Array.from(this.__musics);
		musicNames.push(this.__playing);
		return musicNames.reduce(el => `${el.title}\n`);
	}
};