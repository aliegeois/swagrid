const OngoingSpawnDTO = require('../dto/OngoingSpawnDTO');
const { findGuildConfigById, deletePreviousCardAndReturnMessageId, saveOngoingSpawn, findPonderatedCardTemplate } = require('../utils/databaseUtils');
const { generateSpawnMessageContent } = require('../utils/messageUtils');
const { getValueFloat: getGlobalConfigValueFloat } = require('../utils/globalConfigCache');

/**
 * Supprime une éventuelle précédente carte toujours active du channel
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 */
async function deletePreviousCard(channel) {
	const messageId = await deletePreviousCardAndReturnMessageId(channel.id);
	if (messageId !== null) {
		const spawnMessage = await channel.messages.fetch(messageId);

		if (spawnMessage !== null) {
			await spawnMessage.edit({
				components: [{
					type: 'ACTION_ROW',
					components: [{
						type: 'BUTTON',
						customId: 'claim',
						label: 'Expiré',
						style: 'SECONDARY',
						emoji: '❌',
						disabled: true
					}]
				}]
			});
		}
	}
}

/**
 * Envoie le message indiquant qu'une carte est apparue
 *
 * @param {import('../dto/CardTemplateDTO')} cardTemplate
 * @param {import('discord.js').GuildTextBasedChannel} channel
 */
function sendSpawnMessage(cardTemplate, channel) {
	return channel.send(generateSpawnMessageContent(cardTemplate));
}

/**
 * @param {import('discord.js').GuildTextBasedChannel} channel Le channel dans lequel la carte doit apparaître
 */
async function spawnCard(channel) {
	const SPAWN_RATE_5_STAR = await getGlobalConfigValueFloat('SPAWN_RATE_5_STAR');
	const SPAWN_RATE_4_STAR = await getGlobalConfigValueFloat('SPAWN_RATE_4_STAR');
	const SPAWN_RATE_3_STAR = await getGlobalConfigValueFloat('SPAWN_RATE_3_STAR');
	const SPAWN_RATE_2_STAR = await getGlobalConfigValueFloat('SPAWN_RATE_2_STAR');
	const SPAWN_RATE_1_STAR = await getGlobalConfigValueFloat('SPAWN_RATE_1_STAR');

	await deletePreviousCard(channel);
	const cardTemplate = await findPonderatedCardTemplate(SPAWN_RATE_5_STAR, SPAWN_RATE_4_STAR, SPAWN_RATE_3_STAR, SPAWN_RATE_2_STAR, SPAWN_RATE_1_STAR);
	if (cardTemplate !== null) {
		const spawnMessage = await sendSpawnMessage(cardTemplate, channel);
		await saveOngoingSpawn(new OngoingSpawnDTO(channel.id, cardTemplate.id, spawnMessage.id));
	} else {
		console.warn('Aucun template dans la BDD !');
	}
}

module.exports = {
	name: 'messageCreate',

	/** @param {import('discord.js').Message} message */
	async execute(message) {
		if (message.author.bot) {
			return;
		}

		/** @type {import('../SwagridClient')} */
		const client = message.client;

		const MIN_POINTS_TO_ADD = await getGlobalConfigValueFloat('MIN_POINTS_TO_ADD');
		const MAX_POINTS_TO_ADD = await getGlobalConfigValueFloat('MAX_POINTS_TO_ADD');
		const MIN_TIME_BETWEEN_MESSAGE = await getGlobalConfigValueFloat('MIN_TIME_BETWEEN_MESSAGE');
		const MAX_TIME_BETWEEN_MESSAGE = await getGlobalConfigValueFloat('MAX_TIME_BETWEEN_MESSAGE');
		const SPAWN_THRESHOLD = await getGlobalConfigValueFloat('SPAWN_THRESHOLD');

		let data = client.lastMessageSent.find(lms => lms.userId === message.author.id && lms.guildId === message.guildId);
		/** @type {number} */
		let pointsToAdd;
		if (data === undefined) {
			data = {
				userId: message.author.id,
				guildId: message.guildId,
				createdTimestamp: message.createdTimestamp
			};
			client.lastMessageSent.push(data);
			pointsToAdd = MAX_POINTS_TO_ADD;
		} else {
			const timeDifference = message.createdTimestamp - data.createdTimestamp;
			data.createdTimestamp = message.createdTimestamp;

			if (timeDifference >= MAX_TIME_BETWEEN_MESSAGE) {
				// Si le message date de plus de 5 minutes
				pointsToAdd = MAX_POINTS_TO_ADD;
			} else if (timeDifference <= MIN_TIME_BETWEEN_MESSAGE) {
				// Si le message date de moins de 10 secondes
				pointsToAdd = MIN_POINTS_TO_ADD;
			} else {
				pointsToAdd = Math.round((timeDifference - MIN_TIME_BETWEEN_MESSAGE) * (MAX_POINTS_TO_ADD - MIN_POINTS_TO_ADD) / (MAX_TIME_BETWEEN_MESSAGE - MIN_TIME_BETWEEN_MESSAGE)) + MIN_POINTS_TO_ADD;
			}
		}

		let guildCounter = client.messageCounter.has(message.guildId) ? client.messageCounter.get(message.guildId) : 0;
		guildCounter += pointsToAdd;

		if (guildCounter >= SPAWN_THRESHOLD) {
			// On récupère la config de guilde pour savoir où faire apparaître la carte
			const guildConfig = await findGuildConfigById(message.guildId);

			if (guildConfig !== null && guildConfig.spawnChannelId !== null) {
				const channel = await client.channels.fetch(guildConfig.spawnChannelId);
				if (channel !== null) {
					// Si un channel de spawn est configuré, on fait apparaître une carte
					await spawnCard(channel);
				}
			}
			guildCounter = 0;
		}

		client.messageCounter.set(message.guildId, guildCounter);


		if (message.author.id === '239844917311045639') {
			message.react('986717518553026580');
		}
	}
};