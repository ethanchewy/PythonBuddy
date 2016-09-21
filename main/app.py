from flask import Flask, render_template, request, jsonify
#from pyflakes import api
app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template("index.html")
    
@app.route('/check_code')
def check_code():
    print "hello"

    #test pyflakes
    #example_text = "for i in sadfdfs: hello world"
    #print api.check(example_text,"test.py")

    text = request.args.get('text')
    return jsonify(text)
