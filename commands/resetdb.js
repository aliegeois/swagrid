const { SlashCommandBuilder } = require('@discordjs/builders');
const { resetDB } = require('../utils/database-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetdb')
		.setDescription('Réinitialise les BDDs sélectionnées')
		.addStringOption(option =>
			option
				.setName('dbs')
				.setDescription('La liste des BDDs à réinitialiser')
				.setRequired(true)
		)
		.setDefaultPermission(false),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		resetDB(interaction.options.getString('dbs').split(' '));

		interaction.reply('Bases de données réinitialisées');
	}
};