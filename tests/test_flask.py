import os
import unittest
import tempfile
from PythonBuddy.app import app

class FlaskrTestCase(unittest.TestCase):

    def setUp(self):
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.testing = True
        self.app = app.test_client()
        with app.app_context():
            pass

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])


    def test_index(self):
        """ Tests a request to index returns a 200 status code.
        """
        result = self.app.get('/')    
        self.assertEqual(result.status_code, 200)


    def test_check_code(self):
        """  
        Tests the /check_code endpoint can handle an empty payload.
        """ 
        response = self.app.post("/check_code")
        self.assertEqual(result.status_code, 200)


    def test_check_code(self):
        """ Tests the response json object
        from /check_code returns the documented JSON object.
        """
        response = self.app.post("/check_code", data={"text": "TEST_INPUT"})
        self.assertIsInstance(response.json, dict)

    def test_run_code_index_setup_no_check_code(self):
        """ Tests making a request
        directly to /run_code after hitting
        / but not /check_code does not raise Index errors
        due to session keys not being set.
        """
        response = self.app.get("/")
        response = self.app.post("/run_code")
        self.assertIsInstance(response.json,dict)

    def test_run_code_no_index_setup(self):
        """ Tests making a request
        directly to /run_code before hitting
        /index does not raise Index errors
        due to session keys not being set.
        """
        response = self.app.post("/run_code")
        self.assertIsInstance(response.json,dict)


if __name__ == '__main__':
    unittest.main()
