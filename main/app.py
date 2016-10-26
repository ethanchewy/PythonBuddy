from flask import Flask, render_template, request, jsonify
from StringIO import StringIO
from pylint import lint
from astroid import MANAGER
from pylint.reporters.text import ParseableTextReporter
from pylint.reporters.text import TextReporter
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

@app.route('/')
def hello_world():
    return render_template("index.html")

@app.route('/check_code')

def check_code():
    
            
    text = request.args.get('text')

    f = open("error_test.py","r+")
    f.seek(0)
    f.write(text)
    f.truncate()
    f.close()

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
    
    ARGS = ["-r","n", "--disable=R,C"]
    

    pylint_output = WritableObject()
    lint.Run(["error_test.py"]+ARGS, reporter=TextReporter(pylint_output), exit=False)
    pylint_list = pylint_output.content

    #Clear Cache
    MANAGER.astroid_cache.clear()



    return jsonify(pylint_list)
    

