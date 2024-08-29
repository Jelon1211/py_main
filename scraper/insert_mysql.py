import pymysql
from db import get_connection

def insert_article(title, content):
    print(content)
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            sql = "CALL scrapper__articles__insert(%s, %s)"
            cursor.execute(sql, (title, content))
        connection.commit()
    finally:
        connection.close()
