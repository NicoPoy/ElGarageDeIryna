import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminCategories from './components/AdminCategories';
import AdminOrders from './components/AdminOrders';
import AdminOutOfStock from './components/AdminOutOfStock';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutView from './components/CheckoutView';
import ConfirmDialog from './components/ConfirmDialog';
import Header from './components/Header';
import OrderSuccess from './components/OrderSuccess';
import ProductCatalog from './components/ProductCatalog';
import SiteFooter from './components/SiteFooter';
import Toolbar from './components/Toolbar';
import TopActions from './components/TopActions';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCT_IMAGE,
  INITIAL_PRODUCTS,
  MOCK_USERS
} from './data/products';
import { api } from './lib/api';
import { downloadCsv } from './utils/csv';
import { normalizeBuenosAiresWhatsApp } from './utils/contact';

const CART_STORAGE_KEY = 'el-garage-iryna-cart';
const CART_STORAGE_TTL_MS = 15 * 60 * 1000;
const USERS_STORAGE_KEY = 'el-garage-iryna-users';
const PRODUCTS_STORAGE_KEY = 'el-garage-iryna-products';
const CATEGORIES_STORAGE_KEY = 'el-garage-iryna-categories';
const ORDERS_STORAGE_KEY = 'el-garage-iryna-orders';

const clone = (value) => JSON.parse(JSON.stringify(value));

const readStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') return clone(fallback);

  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return value || clone(fallback);
  } catch {
    return clone(fallback);
  }
};

const writeStoredValue = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const clearStoredCart = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
};

const sanitizeCartItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item.id,
      variantId: item.variantId || null,
      variantKey: item.variantKey,
      name: item.name,
      price: Number(item.price || 0),
      image: item.image,
      variety: item.variety || '',
      quantity: Math.max(1, Number(item.quantity || 1))
    }))
    .filter((item) => item.id && item.variantKey && item.name && item.price > 0);

const getStoredCartItems = () => {
  if (typeof window === 'undefined') return [];

  try {
    const storedCart = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || 'null');

    if (!storedCart?.expiresAt || Date.now() > storedCart.expiresAt) {
      clearStoredCart();
      return [];
    }

    return sanitizeCartItems(storedCart.items);
  } catch {
    clearStoredCart();
    return [];
  }
};

const saveStoredCartItems = (items) => {
  if (typeof window === 'undefined') return;

  if (!items.length) {
    clearStoredCart();
    return;
  }

  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      expiresAt: Date.now() + CART_STORAGE_TTL_MS,
      items
    })
  );
};

const normalizeOptions = (value) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const getSelectedVariant = (product, variety) => {
  if (!product.variants?.length) return null;
  return product.variants.find((variant) => variant.name === variety);
};

const getVariantStockTotal = (variants) =>
  variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0);

const reserveCartItemStock = (product, item) => {
  const quantity = Math.max(0, Number(item.quantity || 0));

  return {
    ...product,
    stock: Math.max(0, product.stock - quantity),
    availableStock: Math.max(0, (product.availableStock ?? product.stock) - quantity),
    variants: item.variantId
      ? product.variants.map((variant) =>
          variant.id === item.variantId
            ? { ...variant, stock: Math.max(0, variant.stock - quantity) }
            : variant
        )
      : product.variants
  };
};

const getCartItemAvailableStock = (product, item) => {
  if (!product) return 0;

  const selectedVariant = item.variantId
    ? product.variants?.find((variant) => variant.id === item.variantId)
    : null;

  return selectedVariant ? selectedVariant.stock : product.stock;
};

const reconcileCartWithProducts = (products, cartItems) => {
  let nextProducts = products;
  let changed = false;

  const nextCartItems = cartItems
    .map((item) => {
      const product = nextProducts.find((currentProduct) => currentProduct.id === item.id);
      const availableStock = getCartItemAvailableStock(product, item);
      const nextQuantity = Math.min(item.quantity, availableStock);

      if (!product || nextQuantity <= 0) {
        changed = true;
        return null;
      }

      if (nextQuantity !== item.quantity) changed = true;

      const nextItem = { ...item, quantity: nextQuantity };
      nextProducts = nextProducts.map((currentProduct) =>
        currentProduct.id === item.id ? reserveCartItemStock(currentProduct, nextItem) : currentProduct
      );

      return nextItem;
    })
    .filter(Boolean);

  return { cartItems: nextCartItems, changed, products: nextProducts };
};

const createLocalImageUrls = (files = []) =>
  Array.from(files)
    .filter(Boolean)
    .map((file) => URL.createObjectURL(file));

