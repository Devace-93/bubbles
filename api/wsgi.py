"""Gunicorn / `flask run` entry point: `wsgi:app`."""

from bubbles_api import create_app

app = create_app()
