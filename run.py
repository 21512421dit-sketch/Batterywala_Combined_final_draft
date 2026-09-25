import os

from app import create_app

# Local runs may inherit an unreachable proxy; WhatsApp delivery needs Meta directly.
if 'graph.facebook.com' not in os.getenv('NO_PROXY', '').lower().split(','):
    os.environ['NO_PROXY'] = ','.join(filter(None, (os.getenv('NO_PROXY'), 'graph.facebook.com')))

app=create_app()
if __name__=='__main__': app.run(host='0.0.0.0',port=8000,debug=False)
