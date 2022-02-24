const { getGlobalConfigOrDefault } = require('./utils/database-utils');

class Cache {
	/** @type {Map<string, any>} */
	#variables;

	constructor() {
		this.invalidate();
	}

	/**
	 * @param {string} name
	 */
	async get(name) {
		if (!this.#variables.has(name)) {
			const globalConfig = await getGlobalConfigOrDefault();
			this.#variables.set(name, globalConfig[name]);
		}
		return this.#variables.get(name);
	}

	invalidate() {
		this.#variables = new Map();
	}
}

module.exports = new Cache();