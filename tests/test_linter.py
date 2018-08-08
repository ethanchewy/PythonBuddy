import unittest
from app import *

class TestPylint(unittest.TestCase):

    def test_pylint(self):
        test_code_1 = "print(\"hello world\")"
        self.assertEqual(app.check_code(test_code_1), '{}')

    def test_isupper(self):
        self.assertTrue('FOO'.isupper())
        self.assertFalse('Foo'.isupper())

    def test_split(self):
        s = 'hello world'
        self.assertEqual(s.split(), ['hello', 'world'])
        # check that s.split fails when the separator is not a string
        with self.assertRaises(TypeError):
            s.split(2)

if __name__ == '__main__':
    unittest.main()
