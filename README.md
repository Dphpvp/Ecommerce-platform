After the pull you need to follow the following steps to work:

cd backend
pip install -r requirements.txt
venv\scripts\activate
python main.py

in a new terminal:

cd frontend
npm start

Enjoy!

## Creating an Admin User

To create an admin user, follow these steps:

1.  **Create a user account** through the registration page in the application.
2.  **Verify the user's email** by clicking the link in the verification email.
3.  **Run the `make_admin.py` script** from the `backend` directory, passing the user's email as an argument:

    ```bash
    python scripts/make_admin.py <user_email>
    ```

    For example:

    ```bash
    python scripts/make_admin.py admin@example.com
    ```

This will grant admin privileges to the specified user.
