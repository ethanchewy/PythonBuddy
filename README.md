# PythonBuddy 🖊️ 🐍 
Online Python 2.7 Programming with Live Pylint Syntax Checking!
![](ScreenshotPythonBuddy.gif)
<br>

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
###Customize
1) Fork github repo
<br>
2) Edit app.py to change any linting features

###Current Features:
<ul>
  <li>Live Syntax Checking
    <ul>
      <li>Uses Pylint as checker (only prints out errors and warnings)</li>
      <li>Live Error Table with Additional Help Suggestions</li>
    </ul>
  </li>
  <li>Syntax Highlighting</li>
  <li>Python 2.7 Complilation</li>
  <li>Search Within Code</li>
</ul>

###Future Goals:
- Make easily embeddable for MOOCs like edX and other education platform
- Lower CPU usage

###FAQ:
Why did you make this? <br>
I wanted to create an open source live python syntax checker to help beginning python programmers jump into python programming courses on MOOCs like edX without setting up a complicated python IDE. 

Has anyone created anything like this before? <br>
There has never been a live syntax checker for python online. Similar projects that are not "live" are http://pep8online.com/ and http://antares.sip.ucm.es/cesar/pylint/

Has can I contribute? <br>
You can star my repo, fork my repo, push a pull request, and/or open issues!

Where's the code for embedding it in MOOCs? <br>
I'm currently working on this over here (for edx specifically): https://github.com/ethanchewy/pybuddy2.0

I want the code to actually compile and run in a certain way?
If you want to actually execute the python look at my XBlock code: https://github.com/ethanchewy/pybuddy2.0 . Remember to sandbox the code with RestrictedPython or something.

###Credits:
This was made by Ethan Chiu as a research project under the guidance of Wellesley College professor Eni Mustafaraj.
