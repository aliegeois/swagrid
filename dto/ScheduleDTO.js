module.exports = class ScheduleDTO {
	#userId;
	#name;
	#channelId;
	#frequency;
	#subreddit;
	#category;
	#lastExecution;

	/**
	 * @param {string} userId
	 * @param {string} name
	 * @param {string} channelId
	 * @param {number} frequency
	 * @param {string} subreddit
	 * @param {string} category
	 * @param {Date} lastExecution
	 */
	constructor(userId, name, channelId, frequency, subreddit, category, lastExecution) {
		this.#userId = userId;
		this.#name = name;
		this.#channelId = channelId;
		this.#frequency = frequency;
		this.#subreddit = subreddit;
		this.#category = category;
		this.#lastExecution = lastExecution;
	}

	static get TABLE_NAME() {
		return 'schedule';
	}

	/** @param {import('sequelize').Model} model */
	static modelToClass(model) {
		return new ScheduleDTO(model.get('user_id'), model.get('name'), model.get('channel_id'), model.get('frequency'), model.get('subreddit'), model.get('category'), model.get('last_execution'));
	}

	/** @param {import('sequelize').Model[]} models */
	static modelToClassArray(models) {
		return models.map(this.modelToClass);
	}

	get userId() {
		return this.#userId;
	}

	get name() {
		return this.#name;
	}

	get channelId() {
		return this.#channelId;
	}

	set channelId(channelId) {
		this.#channelId = channelId;
	}

	get frequency() {
		return this.#frequency;
	}

	set frequency(frequency) {
		this.#frequency = frequency;
	}

	get subreddit() {
		return this.#subreddit;
	}

	set subreddit(subreddit) {
		this.#subreddit = subreddit;
	}

	get category() {
		return this.#category;
	}

	set category(category) {
		this.#category = category;
	}

	get lastExecution() {
		return this.#lastExecution;
	}

	set lastExecution(lastExecution) {
		this.#lastExecution = lastExecution;
	}

	toJSON() {
		return {
			user_id: this.#userId,
			name: this.#name,
			channel_id: this.#channelId,
			frequency: this.#frequency,
			subreddit: this.#subreddit,
			category: this.#category,
			last_execution: this.#lastExecution.toISOString()
		};
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
};