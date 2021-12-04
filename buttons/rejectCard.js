const { SCORE_REQUIRED } = require('../constants');
const SuggestionVoteDTO = require('../dto/SuggestionVoteDTO');
const { saveSuggestionVoteAndCalculateScore } = require('../utils/database-utils');
const { generateSuggestionReviewMessageContent, TEXT } = require('../utils/message-utils');

module.exports = {
	name: 'rejectCard',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		const { score, validatedSuggestion } = await saveSuggestionVoteAndCalculateScore(new SuggestionVoteDTO(interaction.user.id, interaction.message.id, false));

		if (score === null) {
			// Le calcul a échoué
			await interaction.reply('Échec du calcul du score :\'(');
		} else {
			await interaction.reply({
				content: 'Votre vote a été pris en compte (vous avez **rejeté** cette carte)',
				ephemeral: true
			});

			const editedMessage = generateSuggestionReviewMessageContent(validatedSuggestion, score);
			const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);

			if (score <= -SCORE_REQUIRED) {
				// Rejeter la carte
				await originalMessage.edit({
					content: 'Carte approuvée !',
					embeds: editedMessage.embeds,
					components: [{
						type: 'ACTION_ROW',
						components: [{
							type: 'BUTTON',
							customId: 'rejectCard',
							label: TEXT.CARD.REJECTED,
							style: 'DANGER',
							disabled: true
						}]
					}]
				});
			} else {
				await originalMessage.edit(editedMessage);
			}
		}
	}
};