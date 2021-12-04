const AbstractCardDTO = require('./AbstractCardDTO');

module.exports = class ValidatedSuggestionDTO extends AbstractCardDTO {
	#messageId;

	/**
	 * @param {number} messageId
	 * @param {string} name
	 * @param {string} imageURL
	 * @param {number} rarity
	 */
	constructor(messageId, name, imageURL, rarity) {
		super(name, imageURL, rarity);
		this.#messageId = messageId;
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new ValidatedSuggestionDTO(model.get('message_id'), model.get('name'), model.get('image_url'), model.get('rarity'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get messageId() {
		return this.#messageId;
	}

	toString() {
		return JSON.stringify({
			name: this.name,
			imageURL: this.imageURL,
			rarity: this.rarity,
			messageId: this.messageId
		});
	}
};