from dotenv import load_dotenv
import os

# Wczytanie zmiennych z pliku .env
load_dotenv()

# Pobranie konfiguracji bazy danych
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT"))
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
