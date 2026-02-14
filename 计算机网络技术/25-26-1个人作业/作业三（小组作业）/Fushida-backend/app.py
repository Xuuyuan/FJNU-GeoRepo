from flask import Flask, request
from flask_jwt_extended import (JWTManager, jwt_required, create_access_token, get_jwt_identity)
from flask_cors import CORS
from extensions import db
from models import User, Tapp, Announcements
from utils import Message, db_add_salt, db_encrypt_pwd, db_decrypt_pwd
from fustar import Fustar, encrypt_password
import base64, re
from io import BytesIO
from urllib.parse import urlparse, parse_qs
from PIL import Image
from pyzbar.pyzbar import decode as zbar_decode
import cv2
import numpy as np
import uuid
app = (Flask(__name__))
app.config['JWT_SECRET_KEY'] = '涉及隐私信息，略'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400
jwt = JWTManager(app)
tickets = {}
username = 'root'
password = '1234'
hostname = 'localhost'
port = '3306'
database = 'fustar_web'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{username}:{password}@{hostname}:{port}/{database}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
CORS(app)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/user/register', methods=['POST'])
def register():
    data = request.get_json()
    # 检查用户是否已存在
    if not data.get('username') or not data.get('password'):
        return Message.fail("缺少参数")
    elif len(data['username']) < 4 or len(data['password']) < 6:
        return Message.fail("用户名或密码长度不符合要求")
    elif User.query.filter_by(username=data['username']).first():
        return Message.fail("该用户已存在")

    new_user = User(username=data['username'], password=db_add_salt(data['username'], data['password']))
    db.session.add(new_user)
    db.session.commit()

    return Message.success("注册成功！")


