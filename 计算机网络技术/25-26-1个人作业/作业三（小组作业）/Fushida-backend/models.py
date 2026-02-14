from extensions import db
from datetime import datetime, UTC


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_bound = db.Column(db.Integer, default=0)
    fustar_username = db.Column(db.String(100), nullable=True)
    fustar_password = db.Column(db.String(100), nullable=True)
    fustar_userid = db.Column(db.String(6), nullable=True)
    fustar_sno = db.Column(db.String(20), nullable=True)
    fustar_token = db.Column(db.Text, nullable=True)
    create_time = db.Column(db.DateTime, default=datetime.now(UTC))
    update_time = db.Column(db.DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))

    def __repr__(self):
        return f'<User {self.username}>'

class Tapp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    app_category = db.Column(db.String(50), nullable=True)
    name = db.Column(db.String(100), nullable=True)
    app_url = db.Column(db.Text, nullable=True)
    icon = db.Column(db.Text, nullable=True)
    
class Announcements(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=True)
    origin = db.Column(db.String(10), nullable=True)
    time = db.Column(db.DateTime, default=datetime.now(UTC))
    url = db.Column(db.Text, nullable=True)
    content = db.Column(db.String(200), nullable=True)