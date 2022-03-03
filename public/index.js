(() => {
	fetch('/cards')
		.then(res => res.json())
		.then(cards => {
			/** @type {Map<number, HTMLDivElement>} */
			const containers = new Map([
				[1, document.createElement('div')],
				[2, document.createElement('div')],
				[3, document.createElement('div')],
				[4, document.createElement('div')],
				[5, document.createElement('div')]
			]);
			for (const card of cards) {
				const image = document.createElement('img');
				image.src = card.image_url;
				if (card.rarity >= 1 && card.rarity <= 5) {
					containers.get(card.rarity).appendChild(image);
				}
			}

			const main = document.getElementById('main');
			for (const [, container] of containers) {
				main.appendChild(container);
			}
		});
})();