"""Authenticated delivery callbacks; incoming chat content is not stored."""
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone

from flask import Blueprint, Response, jsonify, request
from flask_login import current_user, login_required
from . import db
from .models import Delivery, Submission, WhatsAppMessage

bp = Blueprint('whatsapp_webhook', __name__)
MAX_BYTES = 1024 * 1024
RANK = {'accepted': 0, 'sent': 1, 'failed': 1, 'delivered': 2, 'read': 3}


def sync_delivery(message):
    delivery = db.session.get(Delivery, message.delivery_id) if message.delivery_id else None
    if delivery:
        delivery.status = message.status
    submission = db.session.get(Submission, message.submission_id) if message.submission_id else None
    if submission:
        result = json.loads(submission.result_json or '{}')
        for item in result.get('whatsapp_delivery', []):
            if item.get('message_id') == message.message_id or item.get('detail') == message.message_id:
                item.update(message_id=message.message_id, status=message.status,
                            error_code=message.error_code,
                            detail=message.error_detail or f'Meta status: {message.status}')
        submission.result_json = json.dumps(result, ensure_ascii=False)


def track_message(message_id, delivery, submission):
    message = db.session.get(WhatsAppMessage, message_id)
    if not message:
        message = WhatsAppMessage(message_id=message_id, status='accepted')
        db.session.add(message)
    message.delivery_id, message.submission_id = delivery.id, submission.id
    sync_delivery(message)


def apply_status(status):
    message_id, state = status.get('id'), status.get('status')
    if not isinstance(message_id, str) or not 1 <= len(message_id) <= 255 or not isinstance(state, str) or state not in RANK:
        return
    try:
        timestamp = int(status.get('timestamp', 0))
        if not 0 <= timestamp <= 99999999999:
            return
    except (ValueError, TypeError):
        return
    message = db.session.get(WhatsAppMessage, message_id)
    if not message:
        delivery = Delivery.query.filter(Delivery.channel == 'whatsapp',
                                         Delivery.detail.endswith(message_id, autoescape=True)).first()
        submission = Submission.query.filter(Submission.site == 'engine_dcarb',
                                              Submission.result_json.contains(message_id, autoescape=True)).first()
        message = WhatsAppMessage(message_id=message_id, status='accepted', event_timestamp=0,
                                  delivery_id=delivery.id if delivery else None,
                                  submission_id=submission.id if submission else None)
        db.session.add(message)
    if timestamp < message.event_timestamp or RANK[state] < RANK[message.status]:
        return
    if timestamp == message.event_timestamp and message.status == 'failed' and state == 'sent':
        return
    errors = status.get('errors') or []
    error = errors[0] if isinstance(errors, list) and errors and isinstance(errors[0], dict) else {}
    error_data = error.get('error_data') or {}
    details = error_data.get('details') if isinstance(error_data, dict) else None
    message.status, message.event_timestamp = state, timestamp
    message.error_code = str(error['code'])[:40] if 'code' in error else None
    message.error_detail = str(details or error.get('message') or error.get('title') or '')[:2000] or None
    message.updated_at = datetime.now(timezone.utc)
    sync_delivery(message)


@bp.get('/api/whatsapp/webhook')
def verify_webhook():
    token = (os.getenv('WHATSAPP_VERIFY_TOKEN') or '').strip()
    if not token:
        return Response('Webhook verification is not configured.', status=503)
    supplied = request.args.get('hub.verify_token', '')
    if request.args.get('hub.mode') != 'subscribe' or not hmac.compare_digest(token.encode(), supplied.encode()):
        return Response('Forbidden', status=403)
    challenge = request.args.get('hub.challenge')
    if not challenge or len(challenge) > 1024:
        return Response('Invalid challenge', status=400)
    return Response(challenge, mimetype='text/plain')


@bp.post('/api/whatsapp/webhook')
def receive_webhook():
    secret = (os.getenv('WHATSAPP_APP_SECRET') or '').strip()
    if not secret:
        return Response('Webhook signature verification is not configured.', status=503)
    if request.content_length and request.content_length > MAX_BYTES:
        return Response('Payload too large', status=413)
    raw = request.get_data()
    if len(raw) > MAX_BYTES:
        return Response('Payload too large', status=413)
    expected = 'sha256=' + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected.encode(), request.headers.get('X-Hub-Signature-256', '').encode()):
        return Response('Invalid signature', status=403)
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or payload.get('object') != 'whatsapp_business_account':
        return Response('Invalid payload', status=400)
    entries = payload.get('entry', [])
    if not isinstance(entries, list):
        return Response('Invalid entries', status=400)
    phone_id = (os.getenv('WHATSAPP_PHONE_NUMBER_ID') or '').strip()
    for entry in entries:
        changes = entry.get('changes', []) if isinstance(entry, dict) else []
        if not isinstance(changes, list):
            continue
        for change in changes:
            if not isinstance(change, dict) or change.get('field') != 'messages':
                continue
            value = change.get('value')
            if not isinstance(value, dict):
                continue
            metadata = value.get('metadata', {})
            if not isinstance(metadata, dict) or not phone_id or metadata.get('phone_number_id') != phone_id:
                continue
            statuses = value.get('statuses', [])
            if isinstance(statuses, list):
                for status in statuses:
                    if isinstance(status, dict):
                        apply_status(status)
    db.session.commit()
    return jsonify(success=True)


@bp.get('/admin/whatsapp-deliveries.json')
@login_required
def delivery_statuses():
    if not current_user.is_admin:
        return Response('Forbidden', status=403)
    rows = db.session.query(WhatsAppMessage, Delivery).outerjoin(
        Delivery, WhatsAppMessage.delivery_id == Delivery.id).order_by(WhatsAppMessage.updated_at.desc()).limit(50).all()
    return jsonify(deliveries=[{
        'message_id': message.message_id, 'target': delivery.target if delivery else None,
        'submission_id': message.submission_id, 'status': message.status,
        'error_code': message.error_code, 'error_detail': message.error_detail,
        'updated_at': message.updated_at.isoformat(),
    } for message, delivery in rows])
