const AbstractCardDTO = require('./AbstractCardDTO');

module.exports = class CardSuggestionDTO extends AbstractCardDTO {
	#messageId;
	#userId;

	/**
	 * @param {string} messageId
	 * @param {string} userId
	 * @param {string} name
	 * @param {string} imageURL
	 * @param {number} rarity
	 */
	constructor(messageId, userId, name, imageURL, rarity) {
		super(name, imageURL, rarity);
		this.#messageId = messageId;
		this.#userId = userId;
	}

	static get TABLE_NAME() {
		return 'card_suggestion';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new CardSuggestionDTO(model.get('message_id'), model.get('user_id'), model.get('name'), model.get('image_url'), model.get('rarity'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get messageId() {
		return this.#messageId;
	}

	get userId() {
		return this.#userId;
	}

	toJSON() {
		return {
			...super.toJSON(),
			message_id: this.messageId,
			user_id: this.#userId
		};
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
};