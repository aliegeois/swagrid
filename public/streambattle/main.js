/**
 * @typedef {{
 *     id: number,
 *     name: string,
 *     videoIds: string[]
 * }} battleInfos
 */

document.getElementById('button-create-battle').addEventListener('click', () => {
	location.href = '/streambattle/create-battle';
});

(() => {
	const divBattles = document.getElementById('list-battles');

	/** @type {battleInfos[]} */
	const battles = Object.entries(localStorage).filter(([k]) => k.startsWith('battle/')).map(([, v]) => JSON.parse(v)).sort((e1, e2) => e1.id - e2.id);
	for (const battle of battles) {
		const a = document.createElement('a');
		a.href = `/streambattle/play-battle?id=${battle.id}`;
		a.innerHTML = battle.name;
		divBattles.appendChild(a);
		divBattles.appendChild(document.createElement('br'));
	}
})();