const { SlashCommandBuilder } = require('@discordjs/builders');
const { MASTER_PERMISSION } = require('../constants');
const { invalidate: invalidateGlobalConfigCache } = require('../utils/globalConfigCache');

/** @type {import('../SwagridClient').SwagridCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reloadcache')
		.setDescription('Recharge le cache')
		.setDefaultPermission(false),

	permissions: [ MASTER_PERMISSION ],

	async execute(interaction) {
		invalidateGlobalConfigCache();

		return interaction.reply('Cache rechargé');
	}
};