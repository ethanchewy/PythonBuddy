from RestrictedPython import compile_restricted
from RestrictedPython.PrintCollector import PrintCollector
from RestrictedPython.Guards import safe_builtins
restricted_globals = dict(__builtins__ = safe_builtins)
#_print_ = PrintCollector

result = printed

print "hello world"
    