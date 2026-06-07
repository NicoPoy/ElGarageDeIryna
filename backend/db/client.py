import libsql

from backend.core.config import settings

_connection = None


def get_connection():
    global _connection

    settings.validate_database()

    if _connection is None:
        _connection = libsql.connect(
            database=settings.turso_database_url,
            auth_token=settings.turso_auth_token,
        )

    return _connection


def execute(sql, args=None):
    return get_connection().execute(sql, args or [])


def query_all(sql, args=None):
    result = execute(sql, args)
    columns = [column[0] for column in result.description or []]
    return [dict(zip(columns, row)) for row in result.fetchall()]


def query_one(sql, args=None):
    rows = query_all(sql, args)
    return rows[0] if rows else None
