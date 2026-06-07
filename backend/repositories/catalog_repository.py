import uuid

from backend.db.client import execute, query_all


def list_categories():
    return query_all("SELECT id, name, active FROM categories ORDER BY name")


def list_products():
    return query_all(
        """
        SELECT p.id, p.name, p.category_id, c.name AS category_name, p.price, p.stock, p.active
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ORDER BY c.name, p.name
        """
    )


def list_images():
    return query_all(
        "SELECT id, product_id, image_url, sort_order FROM product_images ORDER BY sort_order, created_at"
    )


def list_variants():
    return query_all(
        "SELECT id, product_id, name, stock, active, sort_order FROM product_variants ORDER BY sort_order, name"
    )


def create_product(payload):
    product_id = str(uuid.uuid4())
    execute(
        "INSERT INTO products (id, name, category_id, price, stock, active) VALUES (?, ?, ?, ?, ?, 1)",
        [
            product_id,
            payload.get("name"),
            payload.get("categoryId"),
            int(payload.get("price") or 0),
            int(payload.get("stock") or 0),
        ],
    )
    replace_product_images(product_id, payload.get("imageUrls") or payload.get("images") or [])
    replace_product_variants(product_id, payload.get("variants") or [])
    return product_id


def update_product(product_id, payload):
    execute(
        "UPDATE products SET name = ?, category_id = ?, price = ?, stock = ? WHERE id = ?",
        [
            payload.get("name"),
            payload.get("categoryId"),
            int(payload.get("price") or 0),
            int(payload.get("stock") or 0),
            product_id,
        ],
    )
    replace_product_images(product_id, payload.get("imageUrls") or payload.get("images") or [])
    replace_product_variants(product_id, payload.get("variants") or [])


def delete_product(product_id):
    execute("DELETE FROM products WHERE id = ?", [product_id])


def replace_product_images(product_id, image_urls):
    execute("DELETE FROM product_images WHERE product_id = ?", [product_id])
    for index, image_url in enumerate([url for url in image_urls if url]):
        execute(
            "INSERT INTO product_images (id, product_id, image_url, sort_order) VALUES (?, ?, ?, ?)",
            [f"{product_id}-img-{index + 1}-{uuid.uuid4()}", product_id, image_url, index],
        )


def replace_product_variants(product_id, variants):
    execute("DELETE FROM product_variants WHERE product_id = ?", [product_id])
    for index, variant in enumerate(variants):
        execute(
            """
            INSERT INTO product_variants (id, product_id, name, stock, active, sort_order)
            VALUES (?, ?, ?, ?, 1, ?)
            """,
            [
                variant.get("id") or f"{product_id}-var-{index + 1}-{uuid.uuid4()}",
                product_id,
                variant.get("name"),
                max(0, int(variant.get("stock") or 0)),
                index,
            ],
        )


def create_category(name):
    execute(
        "INSERT INTO categories (id, name, active) VALUES (?, ?, 1)",
        [str(uuid.uuid4()), name.strip()],
    )


def rename_category(category_id, name):
    execute("UPDATE categories SET name = ? WHERE id = ?", [name.strip(), category_id])


def set_category_active(category_id, active):
    execute("UPDATE categories SET active = ? WHERE id = ?", [1 if active else 0, category_id])
