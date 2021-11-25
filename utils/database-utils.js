const { Sequelize, DataTypes, Op } = require('sequelize');
const CardTemplateDTO = require('../dto/CardTemplateDTO');
const InventoryCardDTO = require('../dto/InventoryCardDTO');
const UserProfileDTO = require('../dto/UserProfileDTO');
const OngoingSpawnDTO = require('../dto/OngoingSpawnDTO');
const GuildConfigDTO = require('../dto/GuildConfigDTO');
const ValidatedSuggestionDTO = require('../dto/ValidatedSuggestionDTO');
const TemporaryCardSuggestionDTO = require('../dto/TemporaryCardSuggestionDTO');
const SuggestionVoteDTO = require('../dto/SuggestionVoteDTO');
const { CARD_PER_PAGE, SCORE_REQUIRED } = require('../constants');

/** @type {Sequelize} */
let sequelize = null;

const CARD_TEMPLATE = 'card_template';
const USER_PROFILE = 'user_profile';
const INVENTORY_CARD = 'inventory_card';
const ONGOING_SPAWN = 'ongoing_spawn';
const GUILD_CONFIG = 'guild_config';
const TEMPORARY_CARD_SUGGESTION = 'temporary_card_suggestion';
const VALIDATED_SUGGESTION = 'validated_suggestion';
const SUGGESTION_VOTE = 'suggestion_vote';

