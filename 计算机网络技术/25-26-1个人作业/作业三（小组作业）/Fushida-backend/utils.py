from flask import jsonify
import hashlib
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad
import base64

class Message():
    def __init__(self, type, msg, data):
        self.type = type
        self.msg = msg
        self.data = data

    @staticmethod
    def success(msg="成功", data=None):
        return jsonify({'code': 1, 'msg': msg, 'data': data}), 200

    @staticmethod
    def fail(msg="失败", data=None):
        return jsonify({'code': 0, 'msg': msg, 'data': data}), 200
    
    @staticmethod
    def fail_nobind(msg="未绑定账号", data=None):
        return jsonify({'code': 1001, 'msg': msg, 'data': data}), 200
    
    @staticmethod
    def fail_2fa(msg="需要进行下一步操作", data=None):
        return jsonify({'code': 1002, 'msg': msg, 'data': data}), 200

def db_add_salt(username: str, password: str) -> str:
    salt = "涉及隐私信息，略"
    salted_string = f"{username}:{salt}:{password}"
    sha256 = hashlib.sha256()
    sha256.update(salted_string.encode('utf-8'))
    salted_string = sha256.hexdigest()
    print(salted_string)
    return salted_string

def db_encrypt_pwd(username: str, password: str) -> str:
    salt = f"涉及隐私信息，略:{username}"
    key = hashlib.sha256(salt.encode('utf-8')).digest()
    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(pad(password.encode('utf-8'), AES.block_size))
    return base64.b64encode(iv + ciphertext).decode('utf-8')
    
def db_decrypt_pwd(username: str, encrypted_password: str) -> str:
    salt = f"涉及隐私信息，略:{username}"
    encrypted_data = base64.b64decode(encrypted_password)
    iv = encrypted_data[:16]
    ciphertext = encrypted_data[16:]
    key = hashlib.sha256(salt.encode('utf-8')).digest()
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_password = cipher.decrypt(ciphertext)
    # 去除填充
    pad_len = padded_password[-1]
    password = padded_password[:-pad_len].decode('utf-8')
    return password