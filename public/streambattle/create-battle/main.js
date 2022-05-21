/** @param {URL} url */
function extractId(url) {
	switch (url.hostname) {
	case 'www.youtube.com':
		if (url.pathname.startsWith('/embed')) {
			return url.pathname.split('/').at(-1);
		} else if (url.searchParams.has('v')) {
			return url.searchParams.get('v');
		} else {
			return '';
		}
	case 'youtu.be':
		return url.pathname.split('/').at(-1);
	default:
		return '';
	}
}

function getLastBattleId() {
	const battles = Object.entries(localStorage).filter(([k]) => k.startsWith('battle/'));
	if (battles.length === 0) {
		return 0;
	}
	return battles.map(([, v]) => JSON.parse(v).id).reduce((p, c) => Math.max(p, c), 0);
}

document.getElementById('button-create-battle').addEventListener('click', () => {
	const id = getLastBattleId() + 1;
	const name = document.getElementById('input-battle-name').value;
	const videoIds = document.getElementById('input-battle-urls').value.split(/\r?\n|\r/).map(url => new URL(url)).map(extractId);

	localStorage.setItem(`battle/${id}`, JSON.stringify({ id, name, videoIds }));

	location.href = '/streambattle';
});