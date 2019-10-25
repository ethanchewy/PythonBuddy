import unittest
from PythonBuddy.app import *

class TestProcessingFunctions(unittest.TestCase):
    # def test_evaluate_pylint(self):
    #     test_code = "def foo(bar, baz):\n   pass\nfoo(42)"
    #     self.assertNotEqual(evaluate_pylint(test_code), {})

    # def test_slow(self):
    #     self.assertFalse(slow())

    def test_format_errors(self):
        # self.assertEqual(format_errors(""), {})
        test_errors="************* Module tmp9utinlsg\r\n \/tmp\/tmp9utinlsg:1: warning (W0613, unused-argument, foo) Unused argument 'bar'\r\n \/tmp\/tmp9utinlsg:1: warning (W0613, unused-argument, foo) Unused argument 'baz'\r\n \/tmp\/tmp9utinlsg:3: error (E1120, no-value-for-parameter, ) No value for argument 'baz' in function call\r\n \r\n ----------------------------------------------------------------------\r\n Your code has been rated at -13.33\/10 (previous run: -13.33\/10, +0.00)\r\n \r\n \r\n"
        self.assertEqual(format_errors(test_errors), [{'code': 'W0613', 'error': 'unused-argument', 'message': 'Unused argument', 'line': '1', 'error_info': ' \r  Occurs when a function or method argument is not used.\r'}, {'code': 'W0613', 'error': 'unused-argument', 'message': 'Unused argument', 'line': '1', 'error_info': ' \r  Occurs when a function or method argument is not used.\r'}, {'code': 'E1120', 'error': 'no-value-for-parameter', 'message': "No value for argument 'baz' in function", 'line': '3', 'error_info': ' \r  Occurs when a function call passes too few arguments.\r'}, None, None, None, None, None])
        self.assertEqual(format_errors("\n\n"), [None])

    def test_process_error(self):
        test_error = " \/tmp\/tmp9utinlsg:3: error (E1120, no-value-for-parameter, ) No value for argument 'baz' in function call\r\n"
        print(process_error(test_error))
        self.assertEqual(process_error(test_error), {'code': 'E1120', 'error': 'no-value-for-parameter', 'message': "No value for argument 'baz' in function", 'line': '3', 'error_info': ' \r  Occurs when a function call passes too few arguments.\r'})
        self.assertEqual(process_error(None), None)
        self.assertEqual(process_error(""), None)

    def test_no_errors(self):
        """ Asserts format_errors function returns None when
        

        """
        test_error = "\r\n--------------------------------------------------------------------\r\n"\
        "Your code has been rated at 10.00/10 (previous run: 9.33/10, +0.67)"

        self.assertEqual(
            format_errors(test_error),
            None
        )

if __name__ == '__main__':
    unittest.main()
