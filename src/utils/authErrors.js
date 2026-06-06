export const getAuthErrorMessage = (error) => {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Ese email ya esta registrado. Inicia sesion o usa otro correo.';
  }

  if (message.includes('invalid login credentials')) {
    return 'Email o contrasena incorrectos.';
  }

  if (message.includes('email not confirmed')) {
    return 'Primero tenes que confirmar tu email desde el correo que recibiste.';
  }

  if (message.includes('password')) {
    return 'La contrasena no cumple los requisitos minimos.';
  }

  if (message.includes('duplicate key') && message.includes('dni')) {
    return 'Ese DNI ya esta registrado.';
  }

  if (message.includes('database error saving new user')) {
    return 'No se pudo crear el usuario. Puede que el email o el DNI ya esten registrados.';
  }

  return error?.message || 'No se pudo completar la operacion.';
};
