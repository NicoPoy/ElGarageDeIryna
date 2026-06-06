import React from 'react';

const sortOptions = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'stock-desc', label: 'Mas stock' }
];

const stockFilterOptions = [
  { value: 'with-stock', label: 'Con stock' },
  { value: 'without-stock', label: 'Sin stock' },
  { value: 'all', label: 'Todos' }
];

function Toolbar({
  activeCategory,
  adminStockFilter,
  categories,
  isAdmin = false,
  query,
  sortOrder,
  onCategoryChange,
  onQueryChange,
  onSortOrderChange,
  onStockFilterChange
}) {
  return (
    <section className="toolbar" aria-label="Filtros del catalogo">
      <label className="search-field">
        <span>Buscar</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Aromas, jabones, detergentes..."
        />
      </label>

      <label className="select-field">
        <span>Categoria</span>
        <select
          value={activeCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="select-field">
        <span>Ordenar por</span>
        <select
          value={sortOrder}
          onChange={(event) => onSortOrderChange(event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {isAdmin && (
        <label className="select-field">
          <span>Stock</span>
          <select
            value={adminStockFilter}
            onChange={(event) => onStockFilterChange(event.target.value)}
          >
            {stockFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

export default Toolbar;
