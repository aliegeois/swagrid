const AbstractCardDTO = require('./AbstractCardDTO');

module.exports = class CardTemplateDTO extends AbstractCardDTO {
	#id;

	/**
	 * @param {number} id
	 * @param {string} imageURL
	 * @param {string} name
	 * @param {number} rarity
	 */
	constructor(id, name = null, imageURL = null, rarity = null) {
		super(name, imageURL, rarity);
		this.#id = id;
	}

	static get TABLE_NAME() {
		return 'card_template';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new CardTemplateDTO(model.get('id'), model.get('name'), model.get('image_url'), model.get('rarity'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get id() {
		return this.#id;
	}

	toJSON() {
		return {
			...super.toJSON(),
			id: this.#id
		};
	}
};