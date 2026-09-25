"""Editable values passed into the original approved Engine D-Carb WhatsApp templates.

Meta owns the fixed body text and placeholder count. Each format here supplies one
existing body parameter, in the same order as the approved template.
"""
import json
import os
import re
from string import Formatter

from . import db
from .models import EngineWhatsAppTemplate


TEMPLATES = {
    'service_customer': {
        'label': 'Service enquiry · customer', 'env': 'WHATSAPP_CUSTOMER_TEMPLATE',
        'default_name': 'engine_dcarb_service_quote',
        'fields': ['customer_name', 'vehicle', 'cost', 'centre_name', 'centre_address', 'centre_phone'],
        'parameters': [
            ('Customer name', '{customer_name}'),
            ('Vehicle', '{vehicle}'),
            ('Indicative cost', '{cost}'),
            ('Selected centre', '{centre_name} | Address: {centre_address} | Contact: {centre_phone}'),
        ],
    },
    'service_centre': {
        'label': 'Service enquiry · centre head', 'env': 'WHATSAPP_CENTRE_TEMPLATE',
        'default_name': 'engine_dcarb_new_service_lead',
        'fields': ['customer_name', 'customer_phone', 'vehicle', 'cost', 'centre_name', 'submitted_at'],
        'parameters': [
            ('Customer name', '{customer_name}'), ('Customer phone', '{customer_phone}'),
            ('Vehicle', '{vehicle}'), ('Indicative cost', '{cost}'),
            ('Centre and submission', '{centre_name} | Submitted: {submitted_at}'),
        ],
    },
    'service_admin': {
        'label': 'Service enquiry · admin', 'env': 'WHATSAPP_ADMIN_TEMPLATE',
        'default_name': 'engine_dcarb_new_service_lead',
        'fields': ['customer_name', 'customer_phone', 'vehicle', 'kilometres', 'service_details',
                   'cost', 'centre_name', 'centre_address', 'centre_heads', 'submitted_at'],
        'parameters': [
            ('Customer name', '{customer_name}'), ('Customer phone', '{customer_phone}'),
            ('Vehicle and notes', '{vehicle} | Kilometres: {kilometres} | Other details: {service_details}'),
            ('Indicative cost', '{cost}'),
            ('Centre and submission', '{centre_name} | Address: {centre_address} | Centre head: {centre_heads} | Submitted: {submitted_at}'),
        ],
    },
    'machine_customer': {
        'label': 'Centre enquiry · customer', 'env': 'WHATSAPP_MACHINE_CUSTOMER_TEMPLATE',
        'default_name': 'engine_dcarb_machine_enquiry_confirmation',
        'fields': ['representative_name', 'company_address'],
        'parameters': [('Representative', '{representative_name}'), ('Company and address', '{company_address}')],
    },
    'machine_admin': {
        'label': 'Centre enquiry · admin', 'env': 'WHATSAPP_MACHINE_ADMIN_TEMPLATE',
        'default_name': 'engine_dcarb_admin_machine_lead',
        'fields': ['representative_name', 'machine_phone', 'machine_email', 'company_address',
                   'business_details', 'machine_city', 'machine_pin', 'machine_details', 'submitted_at'],
        'parameters': [
            ('Enquiry details', 'Representative: {representative_name} | WhatsApp: {machine_phone} | Email: {machine_email} | Company & address: {company_address} | Business details: {business_details} | Location: {machine_city} — {machine_pin} | Other details: {machine_details} | Submitted: {submitted_at}'),
        ],
    },
    'machine_admin_spaced': {
        'label': 'Centre enquiry · admin (spaced)',
        'env': 'WHATSAPP_MACHINE_ADMIN_SPACED_TEMPLATE',
        'default_name': 'engine_dcarb_admin_centre_lead_v2',
        'fields': ['representative_name', 'machine_phone', 'machine_email', 'company_address',
                   'business_details', 'machine_city', 'machine_pin', 'machine_details', 'submitted_at'],
        'parameters': [
            ('Representative', '{representative_name}'),
            ('WhatsApp', '{machine_phone}'),
            ('Email', '{machine_email}'),
            ('Company and address', '{company_address}'),
            ('Business experience', '{business_details}'),
            ('City', '{machine_city}'),
            ('PIN code', '{machine_pin}'),
            ('Other details', '{machine_details}'),
            ('Submitted at', '{submitted_at}'),
        ],
    },
}


def default_name(key):
    spec = TEMPLATES[key]
    if key == 'service_admin' and not (os.getenv(spec['env']) or '').strip():
        return (os.getenv('WHATSAPP_CENTRE_TEMPLATE') or spec['default_name']).strip()
    return (os.getenv(spec['env']) or spec['default_name']).strip()


def template_settings():
    saved = {item.key: item for item in EngineWhatsAppTemplate.query.all()}
    settings = []
    for key, spec in TEMPLATES.items():
        record = saved.get(key)
        defaults = [format_text for _, format_text in spec['parameters']]
        try:
            formats = json.loads(record.parameter_formats_json) if record else defaults
            if not isinstance(formats, list) or len(formats) != len(defaults):
                formats = defaults
        except (TypeError, ValueError):
            formats = defaults
        settings.append({'key': key, 'label': spec['label'],
                         'name': record.template_name if record else default_name(key),
                         'fields': spec['fields'],
                         'parameters': [{'label': label, 'format': value}
                                        for (label, _), value in zip(spec['parameters'], formats)]})
    return settings


def validate_format(value, allowed_fields):
    if not value or len(value) > 1000:
        raise ValueError('Each parameter must contain 1–1,000 characters.')
    if '\n' in value or '\r' in value or '\t' in value or '     ' in value:
        raise ValueError('Meta template parameters cannot contain line breaks, tabs or five consecutive spaces.')
    try:
        parts = list(Formatter().parse(value))
    except ValueError as exc:
        raise ValueError('Check the braces in each parameter.') from exc
    for _, field, format_spec, conversion in parts:
        if field is not None and (field not in allowed_fields or format_spec or conversion):
            raise ValueError('Use only the listed fields inside single braces.')


def save_template(key, name, formats):
    spec = TEMPLATES.get(key)
    if not spec:
        raise ValueError('Unknown WhatsApp template.')
    if not re.fullmatch(r'[a-z0-9_]{1,120}', name):
        raise ValueError('Template name must use lowercase letters, numbers and underscores.')
    if len(formats) != len(spec['parameters']):
        raise ValueError('The approved template requires its existing number of parameters.')
    for value in formats:
        validate_format(value, spec['fields'])
    record = db.session.get(EngineWhatsAppTemplate, key)
    if record:
        record.template_name = name
        record.parameter_formats_json = json.dumps(formats, ensure_ascii=False)
    else:
        db.session.add(EngineWhatsAppTemplate(key=key, template_name=name,
                                              parameter_formats_json=json.dumps(formats, ensure_ascii=False)))
    db.session.commit()


def render_template_parameters(key, values):
    setting = next(item for item in template_settings() if item['key'] == key)
    clean_values = {name: re.sub(r'\s+', ' ', str(value)).strip() for name, value in values.items()}
    parameters = [re.sub(r'\s+', ' ', item['format'].format_map(clean_values)).strip()[:1024]
                  for item in setting['parameters']]
    return setting['name'], parameters


def render_spaced_parameters(name, fields, values):
    """Use one clean field per placeholder in the approved replacement layouts."""
    return name, [re.sub(r'\s+', ' ', str(values[field])).strip()[:1024] for field in fields]
