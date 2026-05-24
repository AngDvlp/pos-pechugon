/**
 * Genera un hash SHA-256 de un texto plano (PIN o contraseña) utilizando la API sutil de criptografía del navegador (Web Crypto API).
 * Este método es asíncrono, nativo, extremadamente rápido y seguro para almacenamiento local en el navegador.
 * 
 * @param {string} message - El texto plano a hashear.
 * @returns {Promise<string>} El hash SHA-256 en formato hexadecimal.
 */
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
