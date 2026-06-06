import { createClient } from '@libsql/client';
import crypto from 'node:crypto';

const DEFAULT_PRODUCT_IMAGE = '/product-placeholder.png';

let cachedDb = null;

const getDb = () => {
  requireTursoConfig();

  if (!cachedDb) {
    cachedDb = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }

  return cachedDb;
};

const json = (res, status, data) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};

const readBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const requireTursoConfig = () => {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    const error = new Error('Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN.');
    error.statusCode = 503;
    throw error;
  }
};

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, expectedHash] = String(storedHash || '').split(':');
  if (!salt || !expectedHash) return false;

  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
};

const toUser = (row) => ({
  id: row.id,
  email: row.email,
  nombre: row.name,
  whatsapp: row.whatsapp || '',
  dni: row.dni || '',
  roles: [row.role]
});

const loadProducts = async () => {
  const [{ rows: categories }, { rows: products }, { rows: images }, { rows: variants }] =
    await Promise.all([
      getDb().execute('SELECT id, name, active FROM categories ORDER BY name'),
      getDb().execute(`
        SELECT p.id, p.name, p.category_id, c.name AS category_name, p.price, p.stock, p.active
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ORDER BY c.name, p.name
      `),
      getDb().execute('SELECT id, product_id, image_url, sort_order FROM product_images ORDER BY sort_order, created_at'),
      getDb().execute('SELECT id, product_id, name, stock, active, sort_order FROM product_variants ORDER BY sort_order, name')
    ]);

  const imageMap = images.reduce((map, image) => {
    map[image.product_id] = [...(map[image.product_id] || []), image.image_url];
    return map;
  }, {});
  const variantMap = variants.reduce((map, variant) => {
    map[variant.product_id] = [
      ...(map[variant.product_id] || []),
      {
        id: variant.id,
        name: variant.name,
        stock: Number(variant.stock || 0),
        active: variant.active !== 0
      }
    ];
    return map;
  }, {});

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      active: category.active !== 0
    })),
    products: products.map((product) => {
      const productVariants = (variantMap[product.id] || []).filter((variant) => variant.active);
      const productImages = imageMap[product.id]?.length ? imageMap[product.id] : [DEFAULT_PRODUCT_IMAGE];
      const variantStock = productVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);

      return {
        id: product.id,
        name: product.name,
        category: product.category_name,
        categoryId: product.category_id,
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        availableStock: productVariants.length ? variantStock : Number(product.stock || 0),
        image: productImages[0],
        images: productImages,
        imagePath: null,
        varieties: productVariants.map((variant) => variant.name),
        variants: productVariants,
        active: product.active !== 0
      };
    })
  };
};

const loadOrders = async () => {
  const [{ rows: orders }, { rows: items }] = await Promise.all([
    getDb().execute('SELECT * FROM orders ORDER BY created_at DESC'),
    getDb().execute('SELECT * FROM order_items ORDER BY created_at ASC')
  ]);

  const itemMap = items.reduce((map, item) => {
    map[item.order_id] = [...(map[item.order_id] || []), item];
    return map;
  }, {});

  return orders.map((order) => ({
    id: order.id,
    userId: order.user_id,
    date: order.created_at,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    total: Number(order.total || 0),
    customer: {
      name: order.customer_name,
      email: order.customer_email || '',
      whatsapp: order.customer_whatsapp || '',
      dni: order.customer_dni || ''
    },
    items: (itemMap[order.id] || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      subtotal: Number(item.subtotal || 0),
      variety: item.variety || '',
      product: {
        name: item.product_name,
        category: item.product_category,
        image: item.product_image_url || DEFAULT_PRODUCT_IMAGE
      }
    }))
  }));
};

const replaceProductImages = async (productId, imageUrls = []) => {
  await getDb().execute({ sql: 'DELETE FROM product_images WHERE product_id = ?', args: [productId] });

  for (const [index, imageUrl] of imageUrls.filter(Boolean).entries()) {
    await getDb().execute({
      sql: 'INSERT INTO product_images (id, product_id, image_url, sort_order) VALUES (?, ?, ?, ?)',
      args: [`${productId}-img-${index + 1}-${crypto.randomUUID()}`, productId, imageUrl, index]
    });
  }
};

