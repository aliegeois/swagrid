const { SlashCommandBuilder, inlineCode, channelMention } = require('@discordjs/builders');
const GuildConfigDTO = require('../dto/GuildConfigDTO');
const { findGuildConfigById, saveGuildConfig } = require('../utils/database-utils');

/**
 * @param {import('../dto/GuildConfigDTO')} guildConfig
 * @param {string} guildId
 */
async function generateMessageSpawnGet(guildConfig) {
	if (guildConfig.spawnChannelId === null) {
		return `Aucun channel de spawn configuré, utilisez ${inlineCode('/channel spawn set <channel>')} pour le définir`;
	} else {
		return `Le channel de spawn est ${channelMention(guildConfig.spawnChannelId)}`;
	}
}

/**
 * @param {import('../dto/GuildConfigDTO')} guildConfig
 * @param {string} channelId
 */
async function generateMessageSpawnSet(guildConfig, channelId) {
	if (guildConfig.spawnChannelId === channelId) {
		return 'Ce channel est déjà celui de spawn !';
	} else {
		guildConfig.spawnChannelId = channelId;
		await saveGuildConfig(guildConfig);
		return `Le channel de spawn est désormais ${channelMention(channelId)}`;
	}
}

/**
 * @param {import('../dto/GuildConfigDTO')} guildConfig
 * @param {string} guildId
 */
async function generateMessageSuggestionGet(guildConfig) {
	if (guildConfig.reviewSuggestionChannelId === null) {
		return `Aucun channel revue de suggestion configuré, utilisez ${inlineCode('/channel suggestion set <channel>')} pour le définir`;
	} else {
		return `Le channel de revue de suggestion est ${channelMention(guildConfig.reviewSuggestionChannelId)}`;
	}
}

/**
 * @param {import('../dto/GuildConfigDTO')} guildConfig
 * @param {string} channelId
 */
async function generateMessageSuggestionSet(guildConfig, channelId) {
	if (guildConfig.reviewSuggestionChannelId === channelId) {
		return 'Ce channel est déjà celui de suggestion !';
	} else {
		guildConfig.reviewSuggestionChannelId = channelId;
		await saveGuildConfig(guildConfig);
		return `Le channel de revue de suggestion est désormais ${channelMention(channelId)}`;
	}
}

/**
 * @param {import('../dto/GuildConfigDTO')} guildConfig
 * @param {string} guildId
 */
async function generateMessageApprovedGet(guildConfig) {
	if (guildConfig.approvedCardsChannelId === null) {
		return `Aucun channel d'approbation de cartes configuré, utilisez ${inlineCode('/channel approved set <channel>')} pour le définir`;
	} else {
		return `Le channel d'approbation de cartes est ${channelMention(guildConfig.approvedCardsChannelId)}`;
	}
}

/**
 * @param {import('../dto/GuildConfigDTO')} guildConfig
 * @param {string} channelId
 */
async function generateMessageApprovedSet(guildConfig, channelId) {
	if (guildConfig.approvedCardsChannelId === channelId) {
		return 'Ce channel est déjà celui d\'approbation de cartes !';
	} else {
		guildConfig.approvedCardsChannelId = channelId;
		await saveGuildConfig(guildConfig);
		return `Le channel d'approbation de cartes est désormais ${channelMention(channelId)}`;
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('channel')
		.setDescription('Modifie / Visualise les informations d\'un channel technique')
		.setDefaultPermission(false)
		.addSubcommandGroup(subCommandGroup =>
			subCommandGroup
				.setName('spawn')
				.setDescription('Modifie / Visualise les informations du channel de spawn')
				.addSubcommand(subCommand =>
					subCommand
						.setName('get')
						.setDescription('Visualise les informations du channel de spawn')
				)
				.addSubcommand(subCommand =>
					subCommand
						.setName('set')
						.setDescription('Modifie les informations du channel de spawn')
						.addChannelOption(option =>
							option
								.setName('channel')
								.setDescription('Le nouveau channel de spawn')
						)
				)
		)
		.addSubcommandGroup(subCommandGroup =>
			subCommandGroup
				.setName('suggestion')
				.setDescription('Modifie / Visualise les informations du channel de suggestion')
				.addSubcommand(subCommand =>
					subCommand
						.setName('get')
						.setDescription('Visualise les informations du channel de suggestion')
				)
				.addSubcommand(subCommand =>
					subCommand
						.setName('set')
						.setDescription('Modifie les informations du channel de suggestion')
						.addChannelOption(option =>
							option
								.setName('channel')
								.setDescription('Le nouveau channel de suggestion')
						)
				)
		)
		.addSubcommandGroup(subCommandGroup =>
			subCommandGroup
				.setName('approved')
				.setDescription('Modifie / Visualise les informations du channel de cartes approuvées')
				.addSubcommand(subCommand =>
					subCommand
						.setName('get')
						.setDescription('Visualise les informations du channel de cartes approuvées')
				)
				.addSubcommand(subCommand =>
					subCommand
						.setName('set')
						.setDescription('Modifie les informations du channel de cartes approuvées')
						.addChannelOption(option =>
							option
								.setName('channel')
								.setDescription('Le nouveau channel de cartes approuvées')
						)
				)
		),

	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction) {
		let guildConfig = await findGuildConfigById(interaction.guildId);
		if (guildConfig === null) {
			guildConfig = new GuildConfigDTO(interaction.guildId);
		}
		const channel = interaction.options.getChannel('channel');
		let channelId;
		if (channel === null) {
			channelId = interaction.channelId;
		} else {
			channelId = channel.id;
		}

		let content;
		switch (interaction.options.getSubcommandGroup()) {
		case 'spawn': {
			switch (interaction.options.getSubcommand()) {
			case 'get':
				content = await generateMessageSpawnGet(guildConfig);
				break;

			case 'set':
				content = await generateMessageSpawnSet(guildConfig, channelId);
				break;
			}
			break;
		}

		case 'suggestion': {
			switch (interaction.options.getSubcommand()) {
			case 'get':
				content = await generateMessageSuggestionGet(guildConfig);
				break;

			case 'set':
				content = await generateMessageSuggestionSet(guildConfig, channelId);
				break;
			}
			break;
		}

		case 'approved': {
			switch (interaction.options.getSubcommand()) {
			case 'get':
				content = await generateMessageApprovedGet(guildConfig);
				break;

			case 'set':
				content = await generateMessageApprovedSet(guildConfig, channelId);
				break;
			}
			break;
		}
		}

		interaction.reply({ content });
	}
};