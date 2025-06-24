from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/detect/strict', methods=['POST'])
def detect_strict():
    # Always return a dummy detection
    return jsonify({
        "success": True,
        "objects": [
            {"label": "suitcase", "confidence": 0.99, "box": [100, 100, 200, 200]}
        ]
    })

@app.route('/', methods=['GET'])
def index():
    return "Dummy Detection API is running!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True) 