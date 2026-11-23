import 'bootstrap-icons/font/bootstrap-icons.css';
import { navigationItems, isCurrentPage } from './navigation-items.js';

class DesktopNavbar extends HTMLElement {
    connectedCallback() {
        document.body.classList.add('has-desktop-navbar');
        this.innerHTML = `
            <aside class="desktop-sidebar" aria-label="Desktop navigation">
                <a class="desktop-brand" href="/">
                    <i class="bi bi-mortarboard-fill" aria-hidden="true"></i>
                    <span>Learn Tok</span>
                </a>
                <nav class="d-flex flex-column gap-2">
                    ${navigationItems.map(item => `
                        <a class="desktop-nav-link ${isCurrentPage(item.href) ? 'active' : ''}"
                           href="${item.href}"
                           ${isCurrentPage(item.href) ? 'aria-current="page"' : ''}>
                            <i class="bi ${item.icon}" aria-hidden="true"></i>
                            <span>${item.label}</span>
                        </a>`).join('')}
                </nav>
            </aside>`;
    }

    disconnectedCallback() {
        document.body.classList.remove('has-desktop-navbar');
    }
}

customElements.define('desktop-navbar', DesktopNavbar);
