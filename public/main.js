onload = () => {
	let table = document.getElementById('emojis');

	fetch('/emojis').then(data => data.json()).then(data => {
		let thead = document.createElement('thead'),
			thEmoji = document.createElement('th'),
			//thName = document.createElement('th'),
			thElo = document.createElement('th');
		thEmoji.innerHTML = 'Emoji';
		//thName.innerHTML = 'Nom';
		thElo.innerHTML = 'Elo';
		thead.appendChild(thEmoji);
		//thead.appendChild(thName);
		thead.appendChild(thElo);
		table.appendChild(thead);

		let tbody = document.createElement('tbody');
		for(let emoji of data) {
			let tr = document.createElement('tr'),
				tdEmoji = document.createElement('td'),
				//tdName = document.createElement('td'),
				tdElo = document.createElement('td');
			let img = new Image(64, 64);
			img.src = `https://cdn.discordapp.com/emojis/${emoji.id}`;
			tdEmoji.appendChild(img);
			//tdName.innerHTML = emoji.???
			tdElo.innerHTML = emoji.elo;
			tr.appendChild(tdEmoji);
			tr.appendChild(tdElo);
			tbody.appendChild(tr);
		}
		table.appendChild(tbody);
	});
};