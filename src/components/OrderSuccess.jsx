import React from 'react';
import { CheckIcon, WhatsAppIcon } from './icons';
import { formatPrice } from '../utils/formatters';
import { buildWhatsAppUrl, orderWhatsAppMessage, WHATSAPP_NUMBER } from '../utils/contact';

function OrderSuccess({ order, onBackToCatalog, onViewOrders }) {
  return (
    <section className="order-success">
      <div className="order-success-card">
        <span className="order-success-icon">
          <CheckIcon />
        </span>
        <span className="order-success-kicker">Pedido realizado</span>
        <h2>Gracias por tu compra</h2>
        <p>
          Tu pedido quedo registrado correctamente. Para coordinar la entrega,
          comunicate al WhatsApp {WHATSAPP_NUMBER}.
        </p>

        <div className="order-success-summary">
          <div>
            <span>Numero de pedido</span>
            <strong>#{order?.id || '-'}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatPrice(order?.total || 0)}</strong>
          </div>
          <div>
            <span>Medio de pago</span>
            <strong>{order?.paymentMethod === 'transferencia' ? 'Transferencia' : 'Efectivo'}</strong>
          </div>
        </div>

        <div className="order-success-steps">
          <strong>Proximos pasos</strong>
          <p>1. Comunicate por WhatsApp para coordinar la entrega.</p>
          {order?.paymentMethod === 'transferencia' && (
            <p>2. Envia el comprobante de transferencia por el mismo chat.</p>
          )}
          <p>3. Las entregas se coordinan por WhatsApp segun zona y disponibilidad.</p>
        </div>

        <div className="order-success-actions">
          <a
            className="whatsapp-button"
            href={buildWhatsAppUrl(orderWhatsAppMessage(order?.id))}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon />
            Coordinar por WhatsApp
          </a>
          <button className="cart-clear" type="button" onClick={onViewOrders}>
            Ver mis pedidos
          </button>
          <button className="cart-clear" type="button" onClick={onBackToCatalog}>
            Volver al catalogo
          </button>
        </div>
      </div>
    </section>
  );
}

export default OrderSuccess;
