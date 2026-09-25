import json
import re
from datetime import datetime, timedelta, timezone

from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models import Delivery, Lead, Submission, User, WhatsAppMessage


def make_app(tmp_path, monkeypatch):
    monkeypatch.setenv('ADMIN_EMAIL', 'admin@test.local')
    monkeypatch.setenv('ADMIN_PASSWORD', 'TestPass123!')
    monkeypatch.delenv('ENGINE_DCARB_DOMAIN', raising=False)
    return create_app({'TESTING': True, 'SECRET_KEY': 'test',
                       'SQLALCHEMY_DATABASE_URI': 'sqlite:///' + str(tmp_path / 'portal.db')})


def admin_login(client):
    token = re.search(rb'name="csrf" value="([^"]+)"', client.get('/admin/login').data).group(1).decode()
    assert client.post('/admin/login', data={'csrf': token, 'email': 'admin@test.local',
                                            'password': 'TestPass123!'}).status_code == 302
    return token


def test_request_search_export_and_delete_owned_records(tmp_path, monkeypatch):
    app = make_app(tmp_path, monkeypatch)
    with app.app_context():
        lead = Lead(name='Battery Customer', phone='9000000000', form_json='{}', result_json='{}')
        db.session.add(lead)
        db.session.flush()
        expiry = datetime.now(timezone.utc) + timedelta(days=30)
        battery = Submission(site='batterywala', form_kind='quotation', name='Battery Customer',
                             phone='9000000000', email='battery@test.local', form_json='{"vehicle":"Alto"}',
                             result_json='{}', consented=True, lead_id=lead.id, expires_at=expiry)
        engine = Submission(site='engine_dcarb', form_kind='service', name='Engine Customer',
                            phone='9111111111', email='engine@test.local', form_json='{"vehicle":"Nexon"}',
                            result_json='{}', consented=True, expires_at=expiry)
        db.session.add_all([battery, engine])
        db.session.flush()
        battery_id, engine_id, lead_id = battery.id, engine.id, lead.id
        db.session.add(Delivery(lead_id=lead_id, channel='email', status='sent', target='battery@test.local'))
        delivery = Delivery(submission_id=engine_id, channel='whatsapp', status='accepted', target='919111111111')
        db.session.add(delivery)
        db.session.flush()
        db.session.add(WhatsAppMessage(message_id='wamid.test', submission_id=engine_id,
                                       delivery_id=delivery.id, status='accepted'))
        db.session.add(User(email='employee@test.local', password_hash=generate_password_hash('EmployeePass123!')))
        db.session.commit()
    client = app.test_client()
    token = admin_login(client)
    rows = client.get('/admin/submissions.json?site=batterywala&search=Alto').json
    assert rows['total'] == 1 and rows['rows'][0]['id'] == battery_id
    assert client.get('/admin/submissions.json?site=batterywala&search=Nexon').json['total'] == 0
    assert b'Delete request' in client.get('/admin?site=batterywala&search=Battery').data
    assert client.get('/admin/export.xlsx?site=batterywala&search=Missing').status_code == 200
    assert client.post(f'/admin/submissions/{engine_id}/delete', data={'csrf': 'bad', 'site': 'engine_dcarb'}).status_code == 400
    assert client.post(f'/admin/submissions/{engine_id}/delete', data={'csrf': token, 'site': 'batterywala'}).status_code == 400
    assert client.post(f'/admin/submissions/{engine_id}/delete', data={'csrf': token, 'site': 'engine_dcarb',
                        'search': 'Engine'}).status_code == 302
    with app.app_context():
        assert db.session.get(Submission, engine_id) is None
        assert WhatsAppMessage.query.count() == 0
        assert Delivery.query.filter_by(submission_id=engine_id).count() == 0
    assert client.post(f'/admin/submissions/{battery_id}/delete', data={'csrf': token, 'site': 'batterywala'}).status_code == 302
    with app.app_context():
        assert db.session.get(Submission, battery_id) is None
        assert db.session.get(Lead, lead_id) is None
        assert Delivery.query.filter_by(lead_id=lead_id).count() == 0
    employee = app.test_client()
    page = employee.get('/admin/login')
    employee_token = re.search(rb'name="csrf" value="([^"]+)"', page.data).group(1).decode()
    employee.post('/admin/login', data={'csrf': employee_token, 'email': 'employee@test.local',
                                        'password': 'EmployeePass123!'})
    assert employee.post(f'/admin/submissions/{battery_id}/delete',
                         data={'csrf': employee_token, 'site': 'batterywala'}).status_code == 403


def test_engine_seo_metadata_sitemap_and_canonical(tmp_path, monkeypatch):
    app = make_app(tmp_path, monkeypatch)
    client = app.test_client()
    page = client.get('/engine-d-carb')
    assert page.status_code == 200
    head = page.data.split(b'</head>', 1)[0]
    assert b'<link rel="canonical" href="http://localhost/engine-d-carb">' in head
    assert b'property="og:image"' in head and b'name="twitter:card"' in head
    assert head.count(b'"@type": "FAQPage"') == 1
    assert head.count(b'"@type": "Organization"') == 1
    sitemap = client.get('/sitemap.xml')
    assert sitemap.status_code == 200
    assert b'http://localhost/engine-d-carb</loc>' in sitemap.data
    assert b'Sitemap: http://localhost/sitemap.xml' in client.get('/robots.txt').data
    monkeypatch.setenv('ENGINE_DCARB_DOMAIN', 'enginedcarb.example')
    assert b'href="https://enginedcarb.example/"' in client.get('/engine-d-carb').data.split(b'</head>', 1)[0]
    assert client.get('/sitemap.xml', base_url='https://battery.example').status_code == 404
    assert b'https://enginedcarb.example/</loc>' in client.get('/sitemap.xml', base_url='https://enginedcarb.example').data
