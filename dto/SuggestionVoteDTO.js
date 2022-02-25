module.exports = class SuggestionVoteDTO {
	#userId;
	#cardSuggestionId;
	#positiveVote;

	/**
	 * @param {string} userId
	 * @param {string} cardSuggestionId
	 * @param {boolean} positiveVote
	 */
	constructor(userId, cardSuggestionId, positiveVote) {
		this.#userId = userId;
		this.#cardSuggestionId = cardSuggestionId;
		this.#positiveVote = positiveVote;
	}

	static get TABLE_NAME() {
		return 'suggestion_vote';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new SuggestionVoteDTO(model.get('user_id'), model.get('card_suggestion_id'), model.get('positive_vote'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get userId() {
		return this.#userId;
	}

	get cardSuggestionId() {
		return this.#cardSuggestionId;
	}

	get positiveVote() {
		return this.#positiveVote;
	}

	/** @param {number} positiveVote */
	set positiveVote(positiveVote) {
		this.#positiveVote = positiveVote;
	}

	toJSON() {
		return {
			user_id: this.#userId,
			card_suggestion_id: this.#cardSuggestionId,
			positive_vote: this.#positiveVote
		};
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
};