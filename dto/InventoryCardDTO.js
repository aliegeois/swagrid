module.exports = class InventoryCardDTO {
	#userProfileId;
	#localId;
	#cardTemplateId;

	/**
	 * @param {string} userProfileId
	 * @param {number} localId
	 * @param {number} cardTemplateId
	 */
	constructor(userProfileId, localId, cardTemplateId) {
		this.#userProfileId = userProfileId;
		this.#localId = localId;
		this.#cardTemplateId = cardTemplateId;
	}

	static get TABLE_NAME() {
		return 'inventory_card';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new InventoryCardDTO(model.get('user_profile_id'), model.get('local_id'), model.get('card_template_id'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get userProfileId() {
		return this.#userProfileId;
	}

	get localId() {
		return this.#localId;
	}

	get cardTemplateId() {
		return this.#cardTemplateId;
	}

	set cardTemplateId(cardTemplateId) {
		this.#cardTemplateId = cardTemplateId;
	}

	toJSON() {
		return {
			user_profile_id: this.#userProfileId,
			local_id: this.#localId,
			card_template_id: this.#cardTemplateId
		};
	}
};