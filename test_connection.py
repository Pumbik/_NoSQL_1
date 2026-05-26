import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

print("⏳ Спроба підключення до MongoDB Atlas...")

try:
    # serverSelectionTimeoutMS=5000 означає, що скрипт видасть помилку через 5 секунд
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    
    # Відправляємо спеціальну команду 'ping' до бази admin
    client.admin.command('ping')
    
    print("✅ УСПІХ! Ви успішно підключені до MongoDB Atlas!")
except Exception as e:
    print("❌ ПОМИЛКА ПІДКЛЮЧЕННЯ:")
    print(e)