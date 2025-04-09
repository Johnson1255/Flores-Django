// Keep theme import if used globally
import { initTheme } from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the theme
    initTheme();
    // Remove language selector and i18n initialization if not used elsewhere
    // const languageSelector = new LanguageSelector();
    // i18n.updatePageContent();

    // Get DOM elements using updated selectors for Django template
    const loginTab = document.querySelector('.tab-button[data-tab="login"]');
    const registerTab = document.querySelector('.tab-button[data-tab="register"]');
    const loginForm = document.getElementById('login-form-content'); // Use ID
    const registerForm = document.getElementById('register-form-content'); // Use ID

    // Function to show the login form
    function showLoginForm() {
        // Add checks to ensure elements exist before manipulating them
        if (!loginTab || !registerTab || !loginForm || !registerForm) {
            console.warn("Login/Register tab or form elements not found.");
            return;
        }
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }

    // Function to show the registration form
    function showRegisterForm() {
        if (!loginTab || !registerTab || !loginForm || !registerForm) {
             console.warn("Login/Register tab or form elements not found.");
            return;
        }
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }

    // Assign click events to the tabs
    if (loginTab) {
        loginTab.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior if it were an anchor
            showLoginForm();
        });
    }

    if (registerTab) {
        registerTab.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterForm();
        });
    }

    // Show the login form by default when the page loads
    showLoginForm();

    // REMOVED: Event listeners for form submission (loginForm.addEventListener('submit', ...))
    // REMOVED: Event listeners for form submission (registerForm.addEventListener('submit', ...))
    // Django now handles form submission via the 'action' and 'method' attributes in the HTML.
});
