const { SlashCommandBuilder } = require('@discordjs/builders');
const { MASTER_PERMISSION } = require('../constants');
const { invalidate: invalidateGlobalConfigCache } = require('../utils/globalConfigCache');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reloadcache')
		.setDescription('Recharge le cache')
		.setDefaultPermission(false),

	permissions: [ MASTER_PERMISSION ],

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		invalidateGlobalConfigCache();

		await interaction.reply('Cache rechargé');
	}
};