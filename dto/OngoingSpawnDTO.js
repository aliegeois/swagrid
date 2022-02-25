module.exports = class OngoingSpawnDTO {
	#channelId;
	#cardTemplateId;
	#messageId;

	/**
	 * @param {string} channelId
	 * @param {number} cardTemplateId
	 * @param {string} messageId
	 */
	constructor(channelId, cardTemplateId, messageId) {
		this.#channelId = channelId;
		this.#cardTemplateId = cardTemplateId;
		this.#messageId = messageId;
	}

	static get TABLE_NAME() {
		return 'ongoing_spawn';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new OngoingSpawnDTO(model.get('channel_id'), model.get('card_template_id'), model.get('message_id'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get channelId() {
		return this.#channelId;
	}

	get cardTemplateId() {
		return this.#cardTemplateId;
	}

	set cardTemplateId(cardTemplateId) {
		this.#cardTemplateId = cardTemplateId;
	}

	get messageId() {
		return this.#messageId;
	}

	set messageId(messageId) {
		this.#messageId = messageId;
	}

	toJSON() {
		return {
			channel_id: this.#channelId,
			card_template_id: this.#cardTemplateId,
			message_id: this.#messageId
		};
	}
};