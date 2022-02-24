module.exports = class GlobalConfigDTO {
	#minTimeBetweenMessage;
	#maxTimeBetweenMessage;
	#minPointsToAdd;
	#maxPointsToAdd;
	#spawnThreshold;
	#cardsPerPage;
	#minTimeBetweenSpawn;
	#maxTimeBetweenSpawn;
	#votesRequired;

	/**
	 * @param {number} minTimeBetweenMessage
	 * @param {number} maxTimeBetweenMessage
	 * @param {number} minPointsToAdd
	 * @param {number} maxPointsToAdd
	 * @param {number} spawnThreshold
	 * @param {number} cardsPerPage
	 * @param {number} minTimeBetweenSpawn
	 * @param {number} maxTimeBetweenSpawn
	 * @param {number} votesRequired
	 */
	constructor(minTimeBetweenMessage, maxTimeBetweenMessage, minPointsToAdd, maxPointsToAdd, spawnThreshold, cardsPerPage, minTimeBetweenSpawn, maxTimeBetweenSpawn, votesRequired) {
		this.#minTimeBetweenMessage = minTimeBetweenMessage;
		this.#maxTimeBetweenMessage = maxTimeBetweenMessage;
		this.#minPointsToAdd = minPointsToAdd;
		this.#maxPointsToAdd = maxPointsToAdd;
		this.#spawnThreshold = spawnThreshold;
		this.#cardsPerPage = cardsPerPage;
		this.#minTimeBetweenSpawn = minTimeBetweenSpawn;
		this.#maxTimeBetweenSpawn = maxTimeBetweenSpawn;
		this.#votesRequired = votesRequired;
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new GlobalConfigDTO(model.get('min_time_between_message'), model.get('max_time_between_message'), model.get('min_points_to_add'), model.get('max_points_to_add'), model.get('spawn_threshold'), model.get('cards_per_page'), model.get('min_time_between_spawn'), model.get('max_time_between_spawn'), model.get('votes_required'));
	}

	get MIN_TIME_BETWEEN_MESSAGE() {
		return this.#minTimeBetweenMessage;
	}

	set MIN_TIME_BETWEEN_MESSAGE(minTimeBetweenMessage) {
		this.#minTimeBetweenMessage = minTimeBetweenMessage;
	}

	get MAX_TIME_BETWEEN_MESSAGE() {
		return this.#maxTimeBetweenMessage;
	}

	set MAX_TIME_BETWEEN_MESSAGE(maxTimeBetweenMessage) {
		this.#maxTimeBetweenMessage = maxTimeBetweenMessage;
	}

	get MIN_POINTS_TO_ADD() {
		return this.#minPointsToAdd;
	}

	set MIN_POINTS_TO_ADD(minPointsToAdd) {
		this.#minPointsToAdd = minPointsToAdd;
	}

	get MAX_POINTS_TO_ADD() {
		return this.#maxPointsToAdd;
	}

	set MAX_POINTS_TO_ADD(maxPointsToAdd) {
		this.#maxPointsToAdd = maxPointsToAdd;
	}

	get SPAWN_THRESHOLD() {
		return this.#spawnThreshold;
	}

	set SPAWN_THRESHOLD(spawnThreshold) {
		this.#spawnThreshold = spawnThreshold;
	}

	get CARDS_PER_PAGE() {
		return this.#cardsPerPage;
	}

	set CARDS_PER_PAGE(cardsPerPage) {
		this.#cardsPerPage = cardsPerPage;
	}

	get MIN_TIME_BETWEEN_SPAWN() {
		return this.#minTimeBetweenSpawn;
	}

	set MIN_TIME_BETWEEN_SPAWN(minTimeBetweenSpawn) {
		this.#minTimeBetweenSpawn = minTimeBetweenSpawn;
	}

	get MAX_TIME_BETWEEN_SPAWN() {
		return this.#maxTimeBetweenSpawn;
	}

	set MAX_TIME_BETWEEN_SPAWN(maxTimeBetweenSpawn) {
		this.#maxTimeBetweenSpawn = maxTimeBetweenSpawn;
	}

	get VOTES_REQUIRED() {
		return this.#votesRequired;
	}

	set VOTES_REQUIRED(votesRequired) {
		this.#votesRequired = votesRequired;
	}
};