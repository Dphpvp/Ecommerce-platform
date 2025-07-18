import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.core.database import get_database

async def make_admin(email: str):
    """
    Grants admin privileges to a user with the given email.
    """
    db = get_database()
    user = await db.users.find_one({"email": email.lower()})

    if not user:
        print(f"Error: User with email '{email}' not found.")
        return

    if user.get("is_admin"):
        print(f"User '{email}' is already an admin.")
        return

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_admin": True}}
    )
    print(f"Successfully granted admin privileges to '{email}'.")

if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

    if len(sys.argv) != 2:
        print("Usage: python backend/scripts/make_admin.py <user_email>")
        sys.exit(1)

    user_email = sys.argv[1]
    asyncio.run(make_admin(user_email))
