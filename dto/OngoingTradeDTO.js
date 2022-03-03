module.exports = class OngoingSpawnDTO {
	#id;
	#userId1;
	#userId2;

	/**
	 * @param {number} id
	 * @param {string} userId1
	 */
	constructor(id, userId1) {
		this.#id = id;
		this.#userId1 = userId1;
		this.#userId2 = null;
	}

	static get TABLE_NAME() {
		return 'ongoing_trade';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new OngoingSpawnDTO(model.get('id'), model.get('user_id_1'), model.get('user_id_2'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get id() {
		return this.#id;
	}

	get userId1() {
		return this.#userId1;
	}

	get userId2() {
		return this.#userId2;
	}

	set userId2(userId2) {
		this.#userId2 = userId2;
	}

	toJSON() {
		return {
			id: this.#id,
			user_id_1: this.#userId1,
			user_id_2: this.#userId2
		};
	}
};