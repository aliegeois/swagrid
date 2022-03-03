const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Liste les commandes et leurs usages'),

	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 * @param {import('../SwagridClient')} client
	 */
	async execute(interaction, client) {
		const commands = client.commands;

		const descriptions = commands.map(command => `${command.data.name}: ${command.data.description}`).join('\n');

		await interaction.reply(`Liste des commandes :${codeBlock(descriptions)}`);
	}
};