module.exports = {
	name: 'cancelSuggestion',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		interaction.reply('[cancelled]');
	}
};