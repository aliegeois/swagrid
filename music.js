const ytdl = require('ytdl-core');
class Music {
	static add(url, title) {
		this._musics.push({url: url, title: title});
		if(this._status == 'stop')
			this._play();
	}
	
	static _play() {
		let song = this._musics.splice(0, 1)[0];
		this._status = 'play';
		this._playing = song.title;
		this._dispatcher = this.voiceConnection.playStream(ytdl(song.url, {
			seek: 0,
			volume: 1
		}));
		this._dispatcher.on('end', reason => {
			if(reason == '_') {
				if(this._musics.length) {
					this._play();
				} else {
					this._status = 'stop';
					this._playing = '';
				}
			}
		});
	}
	
	static cancel() {
		if(this._status == 'play') {
			if(this._musics.length) {
				this._musics.pop();
			} else {
				this._status = 'stop';
				this._playing = '';
				this._dispatcher.end();
			}
		}
	}
	
	static skip() {
		if(this._status == 'play')
			this._dispatcher.end('_');
		if(this._musics.length)
			this._play();
	}
	
	static stop() {
		this._status = 'stop';
		this._playing = '';
		this._dispatcher.end('_');
		this._musics = [];
	}
	
	static get playlist() {
		return this._musics;
	}
}
Music._musics = [];
Music.voiceChannel = null;
Music.voiceConnection = null;
Music._status = 'stop';
Music._dispatcher = null;
Music._playing = '';

module.exports = Music;