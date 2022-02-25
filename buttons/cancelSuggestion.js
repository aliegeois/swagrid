module.exports = {
	name: 'cancelsuggestion',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		interaction.client.temporaryCardSuggestions.delete(interaction.message.id);
		const message = await interaction.channel.messages.fetch(interaction.message.id);
		await message.delete();
	}
};