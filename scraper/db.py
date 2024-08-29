import pymysql

def get_connection():
    connection = pymysql.connect(
        host='db',
        user='root',
        password='scrap_db',
        database='rootpassword',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection
