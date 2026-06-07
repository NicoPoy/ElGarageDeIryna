DEFAULT_PRODUCT_IMAGE = "/product-placeholder.png"


def to_user(row):
    return {
        "id": row["id"],
        "email": row["email"],
        "nombre": row["name"],
        "whatsapp": row.get("whatsapp") or "",
        "dni": row.get("dni") or "",
        "roles": [row["role"]],
    }


def map_catalog(categories, products, images, variants):
    image_map = {}
    for image in images:
        image_map.setdefault(image["product_id"], []).append(image["image_url"])

    variant_map = {}
    for variant in variants:
        variant_map.setdefault(variant["product_id"], []).append({
            "id": variant["id"],
            "name": variant["name"],
            "stock": int(variant.get("stock") or 0),
            "active": variant.get("active") != 0,
        })

    mapped_categories = [
        {
            "id": category["id"],
            "name": category["name"],
            "active": category.get("active") != 0,
        }
        for category in categories
    ]

    mapped_products = []
    for product in products:
        product_variants = [
            variant for variant in variant_map.get(product["id"], []) if variant["active"]
        ]
        product_images = image_map.get(product["id"]) or [DEFAULT_PRODUCT_IMAGE]
        variant_stock = sum(int(variant.get("stock") or 0) for variant in product_variants)
        stock = int(product.get("stock") or 0)

        mapped_products.append({
            "id": product["id"],
            "name": product["name"],
            "category": product["category_name"],
            "categoryId": product["category_id"],
            "price": int(product.get("price") or 0),
            "stock": stock,
            "availableStock": variant_stock if product_variants else stock,
            "image": product_images[0],
            "images": product_images,
            "imagePath": None,
            "varieties": [variant["name"] for variant in product_variants],
            "variants": product_variants,
            "active": product.get("active") != 0,
        })

    return {
        "categories": mapped_categories,
        "products": mapped_products,
    }


def map_orders(orders, items):
    item_map = {}
    for item in items:
        item_map.setdefault(item["order_id"], []).append(item)

    return [
        {
            "id": order["id"],
            "userId": order.get("user_id"),
            "date": order["created_at"],
            "status": order["status"],
            "paymentMethod": order["payment_method"],
            "paymentStatus": order["payment_status"],
            "total": int(order.get("total") or 0),
            "customer": {
                "name": order["customer_name"],
                "email": order.get("customer_email") or "",
                "whatsapp": order.get("customer_whatsapp") or "",
                "dni": order.get("customer_dni") or "",
            },
            "items": [
                {
                    "id": item["id"],
                    "productId": item.get("product_id"),
                    "variantId": item.get("variant_id"),
                    "quantity": int(item.get("quantity") or 0),
                    "unitPrice": int(item.get("unit_price") or 0),
                    "subtotal": int(item.get("subtotal") or 0),
                    "variety": item.get("variety") or "",
                    "product": {
                        "name": item["product_name"],
                        "category": item["product_category"],
                        "image": item.get("product_image_url") or DEFAULT_PRODUCT_IMAGE,
                    },
                }
                for item in item_map.get(order["id"], [])
            ],
        }
        for order in orders
    ]
