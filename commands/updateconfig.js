const { SlashCommandBuilder } = require('@discordjs/builders');
const { MASTER_PERMISSION } = require('../constants');
const { saveGlobalConfig } = require('../utils/databaseUtils');
const { get: getGlobalConfig } = require('../utils/globalConfigCache');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateconfig')
		.setDescription('Met à jour la configuration globale')
		.setDefaultPermission(false)
		.addStringOption(option =>
			option
				.setName('config')
				.setDescription('La configuration à changer')
				.setRequired(true)),

	permissions: [MASTER_PERMISSION],

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