from tinydb import TinyDB, Query
from app.config import settings
import os

# Ensure data directory exists
os.makedirs(os.path.dirname(settings.database_path), exist_ok=True)

db = TinyDB(settings.database_path)

# Table definitions
users_table = db.table('users')
questions_table = db.table('questions')
answers_table = db.table('answers')
votes_table = db.table('votes')
tags_table = db.table('tags')
notifications_table = db.table('notifications')

def init_database():
    """Initialize database with default data if needed"""
    pass