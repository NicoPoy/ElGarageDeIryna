import os


class SettingsError(RuntimeError):
    pass


class Settings:
    @property
    def turso_database_url(self):
        return os.getenv("TURSO_DATABASE_URL", "").strip()

    @property
    def turso_auth_token(self):
        return os.getenv("TURSO_AUTH_TOKEN", "").strip()

    def validate_database(self):
        if not self.turso_database_url or not self.turso_auth_token:
            raise SettingsError("Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN.")


settings = Settings()
