const GlobalConfigDTO = require('./dto/GlobalConfigDTO');

// Mettre ces infos en base (et en cache ? + une command reloadCache)
module.exports = {
	MASTER_PERMISSION: {
		id: process.env.OWNER_ID,
		type: 'USER',
		permission: true
	},

	CARD_MACRON: {
		name: 'Macron veut t\'attraper',
		image_url: 'https://i.imgur.com/eeSA4f6.png',
		rarity: 3
	},

	DEFAULT_GLOBAL_CONFIG: new GlobalConfigDTO(10 * 1000, 5 * 60 * 1000, 1, 20, 5, 2, 10 * 60 * 1000, 15 * 60 * 1000, 1)
};