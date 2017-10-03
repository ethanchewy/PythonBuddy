# How to Deploy PythonBuddy as your own Server
Based off of https://blog.marksteve.com/deploy-a-flask-application-inside-a-digitalocean-droplet/

### Digital Ocean

1. Create DigitalOcean Droplet with the following features: `14.04 Ubuntu x64` any Size. *Choose the closest region*

2. After Droplet is created, ssh into the droplet:
    ```bash
    ssh root@<DROPLET_PUBLIC_IP_ADDRESS>
    ```

3. Add User called `deploy`:
    ```bash
    useradd -r -m -s /bin/bash deploy
    ```

4. Install `pip` and `easy_install`
    ```bash
    apt-get install python-setuptools
    ```
    ```bash
    easy_install -U pip
    ```

5. Install `virtualenv`
    ```bash
    pip install virtualenv
    ```

6. Install `git`
    ```bash
    apt-get install git
    ```

7. Switch to the `deploy` user
    ```bash
    su - deploy
    ```

8. Clone `PythonBuddy` repo and change to that repo
    ```bash
    git clone https://github.com/ethanchewy/OnlinePythonLinterSyntaxChecker
    cd OnlinePythonLinterSyntaxChecker
    ```

9. Make sure you are in the `OnlinePythonLinterSyntaxChecker` directory and install/activate `virualenv`
    ```bash
    virtualenv venv
    source venv/bin/activate
    ```

10. Install requirements and `gunicorn`
    ```bash
    pip install -r requirements.txt
    pip install gunicorn
    ```

11. Press `Ctrl-D` which will change you to root. Install `nginx`
    ```bash
    apt-add-repository ppa:nginx/stable
    apt-get update
    apt-get install nginx
    ```

12. Configure `nginx` to point to gunicorn
    ```bash
    nano /etc/nginx/conf.d/flask-app.conf
    ```

13. Add this to configuration file:
    ```bash
    server {
        listen 80;

        server_name _;

         access_log  /var/log/nginx/access.log;
         error_log  /var/log/nginx/error.log;

        location / {
            proxy_pass         http://127.0.0.1:8000/;
            proxy_redirect     off;

            proxy_set_header   Host             $host;
            proxy_set_header   X-Real-IP        $remote_addr;
            proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        }
    }
    ```

14. Disable default Nginx Welcome Page
    ```bash
    nano /etc/nginx/nginx.conf
    ```

15. Comment out this line: `include /etc/nginx/sites-enabled/`; Reload Nginx: `service nginx reload`

16. Login back as deploy and load virtualenv
    ```bash
    su - deploy
    cd OnlinePythonLinterSyntaxChecker
    source venv/bin/activate
    ```

17. Run as daemon by default: `gunicorn -D app:app`

**Now Everything Should be working! Just go to your ip address!**
