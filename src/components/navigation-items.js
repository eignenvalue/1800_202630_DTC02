/** A constant that defines the navigation objects (icons, labels, etc)
 *  for both the desktop and mobile navigations
 */
export const navigationItems = [
    { href: '/', icon: 'bi-house-fill', label: 'Home' },
    { href: '/profile', icon: 'bi-person-circle', label: 'Profile' },
];

/**
 * Determine if {@link href} matches the current page location.
 * 
 * @param {string} href the current page URL as Hypertext Reference
 * @returns {boolean} if href matches the current path in window.location.pathname
 */
export function isCurrentPage(href) {
    const path = window.location.pathname;
    return href === '/' ? path === '/' || path === '/index.html' : path.startsWith(href);
}
