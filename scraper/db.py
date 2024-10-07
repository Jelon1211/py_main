import pymysql

def get_connection():
    connection = pymysql.connect(
        host='db',
        user='root',
        password='password',
        database='scrap_db',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

# hello123