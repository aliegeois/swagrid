const { SlashCommandBuilder } = require('@discordjs/builders');
const ScheduleDTO = require('../dto/ScheduleDTO');
const { frequencyToSeconds } = require('../utils/scheduleUtils');
const { findSchedulesByUserId, saveSchedule, deleteSchedule, findScheduleByUserIdAndName } = require('../utils/databaseUtils');
const { generateSchedulesListMessageContent, generateScheduleInfoMessageContent } = require('../utils/messageUtils');

/** @typedef {'hot'|'new'|'top'|'rising'} subredditCategory */

/**
 * @param {import('../SwagridClient')} client
 * @param {import('discord.js').User} user
 * @param {string} name
 * @param {import('discord.js').TextChannel} channel
 * @param {string} frequency
 * @param {string} subreddit
 * @param {subredditCategory} category
 * @param {Date} lastExecution
 */
async function addSchedule(client, user, name, channel, frequency, subreddit, category, lastExecution) {
	const schedule = new ScheduleDTO(user.id, name, channel.id, frequencyToSeconds(frequency), subreddit, category, lastExecution);
	await saveSchedule(schedule);
	client.addSchedule(schedule);

	return 'Programme ajouté';
}

/**
 * @param {import('../SwagridClient')} client
 * @param {import('discord.js').User} user
 * @param {string} name
 */
async function removeSchedule(client, user, name) {
	const schedule = new ScheduleDTO(user.id, name);
	await deleteSchedule(schedule);
	client.removeSchedule(schedule);

	return 'Programme supprimé';
}

/**
 * @param {import('discord.js').User} user
 */
async function listSchedules(user) {
	const schedules = await findSchedulesByUserId(user.id);

	if (schedules.length === 0) {
		return 'Aucun programme';
	}

	return generateSchedulesListMessageContent(user, schedules);
}

/**
 * @param {import('discord.js').User} user
 * @param {string} name
 */
async function infosSchedule(user, name) {
	const schedule = await findScheduleByUserIdAndName(user.id, name);

	return generateScheduleInfoMessageContent(user, schedule);
}

/** @type {import('../SwagridClient').SwagridCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule')
		.setDescription('Affiche des posts reddit à fréquence régulière')
		.addSubcommand(subCommand =>
			subCommand
				.setName('add')
				.setDescription('Ajoute un programme')
				.addStringOption(option =>
					option
						.setName('nom')
						.setDescription('Nom du programme (doit être unique)')
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('fréquence')
						.setDescription('Fréquence à laquelle ce programme sera joué')
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('subreddit')
						.setDescription('Le subreddit dans lequel aller chercher les posts')
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('catégorie')
						.setDescription('La catégorie de posts à récupérer')
						.setChoices([
							['hot', 'hot'],
							['new', 'new'],
							['top', 'top'],
							['rising', 'rising']
						])
						.setRequired(true)
				)
		)
		.addSubcommand(subCommand =>
			subCommand
				.setName('remove')
				.setDescription('Supprime un programme')
				.addStringOption(option =>
					option
						.setName('nom')
						.setDescription('Le nom du programme')
						.setRequired(true)
				)
		)
		.addSubcommand(subCommand =>
			subCommand
				.setName('list')
				.setDescription('Liste les programmes que vous avez créés')
		)
		.addSubcommand(subCommand =>
			subCommand
				.setName('infos')
				.setDescription('Affiche les infos d\'un programme')
				.addStringOption(option =>
					option
						.setName('nom')
						.setDescription('Le nom du programme')
						.setRequired(true)
				)
		)
		.setDefaultPermission(true),

	async execute(interaction) {
		let content;

		switch (interaction.options.getSubcommand()) {
		case 'add':
			content = await addSchedule(interaction.client, interaction.user, interaction.options.getString('nom'), interaction.channel, interaction.options.getString('fréquence'), interaction.options.getString('subreddit'), interaction.options.getString('catégorie'), interaction.createdAt);
			break;

		case 'remove':
			content = await removeSchedule(interaction.client, interaction.user, interaction.options.getString('nom'));
			break;

		case 'list':
			content = await listSchedules(interaction.user);
			break;

		case 'infos':
			content = await infosSchedule(interaction.user, interaction.options.getString('nom'));
		}

		return interaction.reply({ content });
	}
};