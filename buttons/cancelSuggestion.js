const { deleteTemporarySuggestion } = require('../utils/database-utils');

module.exports = {
	name: 'cancelSuggestion',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		await deleteTemporarySuggestion(interaction.message.id);
		const message = await interaction.channel.messages.fetch(interaction.message.id);
		await message.delete();
	}
};