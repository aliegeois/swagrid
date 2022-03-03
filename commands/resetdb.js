const { SlashCommandBuilder } = require('@discordjs/builders');
const { MASTER_PERMISSION } = require('../constants');
const { resetDB } = require('../utils/databaseUtils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetdb')
		.setDescription('Réinitialise les BDDs sélectionnées')
		.setDefaultPermission(false)
		.addStringOption(option =>
			option
				.setName('tables')
				.setDescription('La liste des BDDs à réinitialiser')
				.setRequired(true)
		),

	permissions: [ MASTER_PERMISSION ],

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		const tables = interaction.options.getString('tables').split(' ');
		resetDB(tables);

		if (tables.length == 1 && tables[0] !== 'all') {
			interaction.reply('Table réinitialisée');
		} else {
			interaction.reply('Tables réinitialisées');
		}
	}
};