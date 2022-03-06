const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { get: getImage } = require('./imageCache');

const canvas = createCanvas(174, 174);
const ctx = canvas.getContext('2d');

/* function getBackgroundUrl(rarity) {
	switch (rarity) {
	case 1:
		return 'https://i.imgur.com/1JqpsjR.png';
	case 2:
		return 'https://i.imgur.com/G2Rrk1T.png';
	case 3:
		return 'https://i.imgur.com/ZArETan.png';
	case 4:
		return 'https://i.imgur.com/aDprHe0.png';
	case 5:
		return 'https://i.imgur.com/ibYR7ME.png';
	}
}

function getFrameUrl(rarity) {
	switch (rarity) {
	case 1:
		return 'https://i.imgur.com/eTfyHMo.png';
	case 2:
		return 'https://i.imgur.com/gz4sSlo.png';
	case 3:
		return 'https://i.imgur.com/qXb8Tfk.png';
	case 4:
		return 'https://i.imgur.com/cvfWfuj.png';
	case 5:
		return 'https://i.imgur.com/XHcJVu6.png';
	}
}

function getStarUrl(rarity) {
	switch (rarity) {
	case 1:
		return 'https://i.imgur.com/oiEGcna.png';
	case 2:
		return 'https://i.imgur.com/nj5W8ku.png';
	case 3:
		return 'https://i.imgur.com/I7hLhbb.png';
	case 4:
		return 'https://i.imgur.com/4Su2LYH.png';
	case 5:
		return 'https://i.imgur.com/mm7gpra.png';
	}
}*/

function getBackgroundUrl(rarity) {
	return path.join(__dirname, '..', 'assets', `background-${rarity}.png`);
}

function getFrameUrl(rarity) {
	return path.join(__dirname, '..', 'assets', `frame-${rarity}.png`);
}

function getStarUrl(rarity) {
	return path.join(__dirname, '..', 'assets', `star-${rarity}.png`);
}

module.exports = {
	/**
	 * @param {string} baseImageURL
	 * @param {number} rarity
	 * @returns {Promise<string>}
	 */
	async createImage(baseImageURL, rarity) {
		return new Promise((resolve, reject) => {
			Promise.all([
				getImage(getBackgroundUrl(rarity)),
				loadImage(baseImageURL),
				getImage(getFrameUrl(rarity)),
				getImage(getStarUrl(rarity))
			]).then(([background, image, frame, star]) => {
				ctx.clearRect(0, 0, 174, 174);

				ctx.drawImage(background, 0, 0);
				ctx.drawImage(image, 10, 10, 154, 154);
				ctx.drawImage(frame, 0, 0);
				ctx.drawImage(star, 10, 128);

				const dataURL = canvas.toDataURL().split(',')[1];
				resolve(dataURL);
			}).catch(reject);
		});
	}
};