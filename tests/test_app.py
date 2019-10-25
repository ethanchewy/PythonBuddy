from datetime import datetime
import flask
import unittest
from unittest.mock import patch
from PythonBuddy.app import *
from os import path


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


class TestCodeRunning(unittest.TestCase):
    def setUp(self):
        self.code_example = "for i in range(5):\n    print(i)\n"
        self.code_example_modified = "print(\"Oh hai Mark\")"
        self.error_message = [
            {
                "code": self.code_example,
                "error": "",
                "message": "",
                "line": "",
                "error_info": "",
            }
        ]

    @patch('PythonBuddy.app.evaluate_pylint')
    def test_check_code_endpoint_no_evaluate_pylint(self, evaluate_pytlint_patch):
        """Test the check code endpoint
        :param self: instance of the current test.
        :param evaluate_pytlint_patch: patch of the os in the evaluate_pytlint
            testing this separately.
        """
        evaluate_pytlint_patch.return_value = self.error_message
        with app.test_client() as test_client:
            check_code_page = test_client.post('/check_code', data={
                    "text": self.code_example
                })
            self.assertEqual(check_code_page.status, '200 OK')
            self.assertTrue('code' in flask.session)
            self.assertEqual(flask.session['code'], self.code_example)

    @patch('PythonBuddy.app.slow')
    def test_run_code_slow(self, slow_patch):
        """Test that when code is running too much
        :param self: instance of current test
        :param slow_patch: path the slow method, test separately
        """
        slow_patch.return_value = True
        test_client = app.test_client()
        check_run_code = test_client.post('/run_code', data={})
        self.assertEqual(check_run_code.status, '200 OK')
        self.assertTrue(b"Running code too much" in check_run_code.data)

    def test_evaluate_pylint_test_file_creation_deletion_and_contents(self):
        """Test the evaluate pylint method in depth.
        :param self: instance of the current test.

        first check if the file will get created (keyerror thrown)
        second check if code in file will get modified
        """
        with app.test_client() as test_client:
            test_client.get('/') # this will set the count
            test_client.post('/check_code', data={
                "text": self.code_example
            })

            # first test
            # this will check that the exception is raised and
            # a new file is created
            test_client.post('/run_code')
            self.assertTrue('file_name' in flask.session)

            # this will check that the exception is raised and
            # a new file is created
            test_client.post('/check_code', data={
                "text": self.code_example_modified
            })
            # check the code is modified
            temp_code_file = open(flask.session['file_name'], "r")
            self.assertEqual(temp_code_file.read(), self.code_example_modified)

    def test_if_file_created_and_deleted(self):
        """Test if the file will get created and deleted.
        :param self: instance of the current test.
        """
        with app.test_client() as test_client:

            test_client.post('/check_code', data={
                "text": self.code_example
            })
            # check if the file still exists
            self.assertTrue(path.exists(flask.session['file_name']))
            remove_temp_code_file()

            # ensure file is deleted
            self.assertFalse(path.exists(flask.session['file_name']))
