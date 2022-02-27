module.exports = class GlobalConfigDTO {
	#name;
	#value;

	/**
	 * @param {string} name
	 * @param {string} value
	 */
	constructor(name, value) {
		this.#name = name;
		this.#value = value;
	}

	static get TABLE_NAME() {
		return 'global_config';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new GlobalConfigDTO(model.get('name'), model.get('value'));
	}

	get name() {
		return this.#name;
	}

	get value() {
		return this.#value;
	}

	set value(value) {
		this.#value = value;
	}

	toJSON() {
		return {
			name: this.#name,
			value: this.#value
		};
	}
};