import { loginUser, signupUser, authErrorMessage } from '/src/authentication.js';

class LoginModal extends HTMLElement {
    connectedCallback() {
        this.className = 'position-fixed top-0 start-0 w-100 h-100 align-items-center justify-content-center p-3';
        this.style.cssText = 'display:none; background:rgba(0,0,0,.75); z-index:2000;';
    }

    showPopup(message) {
        this.style.display = 'flex';
        this.innerHTML = `
            <div class="bg-dark text-white rounded p-4 w-100 position-relative" style="max-width:400px">
                <p class="login-message"></p>
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-secondary close-login" type="button">Not now</button>
                    <button class="btn text-white show-login" style="background:#fe2c55" type="button">Log in</button>
                </div>
            </div>`;
        this.querySelector('.login-message').textContent = message;
        this.querySelector('.close-login').onclick = () => this.hide();
        this.querySelector('.show-login').onclick = () => this.showAuthForm();
    }

    showAuthForm(signup = false) {
        this.firstElementChild.innerHTML = `
            <form>
                <button class="btn text-white position-absolute top-0 end-0 close-login" type="button" aria-label="Close">✕</button>
                <h2 class="h4 mb-3">${signup ? 'Sign up' : 'Log in'}</h2>
                <p class="login-error text-danger"></p>
                ${signup ? '<input class="form-control mb-3" name="name" placeholder="Name" required>' : ''}
                <input class="form-control mb-3" name="email" type="email" placeholder="Email" required>
                <input class="form-control mb-3" name="password" type="password" placeholder="Password" required>
                <button class="btn text-white w-100" style="background:#fe2c55" type="submit">${signup ? 'Create account' : 'Log in'}</button>
                <button class="btn btn-link w-100 mt-2 toggle-auth" type="button">${signup ? 'Already have an account? Log in' : 'Need an account? Sign up'}</button>
            </form>`;

        this.querySelector('.close-login').onclick = () => this.hide();
        this.querySelector('.toggle-auth').onclick = () => this.showAuthForm(!signup);
        this.querySelector('form').onsubmit = async (event) => {
            event.preventDefault();
            const form = event.target;
            try {
                const email = form.elements.email.value.trim();
                const password = form.elements.password.value;
                if (signup) {
                    await signupUser(form.elements.name.value.trim(), email, password);
                } else {
                    await loginUser(email, password);
                }
                this.hide();
            } catch (error) {
                this.querySelector('.login-error').textContent = authErrorMessage(error);
            }
        };
    }

    hide() {
        this.style.display = 'none';
    }
}

customElements.define('login-modal', LoginModal);

export function showLoginModal(message) {
    let modal = document.querySelector('login-modal');
    if (!modal) {
        modal = document.createElement('login-modal');
        document.body.appendChild(modal);
    }
    modal.showPopup(message);
}
