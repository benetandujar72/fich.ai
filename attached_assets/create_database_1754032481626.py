"""
Script per crear la base de dades SQLite a partir de l'esquema definint les
taules i les relacions. Aquest script es pot executar a Replit o qualsevol
entorn Python amb sqlite3 instal·lat.

Executa'l així:
    python create_database.py

Es crearà un fitxer 'database.db' i les taules definides a 'db_schema.sql'.
"""

import sqlite3
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent / "db_schema.sql"
DB_PATH = Path(__file__).resolve().parent / "database.db"


def create_db():
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(schema_sql)
        conn.commit()
        print(f"S'ha creat la base de dades a {DB_PATH} amb l'esquema definit.")
    finally:
        conn.close()


if __name__ == "__main__":
    create_db()