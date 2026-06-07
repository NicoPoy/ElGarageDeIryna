import uuid

from backend.db.client import execute, query_one


def find_active_user_by_email(email):
    return query_one(
        "SELECT * FROM users WHERE email = ? AND active = 1 LIMIT 1",
        [email.strip().lower()],
    )


def create_client_user(payload, password_hash):
    user_id = str(uuid.uuid4())
    execute(
        """
        INSERT INTO users (id, email, password_hash, name, whatsapp, dni, role)
        VALUES (?, ?, ?, ?, ?, ?, 'cliente')
        """,
        [
            user_id,
            payload.get("email", "").strip().lower(),
            password_hash,
            payload.get("nombre", "").strip(),
            payload.get("whatsapp") or "",
            payload.get("dni") or "",
        ],
    )
    return find_active_user_by_email(payload.get("email", ""))
