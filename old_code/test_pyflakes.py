import pyflakes.api

text_example = """print hello world \n"""

def check(text):
	pyflakes.api.check(text,"test.py")

check(text_example)