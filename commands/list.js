const { SlashCommandBuilder } = require('@discordjs/builders');
const cache = require('../cache');
const { getInventorySize, getInventoryPage, findCardTemplatesByIds } = require('../utils/database-utils');
const { generateInventoryMessageContent } = require('../utils/message-utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Affiche la liste de vos cartes')
		.addIntegerOption(option =>
			option
				.setName('page')
				.setDescription('La page de l\'inventaire à afficher')
				.setRequired(false)
		),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		const inventorySize = await getInventorySize(interaction.user.id);
		let page = 0;
		if (interaction.options.getInteger('page') !== null) {
			page = interaction.options.getInteger('page') - 1;
		}
		const cardsPerPage = await cache.get('CARDS_PER_PAGE');
		const maxPage = Math.floor(inventorySize / cardsPerPage);
		if (page < 0) {
			page = 0;
		} else if (page > maxPage) {
			page = maxPage;
		}

		// On récupère la page qui nous intéresse
		const inventoryCards = await getInventoryPage(interaction.user.id, page, cardsPerPage);
		if (inventoryCards !== null) {
			/** @type {number[]} */
			const cardTemplateIds = [...new Set(inventoryCards.map(inventoryCard => inventoryCard.cardTemplateId))];

			// Pour chaque carte unique, on récupère son template
			const cardTemplates = await findCardTemplatesByIds(cardTemplateIds);
			const mapCardTemplates = new Map(cardTemplates.map(cardTemplate => [cardTemplate.id, cardTemplate]));

			await interaction.reply(generateInventoryMessageContent(interaction.user, inventoryCards, mapCardTemplates, page, maxPage, cardsPerPage));
		} else {
			await interaction.reply('Impossible de trouver la liste de cet utilisateur');
		}
	}
};