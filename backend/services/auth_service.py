from backend.core.http import ApiError
from backend.core.security import hash_password, verify_password
from backend.repositories import user_repository
from backend.schemas.mappers import to_user


def login(payload):
    user = user_repository.find_active_user_by_email(payload.get("email") or "")

    if not user or not verify_password(payload.get("password") or "", user["password_hash"]):
        raise ApiError(
            "Email o contrasena incorrectos.",
            status_code=401,
            code="INVALID_PASSWORD" if user else "USER_NOT_FOUND",
        )

    return {"user": to_user(user)}


def register(payload):
    password_hash = hash_password(payload.get("password") or "")
    user = user_repository.create_client_user(payload, password_hash)
    return {"user": to_user(user)}
