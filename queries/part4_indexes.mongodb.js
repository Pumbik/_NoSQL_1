db = db.getSiblingDB("spotify");

// Завдання 1. Аналіз запиту та індексація

db = db.getSiblingDB("spotify");

print("1. Аналіз запиту ДО створення індексу:");
const explainBefore = db.tracks.find({
    track_genre: "pop",
    "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

// ключові метрики для аналізу
print(`Метод пошуку: ${explainBefore.queryPlanner.winningPlan.stage}`);
print(`Перевірено документів: ${explainBefore.executionStats.totalDocsExamined}`);
print(`Час виконання (мс): ${explainBefore.executionStats.executionTimeMillis}`);

print("\n 2. Створюємо складений індекс за правилом ESR...");
db.tracks.createIndex({ 
    track_genre: 1, 
    popularity: -1,  //1 - ASC, -1 - DESC
    "audio_features.danceability": 1 
});
print("Індекс успішно створено!");

print("\n 3. Аналіз запиту ПІСЛЯ створення індексу:");
const explainAfter = db.tracks.find({
    track_genre: "pop",
    "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

print(`Метод пошуку: ${explainAfter.queryPlanner.winningPlan.stage}`);
print(`Перевірено документів: ${explainAfter.executionStats.totalDocsExamined}`);
print(`Час виконання (мс): ${explainAfter.executionStats.executionTimeMillis}`);

//  якщо треба поекспериментувати ще раз
// db.tracks.dropIndex("track_genre_1_popularity_-1_audio_features.danceability_1");



// Завдання 2. Індекс для інших полів

db = db.getSiblingDB("spotify");

print("Завдання 2. Індекс для фонової музики:");

print("1. Створюємо складений індекс за правилом ESR...");
// explicit --> першим (Equality), інші - наступними (Range)
db.tracks.createIndex({ 
    "explicit": 1, 
    "audio_features.instrumentalness": 1, 
    "audio_features.speechiness": 1 
});
print("\n Індекс успішно створено!");

print("\n 2. Аналіз запиту з використанням індексу:");

const explainBackground = db.tracks.find({
    "explicit": false,
    "audio_features.instrumentalness": { $gte: 0.5 },
    "audio_features.speechiness": { $lte: 0.1 }
}).explain("executionStats");

// невеличка перевірка, щоб спробавати дістати глибинний метод пошуку.
let stage = explainBackground.queryPlanner.winningPlan.stage;
if (stage === "FETCH") {
    stage = explainBackground.queryPlanner.winningPlan.inputStage.stage;
}

// ключові показники
print(`Метод пошуку бази даних: ${stage} (Якщо тут IXSCAN — індекс працює ідеально!)`);
print(`Реально знайдено документів (nReturned): ${explainBackground.executionStats.nReturned}`);
print(`Перевірено документів у базі (totalDocsExamined): ${explainBackground.executionStats.totalDocsExamined}`);
print(`Час виконання (мс): ${explainBackground.executionStats.executionTimeMillis}`);


// Завдання 3. Покривний запит
db.tracks.find({
  track_genre: "pop",
  popularity: { $gte: 70 }
});
// Питання: Чи є цей запит покривним (covered query)? Надайте розгорнуту та обґрунтовану відповідь у файлі README