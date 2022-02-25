const cache = require('../cache');
const CardSuggestionDTO = require('../dto/CardSuggestionDTO');
const { findGuildConfigById, saveValidatedSuggestion } = require('../utils/database-utils');
const { generateSuggestionReviewMessageContent } = require('../utils/message-utils');

module.exports = {
	name: 'validatesuggestion',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		/** @type {import('../dto/CardSuggestionDTO')} */
		const temporaryCardSuggestion = interaction.client.temporaryCardSuggestions.get(interaction.message.id);
		if (temporaryCardSuggestion.userId !== interaction.user.id) {
			return;
		}

		const guildConfig = await findGuildConfigById(interaction.guildId);
		if (guildConfig !== null && guildConfig.reviewSuggestionChannelId !== null) {
			/** @type {import('discord.js').GuildTextBasedChannel} */
			const suggestionChannel = await interaction.client.channels.fetch(guildConfig.reviewSuggestionChannelId);
			if (suggestionChannel !== null) {
				if (interaction.client.temporaryCardSuggestions.has(interaction.message.id)) {
					const votesRequired = await cache.get('VOTES_REQUIRED');
					const previewMessage = await suggestionChannel.send(generateSuggestionReviewMessageContent(temporaryCardSuggestion, votesRequired));
					// Transformer la suggestion temporaire en suggestion permanente
					await saveValidatedSuggestion(new CardSuggestionDTO(previewMessage.id, temporaryCardSuggestion.userId, temporaryCardSuggestion.name, temporaryCardSuggestion.imageURL, temporaryCardSuggestion.rarity));
					interaction.client.temporaryCardSuggestions.delete(interaction.message.id);
					/** @type {import('discord.js').Message} */
					const message = await interaction.channel.messages.fetch(interaction.message.id);
					await message.delete();
				}
			} else {
				await interaction.reply('Le channel de review de suggestion n\'a pas été trouvé, peut-être est-t\'il supprimé');
			}
		} else {
			await interaction.reply('Aucun channel de review de suggestion n\'a été configuré, faites /channel suggest set #<channel>');
		}
	}
};