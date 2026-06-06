import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { compressImageToWebp } from '../utils/imageCompression';

const MAX_IMAGE_SIZE_MB = 1.5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_PRODUCT_PHOTOS = 4;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const initialForm = {
  name: '',
  categoryId: '',
  price: '',
  stock: '1',
  photos: [],
  varietyDraft: '',
  varieties: [],
  variantStocks: {}
};

const clearPhotoPreviews = (photos = []) => {
  photos.forEach((photo) => {
    if (photo.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl);
    }
  });
};

const buildVariantStocks = (variants = []) =>
  variants.reduce(
    (stockMap, variant) => ({
      ...stockMap,
      [variant.name]: String(variant.stock ?? 0)
    }),
    {}
  );

function AdminPanel({
  categories,
  editingProduct,
  message,
  onCancelEdit,
  onCreateProduct,
  onExportProducts,
  onUpdateProduct
}) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const [removedImageUrls, setRemovedImageUrls] = useState([]);
  const isEditing = Boolean(editingProduct);

  const categoryOptions = useMemo(
    () =>
      [...categories]
        .filter((category) => category.active !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const currentPhotoPreviews = useMemo(() => {
    const images = editingProduct?.images?.length
      ? editingProduct.images
      : [editingProduct?.image || DEFAULT_PRODUCT_IMAGE];

    return images
      .filter(Boolean)
      .filter((image) => !removedImageUrls.includes(image));
  }, [editingProduct, removedImageUrls]);
  const displayedPhotoPreviews = (() => {
    const previews = isEditing
      ? [...currentPhotoPreviews, ...form.photos.map((photo) => photo.previewUrl)]
      : form.photos.map((photo) => photo.previewUrl);

    return previews.length ? previews : [DEFAULT_PRODUCT_IMAGE];
  })();
  const variantRows = useMemo(
    () => form.varieties.map((name) => ({ key: name, name })),
    [form.varieties]
  );
  const generalStock = Math.max(0, Number(form.stock || 0));
  const varietiesStockTotal = useMemo(
    () =>
      variantRows.reduce(
        (sum, variant) =>
          sum + Math.max(0, Number(form.variantStocks[variant.key] || 0)),
        0
      ),
    [form.variantStocks, variantRows]
  );
  const hasStockOverflow = variantRows.length > 0 && varietiesStockTotal > generalStock;

  useEffect(() => {
    if (!editingProduct) {
      setForm((currentForm) => {
        clearPhotoPreviews(currentForm.photos);
        return initialForm;
      });
      return;
    }

    setRemovedImageUrls([]);
    setForm((currentForm) => {
      clearPhotoPreviews(currentForm.photos);

      return {
        name: editingProduct.name || '',
        categoryId: editingProduct.categoryId || '',
        price: String(editingProduct.price || ''),
        stock: String(editingProduct.stock ?? 0),
        photos: [],
        varietyDraft: '',
        varieties: editingProduct.varieties || [],
        variantStocks: buildVariantStocks(editingProduct.variants)
      };
    });
    setLocalError('');
  }, [editingProduct]);

  useEffect(() => {
    return () => {
      clearPhotoPreviews(form.photos);
    };
  }, []);

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!form.name.trim() || !form.categoryId) {
      setLocalError('Completa nombre y categoria para guardar el producto.');
      return;
    }

    if (Number(form.price) <= 0) {
      setLocalError('El precio tiene que ser mayor a cero.');
      return;
    }

    if (Number(form.stock) < 0) {
      setLocalError('El stock no puede ser negativo.');
      return;
    }

    if (hasStockOverflow) {
      setLocalError('La suma del stock de las variedades no puede superar el stock general.');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price: form.price,
      stock: form.stock,
      photoFiles: form.photos.map((photo) => photo.file),
      varietiesText: form.varieties.join('\n'),
      variants: variantRows.map((variant) => ({
        name: variant.name,
        stock: Math.max(0, Number(form.variantStocks[variant.key] ?? 0))
      }))
    };

    const wasSaved = isEditing
      ? await onUpdateProduct({
          ...payload,
          id: editingProduct.id,
          currentImageUrl:
            currentPhotoPreviews[0] === DEFAULT_PRODUCT_IMAGE ? null : currentPhotoPreviews[0],
          currentImageUrls: currentPhotoPreviews.filter(
            (image) => image !== DEFAULT_PRODUCT_IMAGE
          ),
          currentImagePath: editingProduct.imagePath
        })
      : await onCreateProduct(payload);

    setIsSaving(false);

    if (wasSaved) {
      setForm((currentForm) => {
        clearPhotoPreviews(currentForm.photos);
        return initialForm;
      });
    }
  };

  const handleCancelEdit = () => {
    setLocalError('');
    setRemovedImageUrls([]);
    setForm((currentForm) => {
      clearPhotoPreviews(currentForm.photos);
      return initialForm;
    });
    onCancelEdit();
  };

  const updateVariantStock = (key, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      variantStocks: {
        ...currentForm.variantStocks,
        [key]: value
      }
    }));
  };

  const addPhotoFiles = async (files) => {
    const newFiles = Array.from(files || []);

    if (!newFiles.length) return;

    const invalidTypeFiles = newFiles.filter(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type)
    );

    if (invalidTypeFiles.length) {
      setLocalError('Solo se permiten imagenes JPG, PNG o WEBP.');
      return;
    }

    const currentPhotoCount =
      (isEditing ? currentPhotoPreviews.filter((image) => image !== DEFAULT_PRODUCT_IMAGE).length : 0) +
      form.photos.length;

    if (currentPhotoCount >= MAX_PRODUCT_PHOTOS) {
      setLocalError(`Cada producto puede tener hasta ${MAX_PRODUCT_PHOTOS} fotos.`);
      return;
    }

    const availableSlots = MAX_PRODUCT_PHOTOS - currentPhotoCount;
    const filesToProcess = newFiles.slice(0, availableSlots);

    if (newFiles.length > availableSlots) {
      setLocalError(`Solo se agregaron ${availableSlots} foto(s). El maximo es ${MAX_PRODUCT_PHOTOS}.`);
    } else {
      setLocalError('');
    }

    let compressedFiles;

    try {
      compressedFiles = await Promise.all(filesToProcess.map(compressImageToWebp));
    } catch (error) {
      setLocalError(`No se pudo optimizar la imagen: ${error.message}`);
      return;
    }

    const oversizedFiles = compressedFiles.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES);

    if (oversizedFiles.length) {
      setLocalError(
        `Despues de optimizar, cada foto puede pesar hasta ${MAX_IMAGE_SIZE_MB} MB. Revisa: ${oversizedFiles
          .map((file) => file.name)
          .join(', ')}.`
      );
      return;
    }

    setForm((currentForm) => {
      const knownFiles = new Set(
        currentForm.photos.map(
          (photo) => `${photo.file.name}-${photo.file.size}-${photo.file.lastModified}`
        )
      );
      const uniqueNewFiles = compressedFiles.filter(
        (file) => !knownFiles.has(`${file.name}-${file.size}-${file.lastModified}`)
      );
      const nextPhotos = uniqueNewFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      return {
        ...currentForm,
        photos: [...currentForm.photos, ...nextPhotos]
      };
    });
  };

  const removePhotoFile = (index) => {
    setForm((currentForm) => ({
      ...currentForm,
      photos: currentForm.photos.filter((photo, fileIndex) => {
        if (fileIndex === index) {
          clearPhotoPreviews([photo]);
          return false;
        }

        return true;
      })
    }));
  };

  const removeExistingPhoto = (imageUrl) => {
    if (!isEditing || imageUrl === DEFAULT_PRODUCT_IMAGE) return;

    setRemovedImageUrls((currentUrls) =>
      currentUrls.includes(imageUrl) ? currentUrls : [...currentUrls, imageUrl]
    );
  };

  const addVariety = () => {
    const nextVariety = form.varietyDraft.trim();

    if (!nextVariety) return;

    if (
      form.varieties.some(
        (variety) => variety.toLowerCase() === nextVariety.toLowerCase()
      )
    ) {
      setLocalError('Esa variedad ya esta cargada.');
      return;
    }

    setLocalError('');
    setForm((currentForm) => ({
      ...currentForm,
      varietyDraft: '',
      varieties: [...currentForm.varieties, nextVariety],
      variantStocks: {
        ...currentForm.variantStocks,
        [nextVariety]: '0'
      }
    }));
  };

  const removeVariety = (name) => {
    setForm((currentForm) => {
      const nextVariantStocks = { ...currentForm.variantStocks };
      delete nextVariantStocks[name];

      return {
        ...currentForm,
        varieties: currentForm.varieties.filter((variety) => variety !== name),
        variantStocks: nextVariantStocks
      };
    });
  };

  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <div>
          <span>{isEditing ? 'Edicion' : 'Gestion'}</span>
          <h2>{isEditing ? 'Modificar producto' : 'Administrar productos'}</h2>
        </div>
        {onExportProducts && (
          <button className="admin-secondary-button" type="button" onClick={onExportProducts}>
            Exportar productos
          </button>
        )}
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-section admin-form-main-section">
          <div className="admin-section-title">
            <span>Datos principales</span>
            <small>Informacion base para mostrar el producto en el catalogo.</small>
          </div>

          <div className="admin-basic-grid">
            <label className="admin-field-large">
              <span>Nombre</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Ej: Limpiador multiuso lavanda"
              />
            </label>

            <label>
              <span>Categoria</span>
              <select
                value={form.categoryId}
                onChange={(event) => updateField('categoryId', event.target.value)}
              >
                <option value="">Seleccionar categoria</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Precio</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                placeholder="2500"
              />
            </label>

            <label>
              <span>Stock</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField('stock', event.target.value)}
                placeholder="1"
              />
            </label>
          </div>
        </div>

        <div className="admin-form-section admin-media-section">
          <div className="admin-section-title">
            <span>Fotos del producto</span>
            <small>
              {isEditing
                ? `Podes sumar fotos nuevas sin perder las actuales. Maximo ${MAX_PRODUCT_PHOTOS} fotos.`
                : `Podes cargar fotos de a poco. Maximo ${MAX_PRODUCT_PHOTOS} fotos.`}
            </small>
          </div>

          <div className="admin-media-layout">
            <label className="photo-upload-button">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => {
                  addPhotoFiles(event.target.files);
                  event.target.value = '';
                }}
              />
              <span aria-hidden="true">+</span>
              <strong>Agregar fotos</strong>
              <small>JPG, PNG o WEBP</small>
            </label>

            <div className="admin-photo-preview-grid">
              {displayedPhotoPreviews.map((preview, index) => {
                const selectedIndex = isEditing ? index - currentPhotoPreviews.length : index;
                const isSelectedFile = selectedIndex >= 0 && form.photos[selectedIndex];
                const isExistingFile = isEditing && index < currentPhotoPreviews.length;

                return (
                  <figure key={`${preview}-${index}`}>
                    <img src={preview} alt="" aria-hidden="true" />
                    {(isSelectedFile || isExistingFile) && (
                      <button
                        type="button"
                        onClick={() =>
                          isSelectedFile
                            ? removePhotoFile(selectedIndex)
                            : removeExistingPhoto(preview)
                        }
                        aria-label="Quitar foto"
                      >
                        x
                      </button>
                    )}
                  </figure>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-form-section admin-varieties-section">
          <div className="variety-builder">
            <div className="variety-builder-header">
              <span>Variedades opcionales</span>
              <small>Agrega solo las opciones que correspondan a este producto.</small>
            </div>

            <div className="variety-add-row">
              <input
                type="text"
                value={form.varietyDraft}
                onChange={(event) => updateField('varietyDraft', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addVariety();
                  }
                }}
                placeholder="Ej: Dorado, Plateado, Rosa chico"
              />
              <button
                className="variety-add-button"
                type="button"
                onClick={addVariety}
                aria-label="Agregar variedad"
              >
                +
              </button>
            </div>
          </div>

          {variantRows.length > 0 && (
            <div className="variant-stock-editor">
              <div className="variant-stock-summary">
                <span>Stock asignado en variedades</span>
                <strong className={hasStockOverflow ? 'is-over' : ''}>
                  {varietiesStockTotal} / {generalStock}
                </strong>
              </div>
              <div className="variant-stock-list">
                {variantRows.map((variant) => (
                  <label key={variant.key}>
                    <strong>
                      {variant.name}
                    </strong>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.variantStocks[variant.key] ?? form.stock}
                      onChange={(event) => updateVariantStock(variant.key, event.target.value)}
                    />
                    <button
                      className="variant-remove-button"
                      type="button"
                      onClick={() => removeVariety(variant.name)}
                      aria-label={`Quitar ${variant.name}`}
                    >
                      x
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

          {(localError || message) && (
            <p className={`admin-message ${localError ? 'error' : 'success'}`}>
              {localError || message}
            </p>
          )}

          <div className="admin-form-actions">
            <button className="admin-submit" type="submit" disabled={isSaving}>
              {isSaving
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Agregar producto'}
            </button>

            {isEditing && (
              <button
                className="admin-cancel-button"
                type="button"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
      </form>

    </section>
  );
}

export default AdminPanel;