@app.route('/user/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('username') or not data.get('password'):
        return Message.fail("缺少参数")
    elif len(data['username']) < 4 or len(data['password']) < 6:
        return Message.fail("用户名或密码长度不符合要求")
    user_query = User.query.filter_by(username=data['username'], password=db_add_salt(data['username'], data['password'])).first()
    if not user_query:
        return Message.fail("账号或密码错误")
    access_token = create_access_token(identity=user_query.username)
    return Message.success("", {"access_token": access_token, "username": user_query.username, "is_bound": user_query.is_bound})

@app.route('/user/changePassword', methods=['POST'])
@jwt_required()
def change_password():
    """修改密码，参数：old_password, new_password"""
    user_name = get_jwt_identity()
    user = User.query.filter_by(username=user_name).first()
    data = request.get_json()
    if not data.get('old_password') or not data.get('new_password'):
        return Message.fail("缺少参数")
    elif data.get('old_password') == data.get('new_password'):
        return Message.fail("新密码不能与原密码相同（验证侧）")
    elif user.password != db_add_salt(user.username, data['old_password']):
        return Message.fail("原密码错误")
    elif db_add_salt(user.username, data['new_password']) == user.password:
        return Message.fail("新密码不能与原密码相同")
    user.password = db_add_salt(user.username, data['new_password'])
    db.session.commit()
    return Message.success("密码修改成功")

@app.route('/fustar/login', methods=['POST'])
@jwt_required()
def fustar_login():
    user_name = get_jwt_identity()
    data = request.get_json()
    user = User.query.filter_by(username=user_name).first()
    fustar = Fustar()
    res = fustar.login(data.get('fustar_username', None), data.get('fustar_password', None))
    if res.get("data").get("deviceChange"):
        user.fustar_username = data.get('fustar_username', None)
        user.fustar_password = db_encrypt_pwd(data.get('fustar_username', None), data.get('fustar_password', None))
        db.session.commit()
        return Message.fail_2fa("检测到设备变更，需要进行下一步操作")
    if res.get('meta').get('code') == 0:
        user.fustar_username = data.get('fustar_username', None)
        user.fustar_password = db_encrypt_pwd(data.get('fustar_username', None), data.get('fustar_password', None))
        user.fustar_token = res.get('data').get('userToken')
        user.fustar_userid = res.get('data').get('memberId')
        user.fustar_sno = res.get('data').get('sno')
        user.is_bound = 1
        db.session.commit()
        return Message.success("成功绑定到角色: " + res.get('data').get('memberName'))
    else:
        return Message.fail(res.get('meta').get('message'))


@app.route('/fustar/login_get_captha', methods=['POST'])
@jwt_required()
def fustar_login_get_captha():
    data = request.get_json()
    fustar = Fustar()
    res = fustar.login_get_captha(data.get('fustar_username', None))
    return Message.success("", res)


@app.route('/fustar/login_send_vericode', methods=['POST'])
@jwt_required()
def fustar_login_send_vericode():
    data = request.get_json()
    fustar = Fustar()
    res = fustar.login_send_vericode(data.get('fustar_username', None), data.get('graphic_code', None))
    return Message.success("", res)


@app.route('/fustar/login_by_sms', methods=['POST'])
@jwt_required()
def fustar_login_by_sms():
    data = request.get_json()
    fustar = Fustar()
    res = fustar.login_by_sms(data.get('fustar_username', None), data.get('code', None))
    if res.get('meta').get('code') == 0:
        user = User.query.filter_by(username=get_jwt_identity()).first()
        user.fustar_token = res.get('data').get('userToken')
        user.fustar_userid = res.get('data').get('userId', res.get('data').get('memberId'))
        user.fustar_sno = res.get('data').get('sno')
        user.is_bound = 1
        db.session.commit()
    return Message.success("", res)

@app.route('/fustar/generate_ticket', methods=['POST'])
@jwt_required()
def fustar_generate_ticket():
    ''' 生成用于绑定福Star账号的临时ticket 参数: 无 '''
    user_name = get_jwt_identity()
    ticket = str(uuid.uuid4())
    tickets[ticket] = user_name
    return Message.success("", {"ticket": ticket})

@app.route('/fustar/login_by_token', methods=['POST'])
def fustar_login_by_token():
    ''' 通过已有Token绑定福Star 参数: ticket, fustar_token'''
    # 验证基本参数
    data = request.get_json()
    ticket = data.get('ticket', None)
    fustar_token = data.get('fustar_token', None)
    if not ticket or not fustar_token:
        return Message.fail("缺少参数")
    # 验证ticket有效性
    if ticket not in tickets:
        return Message.fail("无效的 ticket")
    username = tickets.pop(ticket)
    # 获取code
    fustar = Fustar()
    code_json = fustar.getcode(fustar_token)
    if code_json.get("meta", {}).get("code") != 0:
        return Message.fail(code_json.get("meta", {}).get("message", "获取code失败"))
    # 从code获取用户信息
    code = code_json.get("data", None)
    userinfo_json = fustar.getuserinfo(code)
    if userinfo_json.get("meta", {}).get("code") != 0:
        return Message.fail(userinfo_json.get("meta", {}).get("message", "获取用户信息失败"))
    fustar_userid = userinfo_json.get("data", {}).get("memberId", None)
    fustar_username = userinfo_json.get("data", {}).get("mobile", None)
    fustar_sno = userinfo_json.get("data", {}).get("pstuNo", None)
    # 进行绑定
    user = User.query.filter_by(username=username).first()
    user.fustar_token = fustar_token
    user.fustar_userid = fustar_userid
    user.fustar_sno = fustar_sno
    user.fustar_username = fustar_username
    user.is_bound = 1
    db.session.commit()
    return Message.success()

@app.route('/fustar/getaap', methods=['POST'])
@jwt_required()
def fustar_getaap():
    fustar = Fustar()
    user = User.query.filter_by(username=get_jwt_identity()).first()
    if user.is_bound == 0:
        return Message.fail_nobind()
    res = fustar.getaap(user.fustar_token, user.fustar_userid, user.fustar_username)
    if res.get("code") == "0":
        app_list = res.get("data",[]).get("targetPath",[]).get("tapp",[])[-1].get("preLoadApps", [])
        tapp = Tapp.query.all()
        for i in tapp:
            app_list.append({"appId": i.id, "appCategory": i.app_category, "name": i.name, "appUrl": i.app_url, "icon": i.icon})
        return Message.success(res.get("message"), app_list)
    elif res.get("code") == "600062":
        return Message.fail_nobind("账号下线，需要重新绑定账号", [])
    else:
        return Message.fail(res.get("message"), [])

@app.route('/get_announcements', methods=['POST'])
@jwt_required()
def get_announcements():
    fustar = Fustar()
    announcements = Announcements.query.order_by(Announcements.time.desc()).all()
    ann_list = []
    for i in announcements:
        ann_list.append({"id": i.id, "title": i.title, "origin": i.origin, "time": i.time.strftime("%Y-%m-%d %H:%M:%S"), "url": i.url, "content": i.content})
    return Message.success("", ann_list)

@app.route('/fustar/get_qrcode', methods=['POST'])
@jwt_required()
def fustar_get_qrcode():
    fustar = Fustar()
    user = User.query.filter_by(username=get_jwt_identity()).first()
    if user.is_bound == 0:
        return Message.fail_nobind()
    res = fustar.getcert(user.fustar_token, user.fustar_sno)
    if res.get("code") != 0:
        if res.get("code") == -1:
            return Message.fail_nobind("无效Token，需要重新绑定账号")
        return Message.fail(res.get("message"))
    vcardno = res.get("data").get("cert").get("vCardNo")
    res_qrcode = fustar.getqrcode(user.fustar_token, user.fustar_sno, vcardno)
    if res_qrcode.get("code") != 0:
        return Message.fail(res_qrcode.get("message"))
    return Message.success("获取成功", res_qrcode.get("data").get("qrCode"))


@app.route('/fustar/scan_qrcode', methods=['POST'])
@jwt_required()
def fustar_scan_qrcode():
    data = request.get_json()
    fustar = Fustar()
    user = User.query.filter_by(username=get_jwt_identity()).first()
    if user.is_bound == 0:
        return Message.fail_nobind()
    img = data.get('img')
    # img为图片的base64编码
    if not img:
        return Message.fail("缺少图片参数")

    # 支持 data:image/...;base64,xxx 或 直接 base64 字符串
    try:
        b64 = img.split(',', 1)[1] if ',' in img else img
        img_bytes = base64.b64decode(b64)
    except Exception:
        return Message.fail("无法解析图片数据")

    qr_text = None

    try:
        pil_img = Image.open(BytesIO(img_bytes)).convert("RGB")
        decoded = zbar_decode(pil_img)
        if decoded:
            qr_text = decoded[0].data.decode('utf-8')
    except Exception:
        qr_text = qr_text

    if not qr_text:
        try:
            arr = np.frombuffer(img_bytes, np.uint8)
            mat = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            detector = cv2.QRCodeDetector()
            data_decoded, _, _ = detector.detectAndDecode(mat)
            if data_decoded:
                qr_text = data_decoded
        except Exception:
            qr_text = qr_text

    if not qr_text:
        return Message.fail("未检测到二维码或无法解码")

    # 尝试从 URL 中提取 uuid 参数
    uuid_val = None
    try:
        parsed = urlparse(qr_text)
        qs = parse_qs(parsed.query)
        uuid_list = qs.get('uuid') or qs.get('UUID') or qs.get('Uuid')
        if uuid_list:
            uuid_val = uuid_list[0]
        else:
            m = re.search(r'uuid=([0-9a-fA-F-]+)', qr_text)
            if m:
                uuid_val = m.group(1)
    except Exception:
        uuid_val = None

    if not uuid_val:
        return Message.fail("二维码中未包含uuid")

    secret_sno = encrypt_password(user.fustar_sno)
    res = fustar.scanqrcode(user.fustar_token, secret_sno, uuid_val)
    if res.get("code") != 0:
        return Message.fail(res.get("message"))
    return Message.success()

@app.route('/fustar/unbind', methods=['POST'])
@jwt_required()
def fustar_unbind():
    user = User.query.filter_by(username=get_jwt_identity()).first()
    if user.is_bound == 0:
        return Message.fail("尚未绑定福Star账号")
    user.is_bound = 0
    user.fustar_username = None
    user.fustar_password = None
    user.fustar_token = None
    user.fustar_userid = None
    user.fustar_sno = None
    db.session.commit()
    return Message.success("解除福Star账号绑定成功")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
