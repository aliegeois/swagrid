const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Fait dire des choses à Swagrid')
		.addStringOption(option =>
			option
				.setName('message')
				.setDescription('Le message à envoyer')
				.setRequired(true)
		),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		await interaction.reply(interaction.options.getString('message'));
	}
};