const replaceProductVariants = async (productId, variants = []) => {
  await getDb().execute({ sql: 'DELETE FROM product_variants WHERE product_id = ?', args: [productId] });

  for (const [index, variant] of variants.entries()) {
    await getDb().execute({
      sql: 'INSERT INTO product_variants (id, product_id, name, stock, active, sort_order) VALUES (?, ?, ?, ?, 1, ?)',
      args: [
        variant.id || `${productId}-var-${index + 1}-${crypto.randomUUID()}`,
        productId,
        variant.name,
        Math.max(0, Number(variant.stock || 0)),
        index
      ]
    });
  }
};

const createProduct = async (body) => {
  const id = crypto.randomUUID();
  const images = body.imageUrls?.length ? body.imageUrls : body.images || [];
  const variants = body.variants || [];

  await getDb().execute({
    sql: 'INSERT INTO products (id, name, category_id, price, stock, active) VALUES (?, ?, ?, ?, ?, 1)',
    args: [id, body.name, body.categoryId, Number(body.price || 0), Number(body.stock || 0)]
  });
  await replaceProductImages(id, images);
  await replaceProductVariants(id, variants);

  return loadProducts();
};

const updateProduct = async (id, body) => {
  const images = body.imageUrls?.length ? body.imageUrls : body.images || [];

  await getDb().execute({
    sql: 'UPDATE products SET name = ?, category_id = ?, price = ?, stock = ? WHERE id = ?',
    args: [body.name, body.categoryId, Number(body.price || 0), Number(body.stock || 0), id]
  });
  await replaceProductImages(id, images);
  await replaceProductVariants(id, body.variants || []);

  return loadProducts();
};

const createOrder = async (body) => {
  const id = String(Date.now()).slice(-6);
  let total = 0;
  const items = [];

  for (const item of body.items || []) {
    const { rows } = await getDb().execute({
      sql: `
        SELECT p.id, p.name, p.price, p.stock, c.name AS category_name,
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image_url
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.active = 1
      `,
      args: [item.id]
    });
    const product = rows[0];

    if (!product) {
      const error = new Error('Uno de los productos ya no esta disponible.');
      error.statusCode = 400;
      throw error;
    }

    const quantity = Math.max(1, Number(item.quantity || 1));
    const unitPrice = Number(product.price || 0);
    const subtotal = unitPrice * quantity;

    await getDb().execute({
      sql: 'UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?',
      args: [quantity, item.id]
    });

    if (item.variantId) {
      await getDb().execute({
        sql: 'UPDATE product_variants SET stock = MAX(stock - ?, 0) WHERE id = ?',
        args: [quantity, item.variantId]
      });
    }

    total += subtotal;
    items.push({
      ...item,
      quantity,
      unitPrice,
      subtotal,
      product
    });
  }

  await getDb().execute({
    sql: `
      INSERT INTO orders (
        id, user_id, status, payment_method, payment_status, total,
        customer_name, customer_email, customer_whatsapp, customer_dni
      ) VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      body.userId || null,
      body.paymentMethod,
      body.paymentMethod === 'transferencia' ? 'pendiente_comprobante' : 'pendiente',
      total,
      body.customer?.name || 'Cliente',
      body.customer?.email || '',
      body.customer?.whatsapp || '',
      body.customer?.dni || ''
    ]
  });

  for (const item of items) {
    await getDb().execute({
      sql: `
        INSERT INTO order_items (
          id, order_id, product_id, variant_id, product_name, product_category,
          product_image_url, variety, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        crypto.randomUUID(),
        id,
        item.id,
        item.variantId || null,
        item.product.name,
        item.product.category_name,
        item.product.image_url || DEFAULT_PRODUCT_IMAGE,
        item.variety || '',
        item.quantity,
        item.unitPrice,
        item.subtotal
      ]
    });
  }

  return { order: { id, total, paymentMethod: body.paymentMethod }, orders: await loadOrders(), ...(await loadProducts()) };
};

