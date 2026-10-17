"""Plain SQL, one module per table, one function per query.

Every function takes an open psycopg connection first and returns dict rows
(or None). No business rules here beyond what the database enforces.
"""
