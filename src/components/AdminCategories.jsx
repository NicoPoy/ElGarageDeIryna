import React, { useMemo, useState } from 'react';

function AdminCategories({
  categories,
  message,
  productCounts,
  onCreateCategory,
  onRenameCategory,
  onToggleCategory
}) {
  const [categoryName, setCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!categoryName.trim()) {
      setLocalError('Escribi el nombre de la categoria.');
      return;
    }

    setIsSaving(true);
    const wasSaved = await onCreateCategory(categoryName);
    setIsSaving(false);

    if (wasSaved) {
      setCategoryName('');
    }
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setLocalError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setLocalError('');
  };

  const handleRename = async (category) => {
    setLocalError('');

    if (!editingName.trim()) {
      setLocalError('El nombre de la categoria no puede estar vacio.');
      return;
    }

    setIsSaving(true);
    const wasSaved = await onRenameCategory(category, editingName);
    setIsSaving(false);

    if (wasSaved) {
      cancelEditing();
    }
  };

  return (
    <section className="admin-categories">
      <div className="admin-heading">
        <div>
          <span>Solo admin</span>
          <h2>Categorias</h2>
        </div>
      </div>

      <div className="admin-categories-layout">
        <form className="admin-form admin-category-form" onSubmit={handleCreate}>
          <label>
            Nombre
            <input
              type="text"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ej: Collares"
            />
          </label>

          {(localError || message) && (
            <p
              className={`admin-message ${
                localError || message.startsWith('No se') || message.startsWith('Falta')
                  ? 'error'
                  : 'success'
              }`}
            >
              {localError || message}
            </p>
          )}

          <div className="admin-form-actions">
            <button className="admin-submit" type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Agregar categoria'}
            </button>
          </div>
        </form>

        <div className="admin-category-list">
          {sortedCategories.length === 0 ? (
            <p className="admin-empty">Todavia no hay categorias cargadas.</p>
          ) : (
            sortedCategories.map((category) => {
              const isEditing = editingId === category.id;

              return (
                <article
                  className={`admin-category-card ${category.active ? '' : 'is-inactive'}`}
                  key={category.id}
                >
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    ) : (
                      <>
                        <strong>{category.name}</strong>
                        <span>{productCounts[category.id] || 0} productos</span>
                      </>
                    )}
                  </div>

                  <span className={category.active ? 'category-active' : 'category-inactive'}>
                    {category.active ? 'Activa' : 'Inactiva'}
                  </span>

                  <div className="admin-category-actions">
                    {isEditing ? (
                      <>
                        <button
                          className="admin-submit"
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleRename(category)}
                        >
                          Guardar
                        </button>
                        <button
                          className="admin-cancel-button"
                          type="button"
                          onClick={cancelEditing}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="admin-secondary-button"
                          type="button"
                          onClick={() => startEditing(category)}
                        >
                          Editar
                        </button>
                        <button
                          className={
                            category.active ? 'admin-danger-button' : 'admin-submit'
                          }
                          type="button"
                          onClick={() => onToggleCategory(category)}
                        >
                          {category.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminCategories;
