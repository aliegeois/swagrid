module.exports = class UserProfileDTO {
	#id;

	/**
	 * @param {string} id
	 */
	constructor(id) {
		this.#id = id;
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new UserProfileDTO(model.get('id'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get id() {
		return this.#id;
	}
};