const { loadImage } = require('canvas');

/** @type {Map<string, import('canvas').Image>} */
const images = new Map();

module.exports = {
	/** @param {string} url */
	async get(url) {
		if (!images.has(url)) {
			images.set(url, await loadImage(url));
		}
		return images.get(url);
	},

	invalidate() {
		images.clear();
	}
};