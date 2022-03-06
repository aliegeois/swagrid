const CardSuggestionDTO = require('../dto/CardSuggestionDTO');
const { findGuildConfigById, saveValidatedSuggestion } = require('../utils/databaseUtils');
const { generateSuggestionReviewMessageContent } = require('../utils/messageUtils');
const { getValueInt: getGlobalConfigValueInt } = require('../utils/globalConfigCache');
const { uploadImage } = require('../utils/imgurUtils');

module.exports = {
	name: 'validatesuggestion',

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 * @param {import('../SwagridClient')} client
	 */
	async execute(interaction, client) {
		if (client.temporaryCardSuggestions.has(interaction.message.id)) {
			const cardSuggestion = client.temporaryCardSuggestions.get(interaction.message.id);
			if (cardSuggestion.userId !== interaction.user.id) {
				// Si ce n'est pas l'utilisateur qui a suggéré la carte qui la valide, on s'arrête ici
				return;
			}

			const guildConfig = await findGuildConfigById(interaction.guildId);
			/** @type {import('discord.js').GuildTextBasedChannel} */
			const interactionChannel = await client.channels.fetch(interaction.channelId);
			/** @type {import('discord.js').GuildTextBasedChannel} */
			let suggestionChannel;
			if (guildConfig !== null && guildConfig.reviewSuggestionChannelId !== null) {
				suggestionChannel = await client.channels.fetch(guildConfig.reviewSuggestionChannelId);
			} else {
				suggestionChannel = interactionChannel;
				// await interaction.reply('Aucun channel de review de suggestion n\'a été configuré, faites /channel suggest set #<channel>');
			}

			if (suggestionChannel !== null) {
				cardSuggestion.imageURL = await uploadImage(cardSuggestion.name, cardSuggestion.imageURL);

				const VOTES_REQUIRED = await getGlobalConfigValueInt('VOTES_REQUIRED');
				const previewMessage = await suggestionChannel.send(generateSuggestionReviewMessageContent(cardSuggestion, VOTES_REQUIRED));

				// Transformer la suggestion temporaire en suggestion permanente
				await saveValidatedSuggestion(new CardSuggestionDTO(previewMessage.id, cardSuggestion.userId, cardSuggestion.name, cardSuggestion.imageURL, cardSuggestion.rarity));
				client.temporaryCardSuggestions.delete(interaction.message.id);
				const message = await interactionChannel.messages.fetch(interaction.message.id);
				await message.delete();
			} else {
				await interaction.reply('Le channel de review de suggestion n\'a pas été trouvé');
			}
		} else {
			await interaction.reply('Cette suggestion n\'existe plus');
		}
	}
};