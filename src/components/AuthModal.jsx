import React, { useState } from 'react';

const emptyAuthForm = {
  nombre: '',
  whatsapp: '',
  dni: '',
  email: '',
  password: ''
};

function AuthModal({ mode, onClose, onLogin, onModeChange, onRegister }) {
  const [form, setForm] = useState(emptyAuthForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await onRegister(form);
      } else {
        await onLogin({
          email: form.email,
          password: form.password
        });
      }

      onClose();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'No se pudo completar el acceso.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label="Cerrar">
          x
        </button>

        <div className="auth-heading">
          <span>{isRegister ? 'Crear cuenta' : 'Acceso'}</span>
          <h2 id="auth-title">{isRegister ? 'Registrarse' : 'Iniciar sesion'}</h2>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            className={!isRegister ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('login')}
          >
            Iniciar sesion
          </button>
          <button
            className={isRegister ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('register')}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label>
                <span>Nombre</span>
                <input
                  value={form.nombre}
                  onChange={(event) => updateField('nombre', event.target.value)}
                  required
                />
              </label>
              <label>
                <span>WhatsApp</span>
                <input
                  value={form.whatsapp}
                  onChange={(event) => updateField('whatsapp', event.target.value)}
                  placeholder="+5493754419227"
                  required
                />
              </label>
              <label>
                <span>DNI</span>
                <input
                  value={form.dni}
                  onChange={(event) => updateField('dni', event.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
            />
          </label>

          <label>
            <span>Contrasena</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              minLength={6}
              required
            />
          </label>

          {status.message && <p className={`auth-message ${status.type}`}>{status.message}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AuthModal;
