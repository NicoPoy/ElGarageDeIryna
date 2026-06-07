from backend.core.http import ApiError, response
from backend.services import auth_service, catalog_service, order_service


def route(method, path, body):
    parts = [part for part in path.strip("/").split("/") if part]

    if method == "GET" and parts == ["health"]:
        return response(200, {"ok": True})

    if method == "GET" and parts == ["catalog"]:
        return response(200, catalog_service.get_catalog())

    if method == "GET" and parts == ["orders"]:
        return response(200, order_service.get_orders())

    if method == "POST" and parts == ["auth", "login"]:
        return response(200, auth_service.login(body))

    if method == "POST" and parts == ["auth", "register"]:
        return response(201, auth_service.register(body))

    if method == "POST" and parts == ["products"]:
        return response(201, catalog_service.create_product(body))

    if method == "PUT" and len(parts) == 2 and parts[0] == "products":
        return response(200, catalog_service.update_product(parts[1], body))

    if method == "DELETE" and len(parts) == 2 and parts[0] == "products":
        return response(200, catalog_service.delete_product(parts[1]))

    if method == "POST" and parts == ["categories"]:
        return response(201, catalog_service.create_category(body))

    if method == "PUT" and len(parts) == 2 and parts[0] == "categories":
        return response(200, catalog_service.rename_category(parts[1], body))

    if method == "PATCH" and len(parts) == 2 and parts[0] == "categories":
        return response(200, catalog_service.toggle_category(parts[1], body))

    if method == "POST" and parts == ["orders"]:
        return response(201, order_service.create_order(body))

    if method == "PATCH" and len(parts) == 2 and parts[0] == "orders":
        return response(200, order_service.update_order(parts[1], body))

    raise ApiError("Endpoint no encontrado.", status_code=404, code="NOT_FOUND")
