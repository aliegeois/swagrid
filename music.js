const ytdl = require('ytdl-core');

/*	var Music = {
	musics: [],
	voiceChannel: null,
	voiceConnection: null,
	status: 'stop',
	dispatcher: null,
	playing: '',
	add: (url, title) => {
		Music.musics.push({url: url, title: title});
		if(Music.status == 'stop')
			Music.play();
	},
	play: () => {
		let song = Music.musics.splice(0, 1)[0];
		Music.status = 'play';
		Music.playing = song.title;
		Music.dispatcher = Music.voiceConnection.playStream(ytdl(song.url, {
			seek: 0,
			volume: 1
		}));
		Music.dispatcher.on('end', reason => {
			if(!reason) {
				if(Music.musics.length) {
					Music.play();
				} else {
					Music.status = 'stop';
					Music.playing = '';
				}
			}
		});
	},
	cancel: () => {
		if(Music.status == 'play') {
			if(Music.musics.length) {
				Music.musics.pop();
			} else {
				Music.status = 'stop';
				Music.playing = '';
				Music.dispatcher.end();
			}
		}
	},
	skip: () => {
		if(Music.status == 'play')
			Music.dispatcher.end('_');
		if(Music.musics.length)
			Music.play();
	},
	stop: () => {
		Music.status = 'stop';
		Music.playing = '';
		Music.dispatcher.end('_');
		Music.musics = [];
	},
	playlist: () => {
		return Music.musics;
	}
};*/

class Music {
	static add(url, title) {
		this._musics.push({url: url, title: title});
		if(this._status == 'stop')
			this.play();
	}
	
	static play() {
		let song = this._musics.splice(0, 1)[0];
		this._status = 'play';
		this._playing = song.title;
		this._dispatcher = this.voiceConnection.playStream(ytdl(song.url, {
			seek: 0,
			volume: 1
		}));
		this._dispatcher.on('end', reason => {
			if(!reason) {
				if(this._musics.length) {
					this.play();
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
			this.play();
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