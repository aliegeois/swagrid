const { SlashCommandBuilder } = require('@discordjs/builders');
const cache = require('../cache');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invalidatecache')
		.setDescription('Invalide le cache')
		.setDefaultPermission(false),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		cache.invalidate();

		interaction.reply('Cache invalidé');
	}
};