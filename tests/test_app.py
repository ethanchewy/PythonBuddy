from datetime import datetime
import flask
import unittest
from unittest.mock import patch
from PythonBuddy.app import *


class TestIndexPage(unittest.TestCase):
    def test_index(self):
        """Test the index page that it is displayed
        :param self: instance of the current test.
        """
        test_client = app.test_client()
        index_page = test_client.get('/')
        self.assertEqual(index_page.status, '200 OK')
        self.assertTrue(b'Python Linter Online' in index_page.data)

    def test_index_session(self):
        """Test the flask session on the index page.
        :param self: instance of the current test.
        """
        with app.test_client() as test_client:
            index_page = test_client.get('/')

            self.assertTrue('count' in flask.session)
            self.assertTrue('time_now' in flask.session)


class TestUtilities(unittest.TestCase):
    @patch('PythonBuddy.app.os')
    def test_is_os_linux(self, os_name_patch):
        """Test the linux check in the PythonBuddy app
        :param self: instance of the current test.
        :param os_name_patch: patch of the os in the pybuddy app
        """
        os_name_patch.name = "nt"
        self.assertFalse(is_os_linux())

        os_name_patch.name = "ubuntu :)"
        self.assertTrue(is_os_linux())
