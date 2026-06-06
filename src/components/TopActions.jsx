import React from 'react';
import { CartIcon } from './icons';

function TopActions({
  cartCount,
  currentView,
  displayName,
  isAdmin,
  isClient,
  onAdminViewChange,
  onCartOpen,
  onClientViewChange,
  onLoginOpen,
  onLogout,
  session
}) {
  return (
    <div className="top-actions">
      {session ? (
        <div className="session-actions">
          <span>Hola, {displayName}</span>
          {isAdmin && (
            <div className="admin-top-nav" aria-label="Navegacion admin">
              <button
                className={currentView === 'catalog' ? 'is-active' : ''}
                type="button"
                onClick={() => onAdminViewChange('catalog')}
              >
                Productos
              </button>
              <button
                className={currentView === 'orders' ? 'is-active' : ''}
                type="button"
                onClick={() => onAdminViewChange('orders')}
              >
                Pedidos
              </button>
              <button
                className={currentView === 'out-of-stock' ? 'is-active' : ''}
                type="button"
                onClick={() => onAdminViewChange('out-of-stock')}
              >
                Sin stock
              </button>
              <button
                className={currentView === 'categories' ? 'is-active' : ''}
                type="button"
                onClick={() => onAdminViewChange('categories')}
              >
                Categorias
              </button>
            </div>
          )}
          {!isAdmin && isClient && (
            <div className="admin-top-nav" aria-label="Navegacion usuario">
              <button
                className={currentView === 'catalog' ? 'is-active' : ''}
                type="button"
                onClick={() => onClientViewChange('catalog')}
              >
                Catalogo
              </button>
              <button
                className={currentView === 'my-orders' ? 'is-active' : ''}
                type="button"
                onClick={() => onClientViewChange('my-orders')}
              >
                Mis pedidos
              </button>
            </div>
          )}
          {!isAdmin && (
            <button className="cart-button" type="button" onClick={onCartOpen}>
              <CartIcon />
              <span>Carrito</span>
              {cartCount > 0 && <strong>{cartCount}</strong>}
            </button>
          )}
          <button className="login-button" type="button" onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      ) : (
        <button className="login-button" type="button" onClick={onLoginOpen}>
          Iniciar sesion
        </button>
      )}
    </div>
  );
}

export default TopActions;
