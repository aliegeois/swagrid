module.exports = class BaseDTO {
	#createdAt;
	#updatedAt;

	/**
	 * @param {string} name
	 * @param {string} imageURL
	 */
	constructor(createdAt = null, updatedAt = null) {
		this.#createdAt = createdAt;
		this.#updatedAt = updatedAt;
	}

	get name() {
		return this.#createdAt;
	}

	set name(name) {
		if (name >= 256) {
			throw new Error('Le nom de la carte doit faire moins de 256 caractères !');
		}
		this.#createdAt = name;
	}

	get imageURL() {
		return this.#updatedAt;
	}

	set imageURL(imageURL) {
		if (imageURL.length >= 256) {
			throw new Error('L\'URL doit faire moins de 256 caractères !');
		}
		this.#updatedAt = imageURL;
	}

	toJSON() {
		return {
			createdAt: this.#createdAt,
			updatedAt: this.#updatedAt
		};
	}
};