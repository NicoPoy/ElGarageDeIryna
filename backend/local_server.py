from http.server import ThreadingHTTPServer
from pathlib import Path
import os
import sys

from backend.vercel_handler import ApiHandler


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TOOLS_PACKAGES = Path("E:/DESARROLLO/Herramientas/python-packages")


def load_env_file():
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main():
    if TOOLS_PACKAGES.exists():
        sys.path.insert(0, str(TOOLS_PACKAGES))

    load_env_file()
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    server = ThreadingHTTPServer((host, port), ApiHandler)
    print(f"API Turso escuchando en http://{host}:{port}/api", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
