import json


class ApiError(Exception):
    def __init__(self, message, status_code=400, code="API_ERROR"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def response(status_code, data):
    return status_code, {"Content-Type": "application/json; charset=utf-8"}, json.dumps(data)


def html_response(status_code, html):
    return status_code, {"Content-Type": "text/html; charset=utf-8"}, html


def parse_json_body(handler):
    content_length = int(handler.headers.get("content-length") or 0)
    if content_length <= 0:
        return {}

    raw_body = handler.rfile.read(content_length).decode("utf-8")
    if not raw_body:
        return {}

    return json.loads(raw_body)
