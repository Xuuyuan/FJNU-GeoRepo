import requests
import base64
from Crypto.Cipher import DES
from Crypto.Util.Padding import pad, unpad
SECRET_KEY = b"18a9d512c03745a791d92630bc0888f6"
IV = b"95620149"


def encrypt_password(password: str) -> str:
    try:
        key = SECRET_KEY[:8]
        cipher = DES.new(key, DES.MODE_CBC, IV)
        password_bytes = password.encode('utf-8')
        padded_password = pad(password_bytes, DES.block_size)
        ciphertext_bytes = cipher.encrypt(padded_password)
        encrypted_string = base64.b64encode(ciphertext_bytes).decode('utf-8')

        return encrypted_string
    except Exception as e:
        print(f"加密出错: {e}")
        return password


class Fustar:
    def __init__(self):
        self.headers = {
            "Accept": "application/json; charset=utf-8",
            "deviceId": "涉及隐私信息，略",
            "deviceName": "ALA-AN70",
            "platform": "android",
            "platformLogin": "EMUI",
            "platformVersion": "",
            "appVersion": "1.9.2",
            "toonType": "210",
            "personToken": "",
            "Authorization": "",
            "secretKey": "1",
            "Content-Type": "application/json; charset=utf-8",
            "Host": "org.app.fjnu.edu.cn",
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip",
            "User-Agent": "okhttp/4.2.2"
        }

        self.headers_getaap = {
            "X-Toon-Type": "210",
            "X-Platform": "android",
            "X-App-Version": "1.9.2",
            "Accept": "application/json;charset=UTF-8",
            "X-Toon-User-Agent": "platform:android,appVersion:1.9.2,toonType:210,deviceId:涉及隐私信息，略",
            "Content-Type": "application/json; charset=UTF-8",
            "Host": "org.app.fjnu.edu.cn",
            "Connection": "Keep-Alive",
            "User-Agent": "okhttp/4.2.2",
            "Accept-Encoding": "gzip, deflate, br"
        }

        self.headers_fsdqrcode = {
            "userToken": "",
            "sno": "",
            "Accept": "application/json;charset=UTF-8",
            "X-Toon-User-Agent": "platform:android,appVersion:1.9.2,toonType:210,deviceId:涉及隐私信息，略",
            "personToken": "",
            "Content-Type": "application/json; charset=UTF-8",
            "Host": "fsdqrcode.app.fjnu.edu.cn",
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip",
            "User-Agent": "okhttp/4.2.2"
        }
        
        self.headers_fsdauthorize = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": "okhttp/4.2.2",
            "Connection": "keep-alive",
            "Content-Type": "application/json"
        }

    # 初始化时设置personToken
    def set_person_token(self, person_token: str):
        self.headers["personToken"] = person_token
        self.headers["Authorization"] = person_token

    def login(self, fustar_username: str, fustar_password: str) -> dict:
        encoded_fustar_password = encrypt_password(fustar_password)
        payload = {"acount": fustar_username, "pwd": encoded_fustar_password}
        response = requests.post("https://org.app.fjnu.edu.cn/openplatform//toon/auth/loginByPwd", json=payload, headers=self.headers)
        return response.json()

    def login_get_captha(self, fustar_username: str):
        querystring = {"mobile": fustar_username}
        response = requests.get("https://org.app.fjnu.edu.cn/openplatform/toon/auth/getJcaptchaCode", headers=self.headers, params=querystring)
        return response.json()

    def login_send_vericode(self, fustar_username: str, graphic_code: str):
        payload = {"graphicCode": graphic_code, "optionType": "login", "templeType": "0", "username": fustar_username, "veriType": "sms"}
        response = requests.post("https://org.app.fjnu.edu.cn/openplatform/toon/auth/sendVeriCode", headers=self.headers, json=payload)
        return response.json()

    def login_by_sms(self, fustar_username: str, code: str):
        payload = {"code": code, "mobile": fustar_username}
        response = requests.post("https://org.app.fjnu.edu.cn/openplatform//toon/auth/loginBySms", headers=self.headers, json=payload)
        return response.json()

    def getaap(self, fustar_token: str, fustar_userid: str, fustar_username: str):
        payload = {"phone": fustar_username, "toonType": "220", "userId": fustar_userid, "token": fustar_token}
        response = requests.post("https://org.app.fjnu.edu.cn/workbench/taip/avoidLogin/getAAP", headers=self.headers_getaap, json=payload)
        return response.json()

    def getcert(self, fustar_token: str, fustar_sno: str):
        self.headers_fsdqrcode["personToken"] = fustar_token
        self.headers_fsdqrcode["userToken"] = fustar_token
        self.headers_fsdqrcode["sno"] = fustar_sno
        payload = {"bizType": "1", "pubKey": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
        response = requests.post("https://fsdqrcode.app.fjnu.edu.cn/virtual-card/member/getCertificate", headers=self.headers_fsdqrcode, json=payload)
        return response.json()

    def getqrcode(self, fustar_token: str, fustar_sno: str, vcardno: str):
        self.headers_fsdqrcode["personToken"] = fustar_token
        self.headers_fsdqrcode["userToken"] = fustar_token
        self.headers_fsdqrcode["sno"] = fustar_sno
        payload = {"vCardNo": vcardno, "studNo": fustar_sno, "busNo": fustar_sno}
        response = requests.post("https://fsdqrcode.app.fjnu.edu.cn/member/generateQRCode", headers=self.headers_fsdqrcode, json=payload)
        return response.json()
    
    def getcode(self, fustar_token: str):
        querystring = {"personToken": fustar_token}
        response = requests.get("https://org.app.fjnu.edu.cn/openplatform/toon/auth/getCode", headers=self.headers, params=querystring)
        return response.json()
    
    def getuserinfo(self, code: str):
        self.headers["code"] = code
        response = requests.get("https://org.app.fjnu.edu.cn/openplatform/toon/open/getUserInfo", headers=self.headers)
        return response.json()
    
    def scanqrcode(self, fustar_token: str, fustar_secret_sno: str, qrcode_uuid: str):
        self.headers["personToken"] = fustar_token
        self.headers["userToken"] = fustar_token
        payload = {"uuid": qrcode_uuid, "secrectSno": fustar_secret_sno}
        response = requests.post("https://org.app.fjnu.edu.cn/openplatform/g/qrcode/authorize", headers=self.headers, json=payload)
        print(response.text)
        return response.json()