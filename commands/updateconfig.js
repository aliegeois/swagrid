const { SlashCommandBuilder } = require('@discordjs/builders');
const { getGlobalConfigOrDefault, saveGlobalConfig } = require('../utils/database-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateconfig')
		.setDescription('Met à jour la configuration globale')
		.addStringOption(option =>
			option
				.setName('config')
				.setDescription('La configuration à changer')
				.setRequired(true))
		.setDefaultPermission(false),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		const currentConfig = await getGlobalConfigOrDefault();

		const commands = interaction.options.getString('config');
		for (const command of commands.split(' ')) {
			const [name, value] = command.split('=');
			currentConfig[name.toUpperCase()] = value;
		}
		saveGlobalConfig(currentConfig);

		interaction.reply('Configuration sauvegardée');
	}
};