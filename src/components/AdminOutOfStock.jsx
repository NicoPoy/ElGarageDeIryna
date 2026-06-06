import React from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { formatPrice } from '../utils/formatters';

function AdminOutOfStock({ products, onDeleteProduct, onEditProduct }) {
  return (
    <section className="admin-out-of-stock admin-stock-section">
      <div className="admin-heading">
        <div>
          <span>Solo admin</span>
          <h2>Sin stock</h2>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="admin-empty">Todavia no hay productos sin stock.</p>
      ) : (
        <div className="admin-stock-list">
          {products.map((product) => (
            <article className="admin-stock-item" key={product.id}>
              <img
                src={product.image || DEFAULT_PRODUCT_IMAGE}
                alt=""
                aria-hidden="true"
              />
              <div>
                <strong>{product.name}</strong>
                <span>{product.category}</span>
              </div>
              <b>{formatPrice(product.price)}</b>
              <button
                className="edit-stock-product-button"
                type="button"
                onClick={() => onEditProduct(product)}
              >
                Modificar
              </button>
              <button
                className="delete-stock-product-button"
                type="button"
                onClick={() => onDeleteProduct(product)}
              >
                Eliminar
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminOutOfStock;
