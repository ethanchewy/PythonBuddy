from datetime import datetime
import flask
import unittest
from unittest.mock import patch
from PythonBuddy.app import *


class TestIndexPage(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_index(self):
        index_page = self.app.get('/')
        self.assertEqual(index_page.status, '200 OK')
        self.assertTrue(b'Python Linter Online' in index_page.data)

    @patch('datetime.datetime')
    def test_index_session(self, datetime_mock):
        current_time = datetime(2019, 10, 7, 13, 46, 33, 824712)
        datetime_mock.now.return_value = current_time
        with app.test_client() as test_client:
            index_page = test_client.get('/')

            self.assertEqual(flask.session['count'], 0)
            self.assertEqual(flask.session['time_now'].date(),
                             current_time.date())


class TestUtilities(unittest.TestCase):
    @patch('PythonBuddy.app.os')
    def test_is_os_linux(self, os_name_patch):
        os_name_patch.name = "nt"
        self.assertFalse(is_os_linux())

        os_name_patch.name = "ubuntu :)"
        self.assertTrue(is_os_linux())
