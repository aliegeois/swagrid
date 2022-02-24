const cache = require('../cache');
const ValidatedSuggestionDTO = require('../dto/ValidatedSuggestionDTO');
const { findGuildConfigById, findTemporaryCardSuggestionById, createValidatedSuggestionAndDeleteTemporary } = require('../utils/database-utils');
const { generateSuggestionReviewMessageContent } = require('../utils/message-utils');

module.exports = {
	name: 'validatesuggestion',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		// L'utilisateur a cliqué sur le bouton "valider" après avoir utilisé /suggest <name> <imageURL> <rarity>
		// On crée un message dans #suggestions et on demande aux utilisateurs de voter
		// Un bouton "Approuver" et un "Rejeter"
		// Un compteur de votes dans le message
		// Quand le message atteint un nombre de votes positif de 4, supprimer les boutons puis poster un message dans #suggestions-approuvées

		const guildConfig = await findGuildConfigById(interaction.guildId);
		if (guildConfig !== null && guildConfig.reviewSuggestionChannelId !== null) {
			/** @type {import('discord.js').GuildTextBasedChannel} */
			const suggestionChannel = await interaction.client.channels.fetch(guildConfig.reviewSuggestionChannelId);
			if (suggestionChannel !== null) {
				const temporaryCardSuggestion = await findTemporaryCardSuggestionById(interaction.message.id);
				if (temporaryCardSuggestion !== null) {
					const votesRequired = await cache.get('VOTES_REQUIRED');
					const previewMessage = await suggestionChannel.send(generateSuggestionReviewMessageContent(temporaryCardSuggestion, votesRequired));
					// Transformer la suggestion temporaire en suggestion permanente
					const inserted = await createValidatedSuggestionAndDeleteTemporary(new ValidatedSuggestionDTO(previewMessage.id, temporaryCardSuggestion.name, temporaryCardSuggestion.imageURL, temporaryCardSuggestion.rarity), temporaryCardSuggestion);
					console.log(`card inserted ? ${inserted}`);
					if (inserted) {
						// Une fois la suggestion prête à être review, on supprime la suggestion temporaire
						/** @type {import('discord.js').Message} */
						const message = await interaction.channel.messages.fetch(temporaryCardSuggestion.messageId);
						await message.delete();
					}
				}
			}
		} else {
			await interaction.reply('Aucun channel de review de suggestion n\'a été configuré, faites /channel suggest set <#channel>');
		}
	}
};