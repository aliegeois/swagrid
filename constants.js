module.exports = {
	MAX_RARITY: 5,

	/** @type {import('discord.js').ApplicationCommandPermissionData} */
	MASTER_PERMISSION: {
		id: process.env.OWNER_ID,
		type: 'USER',
		permission: true
	},

	DEFAULT_GLOBAL_CONFIG: {
		MIN_TIME_BETWEEN_MESSAGE: 10 * 1000,
		MAX_TIME_BETWEEN_MESSAGE: 5 * 60 * 1000,
		MIN_POINTS_TO_ADD: 1,
		MAX_POINTS_TO_ADD: 20,
		SPAWN_THRESHOLD: 50,

		VOTES_REQUIRED: 4,
		CARDS_PER_PAGE: 20,

		SPAWN_RATE_5_STAR: 0.005,
		SPAWN_RATE_4_STAR: 0.045,
		SPAWN_RATE_3_STAR: 0.15,
		SPAWN_RATE_2_STAR: 0.3,
		SPAWN_RATE_1_STAR: 0.5
	}
};