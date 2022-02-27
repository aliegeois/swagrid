const { getGlobalConfigOrDefault } = require('./database-utils');

/** @type {Map<string, import('../dto/GlobalConfigDTO')>} */
const values = new Map();

module.exports = {
	/** @param {string} name */
	async get(name) {
		if (!values.has(name)) {
			const globalConfig = await getGlobalConfigOrDefault(name.toUpperCase());
			values.set(name, globalConfig);
		}
		return values.get(name);
	},

	/** @param {string} name */
	async getValueString(name) {
		return (await module.exports.get(name)).value;
	},

	/** @param {string} name */
	async getValueInt(name) {
		return parseInt(await module.exports.getValueString(name));
	},

	/** @param {string} name */
	async getValueFloat(name) {
		return parseFloat(await module.exports.getValueString(name));
	},

	invalidate() {
		values.clear();
	}
};