import React from 'react';

function ConfirmDialog({
  confirmLabel = 'Confirmar',
  isDanger = false,
  message,
  onCancel,
  onConfirm,
  title
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <span>{isDanger ? 'Atencion' : 'Confirmacion'}</span>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>

        <div className="confirm-actions">
          <button className="admin-cancel-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={isDanger ? 'admin-danger-button' : 'admin-submit'}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
