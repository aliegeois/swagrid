const { SlashCommandBuilder } = require('@discordjs/builders');
const { populateWithMacron } = require('../utils/database-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('populate')
		.setDescription('Peuple la BDD !')
		.setDefaultPermission(false),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		await populateWithMacron();
		await interaction.reply('Base peuplée');
	}
};