const ValidatedSuggestionDTO = require('../dto/ValidatedSuggestionDTO');
const { findGuildConfigById, findTemporaryCardSuggestionById, saveValidatedSuggestion } = require('../utils/database-utils');
const { generateSuggestionReviewMessageContent } = require('../utils/message-utils');

module.exports = {
	name: 'validateSuggestion',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		// L'utilisateur a cliqué sur le bouton "valider" après avoir utilisé /suggest <name> <rarity> <imageURL>
		// On crée un message dans #suggestions et on demande aux utilisateurs de voter
		// Un bouton "Voter pour" et un "Voter contre"
		// Un compteur de score dans le message
		// Quand le message atteint un score de 4, supprimer les boutons puis poster un message dans #suggestions-validées pour prévenir

		const guildConfig = await findGuildConfigById(interaction.guildId);
		if (guildConfig !== null && guildConfig.reviewSuggestionChannelId !== null) {
			try {
				/** @type {import('discord.js').GuildTextBasedChannel} */
				const suggestionChannel = await interaction.client.channels.fetch(guildConfig.reviewSuggestionChannelId);
				const temporaryCardSuggestion = await findTemporaryCardSuggestionById(interaction.message.id);
				const previewMessage = await suggestionChannel.send(generateSuggestionReviewMessageContent(temporaryCardSuggestion));
				// Transformer le vote temporaire en vote permanent
				await saveValidatedSuggestion(new ValidatedSuggestionDTO(previewMessage.id, temporaryCardSuggestion.name, temporaryCardSuggestion.imageURL, temporaryCardSuggestion.rarity));
			} catch (error) {
				// TODO: Le channel a été supprimé, faire des trucs plus tard
				console.error('Le channel de review de suggestion a été supprimé !');
			}
		} else {
			await interaction.reply('Aucun channel de review de suggestion n\'a été configuré, faites /channel suggest set <#channel>');
		}
	}
};