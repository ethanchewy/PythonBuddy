#-*- encoding: utf8 -*-

import pep8
import StringIO
import sys
import os
import tempfile
import re


def template_pep8(temp):
    return {'type': temp[3][1],
            'code': temp[3][2:5],
            'line': temp[1],
            'place': temp[2],
            'text': temp[3][6:]}


def template_results(temp):
    return {'type': temp[0][0],
            'code': temp[0][1:],
            'line': temp[1],
            'place': temp[2],
            'text': temp[3]}


def pep8parser(strings, temp_dict_f=template_pep8):
    """
    Convert strings from pep8 results to list of dictionaries
    """
    result_list = []
    for s in strings:
        temp = re.findall(r"(.+?):(.+?):(.+?):(.*)", s)
        if temp and len(temp[0]) >= 4:
            result_list.append(temp_dict_f(temp[0]))
    return result_list


def check_text(text, temp_dir, logger=None):
    """
    check text for pep8 requirements
    """
    #prepare code
    code_file, code_filename = tempfile.mkstemp(dir=temp_dir)
    with open(code_filename, 'w') as code_file:
        code_file.write(text.encode('utf8'))
        #initialize pep8 checker
    pep8style = pep8.StyleGuide(parse_argv=False, config_file=False)
    options = pep8style.options
    #redirect print and get result
    temp_outfile = StringIO.StringIO()
    sys.stdout = temp_outfile
    checker = pep8.Checker(code_filename, options=options)
    checker.check_all()
    sys.stdout = sys.__stdout__
    result = temp_outfile.buflist[:]
    #clear all
    temp_outfile.close()
    code_file.close()
    os.remove(code_filename)
    fullResultList = pep8parser(result)
    fullResultList.sort(key=lambda x: (int(x['line']), int(x["place"])))
    if logger:
        logger.debug(result)
    return fullResultList


def is_py_extension(filename):
    return ('.' in filename) and (filename.split('.')[-1] == 'py')

if __name__ == '__main__':
    pass