import re
import sqlite3

from werkzeug.security import check_password_hash, generate_password_hash

from app import create_app, db
from app.models import EngineCentre, User


def app_for(tmp_path, monkeypatch):
    monkeypatch.setenv('ADMIN_EMAIL', 'admin@test.local')
    monkeypatch.setenv('ADMIN_PASSWORD', 'TestPass123!')
    return create_app({'TESTING': True, 'SECRET_KEY': 'test-secret',
                       'SQLALCHEMY_DATABASE_URI': 'sqlite:///' + str(tmp_path / 'app.db')})


def sign_in(client, email='admin@test.local', password='TestPass123!'):
    token = re.search(rb'name="csrf" value="([^"]+)"', client.get('/admin/login').data).group(1).decode()
    assert client.post('/admin/login', data={'csrf': token, 'email': email, 'password': password}).status_code == 302
    return token


def test_centre_create_edit_filter_and_employee_form(tmp_path, monkeypatch):
    app = app_for(tmp_path, monkeypatch)
    client = app.test_client()
    token = sign_in(client)
    response = client.post('/admin/engine-centres', data={
        'csrf': token, 'name': 'Pune East', 'address': 'Shop 8, Main Road', 'city': 'Pune', 'state': 'Maharashtra'})
    assert response.status_code == 302
    with app.app_context():
        centre = EngineCentre.query.filter_by(name='Pune East').one()
        centre_id, key = centre.id, centre.key
    assert client.get('/api/engine-d-carb/centres').json['centres'][-1]['key'] == key
    assert b'Pune East' in client.get('/admin?site=engine_dcarb&centre_city=Pune').data
    assert b'Chikalthana MIDC' not in client.get('/admin?site=engine_dcarb&centre_city=Pune').data.split(b'id="engine-centres"')[1].split(b'id="engine-admin-recipient"')[0]
    client.post(f'/admin/engine-centres/{centre_id}/edit', data={
        'csrf': token, 'name': 'Pune Central', 'address': 'Shop 9, Main Road', 'city': 'Pune', 'state': 'Maharashtra'})
    assert any(row['key'] == key and row['address'] == 'Shop 9, Main Road'
               for row in client.get('/api/engine-d-carb/centres').json['centres'])
    with app.app_context():
        db.session.add(User(email='employee@test.local', password_hash=generate_password_hash('EmployeePass123!')))
        db.session.commit()
    employee = app.test_client()
    sign_in(employee, 'employee@test.local', 'EmployeePass123!')
    page = employee.get('/portal').data
    assert b'name="selectedCentre"' in page
    assert b'name="emailQuote"' in page
    assert b'/static/employee-portal.js' in page
    assert b'Change password' in page
    assert employee.get('/account/password').status_code == 200
    quote = employee.post('/api/engine-d-carb/quotations', json={
        'enquiryType': 'service', 'customerName': 'Customer', 'servicePhone': '9876543210',
        'vehicleType': 'Car/SUV', 'vehicleBrand': 'Tata', 'vehicleModel': 'Nexon',
        'passingYear': '2022', 'fuelType': 'Petrol', 'engineCc': '1497',
        'kilometres': '45000', 'selectedCentre': key, 'consent': True})
    assert quote.status_code == 200 and quote.json['centre']['name'] == 'Pune Central'
    restarted = app_for(tmp_path, monkeypatch)
    with restarted.app_context():
        assert EngineCentre.query.filter_by(key=key).one().name == 'Pune Central'


def test_password_change_requires_email_code(tmp_path, monkeypatch):
    sent = []
    class SMTP:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def starttls(self): pass
        def login(self, *args): pass
        def send_message(self, message): sent.append(message)
    monkeypatch.setenv('SMTP_HOST', 'smtp.example.com')
    monkeypatch.setenv('SMTP_FROM', 'portal@example.com')
    monkeypatch.setattr('app.routes.smtplib.SMTP', SMTP)
    app = app_for(tmp_path, monkeypatch)
    client = app.test_client()
    token = sign_in(client)
    assert b'Change password' in client.get('/admin').data
    assert client.post('/account/password', data={'csrf': token, 'action': 'send_code',
                       'current_password': 'wrong'}).status_code == 302
    assert not sent
    client.post('/account/password', data={'csrf': token, 'action': 'send_code',
                'current_password': 'TestPass123!'})
    assert len(sent) == 1 and sent[0]['To'] == 'admin@test.local'
    code = re.search(r'\b[0-9]{8}\b', sent[0].get_content()).group()
    client.post('/account/password', data={'csrf': token, 'action': 'change',
                'current_password': 'TestPass123!', 'code': '00000000',
                'new_password': 'ChangedPassword123!', 'confirm_password': 'ChangedPassword123!'})
    with app.app_context():
        assert check_password_hash(User.query.filter_by(email='admin@test.local').one().password_hash, 'TestPass123!')
    client.post('/account/password', data={'csrf': token, 'action': 'change',
                'current_password': 'TestPass123!', 'code': code,
                'new_password': 'ChangedPassword123!', 'confirm_password': 'ChangedPassword123!'})
    with app.app_context():
        assert check_password_hash(User.query.filter_by(email='admin@test.local').one().password_hash, 'ChangedPassword123!')


def test_existing_centre_table_migrates_without_resetting_edits(tmp_path, monkeypatch):
    path = tmp_path / 'app.db'
    with sqlite3.connect(path) as connection:
        connection.execute('CREATE TABLE engine_centre (id INTEGER PRIMARY KEY, key VARCHAR(40) UNIQUE NOT NULL, name VARCHAR(120) NOT NULL, address VARCHAR(500) NOT NULL, sort_order INTEGER NOT NULL)')
        connection.execute("INSERT INTO engine_centre VALUES (1, 'chikalthana-midc', 'Edited legacy centre', 'Edited address', 1)")
    app = app_for(tmp_path, monkeypatch)
    with app.app_context():
        centre = EngineCentre.query.filter_by(key='chikalthana-midc').one()
        assert centre.name == 'Edited legacy centre'
        assert centre.address == 'Edited address'
        assert centre.city == 'Chhatrapati Sambhajinagar'
        assert centre.state == 'Maharashtra'
