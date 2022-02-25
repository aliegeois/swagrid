module.exports = class GuildConfigDTO {
	#id;
	#spawnChannelId;
	#reviewSuggestionChannelId;
	#approvedCardsChannelId;

	/**
	 * @param {string} id
	 * @param {string} spawnChannelId
	 * @param {string} reviewSuggestionChannelId
	 * @param {string} approvedCardsChannelId
	 */
	constructor(id, spawnChannelId = null, reviewSuggestionChannelId = null, approvedCardsChannelId = null) {
		this.#id = id;
		this.#spawnChannelId = spawnChannelId;
		this.#reviewSuggestionChannelId = reviewSuggestionChannelId;
		this.#approvedCardsChannelId = approvedCardsChannelId;
	}

	static get TABLE_NAME() {
		return 'guild_config';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new GuildConfigDTO(model.get('id'), model.get('spawn_channel_id'), model.get('review_suggestion_channel_id'), model.get('approved_cards_channel_id'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get id() {
		return this.#id;
	}

	get spawnChannelId() {
		return this.#spawnChannelId;
	}

	set spawnChannelId(spawnChannelId) {
		this.#spawnChannelId = spawnChannelId;
	}

	get reviewSuggestionChannelId() {
		return this.#reviewSuggestionChannelId;
	}

	set reviewSuggestionChannelId(reviewSuggestionChannelId) {
		this.#reviewSuggestionChannelId = reviewSuggestionChannelId;
	}

	get approvedCardsChannelId() {
		return this.#approvedCardsChannelId;
	}

	set approvedCardsChannelId(approvedCardsChannelId) {
		this.#approvedCardsChannelId = approvedCardsChannelId;
	}

	toJSON() {
		return {
			id: this.#id,
			spawn_channel_id: this.#spawnChannelId,
			review_suggestion_channel_id: this.#reviewSuggestionChannelId,
			approved_cards_channel_id: this.#approvedCardsChannelId
		};
	}
};