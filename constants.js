// Mettre ces infos en base (et en cache ? + une command reloadCache)
module.exports = {
	// Calcul du prochain spawn
	MIN_TIME_BETWEEN_MESSAGE: 10 * 1000, // 10 secondes
	MAX_TIME_BETWEEN_MESSAGE: 5 * 60 * 1000, // 5 minutes
	MIN_POINTS_TO_ADD: 1,
	MAX_POINTS: 20,
	SPAWN_THRESHOLD: 5,

	// Inventaire
	CARD_PER_PAGE: 2,

	MIN_TIME_BETWEEN_SPAWN: 10 * 60 * 1000, // 10 minutes
	MAX_TIME_BETWEEN_SPAWN: 15 * 60 * 1000, // 15 minutes

	SCORE_REQUIRED: 4 // Le score max (ou -min) requis pour approuver / rejeter une suggestion
};