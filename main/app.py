from flask import Flask, render_template, request, jsonify
app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template("index.html")
    
@app.route('/check_code')
def check_code():
    text = request.args.get('text')
    return jsonify(text)
