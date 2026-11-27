// Import Bootrap styles.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

// Import LearnTok's global stylesheet.
import '/src/styles/style.css';

/**
 * Escape characters into html entities.
 * 
 * Normally .replace would only replace the first instance of the character in first 
 * argument, but the 'g' in the Regex statement means global, and so the replace finds 
 * all instances throughout the string and replaces them.
 * 
 * @param {string} value contains html characters that need to be escaped 
 * @returns {string} a string with all literal ampersands, chevrons, double-quotes, and single-quotes
 *                   replaced by the escaped entity.
 */
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");