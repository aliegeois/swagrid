const { SlashCommandBuilder } = require('@discordjs/builders');
const { MASTER_PERMISSION } = require('../constants');
const { saveGlobalConfig } = require('../utils/databaseUtils');
const { get: getGlobalConfig } = require('../utils/globalConfigCache');

/** @type {import('../SwagridClient').SwagridCommand} */
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

	async execute(interaction) {
		const commands = interaction.options.getString('config');
		for (const command of commands.split(' ')) {
			const [name, value] = command.split('=');
			const globalConfig = await getGlobalConfig(name);
			globalConfig.value = value;
			await saveGlobalConfig(globalConfig);
		}

		return interaction.reply('Configuration sauvegardée');
	}
};