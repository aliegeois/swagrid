const ValidatedSuggestionDTO = require('./ValidatedSuggestionDTO');

module.exports = class TemporaryCardSuggestionDTO extends ValidatedSuggestionDTO {

	/**
	 * @param {string} messageId
	 * @param {string} name
	 * @param {string} imageURL
	 * @param {number} rarity
	 */
	constructor(messageId, name, imageURL, rarity) {
		super(messageId, name, imageURL, rarity);
	}

	static modelToClass(model) {
		return new TemporaryCardSuggestionDTO(model.get('message_id'), model.get('name'), model.get('image_url'), model.get('rarity'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}
};