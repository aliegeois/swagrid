module.exports = class SuggestionVoteDTO {
	#userId;
	#validatedSuggestionId;
	#positiveVote;

	/**
	 * @param {string} userId
	 * @param {string} validatedSuggestionId
	 * @param {boolean} positiveVote
	 */
	constructor(userId, validatedSuggestionId, positiveVote) {
		this.#userId = userId;
		this.#validatedSuggestionId = validatedSuggestionId;
		this.#positiveVote = positiveVote;
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new SuggestionVoteDTO(model.get('user_id'), model.get('validated_suggestion_id'), model.get('positive_vote'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get userId() {
		return this.#userId;
	}

	get validatedSuggestionId() {
		return this.#validatedSuggestionId;
	}

	get positiveVote() {
		return this.#positiveVote;
	}

	/** @param {number} positiveVote */
	set positiveVote(positiveVote) {
		this.#positiveVote = positiveVote;
	}

	toString() {
		return JSON.stringify({
			userId: this.userId,
			validatedSuggestionId: this.validatedSuggestionId,
			positiveVote: this.positiveVote
		});
	}
};