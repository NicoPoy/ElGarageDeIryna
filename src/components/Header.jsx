import React from 'react';

function Header() {
  return (
    <header className="brand-header">
      <div className="brand-lockup">
        <img src="/logo-iryna.png" alt="El Garage de Iryna" />
        <div className="brand-copy">
          <span className="eyebrow">Aromas, limpieza y detalles para tu hogar</span>
          <h1>El Garage de Iryna</h1>
          <p>Productos de limpieza, fragancias, jabones artesanales y papeleria creativa.</p>
        </div>
      </div>
    </header>
  );
}

export default Header;
