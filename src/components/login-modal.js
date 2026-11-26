import { loginUser, signupUser, authErrorMessage } from '/src/authentication.js';

/**
 * The LoginModal is a popup used to notify a user of the fact that they must login
 * to the application before completing some action.
 * 
 * If liking a video requires the user to be logged in, use {@link showLoginModal}
 * function to display the LoginModal.
 * 
 * This element covers the entire screen with a semi-transparent black background and
 * displays a small modal above the background where the user can take actions such as
 * logging in, registering a new account, switching between the login and register forms,
 * and closing the popup via the 'X' or 'Not now' buttons.
 * 
 * This is the only place in the whole application where the user can login/register for
 * an account.
 * 
 * @extends HTMLElement
 */
class LoginModal extends HTMLElement {

    /**
     * Create the background ahead of the LoginModal being used by another 
     * part of the application.
     * 
     * The display property is set to none, so it is not visible at first,
     * and classes pertaining to flex will have no effect yet.
     * 
     * @public
     * @returns {void}
     */
    connectedCallback() {
        this.className = 'position-fixed top-0 start-0 w-100 h-100 align-items-center justify-content-center p-3';

        // Sets the elements inline style property to this string.
        this.style.cssText = 'display:none; background:rgba(0,0,0,.75); z-index:2000;';
    }

    /**
     * Display the popup to the user with a custom message that describes why
     * they must login.
     * 
     * Event handler properties used:
     * 1) .close-login (onclick): Hide the login screen, this is the first button inside the innerHTML 
     *                  assignment
     * 2) .show-login (onclick): Update the content of the modal to show the login form because no argument 
     *                           is passed in place of the default argument for .showAuthForm(signup = false).
     * 
     * @param {string} message the message to show to the user in the popup, 
     *                         so that the popup can address any specific reason
     * @public
     * @returns {void}
    */
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

    /**
     * Show the user the login form, or the register form if signup=true.
     * 
     * If the form is unsuccessful in logging in, or registering the user, an error
     * message will be displayed in read text above the form to notify the user.
     * 
     * This method must be called after showPopup as it creates the container for this methods
     * content (i.e. a firstElementChild must exist in this elements DOM tree before this method 
     * is called).
     * 
     * Event handler properties used:
     * 1) .close-login (onclick): Hide the login screen, this is the first button inside the innerHTML 
     *                  assignment
     * 2) .toggle-auth (onclick): Update the content of the modal to be the either the login page or the register page,
     *                            in this case.
     * 
     *                            The behaviour is that embedding !signup inside each subsequent call to showAuthForm
     *                            will flip-flop the original value to the opposite value without any extra management.
     * 
     * Attaches 1 event listener to the form that it creates:
     * 1) form (onsubmit): QuerySelector finds the <form id="loginForm"> and attaches
     *                     a 'submit' event listener with the callback this.#submitForm 
     * 
     * @param {boolean} signup whether to show the user the login form or the 
     *                         register form (default = false)
     * @public
     * @returns {void}
     */
    showAuthForm(signup = false) {
        this.firstElementChild.innerHTML = `
            <form id="loginForm">
                <button class="btn text-white position-absolute top-0 end-0 close-login" type="button" aria-label="Close">✕</button>
                <h2 class="h4 mb-3">${signup ? 'Sign up' : 'Log in'}</h2>
                <p class="login-error text-danger"></p>
                ${signup ? '<input class="form-control mb-3" name="name" placeholder="Name" required>' : ''}
                
                <!-- signup flag -->
                <input name="signup" value="${Number(signup)}" required hidden>

                <input class="form-control mb-3" name="email" type="email" placeholder="Email" required>
                <input class="form-control mb-3" name="password" type="password" placeholder="Password" required>
                <button class="btn text-white w-100" style="background:#fe2c55" type="submit">${signup ? 'Create account' : 'Log in'}</button>
                <button class="btn btn-link w-100 mt-2 toggle-auth" type="button">${signup ? 'Already have an account? Log in' : 'Need an account? Sign up'}</button>
            </form>`;

        this.querySelector('.close-login').onclick = () => this.hide();
        this.querySelector('.toggle-auth').onclick = () => this.showAuthForm(!signup);
        this.querySelector('#loginForm').addEventListener('submit', this.#submitForm.bind(this))
    }

    /**
     * Submit the login/register form and log the user in.
     *
     * Uses functions from 'src/authenctication.js' to complete the request.
     * 
     * @param {Event | SubmitEvent} event the event object that is created when the form is submitted
     * @private
     * @returns {Promise<void>}
     */
    async #submitForm(event) {
        event.preventDefault();
        const form = event.target;
        try {
            const email = form.elements.email.value.trim();
            const password = form.elements.password.value;
            const signup = Number(form.elements.signup.value);

            if (signup == 1) {
                await signupUser(form.elements.name.value.trim(), email, password);
            } else {
                await loginUser(email, password);
            }
            this.hide();
        } catch (error) {
            this.querySelector('.login-error').textContent = authErrorMessage(error);
        }
    };

    /**
     * Hide this element on the DOM.
     * 
     * @public
     * @returns {void}
     */
    hide() {
        this.style.display = 'none';
    }
}

/**
 * Show the LoginModal by reusing a past instance and updating the message
 * displayed, or by creating a new one if no instance exists on the DOM yet.
 * 
 * @param {string} message a message to show to the user in the login modal
 * @global
 * @returns {void}
 */
export function showLoginModal(message) {
    let modal = document.querySelector('login-modal');
    if (!modal) {
        modal = document.createElement('login-modal');
        document.body.appendChild(modal);
    }
    modal.showPopup(message);
}

/**
 * Hide the login modal when the user logs in in another tab.
 * 
 * @global
 * @returns {void}
 */
export function hideLoginModal() {
    let modal = document.querySelector('login-modal');
    if (modal) {
        modal.hide();
    }
}

// Register the custom element with the CustomElementRegistry.
customElements.define('login-modal', LoginModal);
