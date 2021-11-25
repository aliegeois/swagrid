const { CARD_PER_PAGE, SCORE_REQUIRED } = require('../constants');
const { localIdToAlias } = require('./card-utils');

/** @param {number} rarity */
function generateRarityStar(rarity) {
	let textRarity = '';

	for (let i = 0; i < rarity; i++) {
		textRarity += '⭐';
	}

	return textRarity;
}

module.exports = {
	/** @param {import('../dto/AbstractCardDTO')} abstractCard */
	generateSpawnMessageContent(abstractCard) {
		/** @type {import('discord.js').InteractionReplyOptions} */
		const reply = {
			embeds: [{
				image: {
					url: abstractCard.imageURL
				},
				author: {
					name: 'Spawn !',
					icon_url: 'https://upload.wikimedia.org/wikipedia/en/9/96/Meme_Man_on_transparent_background.webp'
				},
				fields: [{
					name: 'Nom:',
					value: abstractCard.name
				}, {
					name: 'Rareté:',
					value: generateRarityStar(abstractCard.rarity)
				}]
			}],
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'claim',
					label: 'Attraper',
					style: 'PRIMARY'
				}]
			}]
		};

		return reply;
	},

	/**
	 * @param {import('discord.js').User} user
	 * @param {import('../dto/InventoryCardDTO')[]} inventoryCards
	 * @param {Map<number, import('../dto/CardTemplateDTO')>} mapCardTemplates
	 * @param {number} page
	 * @param {number} maxPage
	 */
	generateInventoryMessageContent(user, inventoryCards, mapCardTemplates, page, maxPage) {
		const description = inventoryCards.map(inventoryCard =>
			`\`${localIdToAlias(inventoryCard.localId)}\` | ${mapCardTemplates.get(inventoryCard.cardTemplateId).name}`
		).join('\n');

		/** @type {import('discord.js').InteractionReplyOptions} */
		const reply = {
			embeds: [{
				author: {
					name: `Liste de ${user.username}`,
					icon_url: user.displayAvatarURL({ dynamic: true, size: 32 })
				},
				description,
				footer: {
					text: `Page ${page + 1}/${maxPage + 1} ; Jusqu'à ${CARD_PER_PAGE} résultats par page`
				}
			}]
		};

		return reply;
	},

	/**
	 * @param {import('discord.js').User} user
	 * @param {import('../dto/InventoryCardDTO')} inventoryCard
	 * @param {import('../dto/CardTemplateDTO')} cardTemplate
	 */
	generateViewMessageContent(user, inventoryCard, cardTemplate) {
		const generalInformations = [
			`\`ID:\` **${cardTemplate.id}**`
		];

		const personalInformations = [
			`\`Alias:    \` **${module.exports.localIdToAlias(inventoryCard.localId)}**`,
			`\`Détenteur:\` <@${user.id}>`
		];

		/** @type {import('discord.js').InteractionReplyOptions} */
		const reply = {
			embeds: [{
				image: {
					url: cardTemplate.imageURL
				},
				author: {
					name: cardTemplate.name
				},
				fields: [{
					name: '__Informations générales__',
					value: generalInformations.join('\n')
				}, {
					name: '__Informations personnelles__',
					value: personalInformations.join('\n')
				}]
			}]
		};

		return reply;
	},

	/** @param {import('../dto/TemporaryCardSuggestionDTO')} suggestedCard */
	generateSuggestionPrevisualisationMessageContent(suggestedCard) {
		const realSpawn = module.exports.generateSpawnMessageContent(suggestedCard);
		/** @type {import('discord.js').InteractionReplyOptions} */
		const reply = {
			content: 'Aperçu de la carte, cliquez sur "Valider" pour lancer le processus de validation ou "Annuler" si cette carte ne vous convient pas',
			embeds: realSpawn.embeds,
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'validateSuggestion',
					label: 'Valider',
					style: 'SUCCESS'
				}, {
					type: 'BUTTON',
					customId: 'cancelSuggestion',
					label: 'Annuler',
					style: 'DANGER'
				}]
			}]
		};

		return reply;
	},

	/** @param {import('../dto/TemporaryCardSuggestionDTO')} temporaryCardSuggestion */
	generateSuggestionReviewMessageContent(temporaryCardSuggestion, score = 0) {
		const realSpawn = module.exports.generateSpawnMessageContent(temporaryCardSuggestion);
		realSpawn.embeds[0].fields.push({
			name: 'Score :',
			value: `${score} / ${SCORE_REQUIRED}`
		});

		/** @type {import('discord.js').InteractionReplyOptions} */
		const reply = {
			content: 'Nouvelle proposition de carte !',
			embeds: realSpawn.embeds,
			components: [{
				type: 'ACTION_ROW',
				components: [{
					type: 'BUTTON',
					customId: 'approveCard',
					label: 'Approuver',
					style: 'SUCCESS'
				}, {
					type: 'BUTTON',
					customId: 'rejectCard',
					label: 'Rejeter',
					style: 'DANGER'
				}]
			}]
		};

		return reply;
	}
};