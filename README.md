# PythonBuddy
Pylint Online + Skulpt. Made for python beginners and python educators.
Demo: <a href="http://17chiue.pythonanywhere.com/">http://17chiue.pythonanywhere.com/</a>
![](ScreenshotPythonBuddy.gif)
###Usage
1) Fetch from repo:
  ```
  git clone https://github.com/ethanchewy/PythonBuddy.git
  ```
2) Create virtualenv based on your own system:
  ```
  mkvirtualenv --python=/usr/bin/python2.7 venv
  ```
3) Activate vitrual environment:
  ```
  source venv/bin/activate
  ```
4) Pipe requirements to venv folder:
  ```
  pip install -r requirements.txt
  ```
5) Set FLASK_APP variable:
  ```
  export FLASK_APP=app.py
  ```
6) Run flask app:
  ```
  flask run
  ```
###Customizability
###Current Features:
<ul>
  <li>Live Syntax Checking
    <ul>
      <li>Uses Pylint as checker (only prints out errors and warnings)</li>
    </ul>
  </li>
  <li>Syntax Highlighting</li>
  <li>Complilation</li>
</ul>

###Future Goals:
- Make easily embeddable for MOOCs like edX and other education platform
- Lower CPU usage
