import time
import uuid

from backend.db.client import execute, query_all, query_one
from backend.schemas.mappers import DEFAULT_PRODUCT_IMAGE


def list_orders():
    orders = query_all("SELECT * FROM orders ORDER BY created_at DESC")
    items = query_all("SELECT * FROM order_items ORDER BY created_at ASC")
    return orders, items


def get_product_snapshot(product_id):
    return query_one(
        """
        SELECT p.id, p.name, p.price, p.stock, c.name AS category_name,
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image_url
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.active = 1
        """,
        [product_id],
    )


def reserve_stock(product_id, variant_id, quantity):
    execute("UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?", [quantity, product_id])
    if variant_id:
        execute(
            "UPDATE product_variants SET stock = MAX(stock - ?, 0) WHERE id = ?",
            [quantity, variant_id],
        )


def create_order(payload, items):
    order_id = str(int(time.time() * 1000))[-6:]
    payment_method = payload.get("paymentMethod")
    customer = payload.get("customer") or {}
    total = sum(item["subtotal"] for item in items)

    execute(
        """
        INSERT INTO orders (
          id, user_id, status, payment_method, payment_status, total,
          customer_name, customer_email, customer_whatsapp, customer_dni
        ) VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            order_id,
            payload.get("userId"),
            payment_method,
            "pendiente_comprobante" if payment_method == "transferencia" else "pendiente",
            total,
            customer.get("name") or "Cliente",
            customer.get("email") or "",
            customer.get("whatsapp") or "",
            customer.get("dni") or "",
        ],
    )

    for item in items:
        product = item["product"]
        execute(
            """
            INSERT INTO order_items (
              id, order_id, product_id, variant_id, product_name, product_category,
              product_image_url, variety, quantity, unit_price, subtotal
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                str(uuid.uuid4()),
                order_id,
                item["id"],
                item.get("variantId"),
                product["name"],
                product["category_name"],
                product.get("image_url") or DEFAULT_PRODUCT_IMAGE,
                item.get("variety") or "",
                item["quantity"],
                item["unitPrice"],
                item["subtotal"],
            ],
        )

    return {
        "id": order_id,
        "total": total,
        "paymentMethod": payment_method,
    }


def update_order(order_id, status=None, payment_status=None):
    fields = []
    args = []
    if status:
        fields.append("status = ?")
        args.append(status)
    if payment_status:
        fields.append("payment_status = ?")
        args.append(payment_status)
    if not fields:
        return
    args.append(order_id)
    execute(f"UPDATE orders SET {', '.join(fields)} WHERE id = ?", args)


def restore_order_stock(order_id):
    items = query_all(
        "SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?",
        [order_id],
    )
    for item in items:
        quantity = int(item.get("quantity") or 0)
        if item.get("product_id"):
            execute("UPDATE products SET stock = stock + ? WHERE id = ?", [quantity, item["product_id"]])
        if item.get("variant_id"):
            execute(
                "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
                [quantity, item["variant_id"]],
            )
