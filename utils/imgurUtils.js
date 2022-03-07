const FormData = require('form-data');
const { default: fetch, Headers } = require('node-fetch');

module.exports = {
	/**
	 * @param {string} name
	 * @param {string} image
	 * @returns {Promise<string>}
	 */
	async uploadImage(name, image) {
		const headers = new Headers();
		headers.append('Authorization', `Client-ID ${process.env.IMGUR_CLIENTID}`);

		const body = new FormData();
		body.append('image', image);
		body.append('album', process.env.IMGUR_ALBUM_HASH);
		body.append('type', 'base64');
		body.append('name', name);

		return fetch('https://api.imgur.com/3/image', {
			method: 'POST',
			headers,
			body,
			redirect: 'follow'
		}).then(res => res.json()).then(res => {
			return res.data.link;
		});
	}
};