from backend.repositories import catalog_repository
from backend.schemas.mappers import map_catalog


def get_catalog():
    return map_catalog(
        catalog_repository.list_categories(),
        catalog_repository.list_products(),
        catalog_repository.list_images(),
        catalog_repository.list_variants(),
    )


def create_product(payload):
    catalog_repository.create_product(payload)
    return get_catalog()


def update_product(product_id, payload):
    catalog_repository.update_product(product_id, payload)
    return get_catalog()


def delete_product(product_id):
    catalog_repository.delete_product(product_id)
    return get_catalog()


def create_category(payload):
    catalog_repository.create_category(payload.get("name") or "")
    return get_catalog()


def rename_category(category_id, payload):
    catalog_repository.rename_category(category_id, payload.get("name") or "")
    return get_catalog()


def toggle_category(category_id, payload):
    catalog_repository.set_category_active(category_id, bool(payload.get("active")))
    return get_catalog()
