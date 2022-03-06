const { SlashCommandBuilder } = require('@discordjs/builders');
const { findCardTemplateByName, findCardTemplateById } = require('../utils/databaseUtils');
const { generateInfoMessage } = require('../utils/messageUtils');

/** @type {import('../SwagridClient').SwagridCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Affiche les informations générales d\'une carte')
		.addStringOption(option =>
			option
				.setName('nom')
				.setDescription('Le nom de la carte')
				.setRequired(false)
		)
		.addIntegerOption(option =>
			option
				.setName('id')
				.setDescription('L\'identifiant de la carte')
				.setRequired(false)
		),

	async execute(interaction) {
		const name = interaction.options.getString('nom');
		const id = interaction.options.getInteger('id');

		let cardTemplate;

		if (name === null && id === null) {
			return interaction.reply('L\'un des paramètres "nom" ou "id" doit être renseigné');
		} else if (name !== null && id !== null) {
			return interaction.reply('Un seul des paramètres "nom" ou "id" doit être renseigné');
		} else if (name !== null) {
			cardTemplate = await findCardTemplateByName(name);
		} else if (id !== null) {
			cardTemplate = await findCardTemplateById(id);
		}

		if (cardTemplate === null) {
			return interaction.reply('La carte n\'a pas été trouvée');
		}

		return interaction.reply(generateInfoMessage(cardTemplate));
	}
};