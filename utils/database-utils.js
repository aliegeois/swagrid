const { Sequelize, DataTypes, Op } = require('sequelize');
const CardTemplateDTO = require('../dto/CardTemplateDTO');
const InventoryCardDTO = require('../dto/InventoryCardDTO');
const UserProfileDTO = require('../dto/UserProfileDTO');
const OngoingSpawnDTO = require('../dto/OngoingSpawnDTO');
const GuildConfigDTO = require('../dto/GuildConfigDTO');
const CardSuggestionDTO = require('../dto/CardSuggestionDTO');
const SuggestionVoteDTO = require('../dto/SuggestionVoteDTO');
const GlobalConfigDTO = require('../dto/GlobalConfigDTO');
const { CARD_MACRON, DEFAULT_GLOBAL_CONFIG } = require('../constants');

/** @type {Sequelize} */
let sequelize = null;

module.exports = {
	/** @param {number} id */
	async findCardTemplateById(id) {
		const cardTemplate = await sequelize.models[CardTemplateDTO.TABLE_NAME].findOne({
			where: { id }
		});

		if (cardTemplate === null) {
			return null;
		}
		return CardTemplateDTO.modelToClass(cardTemplate);
	},

	/** @param {string} name */
	async findCardTemplatesByName(name) {
		const cardTemplates = await sequelize.models[CardTemplateDTO.TABLE_NAME].findAll({
			where: {
				name: {
					[Op.substring]: name
				}
			}
		});

		return CardTemplateDTO.modelToClassArray(cardTemplates);
	},

	/** @param {string} name */
	async findCardTemplateByName(name) {
		const cardTemplate = await sequelize.models[CardTemplateDTO.TABLE_NAME].findOne({
			where: {
				name: {
					[Op.substring]: name
				}
			}
		});

		if (cardTemplate === null) {
			return null;
		}
		return CardTemplateDTO.modelToClass(cardTemplate);
	},

	/** @param {string} id */
	async findUserProfileById(id) {
		const userProfile = await sequelize.models[UserProfileDTO.TABLE_NAME].findOne({
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
		const inventoryCard = await sequelize.models[InventoryCardDTO.TABLE_NAME].findOne({
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
		const ongoingSpawn = await sequelize.models[OngoingSpawnDTO.TABLE_NAME].findOne({
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
		const guildConfig = await sequelize.models[GuildConfigDTO.TABLE_NAME].findOne({
			where: { id }
		});

		if (guildConfig === null) {
			return null;
		}
		return GuildConfigDTO.modelToClass(guildConfig);
	},

	/** @param {string} messageId */
	async findValidatedSuggestionById(messageId) {
		const validatedSuggestion = await sequelize.models[CardSuggestionDTO.TABLE_NAME].findOne({
			where: {
				message_id: messageId
			}
		});

		if (validatedSuggestion === null) {
			return null;
		}
		return CardSuggestionDTO.modelToClass(validatedSuggestion);
	},

	/**
	 * @param {string} userId
	 * @param {number} cardSuggestionId
	 */
	async findSuggestionVoteById(userId, cardSuggestionId) {
		const suggestionVote = await sequelize.models[SuggestionVoteDTO.TABLE_NAME].findOne({
			where: {
				user_id: userId,
				card_suggestion_id: cardSuggestionId
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
		if (cardTemplateIds.length === 0) {
			return [];
		}

		const cardTemplates = await sequelize.models[CardTemplateDTO.TABLE_NAME].findAll({
			where: {
				id: {
					[Op.in]: cardTemplateIds
				}
			}
		});

		return CardTemplateDTO.modelToClassArray(cardTemplates);
	},

	/** @param {string} name  */
	async getGlobalConfigOrDefault(name) {
		const globalConfigValue = await sequelize.models[GlobalConfigDTO.TABLE_NAME].findOne({
			where: { name }
		});

		if (globalConfigValue === null) {
			if (name in DEFAULT_GLOBAL_CONFIG) {
				return new GlobalConfigDTO(name, DEFAULT_GLOBAL_CONFIG[name]);
			}
			return null;
		}

		return GlobalConfigDTO.modelToClass(globalConfigValue);
	},

	/**
	 * @param {number} spawnRate5Star
	 * @param {number} spawnRate4Star
	 * @param {number} spawnRate3Star
	 * @param {number} spawnRate2Star
	 * @param {number} spawnRate1Star
	 */
	async findPonderatedCardTemplate(spawnRate5Star, spawnRate4Star, spawnRate3Star, spawnRate2Star, spawnRate1Star) {
		const random = Math.random();
		/** @type {number} */
		let rarity;

		if (random <= spawnRate5Star) {
			rarity = 5;
		} else if (random <= spawnRate5Star + spawnRate4Star) {
			rarity = 4;
		} else if (random <= spawnRate5Star + spawnRate4Star + spawnRate3Star) {
			rarity = 3;
		} else if (random <= spawnRate5Star + spawnRate4Star + spawnRate3Star + spawnRate2Star) {
			rarity = 2;
		} else if (random <= spawnRate5Star + spawnRate4Star + spawnRate3Star + spawnRate2Star + spawnRate1Star) {
			rarity = 1;
		}

		const cardTemplate = await sequelize.models[CardTemplateDTO.TABLE_NAME].findOne({
			where: { rarity },
			order: sequelize.random()
		});

		if (cardTemplate === null) {
			return null;
		}
		return CardTemplateDTO.modelToClass(cardTemplate);
	},

	/** @param {UserProfileDTO} userProfile */
	async saveUserProfile(userProfile) {
		return sequelize.models[UserProfileDTO.TABLE_NAME].upsert(userProfile.toJSON());
	},

	/** @param {InventoryCardDTO} inventoryCard */
	async saveInventoryCard(inventoryCard) {
		return sequelize.models[InventoryCardDTO.TABLE_NAME].upsert(inventoryCard.toJSON());
	},

	/** @param {OngoingSpawnDTO} ongoingSpawn */
	async saveOngoingSpawn(ongoingSpawn) {
		return sequelize.models[OngoingSpawnDTO.TABLE_NAME].upsert(ongoingSpawn.toJSON());
	},

	/** @param {GuildConfigDTO} guildConfig */
	async saveGuildConfig(guildConfig) {
		await sequelize.models[GuildConfigDTO.TABLE_NAME].upsert(guildConfig.toJSON());
	},

	/** @param {GlobalConfigDTO} globalConfig */
	async saveGlobalConfig(globalConfig) {
		await sequelize.models[GlobalConfigDTO.TABLE_NAME].upsert(globalConfig.toJSON());
	},

	/** @param {SuggestionVoteDTO} suggestionVote */
	async saveSuggestionVote(suggestionVote) {
		await sequelize.models[SuggestionVoteDTO.TABLE_NAME].upsert(suggestionVote.toJSON());
	},

	/** @param {CardSuggestionDTO} cardSuggestion */
	async saveValidatedSuggestion(cardSuggestion) {
		await sequelize.models[CardSuggestionDTO.TABLE_NAME].create(cardSuggestion.toJSON());
	},

	/**
	 * @param {SuggestionVoteDTO} suggestionVote
	 * @param {number} votesRequired
	 */
	async countVotesAndValidateSuggestion(suggestionVote, votesRequired) {
		/** @type {number?} */
		let positiveVotes = null;
		/** @type {number?} */
		let negativeVotes = null;
		/** @type {import('../dto/CardSuggestionDTO')?}*/
		let cardSuggestion = null;

		const transaction = await sequelize.transaction();
		try {
			// Récupérer les votes
			const suggestionVoteModels = await sequelize.models[SuggestionVoteDTO.TABLE_NAME].findAll({
				where: {
					card_suggestion_id: suggestionVote.cardSuggestionId
				}
			}, { transaction });

			const suggestionVotes = SuggestionVoteDTO.modelToClassArray(suggestionVoteModels);

			// Compter le nombre de votes pour la suggestion
			positiveVotes = 0;
			negativeVotes = 0;
			for (const vote of suggestionVotes) {
				positiveVotes += (vote.positiveVote ? 1 : 0);
				negativeVotes += (vote.positiveVote ? 0 : 1);
			}

			const validatedSuggestionModel = await sequelize.models[CardSuggestionDTO.TABLE_NAME].findOne({
				where: {
					message_id: suggestionVote.cardSuggestionId
				}
			}, { transaction });
			cardSuggestion = CardSuggestionDTO.modelToClass(validatedSuggestionModel);

			if (positiveVotes >= votesRequired || negativeVotes >= votesRequired) {
				// Supprimer tous les votes
				await sequelize.models[SuggestionVoteDTO.TABLE_NAME].destroy({
					where: {
						card_suggestion_id: suggestionVote.cardSuggestionId
					}
				}, { transaction });

				// Supprimer la suggestion
				await sequelize.models[CardSuggestionDTO.TABLE_NAME].destroy({
					where: {
						message_id: cardSuggestion.messageId
					}
				}, { transaction });
			}

			if (positiveVotes >= votesRequired) {
				// Si le nombre de votes positif est suffisant, ajouter la carte aux templates
				await sequelize.models[CardTemplateDTO.TABLE_NAME].create({
					name: cardSuggestion.name,
					image_url: cardSuggestion.imageURL,
					rarity: cardSuggestion.rarity
				}, { transaction });
			}

			await transaction.commit();
		} catch (error) {
			console.log('rollback', error);
			await transaction.rollback();
			positiveVotes = null;
			negativeVotes = null;
			cardSuggestion = null;
		}

		return { positiveVotes, negativeVotes, cardSuggestion };
	},

	/**
	 * @param {OngoingSpawnDTO} ongoingSpawn
	 * @param {string} userId
	 */
	async claimCardAndAddItToInventory(ongoingSpawn, userId) {
		/** @type {import('sequelize').Model} */
		let inventoryCard = null;

		const transaction = await sequelize.transaction();
		try {
			// La carte est encore disponible, on la revendique ...
			await sequelize.models[OngoingSpawnDTO.TABLE_NAME].destroy({
				where: {
					channel_id: ongoingSpawn.channelId
				}
			}, { transaction });

			let localId = null;
			while (localId === null) {
				const attemptedLocalId = Math.floor(Math.random() * (2 ** 20));

				const existingCardModel = await sequelize.models[InventoryCardDTO.TABLE_NAME].findOne({
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
			inventoryCard = await sequelize.models[InventoryCardDTO.TABLE_NAME].create({
				card_template_id: ongoingSpawn.cardTemplateId,
				user_profile_id: userId,
				local_id: localId
			}, { transaction });

			await transaction.commit();
		} catch (error) {
			console.log('rollback');
			await transaction.rollback();
			console.error(error);
			inventoryCard = null;
		}

		if (inventoryCard === null) {
			return null;
		}
		return InventoryCardDTO.modelToClass(inventoryCard);
	},

	/**
	 * @param {string} channelId
	 */
	async deletePreviousCardAndReturnMessageId(channelId) {
		let messageId = null;

		const transaction = await sequelize.transaction();
		try {
			const ongoingSpawnModel = await sequelize.models[OngoingSpawnDTO.TABLE_NAME].findOne({
				where: { channel_id: channelId }
			}, { transaction });

			if (ongoingSpawnModel !== null) {
				const ongoinSpawn = OngoingSpawnDTO.modelToClass(ongoingSpawnModel);
				messageId = ongoinSpawn.messageId;

				// S'il existe encore une carte dans ce channel, on la supprime
				await sequelize.models[OngoingSpawnDTO.TABLE_NAME].destroy({
					where: {
						channel_id: channelId
					}
				}, { transaction });
			}

			await transaction.commit();
		} catch (error) {
			console.log('rollback');
			await transaction.rollback();
			console.error(error);
			messageId = null;
		}

		return messageId;
	},

	/**
	 * @param {CardSuggestionDTO} cardSuggestion
	 * @param {boolean} approved
	 */
	async finishSuggestionAndDeleteVotes(cardSuggestion, approved) {
		let inserted = true;

		const transaction = await sequelize.transaction();
		try {
			await sequelize.models[CardSuggestionDTO.TABLE_NAME].destroy({
				where: {
					message_id: cardSuggestion.messageId
				}
			}, { transaction });

			await sequelize.models[SuggestionVoteDTO.TABLE_NAME].destroy({
				where: {
					card_suggestion_id: cardSuggestion.messageId
				}
			}, { transaction });

			if (approved) {
				await sequelize.models[CardTemplateDTO.TABLE_NAME].create({
					name: cardSuggestion.name,
					image_url: cardSuggestion.imageURL,
					rarity: cardSuggestion.rarity
				}, { transaction });
			}

			await transaction.commit();
		} catch (error) {
			console.log('rollback');
			await transaction.rollback();
			console.log(error);
			inserted = false;
		}

		return inserted;
	},

	/**
	 * @param {string} userId
	 * @returns {Promise<number>}
	 */
	async getInventorySize(userId) {
		return await sequelize.models[InventoryCardDTO.TABLE_NAME].count({
			where: {
				user_profile_id: userId
			}
		});
	},

	async getInventoryPage(userId, page, cardsPerPage) {
		const inventoryCards = await sequelize.models[InventoryCardDTO.TABLE_NAME].findAll({
			where: {
				user_profile_id: userId
			},
			limit: cardsPerPage,
			offset: page * cardsPerPage,
			order: [['createdAt', 'DESC']]
		});

		if (inventoryCards === null) {
			return null;
		}

		return InventoryCardDTO.modelToClassArray(inventoryCards);
	},

	async populateWithMacron() {
		await sequelize.models[CardTemplateDTO.TABLE_NAME].sync({ force: true });
		await sequelize.models[CardTemplateDTO.TABLE_NAME].create(CARD_MACRON);
	},

	/** @param {string[]} tables */
	async resetDB(tables) {
		if (tables.includes(InventoryCardDTO.TABLE_NAME) || tables.includes('all')) {
			await sequelize.models[InventoryCardDTO.TABLE_NAME].sync({ force: true });
		}
		if (tables.includes(UserProfileDTO.TABLE_NAME) || tables.includes('all')) {
			await sequelize.models[UserProfileDTO.TABLE_NAME].sync({ force: true });
		}
		if (tables.includes(GuildConfigDTO.TABLE_NAME) || tables.includes('all')) {
			await sequelize.models[GuildConfigDTO.TABLE_NAME].sync({ force: true });
		}
		if (tables.includes(OngoingSpawnDTO.TABLE_NAME) || tables.includes('all')) {
			await sequelize.models[OngoingSpawnDTO.TABLE_NAME].sync({ force: true });
		}
		if (tables.includes(CardTemplateDTO.TABLE_NAME) || tables.includes('all')) {
			await sequelize.models[CardTemplateDTO.TABLE_NAME].sync({ force: true });
		}
		if (tables.includes(SuggestionVoteDTO.TABLE_NAME) || tables.includes('all')) {
			await sequelize.models[SuggestionVoteDTO.TABLE_NAME].sync({ force: true });
		}
		if (tables.includes(CardSuggestionDTO.TABLE_NAME) || tables.includes('all')) {
			await sequelize.models[CardSuggestionDTO.TABLE_NAME].sync({ force: true });
		}
	},

	async init() {
		console.info('Autentification à la base de donnée...');

		if (sequelize !== null) {
			throw new Error('Impossible de s\'autentifier plusieurs fois !');
		}

		switch (process.env.NODE_ENV) {
		case 'development':
			sequelize = new Sequelize(process.env.DATABASE_URL, {
				dialect: 'postgres'
			});
			break;
		case 'production':
			sequelize = new Sequelize(process.env.DATABASE_URL, {
				dialect: 'postgres',
				logging: false,
				dialectOptions: {
					ssl: {
						require: true,
						rejectUnauthorized: false
					}
				}
			});
			break;
		default:
			throw new Error('La variable NODE_ENV doit être définie !');
		}

		await sequelize.authenticate();

		console.info('Autentification réussie !');
		console.info('Définition des tables...');

		sequelize.define(CardTemplateDTO.TABLE_NAME, {
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			name: DataTypes.STRING,
			image_url: DataTypes.STRING,
			rarity: DataTypes.INTEGER
		}, { tableName: CardTemplateDTO.TABLE_NAME });

		sequelize.define(UserProfileDTO.TABLE_NAME, {
			id: {
				type: DataTypes.STRING,
				primaryKey: true
			}
		}, { tableName: UserProfileDTO.TABLE_NAME });

		sequelize.define(InventoryCardDTO.TABLE_NAME, {
			user_profile_id: {
				type: DataTypes.STRING,
				/* references: {
					model: UserProfileDTO.TABLE_NAME,
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
					model: CardTemplateDTO.TABLE_NAME,
					key: 'id'
				},
				onDelete: 'CASCADE'
			}
		}, { tableName: InventoryCardDTO.TABLE_NAME });

		sequelize.define(OngoingSpawnDTO.TABLE_NAME, {
			channel_id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			card_template_id: {
				type: DataTypes.INTEGER,
				references: {
					model: CardTemplateDTO.TABLE_NAME,
					key: 'id'
				},
				onDelete: 'CASCADE'
			},
			message_id: DataTypes.STRING
		}, { tableName: OngoingSpawnDTO.TABLE_NAME });

		sequelize.define(GuildConfigDTO.TABLE_NAME, {
			id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			spawn_channel_id: DataTypes.STRING,
			review_suggestion_channel_id: DataTypes.STRING,
			approved_cards_channel_id: DataTypes.STRING
		}, { tableName: GuildConfigDTO.TABLE_NAME });

		sequelize.define(CardSuggestionDTO.TABLE_NAME, {
			message_id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			user_id: {
				type: DataTypes.STRING/* ,
				references: {
					model: UserProfileDTO.TABLE_NAME,
					key: id
				}*/
			},
			name: DataTypes.STRING,
			image_url: DataTypes.STRING,
			rarity: DataTypes.INTEGER
		}, { tableName: CardSuggestionDTO.TABLE_NAME });

		sequelize.define(SuggestionVoteDTO.TABLE_NAME, {
			user_id: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			card_suggestion_id: {
				type: DataTypes.STRING,
				references: {
					model: CardSuggestionDTO.TABLE_NAME,
					key: 'message_id'
				},
				primaryKey: true
			},
			positive_vote: DataTypes.BOOLEAN
		}, { tableName: SuggestionVoteDTO.TABLE_NAME });

		sequelize.define(GlobalConfigDTO.TABLE_NAME, {
			name: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			value: DataTypes.STRING
		}, { tableName: GlobalConfigDTO.TABLE_NAME });

		await sequelize.sync({
			alter: true
		});

		console.info('Tables définies !');
	}
};