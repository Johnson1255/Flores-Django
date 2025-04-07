// Importar SOLO si mantienes theme/i18n JS
import { initTheme } from './theme.js';
// import i18n from './i18n.js';
// import LanguageSelector from './language.js';
// NO importar auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tema y (opcionalmente) i18n
    initTheme();
    // const languageSelector = new LanguageSelector();
    // i18n.updatePageContent();

    // Obtener elementos del DOM para las pestañas
    const loginTab = document.querySelector('.tab-button[data-i18n="login"]'); // O usa un ID/clase más específico
    const registerTab = document.querySelector('.tab-button[data-i18n="register"]');
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');

    // Función para mostrar el formulario de inicio de sesión
    function showLoginForm() {
        if (!loginTab || !registerTab || !loginForm || !registerForm) return;
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }

    // Función para mostrar el formulario de registro
    function showRegisterForm() {
        if (!loginTab || !registerTab || !loginForm || !registerForm) return;
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }

    // Asignar eventos click a las pestañas
    if (loginTab) {
        loginTab.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }

    if (registerTab) {
        registerTab.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }

    // Mostrar el formulario correcto al inicio (login por defecto)
    showLoginForm();

    // --- IMPORTANTE ---
    // La lógica de envío de formularios (submit listeners) se ha ELIMINADO.
    // Los formularios ahora deben tener method="post" y action="{% url '...' %}"
    // y un {% csrf_token %}. Django manejará el envío, la validación,
    // el inicio de sesión/registro y la redirección.
    // Puedes añadir validaciones básicas de frontend aquí si quieres (ej. campos no vacíos),
    // pero la validación principal y la lógica ocurren en el backend.
});