"""Expose the admin and employee workspaces through one portal tunnel."""
import os

from flask import redirect, request

from app import create_app


if 'graph.facebook.com' not in os.getenv('NO_PROXY', '').lower().split(','):
    os.environ['NO_PROXY'] = ','.join(filter(None, (os.getenv('NO_PROXY'), 'graph.facebook.com')))

app = create_app()


@app.before_request
def restrict_to_portal():
    path = request.path
    if path == '/':
        return redirect('/admin/login')
    if path in {'/admin', '/portal', '/account/password'} or path.startswith('/admin/'):
        return None
    if path in {'/static/portal.css', '/static/portal-updates.css', '/static/admin-portal.js', '/static/employee-portal.js'}:
        return None
    if path in {'/api/form-schemas', '/api/engine-d-carb/centres'} and request.method == 'GET':
        return None
    if path in {'/api/quotations', '/api/engine-d-carb/quotations'} and request.method == 'POST':
        return None
    return 'Not found', 404


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8002, debug=False)