export default async function handler(req, res) {
  try {
    requireTursoConfig();

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const method = req.method.toUpperCase();

    if (method === 'GET' && path[0] === 'health') {
      return json(res, 200, { ok: true });
    }

    if (method === 'GET' && path[0] === 'catalog') {
      return json(res, 200, await loadProducts());
    }

    if (method === 'GET' && path[0] === 'orders') {
      return json(res, 200, { orders: await loadOrders() });
    }

    if (method === 'POST' && path[0] === 'auth' && path[1] === 'login') {
      const body = await readBody(req);
      const { rows } = await getDb().execute({
        sql: 'SELECT * FROM users WHERE email = ? AND active = 1 LIMIT 1',
        args: [body.email?.trim().toLowerCase()]
      });
      const user = rows[0];

      if (!user || !verifyPassword(body.password, user.password_hash)) {
        return json(res, 401, { message: 'Email o contrasena incorrectos.' });
      }

      return json(res, 200, { user: toUser(user) });
    }

    if (method === 'POST' && path[0] === 'auth' && path[1] === 'register') {
      const body = await readBody(req);
      const user = {
        id: crypto.randomUUID(),
        email: body.email?.trim().toLowerCase(),
        passwordHash: hashPassword(body.password),
        name: body.nombre?.trim(),
        whatsapp: body.whatsapp || '',
        dni: body.dni || ''
      };

      await getDb().execute({
        sql: 'INSERT INTO users (id, email, password_hash, name, whatsapp, dni, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [user.id, user.email, user.passwordHash, user.name, user.whatsapp, user.dni, 'cliente']
      });

      return json(res, 201, {
        user: {
          id: user.id,
          email: user.email,
          nombre: user.name,
          whatsapp: user.whatsapp,
          dni: user.dni,
          roles: ['cliente']
        }
      });
    }

    if (method === 'POST' && path[0] === 'products') {
      return json(res, 201, await createProduct(await readBody(req)));
    }

    if (method === 'PUT' && path[0] === 'products' && path[1]) {
      return json(res, 200, await updateProduct(path[1], await readBody(req)));
    }

    if (method === 'DELETE' && path[0] === 'products' && path[1]) {
      await getDb().execute({ sql: 'DELETE FROM products WHERE id = ?', args: [path[1]] });
      return json(res, 200, await loadProducts());
    }

    if (method === 'POST' && path[0] === 'categories') {
      const body = await readBody(req);
      await getDb().execute({
        sql: 'INSERT INTO categories (id, name, active) VALUES (?, ?, 1)',
        args: [crypto.randomUUID(), body.name?.trim()]
      });
      return json(res, 201, await loadProducts());
    }

    if (method === 'PUT' && path[0] === 'categories' && path[1]) {
      const body = await readBody(req);
      await getDb().execute({
        sql: 'UPDATE categories SET name = ? WHERE id = ?',
        args: [body.name?.trim(), path[1]]
      });
      return json(res, 200, await loadProducts());
    }

    if (method === 'PATCH' && path[0] === 'categories' && path[1]) {
      const body = await readBody(req);
      await getDb().execute({
        sql: 'UPDATE categories SET active = ? WHERE id = ?',
        args: [body.active ? 1 : 0, path[1]]
      });
      return json(res, 200, await loadProducts());
    }

    if (method === 'POST' && path[0] === 'orders') {
      return json(res, 201, await createOrder(await readBody(req)));
    }

    if (method === 'PATCH' && path[0] === 'orders' && path[1]) {
      const body = await readBody(req);
      const fields = [];
      const args = [];

      if (body.status) {
        fields.push('status = ?');
        args.push(body.status);
      }
      if (body.paymentStatus) {
        fields.push('payment_status = ?');
        args.push(body.paymentStatus);
      }

      if (!fields.length) return json(res, 400, { message: 'No hay campos para actualizar.' });

      if (body.status === 'cancelado') {
        const { rows: orderItems } = await getDb().execute({
          sql: 'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
          args: [path[1]]
        });

        for (const item of orderItems) {
          if (item.product_id) {
            await getDb().execute({
              sql: 'UPDATE products SET stock = stock + ? WHERE id = ?',
              args: [Number(item.quantity || 0), item.product_id]
            });
          }

          if (item.variant_id) {
            await getDb().execute({
              sql: 'UPDATE product_variants SET stock = stock + ? WHERE id = ?',
              args: [Number(item.quantity || 0), item.variant_id]
            });
          }
        }
      }

      args.push(path[1]);
      await getDb().execute({ sql: `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, args });

      return json(res, 200, { orders: await loadOrders() });
    }

    return json(res, 404, { message: 'Endpoint no encontrado.' });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      message: error.message || 'Error interno.'
    });
  }
}
