const { SlashCommandBuilder } = require('@discordjs/builders');
const { resetDBs } = require('../utils/databaseUtils');
const { MASTER_PERMISSION } = require('../constants');

/** @type {import('../SwagridClient').SwagridCommand} */
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

	async execute(interaction) {
		const tables = interaction.options.getString('tables').split(' ');
		await resetDBs(tables);

		if (tables.length === 1 && tables[0] !== 'all') {
			return interaction.reply('Table réinitialisée');
		} else {
			return interaction.reply('Tables réinitialisées');
		}
	}
};