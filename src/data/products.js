export const DEFAULT_PRODUCT_IMAGE = '/product-placeholder.png';

export const DEFAULT_CATEGORIES = [
  { id: 'aromas', name: 'Aromas', active: true },
  { id: 'limpieza-hogar', name: 'Limpieza del hogar', active: true },
  { id: 'jaboneria', name: 'Jabones', active: true },
  { id: 'papeleria', name: 'Papeleria creativa', active: true }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-aroma-ropa',
    name: 'Perfume de ropa Brisa de Limon',
    category: 'Aromas',
    categoryId: 'aromas',
    price: 4200,
    stock: 18,
    availableStock: 18,
    image: '/product-aroma-ropa.svg',
    images: ['/product-aroma-ropa.svg'],
    imagePath: null,
    varieties: ['250 ml', '500 ml'],
    variants: [
      { id: 'prod-aroma-ropa-250', name: '250 ml', stock: 10, active: true },
      { id: 'prod-aroma-ropa-500', name: '500 ml', stock: 8, active: true }
    ],
    active: true
  },
  {
    id: 'prod-aerosol',
    name: 'Aerosol Textil Flores Blancas',
    category: 'Aromas',
    categoryId: 'aromas',
    price: 3600,
    stock: 14,
    availableStock: 14,
    image: '/product-aerosol.svg',
    images: ['/product-aerosol.svg'],
    imagePath: null,
    varieties: ['Flores blancas', 'Vainilla suave', 'Bambu'],
    variants: [
      { id: 'prod-aerosol-flores', name: 'Flores blancas', stock: 6, active: true },
      { id: 'prod-aerosol-vainilla', name: 'Vainilla suave', stock: 4, active: true },
      { id: 'prod-aerosol-bambu', name: 'Bambu', stock: 4, active: true }
    ],
    active: true
  },
  {
    id: 'prod-detergente',
    name: 'Detergente Concentrado Citrico',
    category: 'Limpieza del hogar',
    categoryId: 'limpieza-hogar',
    price: 2900,
    stock: 22,
    availableStock: 22,
    image: '/product-detergente.svg',
    images: ['/product-detergente.svg'],
    imagePath: null,
    varieties: ['500 ml', '1 litro'],
    variants: [
      { id: 'prod-detergente-500', name: '500 ml', stock: 12, active: true },
      { id: 'prod-detergente-1000', name: '1 litro', stock: 10, active: true }
    ],
    active: true
  },
  {
    id: 'prod-multiuso',
    name: 'Limpiador Multiuso Lavanda',
    category: 'Limpieza del hogar',
    categoryId: 'limpieza-hogar',
    price: 3100,
    stock: 16,
    availableStock: 16,
    image: '/product-multiuso.svg',
    images: ['/product-multiuso.svg'],
    imagePath: null,
    varieties: [],
    variants: [],
    active: true
  },
  {
    id: 'prod-jabon',
    name: 'Jabon Artesanal de Avena',
    category: 'Jabones',
    categoryId: 'jaboneria',
    price: 1800,
    stock: 20,
    availableStock: 20,
    image: '/product-jabon.svg',
    images: ['/product-jabon.svg'],
    imagePath: null,
    varieties: ['Avena', 'Calandula', 'Rosas'],
    variants: [
      { id: 'prod-jabon-avena', name: 'Avena', stock: 8, active: true },
      { id: 'prod-jabon-calandula', name: 'Calandula', stock: 6, active: true },
      { id: 'prod-jabon-rosas', name: 'Rosas', stock: 6, active: true }
    ],
    active: true
  },
  {
    id: 'prod-agenda',
    name: 'Agenda Floral para el Hogar',
    category: 'Papeleria creativa',
    categoryId: 'papeleria',
    price: 5200,
    stock: 7,
    availableStock: 7,
    image: '/product-agenda.svg',
    images: ['/product-agenda.svg'],
    imagePath: null,
    varieties: [],
    variants: [],
    active: true
  }
];

export const MOCK_USERS = [
  {
    id: 'admin-local',
    email: 'admin@elgaragedeiryna.com',
    password: 'IrynaBaez2023',
    nombre: 'Iryna Admin',
    whatsapp: '+5493754419227',
    dni: '30000000',
    roles: ['admin']
  },
  {
    id: 'cliente-local',
    email: 'cliente@elgaragedeiryna.com',
    password: 'Cliente123',
    nombre: 'Cliente Demo',
    whatsapp: '+5493754000001',
    dni: '40123456',
    roles: ['cliente']
  }
];
