module.exports = class AbstractCardDTO {
	#name;
	#imageURL;
	#rarity;

	/**
	 * @param {string} imageURL
	 * @param {string} name
	 * @param {number} rarity
	 */
	constructor(name = null, imageURL = null, rarity = null) {
		this.#name = name;
		this.#imageURL = imageURL;
		this.#rarity = rarity;
	}

	get name() {
		return this.#name;
	}

	set name(name) {
		if (name >= 256) {
			throw new Error('Le nom de la carte doit faire moins de 256 caractères !');
		}
		this.#name = name;
	}

	get imageURL() {
		return this.#imageURL;
	}

	set imageURL(imageURL) {
		if (imageURL.length >= 256) {
			throw new Error('L\'URL doit faire moins de 256 caractères !');
		}
		this.#imageURL = imageURL;
	}

	get rarity() {
		return this.#rarity;
	}

	/** @param {number} rarity */
	set rarity(rarity) {
		if (rarity < 1 || rarity > 5) {
			throw new Error(`La rareté ne peut pas être inférieure à 1 ou supérieure à 5 (valeur: ${rarity})`);
		}
		this.#rarity = rarity;
	}
};