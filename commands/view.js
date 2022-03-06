const { SlashCommandBuilder } = require('@discordjs/builders');
const { findInventoryCardById: findInventoryCardByIds, findCardTemplateById } = require('../utils/databaseUtils');
const { isAliasValid, aliasToLocalId } = require('../utils/cardUtils');
const { generateViewMessageContent } = require('../utils/messageUtils');

/** @type {import('../SwagridClient').SwagridCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('view')
		.setDescription('Affiche les détails d\'une de vos cartes')
		.addStringOption(option =>
			option
				.setName('alias')
				.setDescription('L\'alias de la carte')
				.setRequired(true)
		),

	async execute(interaction) {
		const alias = interaction.options.getString('alias');
		if (isAliasValid(alias)) {
			const localId = aliasToLocalId(alias);
			const inventoryCard = await findInventoryCardByIds(interaction.user.id, localId);

			if (inventoryCard !== null) {
				const cardTemplate = await findCardTemplateById(inventoryCard.cardTemplateId);
				return interaction.reply(generateViewMessageContent(interaction.user, inventoryCard, cardTemplate));
			} else {
				return interaction.reply('Cette carte n\'existe pas');
			}
		} else {
			return interaction.reply('Alias invalide (doit faire 4 caractères alphanumérique)');
		}
	}
};