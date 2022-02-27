const { SlashCommandBuilder } = require('@discordjs/builders');
const { invalidate: invalidateGlobalConfigCache } = require('../utils/global-config-cache');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invalidatecache')
		.setDescription('Invalide le cache')
		.setDefaultPermission(false),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		invalidateGlobalConfigCache();

		interaction.reply('Cache invalidé');
	}
};