const buildVariants = ({ productId, stock, variants = [], varieties = [] }) => {
  if (variants.length) {
    return variants.map((variant, index) => ({
      id: `${productId}-var-${index + 1}`,
      name: variant.name || variant.nombre || '',
      stock: Math.max(0, Number(variant.stock || 0)),
      active: true
    }));
  }

  return varieties.map((variety, index) => ({
    id: `${productId}-var-${index + 1}`,
    name: variety,
    stock: 0,
    active: true
  }));
};

const buildSession = (user) => ({
  user: {
    id: user.id,
    email: user.email,
    user_metadata: {
      nombre: user.nombre
    }
  }
});

function App() {
  const [catalogProducts, setCatalogProducts] = useState(() =>
    readStoredValue(PRODUCTS_STORAGE_KEY, INITIAL_PRODUCTS)
  );
  const [catalogCategories, setCatalogCategories] = useState(() =>
    readStoredValue(CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES)
  );
  const [users, setUsers] = useState(() => readStoredValue(USERS_STORAGE_KEY, MOCK_USERS));
  const [orders, setOrders] = useState(() => readStoredValue(ORDERS_STORAGE_KEY, []));
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [adminStockFilter, setAdminStockFilter] = useState('with-stock');
  const [authMode, setAuthMode] = useState('login');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [cartItems, setCartItems] = useState(getStoredCartItems);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentView, setCurrentView] = useState('catalog');
  const [productsStatus, setProductsStatus] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [ordersStatus, setOrdersStatus] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolver = useRef(null);

  const requestConfirm = ({ confirmLabel, isDanger = false, message, title }) =>
    new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmDialog({ confirmLabel, isDanger, message, title });
    });

  const closeConfirmDialog = (result) => {
    confirmResolver.current?.(result);
    confirmResolver.current = null;
    setConfirmDialog(null);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isClient = userRoles.includes('cliente');
  const isAdmin = userRoles.includes('admin');
  const displayName = profile?.nombre || session?.user?.user_metadata?.nombre || 'usuario';

  const applyCatalogData = ({ categories: nextCategories, products: nextProducts }) => {
    if (nextCategories) setCatalogCategories(nextCategories);
    if (nextProducts) setCatalogProducts(nextProducts);
  };

  const refreshCatalog = async () => {
    const data = await api.getCatalog();
    applyCatalogData(data);
    setIsApiConnected(true);
    setProductsStatus('');
    return data;
  };

  const refreshOrders = async () => {
    const data = await api.getOrders();
    setOrders(data.orders || []);
    setIsApiConnected(true);
    return data.orders || [];
  };

  useEffect(() => saveStoredCartItems(cartItems), [cartItems]);
  useEffect(() => writeStoredValue(PRODUCTS_STORAGE_KEY, catalogProducts), [catalogProducts]);
  useEffect(() => writeStoredValue(CATEGORIES_STORAGE_KEY, catalogCategories), [catalogCategories]);
  useEffect(() => writeStoredValue(USERS_STORAGE_KEY, users), [users]);
  useEffect(() => writeStoredValue(ORDERS_STORAGE_KEY, orders), [orders]);

  useEffect(() => {
    const reconciledCart = reconcileCartWithProducts(catalogProducts, cartItems);

    if (reconciledCart.changed) {
      setCatalogProducts(reconciledCart.products);
      setCartItems(reconciledCart.cartItems);
      if (cartItems.length) {
        setCartMessage(
          reconciledCart.cartItems.length
            ? 'Actualizamos tu carrito porque cambio el stock disponible.'
            : 'Tu carrito guardado vencio o ya no tiene stock disponible.'
        );
      }
    }
    setProductsStatus('');
  }, []);

  useEffect(() => {
    refreshCatalog().catch(() => {
      setIsApiConnected(false);
      setProductsStatus('Usando datos locales hasta configurar Turso.');
    });
  }, []);

  const activeProducts = useMemo(
    () =>
      catalogProducts.filter(
        (product) => product.active !== false && (product.availableStock ?? product.stock) > 0
      ),
    [catalogProducts]
  );

  const outOfStockProducts = useMemo(
    () =>
      catalogProducts.filter(
        (product) => product.active !== false && (product.availableStock ?? product.stock) <= 0
      ),
    [catalogProducts]
  );

  const categories = useMemo(
    () => [
      'Todos',
      ...catalogCategories
        .filter((category) => category.active !== false)
        .map((category) => category.name)
        .sort((a, b) => a.localeCompare(b))
    ],
    [catalogCategories]
  );

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const sourceProducts = isAdmin ? catalogProducts : activeProducts;

    const products = sourceProducts.filter((product) => {
      if (product.active === false) return false;

      const productStock = product.availableStock ?? product.stock;
      const matchesStockFilter =
        !isAdmin ||
        adminStockFilter === 'all' ||
        (adminStockFilter === 'with-stock' && productStock > 0) ||
        (adminStockFilter === 'without-stock' && productStock <= 0);
      const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      return matchesStockFilter && matchesCategory && matchesSearch;
    });

    return [...products].sort((a, b) => {
      if (sortOrder === 'price-asc') return a.price - b.price;
      if (sortOrder === 'price-desc') return b.price - a.price;
      if (sortOrder === 'stock-desc') {
        return (b.availableStock ?? b.stock) - (a.availableStock ?? a.stock);
      }

      return a.name.localeCompare(b.name);
    });
  }, [activeCategory, activeProducts, adminStockFilter, catalogProducts, isAdmin, query, sortOrder]);

  const adminOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [orders]
  );

  const userOrders = useMemo(
    () =>
      adminOrders.filter((order) => order.userId === session?.user?.id || order.customer.email === profile?.email),
    [adminOrders, profile?.email, session?.user?.id]
  );

  const productCountsByCategory = useMemo(
    () =>
      catalogProducts.reduce((counts, product) => {
        if (!product.categoryId || product.active === false) return counts;
        return {
          ...counts,
          [product.categoryId]: (counts[product.categoryId] || 0) + 1
        };
      }, {}),
    [catalogProducts]
  );

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLogin = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const data = await api.login({ email: normalizedEmail, password });
      setIsApiConnected(true);
      setSession(buildSession(data.user));
      setProfile(data.user);
      setUserRoles(data.user.roles || []);
      refreshOrders().catch(() => {});
      return;
    } catch (error) {
      if (error.code !== 'API_UNAVAILABLE') throw error;
    }

    const user = users.find(
      (currentUser) =>
        currentUser.email.toLowerCase() === normalizedEmail && currentUser.password === password
    );

    if (!user) {
      throw new Error('Email o contrasena incorrectos.');
    }

    setSession(buildSession(user));
    setProfile(user);
    setUserRoles(user.roles || []);
  };

  const handleRegister = async (form) => {
    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedWhatsApp = normalizeBuenosAiresWhatsApp(form.whatsapp);
    const dniDigits = form.dni.replace(/\D/g, '');

    if (normalizedWhatsApp.error) throw new Error(normalizedWhatsApp.error);
    if (dniDigits.length < 7 || dniDigits.length > 8) {
      throw new Error('El DNI tiene que tener 7 u 8 numeros.');
    }
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Ese email ya esta registrado. Inicia sesion o usa otro correo.');
    }

    try {
      const data = await api.register({
        ...form,
        email: normalizedEmail,
        whatsapp: normalizedWhatsApp.value,
        dni: dniDigits
      });
      setIsApiConnected(true);
      setSession(buildSession(data.user));
      setProfile(data.user);
      setUserRoles(data.user.roles || []);
      return;
    } catch (error) {
      if (isApiConnected) throw error;
    }

    const nextUser = {
      id: `cliente-${crypto.randomUUID()}`,
      email: normalizedEmail,
      password: form.password,
      nombre: form.nombre.trim(),
      whatsapp: normalizedWhatsApp.value,
      dni: dniDigits,
      roles: ['cliente']
    };

    setUsers((currentUsers) => [...currentUsers, nextUser]);
    setSession(buildSession(nextUser));
    setProfile(nextUser);
    setUserRoles(nextUser.roles);
  };

  const handleLogout = () => {
    setSession(null);
    setProfile(null);
    setUserRoles([]);
    setCartItems([]);
    setIsCartOpen(false);
    setCurrentView('catalog');
  };

  const openAdminView = (view) => {
    setCurrentView(view);
    setEditingProduct(null);
    setCheckoutMessage('');
    setOrdersStatus('');
    setAdminMessage('');
  };

  const openClientView = (view) => {
    setCurrentView(view);
    setCheckoutMessage('');
    setOrdersStatus('');
  };

  const createProduct = async (product) => {
    setAdminMessage('');
    const selectedCategory = catalogCategories.find(
      (category) => String(category.id) === String(product.categoryId)
    );

    if (!selectedCategory) {
      setAdminMessage('Selecciona una categoria valida.');
      return false;
    }

    const varieties = normalizeOptions(product.varietiesText || '');
    const productId = `prod-${crypto.randomUUID()}`;
    const variants = buildVariants({
      productId,
      varieties,
      variants: product.variants,
      stock: product.stock
    });
    const variantStockTotal = getVariantStockTotal(variants);

    if (variantStockTotal > Number(product.stock || 0)) {
      setAdminMessage('La suma del stock de las variedades no puede superar el stock general.');
      return false;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Cargar producto',
      message: `Se va a cargar "${product.name}" en el catalogo.`,
      title: 'Confirmar producto'
    });

    if (!confirmed) return false;

    if (isApiConnected) {
      try {
        const data = await api.createProduct({
          name: product.name.trim(),
          categoryId: selectedCategory.id,
          price: Number(product.price),
          stock: Number(product.stock || 0),
          imageUrls: [],
          variants
        });
        applyCatalogData(data);
        setAdminMessage('Producto cargado correctamente en Turso.');
        return true;
      } catch (error) {
        setAdminMessage(`No se pudo guardar en Turso: ${error.message}`);
        return false;
      }
    }

    const imageUrls = createLocalImageUrls(product.photoFiles);
    const images = imageUrls.length ? imageUrls : [DEFAULT_PRODUCT_IMAGE];
    const nextProduct = {
      id: productId,
      name: product.name.trim(),
      category: selectedCategory.name,
      categoryId: selectedCategory.id,
      price: Number(product.price),
      stock: Number(product.stock || 0),
      availableStock: variants.length ? variantStockTotal : Number(product.stock || 0),
      image: images[0],
      images,
      imagePath: null,
      varieties: variants.length ? variants.map((variant) => variant.name).filter(Boolean) : varieties,
      variants,
      active: true
    };

    setCatalogProducts((currentProducts) =>
      [...currentProducts, nextProduct].sort((a, b) =>
        `${a.category} ${a.name}`.localeCompare(`${b.category} ${b.name}`)
      )
    );
    setAdminMessage('Producto cargado correctamente.');
    return true;
  };

  const updateProduct = async (product) => {
    setAdminMessage('');
    const selectedCategory = catalogCategories.find(
      (category) => String(category.id) === String(product.categoryId)
    );

    if (!selectedCategory) {
      setAdminMessage('Selecciona una categoria valida.');
      return false;
    }

    const varieties = normalizeOptions(product.varietiesText || '');
    const variants = buildVariants({
      productId: product.id,
      varieties,
      variants: product.variants,
      stock: product.stock
    });
    const variantStockTotal = getVariantStockTotal(variants);

    if (variantStockTotal > Number(product.stock || 0)) {
      setAdminMessage('La suma del stock de las variedades no puede superar el stock general.');
      return false;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Guardar cambios',
      message: `Se va a modificar "${product.name}".`,
      title: 'Confirmar cambios'
    });

    if (!confirmed) return false;

    if (isApiConnected) {
      try {
        const data = await api.updateProduct(product.id, {
          name: product.name.trim(),
          categoryId: selectedCategory.id,
          price: Number(product.price),
          stock: Number(product.stock || 0),
          imageUrls: product.currentImageUrls?.length
            ? product.currentImageUrls
            : product.currentImageUrl
              ? [product.currentImageUrl]
              : [],
          variants
        });
        applyCatalogData(data);
        setEditingProduct(null);
        setAdminMessage('Producto modificado correctamente en Turso.');
        return true;
      } catch (error) {
        setAdminMessage(`No se pudo modificar en Turso: ${error.message}`);
        return false;
      }
    }

    const uploadedImages = createLocalImageUrls(product.photoFiles);
    const preservedImages = product.currentImageUrls?.length
      ? product.currentImageUrls
      : product.currentImageUrl
        ? [product.currentImageUrl]
        : [];
    const images = [...preservedImages, ...uploadedImages].filter(Boolean);
    const finalImages = images.length ? images : [DEFAULT_PRODUCT_IMAGE];

    setCatalogProducts((currentProducts) =>
      currentProducts
        .map((currentProduct) =>
          currentProduct.id === product.id
            ? {
                ...currentProduct,
                name: product.name.trim(),
                category: selectedCategory.name,
                categoryId: selectedCategory.id,
                price: Number(product.price),
                stock: Number(product.stock || 0),
                availableStock: variants.length ? variantStockTotal : Number(product.stock || 0),
                image: finalImages[0],
                images: finalImages,
                varieties: variants.length ? variants.map((variant) => variant.name).filter(Boolean) : varieties,
                variants
              }
            : currentProduct
        )
        .sort((a, b) => `${a.category} ${a.name}`.localeCompare(`${b.category} ${b.name}`))
    );
    setEditingProduct(null);
    setAdminMessage('Producto modificado correctamente.');
    return true;
  };

  const editProduct = (product) => {
    setAdminMessage('');
    setEditingProduct(product);
    setCurrentView('catalog');
  };

  const deleteProduct = async (product) => {
    setAdminMessage('');
    const confirmed = await requestConfirm({
      confirmLabel: 'Eliminar',
      isDanger: true,
      message: `Se va a eliminar "${product.name}" del catalogo.`,
      title: 'Eliminar producto'
    });

    if (!confirmed) return;

    if (isApiConnected) {
      try {
        const data = await api.deleteProduct(product.id);
        applyCatalogData(data);
        setAdminMessage('Producto eliminado correctamente en Turso.');
        return;
      } catch (error) {
        setAdminMessage(`No se pudo eliminar en Turso: ${error.message}`);
        return;
      }
    }

    setCatalogProducts((currentProducts) =>
      currentProducts.filter((currentProduct) => currentProduct.id !== product.id)
    );
    setAdminMessage('Producto eliminado correctamente.');
  };

  const createCategory = async (name) => {
    setAdminMessage('');
    const cleanName = name.trim();

    if (
      catalogCategories.some(
        (category) => category.name.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      setAdminMessage('Esa categoria ya existe.');
      return false;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Crear categoria',
      message: `Se va a crear la categoria "${cleanName}".`,
      title: 'Confirmar categoria'
    });

    if (!confirmed) return false;

    if (isApiConnected) {
      try {
        const data = await api.createCategory({ name: cleanName });
        applyCatalogData(data);
        setAdminMessage('Categoria creada correctamente en Turso.');
        return true;
      } catch (error) {
        setAdminMessage(`No se pudo crear la categoria en Turso: ${error.message}`);
        return false;
      }
    }

    setCatalogCategories((currentCategories) =>
      [
        ...currentCategories,
        {
          id: `cat-${crypto.randomUUID()}`,
          name: cleanName,
          active: true
        }
      ].sort((a, b) => a.name.localeCompare(b.name))
    );
    setAdminMessage('Categoria creada correctamente.');
    return true;
  };

  const renameCategory = async (category, name) => {
    setAdminMessage('');
    const cleanName = name.trim();

    if (cleanName === category.name) return true;
    if (
      catalogCategories.some(
        (currentCategory) =>
          currentCategory.id !== category.id &&
          currentCategory.name.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      setAdminMessage('Ya existe una categoria con ese nombre.');
      return false;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Renombrar',
      message: `La categoria "${category.name}" va a pasar a llamarse "${cleanName}".`,
      title: 'Renombrar categoria'
    });

    if (!confirmed) return false;

    if (isApiConnected) {
      try {
        const data = await api.updateCategory(category.id, { name: cleanName });
        applyCatalogData(data);
        if (activeCategory === category.name) setActiveCategory(cleanName);
        setAdminMessage('Categoria modificada correctamente en Turso.');
        return true;
      } catch (error) {
        setAdminMessage(`No se pudo modificar la categoria en Turso: ${error.message}`);
        return false;
      }
    }

    setCatalogCategories((currentCategories) =>
      currentCategories
        .map((currentCategory) =>
          currentCategory.id === category.id ? { ...currentCategory, name: cleanName } : currentCategory
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setCatalogProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.categoryId === category.id ? { ...product, category: cleanName } : product
      )
    );

    if (activeCategory === category.name) setActiveCategory(cleanName);
    setAdminMessage('Categoria modificada correctamente.');
    return true;
  };

  const toggleCategory = async (category) => {
    setAdminMessage('');
    const nextActive = !category.active;
    const confirmed = await requestConfirm({
      confirmLabel: nextActive ? 'Activar' : 'Desactivar',
      isDanger: !nextActive,
      message: `Se va a ${nextActive ? 'activar' : 'desactivar'} la categoria "${category.name}".`,
      title: `${nextActive ? 'Activar' : 'Desactivar'} categoria`
    });

    if (!confirmed) return;

    if (isApiConnected) {
      try {
        const data = await api.toggleCategory(category.id, { active: nextActive });
        applyCatalogData(data);
        if (!nextActive && activeCategory === category.name) setActiveCategory('Todos');
        setAdminMessage(
          nextActive ? 'Categoria activada correctamente en Turso.' : 'Categoria desactivada correctamente en Turso.'
        );
        return;
      } catch (error) {
        setAdminMessage(`No se pudo modificar la categoria en Turso: ${error.message}`);
        return;
      }
    }

    setCatalogCategories((currentCategories) =>
      currentCategories.map((currentCategory) =>
        currentCategory.id === category.id ? { ...currentCategory, active: nextActive } : currentCategory
      )
    );

    if (!nextActive && activeCategory === category.name) setActiveCategory('Todos');
    setAdminMessage(
      nextActive ? 'Categoria activada correctamente.' : 'Categoria desactivada correctamente.'
    );
  };

  const changeProductStock = (productId, delta, variantId = null) => {
    setCatalogProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              stock: Math.max(0, product.stock + delta),
              availableStock: Math.max(0, (product.availableStock ?? product.stock) + delta),
              variants: variantId
                ? product.variants.map((variant) =>
                    variant.id === variantId
                      ? { ...variant, stock: Math.max(0, variant.stock + delta) }
                      : variant
                  )
                : product.variants
            }
          : product
      )
    );
  };

  const addToCart = (product, options = {}) => {
    setCartMessage('');

    if (isAdmin) return;
    if (!session) {
      openAuth('login');
      return;
    }
    if (!isClient) {
      setCartMessage('Tu cuenta no tiene rol cliente para comprar.');
      setIsCartOpen(true);
      return;
    }

    const variety = options.variety || '';
    const selectedVariant = getSelectedVariant(product, variety);
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

    if (availableStock <= 0) {
      setCartMessage('No hay stock disponible para este producto.');
      setIsCartOpen(true);
      return;
    }

    changeProductStock(product.id, -1, selectedVariant?.id || null);
    const variantKey = `${product.id}-${selectedVariant?.id || variety || 'sin-variedad'}`;

    setCartItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.variantKey === variantKey);

      if (currentItem) {
        return currentItems.map((item) =>
          item.variantKey === variantKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...currentItems,
        {
          id: product.id,
          variantId: selectedVariant?.id || null,
          variantKey,
          name: product.name,
          price: product.price,
          image: product.image,
          variety,
          quantity: 1
        }
      ];
    });
    setIsCartOpen(true);
  };

  const increaseCartItem = (variantKey) => {
    const item = cartItems.find((currentItem) => currentItem.variantKey === variantKey);
    const product = catalogProducts.find((currentProduct) => currentProduct.id === item?.id);
    const selectedVariant = item?.variantId
      ? product?.variants.find((variant) => variant.id === item.variantId)
      : null;
    const availableStock = selectedVariant ? selectedVariant.stock : product?.stock;

    if (!product || availableStock <= 0) {
      setCartMessage('No hay mas stock disponible para este producto.');
      return;
    }

    changeProductStock(product.id, -1, item.variantId);
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.variantKey === variantKey ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseCartItem = (variantKey) => {
    setCartMessage('');
    const itemToDecrease = cartItems.find((item) => item.variantKey === variantKey);
    if (itemToDecrease) changeProductStock(itemToDecrease.id, 1, itemToDecrease.variantId);
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.variantKey === variantKey ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (variantKey) => {
    const item = cartItems.find((currentItem) => currentItem.variantKey === variantKey);
    if (!item) return;

    setCartMessage('');
    changeProductStock(item.id, item.quantity, item.variantId);
    setCartItems((currentItems) => currentItems.filter((currentItem) => currentItem.variantKey !== variantKey));
  };

  const clearCart = () => {
    cartItems.forEach((item) => changeProductStock(item.id, item.quantity, item.variantId));
    setCartItems([]);
    setCartMessage('');
    setCheckoutMessage('');
  };

  const checkoutCart = () => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    setCheckoutMessage('');
    setCurrentView('checkout');
  };

  const finishOrder = async (paymentMethod) => {
    setCheckoutMessage('');

    if (!session?.user?.id) {
      setCheckoutMessage('Para finalizar el pedido tenes que iniciar sesion.');
      return;
    }

    setIsSubmittingOrder(true);

    if (isApiConnected) {
      try {
        const data = await api.createOrder({
          userId: session.user.id,
          paymentMethod,
          customer: {
            name: profile?.nombre || 'Cliente demo',
            email: profile?.email || session.user.email,
            whatsapp: profile?.whatsapp || '',
            dni: profile?.dni || ''
          },
          items: cartItems
        });
        if (data.products && data.categories) applyCatalogData(data);
        if (data.orders) setOrders(data.orders);
        setCartItems([]);
        setCompletedOrder(data.order);
        setIsSubmittingOrder(false);
        setCurrentView('order-success');
        return;
      } catch (error) {
        setIsSubmittingOrder(false);
        setCheckoutMessage(`No se pudo finalizar el pedido en Turso: ${error.message}`);
        return;
      }
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const nextOrder = {
      id: String(Date.now()).slice(-6),
      userId: session.user.id,
      date: new Date().toISOString(),
      status: 'pendiente',
      paymentMethod,
      paymentStatus: paymentMethod === 'transferencia' ? 'pendiente_comprobante' : 'pendiente',
      total,
      customer: {
        name: profile?.nombre || 'Cliente demo',
        email: profile?.email || session.user.email,
        whatsapp: profile?.whatsapp || '',
        dni: profile?.dni || ''
      },
      items: cartItems.map((item) => ({
        id: `${item.variantKey}-${Date.now()}`,
        productId: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
        variety: item.variety || '',
        product: {
          name: item.name,
          category: catalogProducts.find((product) => product.id === item.id)?.category || 'Sin categoria',
          image: item.image
        }
      }))
    };

    setOrders((currentOrders) => [nextOrder, ...currentOrders]);
    setCartItems([]);
    setCompletedOrder({
      id: nextOrder.id,
      total,
      paymentMethod
    });
    setIsSubmittingOrder(false);
    setCurrentView('order-success');
  };

  const markOrderDelivered = async (orderId) => {
    setOrdersStatus('');

    if (isApiConnected) {
      const data = await api.updateOrder(orderId, {
        status: 'entregado',
        paymentStatus: 'confirmado'
      });
      setOrders(data.orders || []);
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: 'entregado', paymentStatus: 'confirmado' } : order
      )
    );
  };

  const confirmOrderPaymentReceived = async (orderId) => {
    setOrdersStatus('');

    if (isApiConnected) {
      const data = await api.updateOrder(orderId, {
        paymentStatus: 'comprobante_recibido'
      });
      setOrders(data.orders || []);
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: 'comprobante_recibido' } : order
      )
    );
  };

  const cancelOrder = async (orderId) => {
    setOrdersStatus('');
    const orderToCancel = orders.find((order) => order.id === orderId);
    const confirmed = await requestConfirm({
      confirmLabel: 'Cancelar pedido',
      isDanger: true,
      message: `El pedido #${orderId} se va a cancelar y se devolvera el stock.`,
      title: 'Cancelar pedido'
    });

    if (!confirmed) return;

    if (isApiConnected) {
      try {
        const data = await api.updateOrder(orderId, { status: 'cancelado' });
        setOrders(data.orders || []);
        await refreshCatalog();
        setOrdersStatus(`Pedido #${orderId} cancelado en Turso.`);
        return;
      } catch (error) {
        setOrdersStatus(`No se pudo cancelar en Turso: ${error.message}`);
        return;
      }
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: 'cancelado' } : order
      )
    );

    if (orderToCancel) {
      setCatalogProducts((currentProducts) =>
        currentProducts.map((product) => {
          const restoredItems = orderToCancel.items.filter((item) => item.productId === product.id);
          if (!restoredItems.length) return product;

          const restoredStock = restoredItems.reduce((sum, item) => sum + item.quantity, 0);

          return {
            ...product,
            stock: product.stock + restoredStock,
            availableStock: (product.availableStock ?? product.stock) + restoredStock,
            variants: product.variants.map((variant) => {
              const restoredVariantStock = restoredItems
                .filter((item) => item.variantId === variant.id)
                .reduce((sum, item) => sum + item.quantity, 0);

              return restoredVariantStock
                ? { ...variant, stock: variant.stock + restoredVariantStock }
                : variant;
            })
          };
        })
      );
    }

    setOrdersStatus(`Pedido #${orderId} cancelado. Stock devuelto correctamente.`);
  };

  const loadAdminOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersStatus('');
    if (isApiConnected) {
      await refreshOrders().catch((error) => setOrdersStatus(error.message));
    }
    setIsLoadingOrders(false);
  };

  const loadUserOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersStatus('');
    if (isApiConnected) {
      await refreshOrders().catch((error) => setOrdersStatus(error.message));
    }
    setIsLoadingOrders(false);
  };

  const exportProductsCsv = () => {
    if (!catalogProducts.length) {
      setAdminMessage('No hay productos para exportar.');
      return;
    }

    const rows = catalogProducts.map((product) => ({
      id: product.id,
      nombre: product.name,
      categoria: product.category,
      precio: product.price,
      stock_general: product.stock,
      stock_disponible: product.availableStock ?? product.stock,
      variedades: product.variants?.length
        ? product.variants.map((variant) => `${variant.name}: ${variant.stock}`).join(' | ')
        : '',
      fotos: product.images?.filter((image) => image !== DEFAULT_PRODUCT_IMAGE).join(' | ') || '',
      activo: product.active ? 'si' : 'no'
    }));

    downloadCsv(`productos-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setAdminMessage('Productos exportados en CSV.');
  };

  const exportOrdersCsv = () => {
    if (!adminOrders.length) {
      setOrdersStatus('No hay pedidos para exportar.');
      return;
    }

    const rows = adminOrders.flatMap((order) =>
      order.items.map((item) => ({
        pedido_id: order.id,
        fecha: order.date,
        estado: order.status,
        medio_pago: order.paymentMethod,
        pago_estado: order.paymentStatus,
        cliente: order.customer.name,
        whatsapp: order.customer.whatsapp,
        dni: order.customer.dni,
        producto: item.product.name,
        categoria: item.product.category,
        variedad: item.variety,
        cantidad: item.quantity,
        precio_unitario: item.unitPrice,
        subtotal: item.subtotal,
        total_pedido: order.total
      }))
    );

    downloadCsv(`pedidos-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setOrdersStatus('Pedidos exportados en CSV.');
  };

  return (
    <main className="page-shell">
      <TopActions
        cartCount={cartCount}
        displayName={displayName}
        isAdmin={isAdmin}
        isClient={isClient}
        currentView={currentView}
        onAdminViewChange={openAdminView}
        onCartOpen={() => setIsCartOpen(true)}
        onClientViewChange={openClientView}
        onLoginOpen={() => openAuth('login')}
        onLogout={handleLogout}
        session={session}
      />

      <Header />

      {currentView === 'catalog' && (
        <>
          <Toolbar
            activeCategory={activeCategory}
            adminStockFilter={adminStockFilter}
            categories={categories}
            isAdmin={isAdmin}
            query={query}
            sortOrder={sortOrder}
            onCategoryChange={setActiveCategory}
            onQueryChange={setQuery}
            onSortOrderChange={setSortOrder}
            onStockFilterChange={setAdminStockFilter}
          />

          {productsStatus && <p className="catalog-status">{productsStatus}</p>}
        </>
      )}

      {currentView === 'catalog' && isAdmin && !editingProduct && (
        <AdminPanel
          categories={catalogCategories}
          editingProduct={null}
          message={adminMessage}
          onCancelEdit={() => setEditingProduct(null)}
          onCreateProduct={createProduct}
          onExportProducts={exportProductsCsv}
          onUpdateProduct={updateProduct}
        />
      )}

      {currentView === 'catalog' && isAdmin && editingProduct && (
        <div className="admin-edit-modal-backdrop" role="presentation">
          <div className="admin-edit-modal" role="dialog" aria-modal="true">
            <button
              className="admin-edit-modal-close"
              type="button"
              onClick={() => setEditingProduct(null)}
              aria-label="Cerrar edicion"
            >
              x
            </button>
            <AdminPanel
              categories={catalogCategories}
              editingProduct={editingProduct}
              message={adminMessage}
              onCancelEdit={() => setEditingProduct(null)}
              onCreateProduct={createProduct}
              onExportProducts={null}
              onUpdateProduct={updateProduct}
            />
          </div>
        </div>
      )}

      {currentView === 'out-of-stock' && isAdmin && (
        <AdminOutOfStock
          products={outOfStockProducts}
          onDeleteProduct={deleteProduct}
          onEditProduct={editProduct}
        />
      )}

      {currentView === 'categories' && isAdmin && (
        <AdminCategories
          categories={catalogCategories}
          message={adminMessage}
          productCounts={productCountsByCategory}
          onCreateCategory={createCategory}
          onRenameCategory={renameCategory}
          onToggleCategory={toggleCategory}
        />
      )}

      {currentView === 'orders' && isAdmin ? (
        <AdminOrders
          isLoading={isLoadingOrders}
          message={ordersStatus}
          orders={adminOrders}
          onCancelOrder={cancelOrder}
          onExportOrders={exportOrdersCsv}
          onMarkDelivered={markOrderDelivered}
          onPaymentReceived={confirmOrderPaymentReceived}
          onRefresh={loadAdminOrders}
        />
      ) : currentView === 'my-orders' && !isAdmin ? (
        <AdminOrders
          badge="Historial"
          emptyText="Todavia no realizaste pedidos."
          isLoading={isLoadingOrders}
          message={ordersStatus}
          orders={userOrders}
          showCustomer={false}
          title="Mis pedidos"
          onRefresh={loadUserOrders}
        />
      ) : currentView === 'order-success' && !isAdmin ? (
        <OrderSuccess
          order={completedOrder}
          onBackToCatalog={() => setCurrentView('catalog')}
          onViewOrders={() => setCurrentView('my-orders')}
        />
      ) : currentView === 'catalog' ? (
        <ProductCatalog
          activeCategory={activeCategory}
          canAddToCart={!isAdmin}
          canManageProducts={isAdmin}
          products={filteredProducts}
          onAddToCart={addToCart}
          onDeleteProduct={deleteProduct}
          onEditProduct={editProduct}
        />
      ) : currentView === 'checkout' ? (
        <CheckoutView
          cartItems={cartItems}
          checkoutMessage={checkoutMessage}
          isSubmitting={isSubmittingOrder}
          onBack={() => setCurrentView('catalog')}
          onFinishOrder={finishOrder}
        />
      ) : null}

      <SiteFooter />

      {isAuthOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLogin}
          onModeChange={setAuthMode}
          onRegister={handleRegister}
        />
      )}

      {!isAdmin && (
        <CartDrawer
          cartItems={cartItems}
          cartMessage={cartMessage}
          isClient={isClient}
          isOpen={isCartOpen}
          onCheckout={checkoutCart}
          onClose={() => setIsCartOpen(false)}
          onDecrease={decreaseCartItem}
          onIncrease={increaseCartItem}
          onRemove={removeCartItem}
          onClear={clearCart}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          confirmLabel={confirmDialog.confirmLabel}
          isDanger={confirmDialog.isDanger}
          message={confirmDialog.message}
          title={confirmDialog.title}
          onCancel={() => closeConfirmDialog(false)}
          onConfirm={() => closeConfirmDialog(true)}
        />
      )}
    </main>
  );
}

export default App;
