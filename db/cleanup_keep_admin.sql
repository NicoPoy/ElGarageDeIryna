PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO users (id, email, password_hash, name, whatsapp, dni, role, active)
VALUES (
  'admin-local',
  'admin@elgaragedeiryna.com',
  'dc8dff8cc3f909bb676a8892ed1880e9:21305d4f92aa0b357eb4edfa46bd15fbd4e5e54f3f559f329620d92e0a5a4246',
  'Iryna Admin',
  '+5493754419227',
  '30000000',
  'admin',
  1
);

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_variants;
DELETE FROM product_images;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM users
WHERE email <> 'admin@elgaragedeiryna.com';

UPDATE users
SET
  id = 'admin-local',
  password_hash = 'dc8dff8cc3f909bb676a8892ed1880e9:21305d4f92aa0b357eb4edfa46bd15fbd4e5e54f3f559f329620d92e0a5a4246',
  name = 'Iryna Admin',
  whatsapp = '+5493754419227',
  dni = '30000000',
  role = 'admin',
  active = 1
WHERE email = 'admin@elgaragedeiryna.com';
