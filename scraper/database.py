import pymysql
import config

class DatabaseManager:
    def __init__(self):
        self.connection = None

    def connect(self):
        """Establish a database connection."""
        if not self.connection:
            self.connection = pymysql.connect(
                host=config.DB_HOST,
                port=config.DB_PORT,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                db=config.DB_NAME,
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=10,
                read_timeout=10,
                write_timeout=10
            )

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            self.connection = None

    def execute_query(self, query, params=None):
        """Execute a query that doesn't return any results (e.g., INSERT, UPDATE, DELETE)."""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                self.connection.commit()
        except Exception as e:
            print(f"An error occurred: {e}")
            self.connection.rollback()

    def fetch_all(self, query, params=None):
        """Execute a query and fetch all results (e.g., SELECT)."""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    def fetch_one(self, query, params=None):
        """Execute a query and fetch a single result."""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
