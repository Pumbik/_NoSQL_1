db = db.getSiblingDB("spotify");

// Завдання 1. Треки для вечірки
const partyTracks = db.tracks.find({
    "audio_features.danceability": { $gt: 0.7 },
    "audio_features.energy": { $gt: 0.7 },
    "duration_sec": { $gte: 180, $lte: 300 }
}, {
    _id: 0,
    track_name: 1,
    artists: 1,
    "audio_features.danceability": 1,
    "audio_features.energy": 1,
    duration_sec: 1
}).limit(5).toArray(); // limit(5) щоб вивести лише перші 5 для перевірки

printjson(partyTracks);

// Завдання 2. Виконавці, у яких усі треки популярні
const topArtists = db.tracks.aggregate([
    { $unwind: "$artists" },

    { 
        $group: {
            _id: "$artists", // Групуємо по артисту 
            total_tracks: { $sum: 1 }, // + 1 до кількості
            min_popularity: { $min: "$popularity" }, // найменше значення популярності
            avg_popularity: { $avg: "$popularity" } // середне популярність
        }
    },

    {
        $match: {
            total_tracks: { $gte: 3 }, // Мінімум 3 треки
            min_popularity: { $gte: 60 } // Мінімальна популярність 60 або вище
        }
    },

    {
        $addFields: {
            avg_popularity: { $round: ["$avg_popularity", 1] } 
        }
    },

    {
        $sort: { avg_popularity: -1 } // DESC
    },

    { $limit: 20 },

    {
        $project: {
            _id: 0,
            artist_name: "$_id",
            total_tracks: 1,
            min_popularity: 1,
            avg_popularity: 1
        }
    }
]).toArray();

printjson(topArtists);


// Завдання 3. Нетипові треки
const outlierTracks = db.tracks.aggregate([
    {
        $group: {
            _id: "$track_genre", // Групуємо по жанру
            avg_tempo: { $avg: "$audio_features.tempo" }, // Середній темп
            stdDev: { $stdDevPop: "$audio_features.tempo" }, // Стандартне відхилення
            all_tracks: { $push: "$$ROOT" } // $$ROOT зберігаємо весь оригінальний документ треку
        }
    },

    {
        $addFields: {
            outlier_threshold: {  // значення порогу
                // avg_tempo + (2 * stdDev)
                $add: [
                    "$avg_tempo", 
                    { $multiply: [2, "$stdDev"] }
                ]
            }
        }
    },

    // фінальна структура \ фільтруємо треки
    {
        $project: {
            _id: 0, 
            genre: "$_id", // Перейменовуємо _id у genre
            avg_tempo: { $round: ["$avg_tempo", 0] }, // Округлюємо середнє 
            outlier_threshold: { $round: ["$outlier_threshold", 1] }, // Округлюємо поріг до 1 знаку
            
            // фільтруємо і форматуємо масив треків
            outlier_tracks: {
                $map: {
                    // Спочатку фільтруємо масив all_tracks
                    input: {
                        $filter: {
                            input: "$all_tracks",
                            as: "track",
                            // tempo треку > outlier_threshold
                            cond: { $gt: ["$$track.audio_features.tempo", "$outlier_threshold"] }
                        }
                    },
                    // проходимося по відфільтрованих треках і формуємо об'єкт для кожного нетипового треку
                    as: "outlier",
                    in: {
                        _id: "$$outlier._id",
                        track_name: "$$outlier.track_name",
                        popularity: "$$outlier.popularity",
                        artists: "$$outlier.artists",
                        audio_features: {
                            tempo: "$$outlier.audio_features.tempo"
                        }
                    }
                }
            }
        }
    },

    // залишаємо тільки ті жанри, де знайшовся хоча б один нетиповий трек
    {
        $match: {
            // "outlier_tracks.0" перевірка наявності першого елемента в масиві
            "outlier_tracks.0": { $exists: true }
        }
    }
]).toArray();

printjson(outlierTracks[0]);



// Завдання 4: Треки для фонової роботи
const backgroundTracks = db.tracks.find({
    "audio_features.loudness": { $lt: -10 },         // тихі (< -10)
    "audio_features.speechiness": { $lt: 0.1 },      // мало слів (< 0.1)
    "audio_features.instrumentalness": { $gt: 0.5 }, // переважно інструментальні (> 0.5)
    "explicit": false                                // без ненормативної лексики
}, {
    // Проєкція: виводимо лише те, що допоможе перевірити правильність запиту
    _id: 0,
    track_name: 1,
    artists: 1,
    explicit: 1,
    "audio_features.loudness": 1,
    "audio_features.speechiness": 1,
    "audio_features.instrumentalness": 1
}).limit(5).toArray(); // Обмежуємо вивід до 5 треків для зручності

printjson(backgroundTracks);