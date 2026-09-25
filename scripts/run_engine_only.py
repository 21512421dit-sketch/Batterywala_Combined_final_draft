import os

from flask import request

from app import create_app
from app.portal import engine_site_response


# Local previews may inherit an unreachable proxy. Keep Meta reachable for form delivery.
if 'graph.facebook.com' not in os.getenv('NO_PROXY', '').lower().split(','):
    os.environ['NO_PROXY'] = ','.join(filter(None, (os.getenv('NO_PROXY'), 'graph.facebook.com')))

app = create_app()


@app.before_request
def restrict_to_engine_dcarb():
    path = request.path
    if path == '/':
        return engine_site_response()
    if path in {
        '/engine-d-carb', '/engine-d-carb/privacy-policy',
        '/engine-d-carb/terms-and-conditions', '/privacy', '/data-deletion',
        '/sitemap.xml', '/robots.txt',
    }:
        return None
    if path in {
        '/api/engine-d-carb/centres',
        '/api/engine-d-carb/quotations',
        '/api/whatsapp/webhook',
    }:
        return None
    if path.startswith('/static/engine-') or path == '/static/images/batterywala-logo-original.png':
        return None
    return 'Not found', 404


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8001, debug=False)
