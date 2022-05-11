module.exports = {
	/** @param {string} frequency */
	frequencyToSeconds(frequency) {
		const frequencyMatcher = frequency.match(/^((?<years>\d+)y)?((?<months>\d+)M)?((?<days>\d+)d)?((?<hours>\d+)H)?((?<minutes>\d+)m)?((?<seconds>\d+)s)?$/);

		let frequencySeconds = 0;
		if (frequencyMatcher.groups.years) {
			frequencySeconds += parseInt(frequencyMatcher.groups.years) * 60 * 60 * 24 * 365;
		}
		if (frequencyMatcher.groups.months) {
			frequencySeconds += parseInt(frequencyMatcher.groups.months) * 60 * 60 * 24 * 30;
		}
		if (frequencyMatcher.groups.days) {
			frequencySeconds += parseInt(frequencyMatcher.groups.days) * 60 * 60 * 24;
		}
		if (frequencyMatcher.groups.hours) {
			frequencySeconds += parseInt(frequencyMatcher.groups.hours) * 60 * 60;
		}
		if (frequencyMatcher.groups.minutes) {
			frequencySeconds += parseInt(frequencyMatcher.groups.minutes) * 60;
		}
		if (frequencyMatcher.groups.seconds) {
			frequencySeconds += parseInt(frequencyMatcher.groups.seconds);
		}

		return frequencySeconds;
	},

	/** @param {number} frequencySeconds */
	secondsToFrequency(frequencySeconds) {
		const years = frequencySeconds % (60 * 60 * 24 * 365);
		frequencySeconds -= years * 60 * 60 * 24 * 365;
		const months = frequencySeconds % (60 * 60 * 24 * 30);
		frequencySeconds -= months * 60 * 60 * 24 * 30;
		const days = frequencySeconds % (60 * 60 * 24);
		frequencySeconds -= days * 60 * 60 * 24;
		const hours = frequencySeconds % (60 * 60);
		frequencySeconds -= hours * 60 * 60;
		const minutes = frequencySeconds % 60;
		frequencySeconds -= minutes;
		const seconds = frequencySeconds;

		let frequency = '';
		if (years > 0) {
			frequency += `${years}y`;
		}
		if (months > 0) {
			frequency += `${months}M`;
		}
		if (days > 0) {
			frequency += `${days}d`;
		}
		if (hours > 0) {
			frequency += `${hours}H`;
		}
		if (minutes > 0) {
			frequency += `${minutes}m`;
		}
		if (seconds > 0) {
			frequency += `${seconds}s`;
		}

		return frequency;
	}
};