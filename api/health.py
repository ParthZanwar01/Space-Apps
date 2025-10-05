from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Space Debris Analyzer API is running',
        'version': '1.0.0'
    })

# Vercel serverless function entry point
def handler(request):
    return app(request.environ, lambda *args: None)
