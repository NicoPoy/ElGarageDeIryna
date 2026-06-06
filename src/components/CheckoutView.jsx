import React, { useState } from 'react';
import { BankIcon, CashIcon, CheckIcon, WhatsAppIcon } from './icons';
import { formatPrice } from '../utils/formatters';
import { buildWhatsAppUrl, orderWhatsAppMessage, WHATSAPP_NUMBER } from '../utils/contact';

const TRANSFER_ALIAS = 'lourdes.124.bares.mp';

const paymentOptions = [
  {
    id: 'efectivo',
    title: 'Efectivo',
    Icon: CashIcon
  },
  {
    id: 'transferencia',
    title: 'Transferencia',
    alias: TRANSFER_ALIAS,
    Icon: BankIcon
  },
  {
    id: 'mercado_pago',
    title: 'Mercado Pago',
    description: 'Proximamente',
    disabled: true,
    iconImage: '/mercado-pago-icon.png'
  }
];

function CheckoutView({
  cartItems,
  checkoutMessage,
  isSubmitting,
  onBack,
  onFinishOrder
}) {
  const [selectedMethod, setSelectedMethod] = useState('');
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="checkout-view">
      <div className="checkout-heading">
        <span>Pago</span>
        <h2>Elegir medio de pago</h2>
      </div>

      <div className="checkout-layout">
        <div className="payment-options">
          {paymentOptions.map((option) => {
            const isSelected = selectedMethod === option.id;
            const Icon = option.Icon;

            return (
              <button
                className={`payment-option ${isSelected ? 'is-selected' : ''} ${
                  option.disabled ? 'is-disabled' : ''
                }`}
                disabled={option.disabled}
                key={option.id}
                type="button"
                onClick={() => setSelectedMethod(option.id)}
              >
                <span className="payment-option-copy">
                  <strong>
                    {option.title}
                    {option.disabled && <em>Proximamente</em>}
                  </strong>
                  {option.alias ? (
                    <span>
                      Alias: <b>{option.alias}</b>
                    </span>
                  ) : option.description ? (
                    <span>{option.description}</span>
                  ) : null}
                </span>

                <span className="payment-option-side">
                  {isSelected && (
                    <span className="payment-selected-check">
                      <CheckIcon />
                    </span>
                  )}
                  <span className="payment-option-icon">
                    {option.iconImage ? (
                      <img src={option.iconImage} alt="" aria-hidden="true" />
                    ) : (
                      <Icon />
                    )}
                  </span>
                </span>
              </button>
            );
          })}

          <p className="delivery-note">
            Para coordinar la entrega, comunicarse al WhatsApp {WHATSAPP_NUMBER}.
             <br />
            Si pagas por transferencia, envia el comprobante por la misma via.
          </p>

          <a
            className="checkout-whatsapp"
            href={buildWhatsAppUrl(orderWhatsAppMessage())}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon />
            Escribir por WhatsApp
          </a>

          <p className="delivery-note">
            Las entregas se coordinan por WhatsApp segun zona y disponibilidad.
          </p>

          {checkoutMessage && <p className="checkout-message">{checkoutMessage}</p>}

          <div className="checkout-actions">
            <button className="cart-clear" type="button" onClick={onBack}>
              Volver al catalogo
            </button>
            {selectedMethod && (
              <button
                className="cart-checkout"
                type="button"
                disabled={isSubmitting}
                onClick={() => onFinishOrder(selectedMethod)}
              >
                {isSubmitting ? 'Finalizando...' : 'Finalizar pedido'}
              </button>
            )}
          </div>
        </div>

        <aside className="checkout-summary">
          <span>Resumen</span>
          <div className="checkout-summary-items">
            {cartItems.map((item) => (
              <div key={item.variantKey}>
                <span>
                  {item.quantity} x {item.name}
                  {item.variety && ` (${item.variety})`}
                </span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="checkout-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CheckoutView;
