/**
 * @typedef {{url: string, title: string}} music
 */

const ytdl = require('ytdl-core');

/**
 * @class
 */
class Music {
	/**
	 * Ajoute une vidéo à la file d'attente. Joue la vidéo si la file est vide
	 * @param {string} url L'URL de la vidéo
	 * @param {string} title Le titre de la vidéo
	 */
	static add(url, title) {
		this._musics.push({url: url, title: title});
		if(this._status == 'stop')
			this._play();
	}
	/**
	 * @private
	 */
	static _play() {
		let song = this._musics.shift();
		this._status = 'play';
		this.playing = song;
		this._dispatcher = this.voiceConnection.playStream(ytdl(song.url, {
			seek: 0,
			volume: 1
		}));
		this._dispatcher.on('end', reason => {
			if(this._musics.length) {
				this._play();
			} else {
				this._status = 'stop';
				this.playing = null;
			}
		});
	}
	
	/**
	 * Annule la dernière action
	 */
	static cancel() {
		if(this._status == 'play') {
			if(this._musics.length) {
				this._musics.pop();
			} else {
				this._status = 'stop';
				this.playing = null;
				this._dispatcher.end();
			}
		}
	}
	
	/**
	 * Passe la vidéo en cours de lecture
	 */
	static skip() {
		if(this._status == 'play')
			this._dispatcher.end('_');
		if(this._musics.length)
			this._play();
	}
	
	/**
	 * Stoppe la vidéo en cours de lecture
	 */
	static stop() {
		this._status = 'stop';
		this.playing = null;
		this._dispatcher.end('_');
		this._musics = [];
	}

	/**
	 * Retourne le nom de la vidéo en cours de lecture
	 * @returns {string}
	 */
	static get playing() {
		return this._playing.title;
	}
	
	/**
	 * Retourne les musiques à lire, séparée par un retour à la ligne, en commencant par celle en cours de lecture
	 * @returns {string}
	 */
	static get playlist() {
		let musicNames = Array.from(this._musics);
		musicNames.push(this._playing);
		return musicNames.reduce(el => `${el.title}\n`);
	}
}
/**
 * @type {music[]}
 * @private
 */
Music._musics = [];
/**
 * @type {?Discord.VoiceChannel}
 */
Music.voiceChannel = null;
/**
 * @type {?Discord.VoiceConnection}
 */
Music.voiceConnection = null;
/**
 * @type {string}
 * @private
 */
Music._status = 'stop';
/**
 * @type {?Discord.StreamDispatcher}
 * @private
 */
Music._dispatcher = null;
/**
 * @type {music}
 * @private
 */
Music._playing = null;

module.exports = Music;