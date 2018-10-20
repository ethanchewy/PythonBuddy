"""Created originally by Ethan Chiu 10/25/16
v2.0.0 created on 8/4/18
Complete redesign for efficiency and scalability
Uses Python 3 now
 """
from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO
import eventlet.wsgi
import tempfile
import mmap
import os
from datetime import datetime
from pylint import epylint as lint
from subprocess import Popen, PIPE, STDOUT
from multiprocessing import Pool, cpu_count

# Configure Flask App
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
socketio = SocketIO(app)

# Get number of cores for multiprocessing
num_cores = cpu_count()

@app.route('/')
def index():
    """Display home page
        :return: index.html

        Initializes session variables for tracking time between running code.
    """
    session["count"] = 0
    session["time_now"] = datetime.now()
    return render_template("index.html")

@app.route('/check_code', methods=['POST'])
def check_code():
    """Run pylint on code and get output
        :return: JSON object of pylint errors
            {
                {
                    "code":...,
                    "error": ...,
                    "message": ...,
                    "line": ...,
                    "error_info": ...,
                }
                ...
            }

        For more customization, please look at Pylint's library code:
        https://github.com/PyCQA/pylint/blob/master/pylint/lint.py
    """
    #Get textarea text from AJAX call
    text = request.form['text']

    # Session to handle multiple users at one time
    session["code"] = text
    text = session["code"]
    output = evaluate_pylint(text)

    # MANAGER.astroid_cache.clear()
    return jsonify(output)

# Run python in secure system
@app.route('/run_code', methods=['POST'])
def run_code():
    """Run python 3 code
        :return: JSON object of python 3 output
            {
                ...
            }
    """
    # Don't run too many times
    if slow():
        return jsonify("Running code too much within a short time period. Please wait a few seconds before clicking \"Run\" each time.")
    session["time_now"] = datetime.now()

    output = None
    cmd = 'python ' + session["file_name"]
    p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
    output = p.stdout.read()

    return jsonify(output.decode('utf-8'))

# Slow down if user clicks "Run" too many times
def slow():
    session["count"] += 1
    time = datetime.now() - session["time_now"]
    if float(session["count"]) / float(time.total_seconds()) > 5:
        return True
    return False

def evaluate_pylint(text):
    """Create temp files for pylint parsing on user code

    :param text: user code
    :return: dictionary of pylint errors:
        {
            {
                "code":...,
                "error": ...,
                "message": ...,
                "line": ...,
                "error_info": ...,
            }
            ...
        }
    """
    # Open temp file for specific session.
    # IF it doesn't exist (aka the key doesn't exist), create one
    try:
        session["file_name"]
        f = open(session["file_name"], "w")
        for t in text:
            f.write(t)
        f.flush()
    except Exception as e:
        with tempfile.NamedTemporaryFile(delete=False) as temp:
            session["file_name"] = temp.name
            for t in text:
                temp.write(t.encode("utf-8"))
            temp.flush()

    try:
        ARGS = " -r n --disable=R,C"
        (pylint_stdout, pylint_stderr) = lint.py_run(session["file_name"]+ARGS, return_std=True)
    except Exception as e:
        raise Exception(e)

    if pylint_stderr.getvalue():
        raise Exception("Issue with pylint configuration")

    formatted_dict = format_errors(pylint_stdout.getvalue())

    return formatted_dict

def process_error(error):
    """Formats error message into dictionary

        :param error: pylint error full text
        :return: dictionary of error as:
            {
                "code":...,
                "error": ...,
                "message": ...,
                "line": ...,
                "error_info": ...,
            }
    """
    # Return None if not an error or warning
    if error == " " or error is None:
        return None
    list_words = error.split()
    if len(list_words) < 3:
        return None
    if error.find("Your code has been rated at") > -1:
        return None

    # Linux would return error message with line number on position [1] 
    # and windows place line number on position [2]
    line_num = error.split(":")[1] if error.split(":")[1].isnumeric() else error.split(":")[2] 

    # list_words.pop(0)
    error_yet = False
    message_yet = False
    first_time = True
    i = 0
    # error_code=None
    length = len(list_words)
    while i < length:
        word = list_words[i]
        if (word == "error" or word == "warning") and first_time:
            error_yet = True
            first_time = False
            i += 1
            continue
        if error_yet:
            error_code = word[1:-1]
            error_string = list_words[i+1][:-1]
            i = i + 3
            error_yet = False
            message_yet = True
            continue
        if message_yet:
            full_message = ' '.join(list_words[i:length-1])
            break
        i += 1

    error_info = find_error(error_code)
    return {
        "code": error_code,
        "error": error_string,
        "message": full_message,
        "line": line_num,
        "error_info": error_info,
    }

def format_errors(pylint_text):
    """Format errors into parsable nested dictionary

    :param pylint_text: original pylint output
    :return: dictionary of errors as:
        {
            {
                "code":...,
                "error": ...,
                "message": ...,
                "line": ...,
                "error_info": ...,
            }
            ...
        }
    """
    errors_list = pylint_text.splitlines(True)

    # If there is not an error, return nothing
    if "--------------------------------------------------------------------" in errors_list[1] and \
    "Your code has been rated at" in errors_list[2] and "module" not in errors_list[0]:
        return None

    errors_list.pop(0)

    pylint_dict = {}
    try:
        pool = Pool(num_cores)
        pylint_dict = pool.map(process_error, errors_list)
    finally:
        pool.close()
        pool.join()
        return pylint_dict

    # count = 0
    # for error in errors_list:
    #     pylint_dict[count]=process_error(error)
    #     count +=1
    return pylint_dict

def find_error(id):
    """Find relevant info about pylint error

    :param id: pylint error id
    :return: returns error message description

    pylint_errors.txt is the result from "pylint --list-msgs"
    """
    file = open('pylint_errors.txt', 'r')
    s = mmap.mmap(file.fileno(), 0, access=mmap.ACCESS_READ)
    location = s.find(id.encode())
    if location != -1:
        search_text = s[location:]
        lines = search_text.splitlines(True)
        error_message = []
        for l in lines:
            if l.startswith(':'.encode()):
                full_message = b''.join(error_message)
                full_message = full_message.decode('utf-8')
                replaced = id+"):"
                full_message = full_message.replace(replaced, "")
                full_message = full_message.replace("Used", "Occurs")
                return full_message
            error_message.append(l)

    return "No information at the moment"

@socketio.on('disconnect', namespace='/check_disconnect')
def disconnect():
    """Remove temp file associated with current session"""
    os.remove(session["file_name"])

if __name__ == "__main__":
    """Initialize app"""
    socketio.run(app)
