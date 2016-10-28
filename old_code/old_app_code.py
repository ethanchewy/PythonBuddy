from flask import Flask, render_template, request, jsonify
from StringIO import StringIO
from pylint import epylint as lint
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
    #stdout_ = sys.stdout #Keep track of the previous value.
    #stream = cStringIO.StringIO()
    #sys.stdout = stream
    
    text = request.args.get('text')

    sys.stdout=open("test.txt","w")
    #print ("hello")
    pyflakes.api.check(text,"test.py")
    #sys.stdout.close()

    return "done"

    # Store the reference, in case you want to show things again in standard output
    '''
    old_stdout = sys.stdout
     
    # This variable will store everything that is sent to the standard output
    
    result = StringIO()
     
    sys.stdout = result

    pyflakes.api.check(text,"test.py")

    sys.stdout = old_stdout

    result_string = result.getvalue()
    print result_string
    f = open( 'test.txt', 'w' )
    f.write( result_string )
    f.close()
    '''
    '''
    output = StringIO()
    pyflakes.api.check(text,"test.py")
    print output.getvalue()
    return jsonify(output.getvalue())
    '''
    #sys.stdout=open("test.txt","w")
    #print ("hello")
    #pyflakes.api.check(text,"test.py")
    #sys.stdout.close()

    #redirect print and get result

    #sys.stdout = stdout_ # restore the previous stdout.
    #variable = stream.getvalue()  # This will get the "hello" string inside the variable
    #print print_result
    '''
    with redirected(stdout='test.txt'):
        print pyflakes.api.check(text,"test.py")
    print 'Hello again'
    '''
    #test pyflakes
    #example_text = "for i in sadfdfs: hello world"
    #print api.check(example_text,"test.py")
    
    #print "text_json_1"
    #print api.check(text,"test.py")
    #print text_json
    #print "text_json_2"
    #text_2 = api.check(text,"test.py")
    ''
    class WritableObject:
        def __init__(self):
            self.content = []
        def write(self, string):
            self.content.append(string)
    
    
    args = ["-r", "n", "--disable=R,C", "error_test.py"]
    pylint_output = WritableObject()
    lint.Run(args, reporter=ParseableTextReporter(pylint_output), exit=False)
    '''
    #print pylint_output.content
    #pylint_list = pylint_output.content

    #for l in pylint_list:
        #print l

    #errors = "\n".join(pylint_list)

    #return jsonify(text_2)
    (pylint_stdout, pylint_stderr) = lint.py_run("error_test.py",return_std= True,stdout="results.txt",stderr="results2.txt")

    print pylint_stdout
    print pylint_stderr

