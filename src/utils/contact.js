export const WHATSAPP_NUMBER = '+54 9 3754 41-9227';
export const WHATSAPP_WA_NUMBER = '5493754419227';

export const normalizeWhatsAppNumber = (value = '') => {
  const digits = String(value).replace(/\D/g, '');

  if (!digits) return WHATSAPP_WA_NUMBER;
  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('9')) return `54${digits}`;

  return `549${digits}`;
};

export const normalizeBuenosAiresWhatsApp = (value = '') => {
  const rawDigits = String(value).replace(/\D/g, '');

  if (!rawDigits) {
    return {
      error: 'Ingresa un WhatsApp para poder coordinar la entrega.',
      value: ''
    };
  }

  let mobileDigits = rawDigits;

  if (mobileDigits.startsWith('549')) {
    mobileDigits = mobileDigits.slice(3);
  } else if (mobileDigits.startsWith('54')) {
    mobileDigits = mobileDigits.slice(2);
    if (mobileDigits.startsWith('9')) {
      mobileDigits = mobileDigits.slice(1);
    }
  } else if (mobileDigits.startsWith('9') && mobileDigits.length === 11) {
    mobileDigits = mobileDigits.slice(1);
  }

  if (mobileDigits.startsWith('0')) {
    mobileDigits = mobileDigits.slice(1);
  }

  if (mobileDigits.length !== 10) {
    return {
      error: 'El WhatsApp tiene que quedar con formato +549 seguido del numero.',
      value: ''
    };
  }

  return {
    error: '',
    value: `+549${mobileDigits}`
  };
};

export const buildWhatsAppUrl = (message = '', phone = WHATSAPP_WA_NUMBER) =>
  `https://wa.me/${normalizeWhatsAppNumber(phone)}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`;

export const orderWhatsAppMessage = (orderId) =>
  `Hola, soy cliente de El Garage de Iryna. Quiero coordinar la entrega${
    orderId ? ` del pedido #${orderId}` : ''
  }.`;
