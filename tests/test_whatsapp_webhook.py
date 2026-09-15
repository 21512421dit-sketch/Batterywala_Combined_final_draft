import hashlib
import hmac
import json

from app import db
from app.models import Delivery, Submission, WhatsAppMessage
from test_portal import make_app
from app.portal import retention_expiry


def test_signed_delivery_callbacks(tmp_path, monkeypatch):
    monkeypatch.setenv('WHATSAPP_APP_SECRET', 'test-secret')
    monkeypatch.setenv('WHATSAPP_VERIFY_TOKEN', 'test-verify')
    monkeypatch.setenv('WHATSAPP_PHONE_NUMBER_ID', '123')
    app = make_app(tmp_path)
    client = app.test_client()
    assert client.get('/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test-verify&hub.challenge=456').data == b'456'
    assert client.get('/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=456').status_code == 403
    with app.app_context():
        delivery = Delivery(channel='whatsapp', target='919876543210', status='accepted')
        submission = Submission(site='engine_dcarb', form_kind='service', form_json='{}',
                                result_json=json.dumps({'whatsapp_delivery': [{'message_id': 'wamid.test'}]}), consented=True,
                                expires_at=retention_expiry())
        db.session.add_all([delivery, submission])
        db.session.flush()
        db.session.add(WhatsAppMessage(message_id='wamid.test', delivery_id=delivery.id, submission_id=submission.id))
        db.session.commit()

    def post(state, timestamp, phone='123', signed=True):
        payload = {'object': 'whatsapp_business_account', 'entry': [{'changes': [{'field': 'messages', 'value': {
            'metadata': {'phone_number_id': phone}, 'statuses': [{'id': 'wamid.test', 'status': state,
            'timestamp': str(timestamp), 'errors': [{'code': 131049, 'error_data': {'details': 'Delivery rejected'}}]}]}}]}]}
        raw = json.dumps(payload).encode()
        signature = 'sha256=' + hmac.new(b'test-secret', raw, hashlib.sha256).hexdigest()
        return client.post('/api/whatsapp/webhook', data=raw, content_type='application/json',
                           headers={'X-Hub-Signature-256': signature if signed else 'invalid'})

    assert post('failed', 10, signed=False).status_code == 403
    assert post('failed', 10, phone='other').status_code == 200
    assert post('failed', 10).status_code == 200
    with app.app_context():
        assert Delivery.query.first().status == 'failed'
        result = json.loads(Submission.query.first().result_json)['whatsapp_delivery'][0]
        assert result['error_code'] == '131049'
        assert result['detail'] == 'Delivery rejected'
    assert post('delivered', 20).status_code == 200
    assert post('sent', 30).status_code == 200
    assert post([], 40).status_code == 200
    with app.app_context():
        assert Delivery.query.first().status == 'delivered'
    assert client.get('/admin/whatsapp-deliveries.json').status_code == 302
