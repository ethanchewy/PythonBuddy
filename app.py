#Created by Ethan Chiu 10/25/16
from flask import Flask, render_template, request, jsonify
from pylint import lint
from astroid import MANAGER
from pylint.reporters.text import TextReporter
from subprocess import Popen, PIPE, STDOUT


app = Flask(__name__)
app.debug = True 

@app.route('/')
def hello_world():
    return render_template("index.html")

@app.route('/check_code')

def check_code():
    #Get textarea text from AJAX call
    text = request.args.get('text')

    #Open temp file which will be parsed
    f = open("temp.py","r+")
    f.seek(0)
    f.write(text)
    f.truncate()
    f.close()

    #Writable Object that will be used as a TextReporter
    class WritableObject(object):
        def __init__(self):
            self.content = []
        def write(self, st):
            self.content.append(st)
        def read(self):
            return self.content

    #Remember that you can configure with a seperate file for more specific limitations => --rcfile=/path/to/config.file . 
    #See http://stackoverflow.com/a/10138997/4698963
    #Add "--disable=R,C" to ARGs to print only errors & warnings
    ARGS = ["-r","n", "--disable=R,C","--msg-template={path}:{line}: [{msg_id}({symbol}), {obj}] {msg}"]

    pylint_output = WritableObject()

    #Run Pylint, textreporter will redirect to writable object
    lint.Run(["temp.py"]+ARGS, reporter=TextReporter(pylint_output), exit=False)
    pylint_list = pylint_output.content

    #Clear Cache. VERY IMPORTANT! This will make sure that there's no funky issues. See: http://stackoverflow.com/questions/2028268/invoking-pylint-programmatically#comment5393474_4803466 
    MANAGER.astroid_cache.clear()


    #Return json object, which is the pylint_output seperated by each newline
    return jsonify(pylint_list)
'''
@app.route('/get_help')
def help_code():
'''
@app.route('/run_code')

def run_code():
    print "run_test"
    cmd = 'python temp.py'
    p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
    output = p.stdout.read()

    return jsonify(output)

    

