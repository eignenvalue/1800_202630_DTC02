export const navigationItems = [
    { href: '/', icon: 'bi-house-fill', label: 'Home' },
    { href: '/profile', icon: 'bi-person-circle', label: 'Profile' },
];

export function isCurrentPage(href) {
    const path = window.location.pathname;
    return href === '/' ? path === '/' || path === '/index.html' : path.startsWith(href);
}
