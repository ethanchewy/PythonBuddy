from flask import Flask, render_template, request, jsonify
from StringIO import StringIO
from pylint import lint
from pylint.reporters.text import ParseableTextReporter
import contextlib
import cStringIO
import sys
import os
import tempfile
import re

#from pyflakes import api
import pyflakes.api



app = Flask(__name__)
app.debug = True 
class WritableObject:
    def __init__(self):
        self.content = []
    def write(self, string):
        self.content.append(string)
@app.route('/')
def hello_world():
    return render_template("index.html")

@app.route('/check_code')

def check_code():
    f = open("error_test.py","r+")

    text = request.args.get('text')

    f.seek(0)
    f.write(text)
    f.truncate()
    f.close()

    #TODO: format file correctly
    pylint_output = WritableObject()
    args = ["-r", "n", "error_test.py"]

    pylint = lint.Run(args, reporter=ParseableTextReporter(pylint_output), exit=False)
    
    pylint_list = pylint_output.content

    #for l in pylint_list:
        #print l

    #errors = "\n".join(pylint_list)

    return jsonify(pylint_list)
    

