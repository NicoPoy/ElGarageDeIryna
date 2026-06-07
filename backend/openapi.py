OPENAPI_SCHEMA = {
    "openapi": "3.0.3",
    "info": {
        "title": "El Garage de Iryna API",
        "version": "1.0.0",
        "description": "API para catalogo, usuarios, productos, categorias y pedidos.",
    },
    "servers": [{"url": "/api"}],
    "tags": [
        {"name": "Health"},
        {"name": "Auth"},
        {"name": "Catalog"},
        {"name": "Products"},
        {"name": "Categories"},
        {"name": "Orders"},
    ],
    "paths": {
        "/health": {
            "get": {
                "tags": ["Health"],
                "summary": "Verifica que la API responda",
                "responses": {
                    "200": {"description": "API disponible"},
                },
            },
        },
        "/catalog": {
            "get": {
                "tags": ["Catalog"],
                "summary": "Obtiene categorias y productos",
                "responses": {
                    "200": {
                        "description": "Catalogo completo",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CatalogResponse"},
                            },
                        },
                    },
                },
            },
        },
        "/auth/login": {
            "post": {
                "tags": ["Auth"],
                "summary": "Inicia sesion",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/LoginRequest"},
                            "example": {
                                "email": "admin@elgaragedeiryna.com",
                                "password": "IrynaBaez2023",
                            },
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Sesion iniciada",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/UserResponse"},
                            },
                        },
                    },
                    "401": {"description": "Credenciales invalidas"},
                },
            },
        },
        "/auth/register": {
            "post": {
                "tags": ["Auth"],
                "summary": "Registra un cliente",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/RegisterRequest"},
                        },
                    },
                },
                "responses": {
                    "201": {
                        "description": "Usuario creado",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/UserResponse"},
                            },
                        },
                    },
                },
            },
        },
        "/products": {
            "post": {
                "tags": ["Products"],
                "summary": "Crea un producto",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ProductInput"},
                        },
                    },
                },
                "responses": {
                    "201": {
                        "description": "Producto creado",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CatalogResponse"},
                            },
                        },
                    },
                },
            },
        },
        "/products/{productId}": {
            "put": {
                "tags": ["Products"],
                "summary": "Actualiza un producto",
                "parameters": [{"$ref": "#/components/parameters/ProductId"}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ProductInput"},
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Producto actualizado",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CatalogResponse"},
                            },
                        },
                    },
                },
            },
            "delete": {
                "tags": ["Products"],
                "summary": "Elimina un producto",
                "parameters": [{"$ref": "#/components/parameters/ProductId"}],
                "responses": {
                    "200": {
                        "description": "Producto eliminado",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CatalogResponse"},
                            },
                        },
                    },
                },
            },
        },
        "/categories": {
            "post": {
                "tags": ["Categories"],
                "summary": "Crea una categoria",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/CategoryInput"},
                        },
                    },
                },
                "responses": {
                    "201": {
                        "description": "Categoria creada",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CatalogResponse"},
                            },
                        },
                    },
                },
            },
        },
        "/categories/{categoryId}": {
            "put": {
                "tags": ["Categories"],
                "summary": "Renombra una categoria",
                "parameters": [{"$ref": "#/components/parameters/CategoryId"}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/CategoryInput"},
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Categoria renombrada",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CatalogResponse"},
                            },
                        },
                    },
                },
            },
            "patch": {
                "tags": ["Categories"],
                "summary": "Activa o desactiva una categoria",
                "parameters": [{"$ref": "#/components/parameters/CategoryId"}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/CategoryStatusInput"},
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Categoria actualizada",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/CatalogResponse"},
                            },
                        },
                    },
                },
            },
        },
        "/orders": {
            "get": {
                "tags": ["Orders"],
                "summary": "Obtiene pedidos",
                "responses": {
                    "200": {
                        "description": "Listado de pedidos",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/OrdersResponse"},
                            },
                        },
                    },
                },
            },
            "post": {
                "tags": ["Orders"],
                "summary": "Crea un pedido",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/OrderInput"},
                        },
                    },
                },
                "responses": {
                    "201": {"description": "Pedido creado"},
                },
            },
        },
        "/orders/{orderId}": {
            "patch": {
                "tags": ["Orders"],
                "summary": "Actualiza estado de pedido",
                "parameters": [{"$ref": "#/components/parameters/OrderId"}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/OrderStatusInput"},
                        },
                    },
                },
                "responses": {
                    "200": {
                        "description": "Pedido actualizado",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/OrdersResponse"},
                            },
                        },
                    },
                },
            },
        },
    },
    "components": {
        "parameters": {
            "ProductId": {
                "name": "productId",
                "in": "path",
                "required": True,
                "schema": {"type": "string"},
            },
            "CategoryId": {
                "name": "categoryId",
                "in": "path",
                "required": True,
                "schema": {"type": "string"},
            },
            "OrderId": {
                "name": "orderId",
                "in": "path",
                "required": True,
                "schema": {"type": "string"},
            },
        },
        "schemas": {
            "LoginRequest": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                    "email": {"type": "string", "format": "email"},
                    "password": {"type": "string", "format": "password"},
                },
            },
            "RegisterRequest": {
                "allOf": [
                    {"$ref": "#/components/schemas/LoginRequest"},
                    {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "phone": {"type": "string"},
                            "address": {"type": "string"},
                        },
                    },
                ],
            },
            "UserResponse": {
                "type": "object",
                "properties": {
                    "user": {"$ref": "#/components/schemas/User"},
                },
            },
            "User": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "role": {"type": "string", "enum": ["admin", "client"]},
                    "phone": {"type": "string"},
                    "address": {"type": "string"},
                },
            },
            "CategoryInput": {
                "type": "object",
                "required": ["name"],
                "properties": {"name": {"type": "string"}},
            },
            "CategoryStatusInput": {
                "type": "object",
                "required": ["active"],
                "properties": {"active": {"type": "boolean"}},
            },
            "ProductInput": {
                "type": "object",
                "required": ["name", "price", "category"],
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "price": {"type": "integer"},
                    "category": {"type": "string"},
                    "stock": {"type": "integer"},
                    "featured": {"type": "boolean"},
                    "images": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "variants": {
                        "type": "array",
                        "items": {"$ref": "#/components/schemas/ProductVariant"},
                    },
                },
            },
            "ProductVariant": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "stock": {"type": "integer"},
                },
            },
            "CatalogResponse": {
                "type": "object",
                "properties": {
                    "categories": {
                        "type": "array",
                        "items": {"type": "object"},
                    },
                    "products": {
                        "type": "array",
                        "items": {"type": "object"},
                    },
                },
            },
            "OrderInput": {
                "type": "object",
                "properties": {
                    "customer": {"type": "object"},
                    "items": {
                        "type": "array",
                        "items": {"type": "object"},
                    },
                    "total": {"type": "integer"},
                    "notes": {"type": "string"},
                },
            },
            "OrderStatusInput": {
                "type": "object",
                "properties": {
                    "status": {"type": "string"},
                    "paymentStatus": {"type": "string"},
                },
            },
            "OrdersResponse": {
                "type": "object",
                "properties": {
                    "orders": {
                        "type": "array",
                        "items": {"type": "object"},
                    },
                },
            },
        },
    },
}


SWAGGER_HTML = """<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>El Garage de Iryna API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fbf4e8; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>"""
