from subprocess import Popen, PIPE

proc = Popen("python test_pyflakes.py", stdout=PIPE, stderr=PIPE)
out, err = proc.communicate()

print out