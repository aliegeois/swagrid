const { SlashCommandBuilder } = require('@discordjs/builders');
const { saveGlobalConfig } = require('../utils/database-utils');
const { get: getGlobalConfig } = require('../utils/global-config-cache');

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
		const commands = interaction.options.getString('config');
		for (const command of commands.split(' ')) {
			const [name, value] = command.split('=');
			const globalConfig = await getGlobalConfig(name);
			globalConfig.value = value;
			await saveGlobalConfig(globalConfig);
		}

		interaction.reply('Configuration sauvegardée');
	}
};