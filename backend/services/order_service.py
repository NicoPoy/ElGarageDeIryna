from backend.core.http import ApiError
from backend.repositories import order_repository
from backend.schemas.mappers import map_orders
from backend.services.catalog_service import get_catalog


def get_orders():
    orders, items = order_repository.list_orders()
    return {"orders": map_orders(orders, items)}


def create_order(payload):
    normalized_items = []
    for item in payload.get("items") or []:
        product = order_repository.get_product_snapshot(item.get("id"))
        if not product:
            raise ApiError("Uno de los productos ya no esta disponible.", status_code=400)

        quantity = max(1, int(item.get("quantity") or 1))
        unit_price = int(product.get("price") or 0)

        order_repository.reserve_stock(item.get("id"), item.get("variantId"), quantity)
        normalized_items.append({
            **item,
            "quantity": quantity,
            "unitPrice": unit_price,
            "subtotal": unit_price * quantity,
            "product": product,
        })

    order = order_repository.create_order(payload, normalized_items)
    return {
        "order": order,
        **get_orders(),
        **get_catalog(),
    }


def update_order(order_id, payload):
    if payload.get("status") == "cancelado":
        order_repository.restore_order_stock(order_id)

    order_repository.update_order(
        order_id,
        status=payload.get("status"),
        payment_status=payload.get("paymentStatus"),
    )
    return get_orders()
