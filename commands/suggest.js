const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateSuggestionPreviewMessageContent } = require('../utils/messageUtils');
const { createImage } = require('../utils/imageUtils');
const AbstractCardDTO = require('../dto/AbstractCardDTO');
const CardSuggestionDTO = require('../dto/CardSuggestionDTO');
const { MAX_RARITY } = require('../constants');

/** @type {import('../SwagridClient').SwagridCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('suggest')
		.setDescription('Suggère une carte au gacha')
		.addStringOption(option =>
			option
				.setName('nom')
				.setDescription('Le nom de la carte')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('url')
				.setDescription('L\'URL vers l\'image de la carte')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('rareté')
				.setDescription(`La rareté de la carte (1-${MAX_RARITY})`)
				.setRequired(true)),

	async execute(interaction, client) {
		const suggestedName = interaction.options.getString('nom');
		if (suggestedName.length >= 256) {
			return interaction.reply('Le nom de la carte doit faire moins de 256 caractères !');
		}

		const suggestedImageURL = interaction.options.getString('url');
		if (suggestedImageURL.length >= 256) {
			return interaction.reply('L\'URL doit faire moins de 256 caractères !');
		}

		const suggestedRarity = interaction.options.getInteger('rareté');
		if (suggestedRarity < 1 || suggestedRarity > MAX_RARITY) {
			return interaction.reply(`La rareté doit être comprise entre 1 et ${MAX_RARITY}`);
		}

		await interaction.deferReply();

		const imageDataURL = await createImage(suggestedImageURL, suggestedRarity);
		const previewMessage = await interaction.editReply({
			...generateSuggestionPreviewMessageContent(new AbstractCardDTO(suggestedName, imageDataURL, suggestedRarity)),
			fetchReply: true
		});

		client.temporaryCardSuggestions.set(previewMessage.id, new CardSuggestionDTO(previewMessage.id, interaction.user.id, suggestedName, imageDataURL, suggestedRarity));
	}
};