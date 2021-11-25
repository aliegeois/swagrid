const VALID_CHARACTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '2', '3', '4', '5', '6', '7', '8', '9'];

module.exports = {
	/** @param {string} alias */
	isAliasValid(alias) {
		return (alias.length === 4)
			&& alias.toUpperCase().split('')
				.map(c => VALID_CHARACTERS.indexOf(c) !== -1)
				.reduce((correct, current) => correct && current);
	},

	/** @param {number} localId */
	localIdToAlias(localId) {
		return VALID_CHARACTERS[(localId & 0xF8000) >> 15]
			+ VALID_CHARACTERS[(localId & 0x7C00) >> 10]
			+ VALID_CHARACTERS[(localId & 0x3E0) >> 5]
			+ VALID_CHARACTERS[localId & 0x1F];
	},

	/** @param {string} alias */
	aliasToLocalId(alias) {
		const uppderAlias = alias.toUpperCase();
		return VALID_CHARACTERS.indexOf(uppderAlias[0]) * (2 ** 15)
			+ VALID_CHARACTERS.indexOf(uppderAlias[1]) * (2 ** 10)
			+ VALID_CHARACTERS.indexOf(uppderAlias[2]) * (2 ** 5)
			+ VALID_CHARACTERS.indexOf(uppderAlias[3]);
	}
};