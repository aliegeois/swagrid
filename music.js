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
		this._musics = [];
		/** @type {?Discord.VoiceChannel} */
		this.voiceChannel = null;
		/** @type {?Discord.VoiceConnection} */
		this.voiceConnection = null;
		/**
		 * @type {string}
		 * @private
		 */
		this._status = 'stop';
		/**
		 * @type {?Discord.StreamDispatcher}
		 * @private
		 */
		this._dispatcher = null;
		/**
		 * @type {music}
		 * @private
		 */
		this._playing = null;

		this._lastTime = -1;
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
		if (this.voiceChannel instanceof Discord.VoiceChannel)
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
		this._add({ type: 'music', title: title, url: url });
	}

	/**
	 * Ajoute un son custom à la file d'attente. Joue le son si la file est vide
	 * @param {string} name Nom du son
	 * @param {string} location Emplacement du son
	 */
	addSound(name, location) {
		this._add({ type: 'sound', title: name, url: location });
	}

	/**
	 * @param {music} music
	 * @private
	 */
	_add(music) {
		this._musics.push(music);
		if (this._status === 'stop')
			this._play();
	}

	/** @private */
	_play() {
		let song = this._musics.shift();
		this._status = 'play';
		this._playing = song;

		/** @param {string} reason */
		let end = reason => {
			switch (reason) {
				case 'Stream is not generating quickly enough.':
					console.log('Stream génère pas assez vite');
					break;
				default:
					console.log(`music ended with reason "${reason}"`);
			}

			if (this._musics.length) {
				this._play();
			} else {
				this._status = 'stop';
				this._playing = null;
			}
		};

		switch (song.type) {
			case 'music':
				// console.log('playStream', song);
				this._dispatcher = this.voiceConnection.play(ytdl(song.url, {
					filter: 'audio'
				}), {
					bitrate: 'auto'
				}).on('end', end);
				break;
			case 'sound':
				// console.log('playFile', song);
				this._dispatcher = this.voiceConnection.play(song.url).on('end', end);
				break;
			default:
				this._dispatcher = null;
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
		if (this._status === 'play') {
			if (this._musics.length) {
				this._musics.pop();
			} else {
				this._status = 'stop';
				this._playing = null;
				this._dispatcher.destroy('cancel');
			}
		}
	}

	/** Passe la vidéo en cours de lecture */
	skip() {
		if (this._status === 'play')
			this._dispatcher.destroy('skip');
		// if(this.__musics__.length) // Lecture automatique déjà faite dans l'event 'end'
		// 	this.__play__();
	}

	/** Stoppe la vidéo en cours de lecture */
	stop() {
		this._status = 'stop';
		this._playing = null;
		this._dispatcher.destroy('stop');
		this._musics = [];
	}

	/**
	 * Retourne le nom de la vidéo en cours de lecture
	 * @returns {string}
	 */
	get playing() {
		if (this._playing === null)
			return '';
		return this._playing.title;
	}

	/**
	 * Retourne les musiques à lire, séparée par un retour à la ligne, en commencant par celle en cours de lecture
	 * @returns {string}
	 */
	get playlist() {
		let musicNames = Array.from(this._musics);

		if (this._playing)
			musicNames.unshift(this._playing);

		return musicNames.reduce((acc, el) => `${acc}${el.title}\n`, '');
	}
};