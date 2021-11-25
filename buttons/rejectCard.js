const { SCORE_REQUIRED } = require('../constants');
const SuggestionVoteDTO = require('../dto/SuggestionVoteDTO');
const { saveSuggestionVoteAndCalculateScore } = require('../utils/database-utils');

module.exports = {
	name: 'rejectCard',

	/** @param {import('discord.js').ButtonInteraction} interaction */
	async execute(interaction) {
		const score = await saveSuggestionVoteAndCalculateScore(new SuggestionVoteDTO(interaction.user.id, interaction.message.id, false));

		if (score === null) {
			// Le calcul a échoué
			await interaction.reply('Échec du calcul du score :\'(');
			return;
		} else {
			await interaction.reply({
				content: 'Votre vote a été validé (vous avez **rejeté** cette carte)',
				ephemeral: true
			});

			if (score <= -SCORE_REQUIRED) {
				// Rejeter la carte
				interaction.reply('[rejeté]');
			}
		}
	}
};