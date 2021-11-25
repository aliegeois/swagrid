const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Liste les commandes et leurs usages'),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async executeCommand(interaction) {
		/** @type {import('discord.js').Collection<string, { data: SlashCommandBuilder }>} */
		const commands = interaction.client.commands;

		const descriptions = commands.map(command => `${command.data.name}: ${command.data.description}`).reduce((desc, total) => `${total}\n${desc}`, '');

		await interaction.reply(`Liste des commandes :\`\`\`${descriptions}\`\`\``);
	}
};