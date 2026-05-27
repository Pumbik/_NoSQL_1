db = db.getSiblingDB("spotify");

// Завдання 1. Топ-10 виконавців за середньою популярністю
const top10Artists = db.tracks.aggregate([
    { $unwind: "$artists" },
    { 
        $group: { 
            _id: "$artists",
            total_tracks: { $sum: 1 },
            avg_popularity: { $avg: "$popularity" } 
        } 
    },
    {
        $match: {
            total_tracks: { $gte: 5 }
        }
    },
    { 
        $sort: { 
            avg_popularity: -1 
        } 
    },
    { $limit: 10 },
    {
        $project: {
            _id: 0,
            artist_name: "$_id",
            avg_popularity: { $round: ["$avg_popularity", 1] } 
        }
    }
]).toArray();

printjson(top10Artists);

// Завдання 2. Розподіл треків за настроєм
const moodDistribution = db.tracks.aggregate([
    {
    $addFields: {
            mood: {
                $switch: {
                    branches: [
                        // happy: valence >= 0.5 ТА energy >= 0.5
                        { 
                            case: { 
                                $and: [
                                    { $gte: ["$audio_features.valence", 0.5] },
                                    { $gte: ["$audio_features.energy", 0.5] }
                                ]
                            }, 
                            then: "happy" 
                        },
                        // angry: valence < 0.5 ТА energy >= 0.5
                        { 
                            case: { 
                                $and: [
                                    { $lt: ["$audio_features.valence", 0.5] },
                                    { $gte: ["$audio_features.energy", 0.5] }
                                ]
                            }, 
                            then: "angry" 
                        },
                        // calm: valence >= 0.5 ТА energy < 0.5
                        { 
                            case: { 
                                $and: [
                                    { $gte: ["$audio_features.valence", 0.5] },
                                    { $lt: ["$audio_features.energy", 0.5] }
                                ]
                            }, 
                            then: "calm" 
                        },
                        // sad: valence < 0.5 ТА energy < 0.5
                        { 
                            case: { 
                                $and: [
                                    { $lt: ["$audio_features.valence", 0.5] },
                                    { $lt: ["$audio_features.energy", 0.5] }
                                ]
                            }, 
                            then: "sad" 
                        }
                    ],
                    default: "unknown" // На випадок, якщо якихось даних немає
                }
            }
        }
    },
    {
        $group: {
            _id: "$mood",
            count: { $sum: 1 } // Кожен знайдений трек додає +1
        }
    },
    {
        $sort: { track_count: -1 }
    },
    {
        $project: {
            _id: 0,
            mood: "$_id",
            count: 1
        }
    }
]).toArray();

printjson(moodDistribution);


// Завдання 3. Найбільш «танцювальний» жанр
const danceableGenres = db.tracks.aggregate([
    { $group: {
        _id: "track_genre",
        avg_danceability: { $avg: "$audio_features.danceability" },
        avg_popularity: { $avg: "$popularity" },
        avg_energy: { $avg: "$audio_features.energy" },
        track_count: { $sum: 1 }
    }},
    { $match: { 
        track_count: { $gte: 100 } 
        } 
    },
    { $sort: { avg_danceability: -1 } },
    { $project: {
        _id: 0,
        genre: "$_id",
        avg_danceability: { $round: ["$avg_danceability", 3] },
        avg_energy: { $round: ["$avg_energy", 3] },
        avg_valence: { $round: ["$avg_valence", 3] },
        track_count: 1
        }
    }
]).toArray();

printjson(danceableGenres);

