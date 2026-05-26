
db = db.getSiblingDB("spotify");

print("Трансформація...");

db.tracks.drop();
print("tracks видалена.");

// pipeline
const pipeline = [
    // step 2: Проєкція полів ($project)
    // (1) --> залишити це поле
    {
        $project: {
            _id: 0, // ???
            track_id: 1,
            track_name: 1,
            album_name: 1,
            explicit: 1,
            popularity: 1,
            duration_ms: 1,
            track_genre: 1,
            artists_raw: "$artists", //  artists --> artists_raw
            danceability: 1, 
            energy: 1, 
            loudness: 1, 
            speechiness: 1, 
            acousticness: 1, 
            instrumentalness: 1, 
            liveness: 1, 
            valence: 1, 
            tempo: 1, 
            key: 1, 
            mode: 1, 
            time_signature: 1
        }
    },
    // step 3: Перетворення артистів
    {
        $set: {
            artists: {
                $map: {
                    input: { $split: ["$artists_raw", ";"] },
                    as: "artistName",
                    in: { $trim: { input: "$$artistName" } }
                }
            }
        }
    },
    // step 4: Формування аудіо-характеристик та обчислюваних полів
    {
        $addFields: {
            // 4.1 вкладений об'єкт
            audio_features: {
                danceability: "$danceability",
                energy: "$energy",
                loudness: "$loudness",
                speechiness: "$speechiness",
                acousticness: "$acousticness",
                instrumentalness: "$instrumentalness",
                liveness: "$liveness",
                valence: "$valence",
                tempo: "$tempo",
                key: "$key",
                mode: "$mode",
                time_signature: "$time_signature"
            },
            
            // 4.2 duration_sec (округлюємо до 1 знака)
            // Формула: округлення( (duration_ms / 1000) * 10 ) / 10
            duration_sec: {
                $divide: [
                    { $round: [ { $multiply: [ { $divide: ["$duration_ms", 1000] }, 10 ] }, 0 ] },
                    10
                ]
            },

            // 4.3 Умовна логіка для popularity_tier
            popularity_tier: {
                $switch: {
                    branches: [
                        { case: { $gte: ["$popularity", 70] }, then: "high" },
                        { case: { $gte: ["$popularity", 40] }, then: "medium" }, 
                        { case: { $lt: ["$popularity", 40] }, then: "low" }
                    ],
                    default: "unknown" //  дефолтне значення
                }
            }
        }
    },
    // step 5: Очищення зайвих полів 
    {
        $unset: [
            "artists_raw", "duration_ms", "danceability", "energy", "loudness", 
            "speechiness", "acousticness", "instrumentalness", "liveness", 
            "valence", "tempo", "key", "mode", "time_signature"
        ]
    },

    // step 6: Збереження результату в нову колекцію
    {
        $out: "tracks"
    }
];


// run the pipeline
print("Виконуємо агрегацію... ");
db.tracks_raw.aggregate(pipeline);
print("Трансформація успішно завершена!");

// step 7: Перевірка результату
const totalTracks = db.tracks.countDocuments();
print(`\n Всього документів у новій колекції tracks: ${totalTracks}`);

print("Приклад одного фінального документа:");
const sampleDoc = db.tracks.findOne();
printjson(sampleDoc);

