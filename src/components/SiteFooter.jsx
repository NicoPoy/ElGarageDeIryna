import React from 'react';
import { InstagramIcon, WhatsAppIcon } from './icons';
import { buildWhatsAppUrl, WHATSAPP_NUMBER } from '../utils/contact';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-panel">
        <div className="footer-brand">
          <img src="/logo-iryna.png" alt="" aria-hidden="true" />
          <div>
            <span>Contacto</span>
            <strong>El Garage de Iryna</strong>
            <p>Consultas por aromas, productos de limpieza y detalles para el hogar.</p>
          </div>
        </div>

        <nav className="contact-links" aria-label="Datos de contacto">
          <a
            href={buildWhatsAppUrl('Hola, quiero consultar por productos de El Garage de Iryna.')}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon />
            <span>{WHATSAPP_NUMBER}</span>
          </a>
          <a
            href="https://www.instagram.com/elgaragedeiryna"
            target="_blank"
            rel="noreferrer"
          >
            <InstagramIcon />
            <span>@elgaragedeiryna</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;
