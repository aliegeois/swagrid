module.exports = {
	name: 'cancelsuggestion',

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 * @param {import('../SwagridClient')} client
	 */
	async execute(interaction, client) {
		if (client.temporaryCardSuggestions.has(interaction.message.id)) {
			client.temporaryCardSuggestions.delete(interaction.message.id);
			const message = await interaction.channel.messages.fetch(interaction.message.id);
			await message.delete();
		} else {
			await interaction.reply('Cette suggestion \'existe plus');
		}
	}
};