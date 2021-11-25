const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Répond par Pong !'),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		await interaction.reply(`Pong ! (${Date.now() - interaction.createdAt} ms)`);
	}
};