module.exports = {
	/**
	 * @param {string} id
	 */
	async findCardTemplateById(id) {
		const cardTemplate = await sequelize.models[CARD_TEMPLATE].findOne({
			where: { id }
		});

		if (cardTemplate === null) {
			return null;
		}
		return CardTemplateDTO.modelToClass(cardTemplate);
	},

	/** @param {string} id */
	async findUserProfileById(id) {
		const userProfile = await sequelize.models[USER_PROFILE].findOne({
			where: { id }
		});

		if (userProfile === null) {
			return null;
		}
		return UserProfileDTO.modelToClass(userProfile);
	},

	/**
	 * @param {string} userProfileId
	 * @param {number} localId
	 */
	async findInventoryCardById(userProfileId, localId) {
		const inventoryCard = await sequelize.models[INVENTORY_CARD].findOne({
			where: {
				user_profile_id: userProfileId,
				local_id: localId
			}
		});

		if (inventoryCard === null) {
			return null;
		}
		return InventoryCardDTO.modelToClass(inventoryCard);
	},

	/** @param {string} channelId */
	async findOngoingSpawnById(channelId) {
		const ongoingSpawn = await sequelize.models[ONGOING_SPAWN].findOne({
			where: {
				channel_id: channelId
			}
		});

		if (ongoingSpawn === null) {
			return null;
		}
		return OngoingSpawnDTO.modelToClass(ongoingSpawn);
	},

	/** @param {string} id */
	async findGuildConfigById(id) {
		const guildConfig = await sequelize.models[GUILD_CONFIG].findOne({
			where: { id }
		});

		if (guildConfig === null) {
			return null;
		}
		return GuildConfigDTO.modelToClass(guildConfig);
	},

	/** @param {strring} messageId */
	async findTemporaryCardSuggestionById(messageId) {
		const cardSuggestion = await sequelize.models[TEMPORARY_CARD_SUGGESTION].findOne({
			where: {
				message_id: messageId
			}
		});

		if (cardSuggestion === null) {
			return null;
		}
		return TemporaryCardSuggestionDTO.modelToClass(cardSuggestion);
	},

	/** @param {string} messageId */
	async findValidatedSuggestionById(messageId) {
		const validatedSuggestion = await sequelize.models[VALIDATED_SUGGESTION].findOne({
			where: {
				message_id: messageId
			}
		});

		if (validatedSuggestion === null) {
			return null;
		}
		return ValidatedSuggestionDTO.modelToClass(validatedSuggestion);
	},

	/**
	 * @param {string} userId
	 * @param {number} validatedSuggestionId
	 */
	async findSuggestionVoteById(userId, validatedSuggestionId) {
		const suggestionVote = await sequelize.models[SUGGESTION_VOTE].findOne({
			where: {
				user_id: userId,
				validated_suggestion_id: validatedSuggestionId
			}
		});

		if (suggestionVote === null) {
			return null;
		}
		return SuggestionVoteDTO.modelToClass(suggestionVote);
	},

	/**
	 * @param {number[]} cardTemplateIds
	 */
	async findCardTemplatesByIds(cardTemplateIds) {
		const cardTemplates = await sequelize.models[CARD_TEMPLATE].findAll({
			where: {
				id: {
					[Op.in]: cardTemplateIds
				}
			}
		});

		return CardTemplateDTO.modelToClassArray(cardTemplates);
	},

	async findRandomCardTemplate() {
		const cardTemplate = await sequelize.models[CARD_TEMPLATE].findOne({
			order: sequelize.random()
		});

		if (cardTemplate === null) {
			return null;
		}
		return CardTemplateDTO.modelToClass(cardTemplate);
	},

	/** @param {CardTemplateDTO} cardTemplate */
	async saveCardTemplate(cardTemplate) {
		return sequelize.models[CARD_TEMPLATE].upsert({
			id: cardTemplate.id,
			image_url: cardTemplate.imageURL,
			name: cardTemplate.name
		});
	},

	/** @param {UserProfileDTO} userProfile */
	async saveUserProfile(userProfile) {
		return sequelize.models[USER_PROFILE].upsert({
			id: userProfile.id
		});
	},

	/** @param {InventoryCardDTO} inventoryCard */
	async saveInventoryCard(inventoryCard) {
		return sequelize.models[INVENTORY_CARD].upsert({
			user_profile_id: inventoryCard.userProfileId,
			local_id: inventoryCard.localId,
			card_template_id: inventoryCard.cardTemplateId
		});
	},

	/** @param {OngoingSpawnDTO} ongoingSpawn */
	async saveOngoingSpawn(ongoingSpawn) {
		return sequelize.models[ONGOING_SPAWN].upsert({
			channel_id: ongoingSpawn.channelId,
			card_template_id: ongoingSpawn.cardTemplateId,
			message_id: ongoingSpawn.messageId
		});
	},

	/** @param {GuildConfigDTO} guildConfig */
	async saveGuildConfig(guildConfig) {
		await sequelize.models[GUILD_CONFIG].upsert({
			id: guildConfig.id,
			spawn_channel_id: guildConfig.spawnChannelId,
			review_suggestion_channel_id: guildConfig.reviewSuggestionChannelId,
			approved_cards_channel_id: guildConfig.approvedCardsChannelId
		});
	},

	/** @param {ValidatedSuggestionDTO} validatedSuggestion */
	async saveValidatedSuggestion(validatedSuggestion) {
		await sequelize.models[VALIDATED_SUGGESTION].upsert({
			message_id: validatedSuggestion.messageId,
			name: validatedSuggestion.name,
			image_url: validatedSuggestion.imageURL,
			rarity: validatedSuggestion.rarity
		});
	},

	/** @param {SuggestionVoteDTO} suggestionVote */
	async saveSuggestionVoteAndCalculateScore(suggestionVote) {
		let score = null;
		let validatedSuggestion = null;

		const transaction = await sequelize.transaction();
		try {
			// Sauvegarder le vote
			const insertedVote = await sequelize.models[SUGGESTION_VOTE].upsert({
				user_id: suggestionVote.userId,
				validated_suggestion_id: suggestionVote.validatedSuggestionId,
				positive_vote: suggestionVote.positiveVote
			}, { transaction });

			// Récupérer le nombre de votes
			const suggestionVoteModels = await sequelize.models[SUGGESTION_VOTE].findAll({
				where: {
					validated_suggestion_id: suggestionVote.validatedSuggestionId
				}
			}, { transaction });

			suggestionVoteModels.push(insertedVote);
			const suggestionVotes = SuggestionVoteDTO.modelToClassArray(suggestionVoteModels);

			score = 0;
			for (suggestionVote of suggestionVotes) {
				score += (suggestionVote.positiveVote ? 1 : -1);
			}

			validatedSuggestion = await sequelize.models[VALIDATED_SUGGESTION].findOne({
				where: {
					message_id: suggestionVote.validatedSuggestionId
				}
			}, { transaction });

			if (score >= SCORE_REQUIRED || score <= -SCORE_REQUIRED) {
				await sequelize.models[VALIDATED_SUGGESTION].destroy({
					where: {
						message_id: validatedSuggestion.messageId
					}
				}, { transaction });
			}

			if (score >= SCORE_REQUIRED) {
				sequelize.models[CARD_TEMPLATE].create({
					name: validatedSuggestion.get('name'),
					image_url: validatedSuggestion.get('image_url'),
					rarity: validatedSuggestion.get('rarity')
				}, { transaction });
			}

			transaction.commit();
		} catch (error) {
			console.log('rollback');
			await transaction.rollback();
			score = null;
			validatedSuggestion = null;
		}

		return { validatedSuggestion: ValidatedSuggestionDTO.modelToClass(validatedSuggestion), score };
	},

	/**
	 * @param {OngoingSpawnDTO} ongoingSpawn
	 * @param {string} userId
	 */
	async claimCardAndAddItToInventory(ongoingSpawn, userId) {
		/** @type {import('sequelize').Model} */
		let createdCard = null;

		const transaction = await sequelize.transaction();
		try {
			// La carte est encore disponible, on la revendique ...
			await sequelize.models[ONGOING_SPAWN].destroy({
				where: {
					channel_id: ongoingSpawn.channelId
				}
			}, { transaction });

			let localId = null;
			while (localId === null) {
				const attemptedLocalId = Math.floor(Math.random() * (2 ** 20));

				const existingCardModel = await sequelize.models[INVENTORY_CARD].findOne({
					where: {
						user_profile_id: userId,
						local_id: attemptedLocalId
					}
				}, { transaction });

				if (existingCardModel === null) {
					// La carte n'existe pas, on arrête la recherche
					localId = attemptedLocalId;
				}
			}

			// ... puis on l'ajoute à l'inventaire
			createdCard = await sequelize.models[INVENTORY_CARD].create({
				card_template_id: ongoingSpawn.cardTemplateId,
				user_profile_id: userId,
				local_id: localId
			}, { transaction });

			await transaction.commit();
		} catch (error) {
			console.log('rollback');
			await transaction.rollback();
			console.error(error);
			createdCard = null;
		}

		if (createdCard === null) {
			return null;
		}
		return InventoryCardDTO.modelToClass(createdCard);
	},

	/**
	 * @param {string} channelId
	 */
	async deletePreviousCardAndReturnMessageId(channelId) {
		let messageId = null;

		const transaction = await sequelize.transaction();
		try {
			const ongoingSpawnModel = await sequelize.models[ONGOING_SPAWN].findOne({
				where: { channel_id: channelId }
			}, { transaction });

			if (ongoingSpawnModel !== null) {
				const ongoinSpawn = OngoingSpawnDTO.modelToClass(ongoingSpawnModel);
				messageId = ongoinSpawn.messageId;

				// S'il existe encore une carte dans ce channel, on la supprime
				await sequelize.models[ONGOING_SPAWN].destroy({
					where: { channel_id: channelId }
				}, { transaction });
			}

			transaction.commit();
		} catch (error) {
			console.log('rollback');
			await transaction.rollback();
			console.error(error);
			messageId = null;
		}

		return messageId;
	},

	/**
	 * @param {string} messageId
	 * @param {string} suggestedName
	 * @param {string} suggestedURL
	 * @param {number} suggestedRarity
	 */
	async createTemporaryCardSuggestion(messageId, suggestedName, suggestedURL, suggestedRarity) {
		await sequelize.models[TEMPORARY_CARD_SUGGESTION].create({
			message_id: messageId,
			name: suggestedName,
			image_url: suggestedURL,
			rarity: suggestedRarity
		});
	},

	/**
	 * @param {string} userId
	 * @returns {Promise<number>}
	 */
	async getInventorySize(userId) {
		return await sequelize.models[INVENTORY_CARD].count({
			where: { user_profile_id: userId }
		});
	},

	async getInventoryPage(userId, page) {
		const inventoryCards = await sequelize.models[INVENTORY_CARD].findAll({
			where: { user_profile_id: userId },
			limit: CARD_PER_PAGE,
			offset: page * CARD_PER_PAGE
		});

		if (inventoryCards === null) {
			return null;
		}

		return InventoryCardDTO.modelToClassArray(inventoryCards);
	},

	async populateWithMacron() {
		await sequelize.models[CARD_TEMPLATE].sync({ force: true });
		await sequelize.models[CARD_TEMPLATE].create({
			name: 'Macron veut t\'attraper',
			image_url: 'https://i.imgur.com/eeSA4f6.png',
			rarity: 3
		});
	},

	/** @param {string[]} tables */
	async resetDB(tables) {
		if (tables.includes(INVENTORY_CARD) || tables.includes('all')) {
			await sequelize.models[INVENTORY_CARD].sync({ force: true });
		}
		if (tables.includes(CARD_TEMPLATE) || tables.includes('all')) {
			await sequelize.models[CARD_TEMPLATE].sync({ force: true });
		}
		if (tables.includes(USER_PROFILE) || tables.includes('all')) {
			await sequelize.models[USER_PROFILE].sync({ force: true });
		}
		if (tables.includes(GUILD_CONFIG) || tables.includes('all')) {
			await sequelize.models[GUILD_CONFIG].sync({ force: true });
		}
	},

	async init() {
		console.info('Autentification à la base de donnée...');

		if (sequelize !== null) {
			throw new Error('Impossible de d\'autentifier plusieurs fois !');
		}

		sequelize = new Sequelize(process.env.DATABASE_URL, {
			dialect: 'postgres',
			logging: false
		});
		await sequelize.authenticate();

		console.info('Autentification réussie !');
		console.info('Définition des tables...');

		sequelize.define(CARD_TEMPLATE, {
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			name: DataTypes.STRING,
			image_url: DataTypes.STRING,
			rarity: DataTypes.INTEGER
		}, { tableName: CARD_TEMPLATE });

		sequelize.define(USER_PROFILE, {
			id: {
				type: DataTypes.STRING,
				primaryKey: true
			}
		}, { tableName: USER_PROFILE });

		sequelize.define(INVENTORY_CARD, {
			user_profile_id: {
				type: DataTypes.STRING,
				/* references: {
					model: USER_PROFILE,
					key: 'id'
				}*/
				primaryKey: true
			},
			local_id: {
				type: DataTypes.INTEGER,
				primaryKey: true
			},
			card_template_id: {
				type: DataTypes.INTEGER,
				references: {
					model: CARD_TEMPLATE,
					key: 'id'
				},
				onDelete: 'CASCADE'
			}
		}, { tableName: INVENTORY_CARD });

		sequelize.define(ONGOING_SPAWN, {
			channel_id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			card_template_id: {
				type: DataTypes.INTEGER,
				references: {
					model: CARD_TEMPLATE,
					key: 'id'
				},
				onDelete: 'CASCADE'
			},
			message_id: DataTypes.STRING
		}, { tableName: ONGOING_SPAWN });

		sequelize.define(GUILD_CONFIG, {
			id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			spawn_channel_id: DataTypes.STRING,
			review_suggestion_channel_id: DataTypes.STRING,
			approved_cards_channel_id: DataTypes.STRING
		}, { tableName: GUILD_CONFIG });

		sequelize.define(TEMPORARY_CARD_SUGGESTION, {
			message_id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			name: DataTypes.STRING,
			image_url: DataTypes.STRING,
			rarity: DataTypes.INTEGER
		}, { tableName: TEMPORARY_CARD_SUGGESTION });

		sequelize.define(VALIDATED_SUGGESTION, {
			message_id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			name: DataTypes.STRING,
			image_url: DataTypes.STRING,
			rarity: DataTypes.INTEGER
		}, { tableName: VALIDATED_SUGGESTION });

		sequelize.define(SUGGESTION_VOTE, {
			user_id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			validated_suggestion_id: {
				type: DataTypes.STRING,
				references: {
					model: VALIDATED_SUGGESTION,
					key: 'message_id'
				},
				primaryKey: true
			},
			positive_vote: DataTypes.BOOLEAN
		}, { tableName: SUGGESTION_VOTE });

		await sequelize.sync({
			alter: true
		});

		console.info('Tables définies !');
	}
};