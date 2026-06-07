from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

from backend.core.config import SettingsError
from backend.core.http import ApiError, parse_json_body, response
from backend.router import route


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle()

    def do_POST(self):
        self._handle()

    def do_PUT(self):
        self._handle()

    def do_PATCH(self):
        self._handle()

    def do_DELETE(self):
        self._handle()

    def _handle(self):
        try:
            path = urlparse(self.path).path
            api_path = path.replace("/api/", "", 1).replace("/api", "", 1)
            body = parse_json_body(self) if self.command in {"POST", "PUT", "PATCH"} else {}
            status_code, headers, payload = route(self.command, api_path, body)
        except SettingsError as error:
            status_code, headers, payload = response(503, {"message": str(error), "code": "CONFIG_ERROR"})
        except ApiError as error:
            status_code, headers, payload = response(
                error.status_code,
                {"message": error.message, "code": error.code},
            )
        except Exception as error:
            status_code, headers, payload = response(500, {"message": str(error), "code": "SERVER_ERROR"})

        self.send_response(status_code)
        for key, value in headers.items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload.encode("utf-8"))
