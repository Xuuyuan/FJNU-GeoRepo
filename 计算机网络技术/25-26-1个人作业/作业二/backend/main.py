from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "源站地址"}})

db_config = {
    'host': '数据库地址',
    'user': '数据库用户名',
    'password': '数据库密码',
    'db': 'gis',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db():
    return pymysql.connect(**db_config)

@app.route('/gisdata', methods=['GET'])
def get_data():
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM classmate ORDER BY ID DESC")
            return jsonify(cursor.fetchall())
    finally:
        conn.close()

@app.route('/gisdata', methods=['POST'])
def add_data():
    data = request.json
    conn = get_db()
    try:
        if not data['xuehao'].startswith('109092023') or len(data['xuehao']) != 11 or not data['xuehao'].isdigit():
            return jsonify({'status': 'error', 'message': '学号只能是以109092023开头的11位数字'}), 400
        elif not data['name'].startswith('小') or len(data['name']) > 4:
            return jsonify({'status': 'error', 'message': '姓名必须以“小”开头且不超过4个字'}), 400
        elif len(data['jiguan']) < 2 or len(data['jiguan']) > 6:
            return jsonify({'status': 'error', 'message': '籍贯长度必须在2到6个字之间'}), 400
        with conn.cursor() as cursor:
            sql = "INSERT INTO classmate(xuehao, name, jiguan) VALUES (%s, %s, %s)"
            cursor.execute(sql, (data['xuehao'], data['name'], data['jiguan']))
            conn.commit()
            return jsonify({'status': 'success'}), 201
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001)