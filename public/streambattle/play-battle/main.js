/**
 * @typedef {{
 *     id: number,
 *     name: string,
 *     videoIds: string[]
 * }} battleInfos
 */

let currentRound;

class Duel {
	number;
	id1;
	url2;
	constructor(number, id1, id2) {
		this.number = number;
		this.id1 = id1;
		this.id2 = id2;
	}
}

class Round {
	#number;
	#totalNumberDuels;
	/** @type {string[]} */
	#nextIds = [];
	/** @type {Duel[]} */
	#duels = [];
	#currentDuel;

	/**
	 * @param {number} number
	 * @param {string[]} ids
	 */
	constructor(number, ids) {
		this.#number = number;

		for (let i = 0; i < ids.length; i += 2) {
			this.#duels.push(new Duel(i / 2 + 1, ids[i], ids[i + 1]));
		}
		this.#totalNumberDuels = this.#duels.length;

		document.getElementById('number-current-round').innerHTML = number;
		document.getElementById('number-current-duel').innerHTML = 1;
		document.getElementById('number-total-duels').innerHTML = this.#duels.length;

		this.createNextDuel();
	}

	selectWinner(side) {
		if (side == 'left') {
			this.#nextIds.push(this.#currentDuel.id1);
		} else if (side == 'right') {
			this.#nextIds.push(this.#currentDuel.id2);
		}
	}

	hasNextDuel() {
		return this.#duels.length > 0;
	}

	createNextDuel() {
		if (!this.hasNextDuel()) {
			return;
		}

		const nextDuel = this.#duels.shift();

		document.getElementById('number-current-duel').innerHTML = this.#totalNumberDuels - this.#duels.length;

		document.getElementById('video-left').firstElementChild.setAttribute('src', `https://www.youtube.com/embed/${nextDuel.id1}`);
		document.getElementById('video-right').firstElementChild.setAttribute('src', `https://www.youtube.com/embed/${nextDuel.id2}`);

		this.#currentDuel = nextDuel;
	}

	createNextRound() {
		if (!this.hasNextRound()) {
			return;
		}

		currentRound = new Round(this.#number + 1, this.#nextIds);
	}

	hasNextRound() {
		return this.#nextIds.length > 1;
	}
}

function shuffle(array) {
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {

		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[ array[currentIndex], array[randomIndex] ] = [ array[randomIndex], array[currentIndex] ];
	}

	return array;
}

function selectVideo(side) {
	currentRound.selectWinner(side);
	if (currentRound.hasNextDuel()) {
		currentRound.createNextDuel();
	} else if (currentRound.hasNextRound()) {
		currentRound.createNextRound();
	}
}

document.getElementById('button-select-left-video').addEventListener('click', () => {
	selectVideo('left');
});

document.getElementById('button-select-right-video').addEventListener('click', () => {
	selectVideo('right');
});

addEventListener('resize', () => {
	Array.from(document.getElementsByTagName('iframe')).forEach(iframe => {
		iframe.width = innerWidth * 2 / 5;
		iframe.height = Math.ceil(iframe.width * 9 / 16);
	});
});

(() => {
	const battleName = new URLSearchParams(location.search).get('id');
	if (battleName === null) {
		// ???
		return;
	}

	/** @type {battleInfos} */
	const battleInfos = JSON.parse(localStorage.getItem(`battle/${battleName}`));
	if (battleInfos === null) {
		// ???
		return;
	}

	document.title = battleInfos.name;
	document.getElementById('number-total-rounds').innerHTML = Math.ceil(Math.log2(battleInfos.videoIds.length));
	currentRound = new Round(1, shuffle(battleInfos.videoIds));

	dispatchEvent(new Event('resize'));
})();