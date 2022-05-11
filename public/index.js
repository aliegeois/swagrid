const template = `
<div class="card">
	<span class="card-name">$card-name</span><br />
	<img class="card-image" src="$card-image" />
</div>
`;

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
				const cardElement = template
					.replace('$card-name', card.name)
					.replace('$card-image', card.image_url);

				if (card.rarity >= 1 && card.rarity <= 5) {
					containers.get(card.rarity).innerHTML += cardElement;
				}
			}

			const main = document.getElementsByTagName('main')[0];
			for (const [, container] of containers) {
				main.appendChild(container);
			}
		});
})();