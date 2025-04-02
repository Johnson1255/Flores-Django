import { initTheme } from './theme.js';
import i18n from './i18n.js';
import LanguageSelector from './language.js';
import { signIn, signUp } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el tema y el selector de idiomas
    initTheme();
    const languageSelector = new LanguageSelector();
    i18n.updatePageContent();

    // Obtener elementos del DOM
    const loginTab = document.querySelector('.tab-button[data-i18n="login"]');
    const registerTab = document.querySelector('.tab-button[data-i18n="register"]');
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');

    // Función para obtener parámetros de la URL
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    }

    // Función para mostrar el formulario de inicio de sesión
    function showLoginForm() {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }

    // Función para mostrar el formulario de registro
    function showRegisterForm() {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }

    // Asignar eventos click a las pestañas
    if (loginTab) {
        loginTab.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    }

    if (registerTab) {
        registerTab.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterForm();
        });
    }

    // Manejo del registro de usuarios
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Verificación de contraseñas coincidentes
            const password = registerForm.querySelector('#password-registro').value;
            const confirmPassword = registerForm.querySelector('#confirm-password').value;
            
            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }
            
            // Recopilar datos del formulario
            const formData = {
                nombre: registerForm.querySelector('#nombre').value,
                apellidos: registerForm.querySelector('#apellidos').value,
                email: registerForm.querySelector('#email-registro').value,
                telefono: registerForm.querySelector('#telefono').value,
                pais: registerForm.querySelector('#pais').value,
                ciudad: registerForm.querySelector('#ciudad').value,
                barrio: registerForm.querySelector('#barrio').value,
                direccion: registerForm.querySelector('#direccion').value,
                codigoPostal: registerForm.querySelector('#codigo-postal').value,
                password: password,
                ocasiones: Array.from(registerForm.querySelectorAll('input[name="ocasiones"]:checked'))
                        .map(input => input.value),
                newsletter: registerForm.querySelector('input[name="newsletter"]')?.checked || false
            };

            try {
                // Registrar con Supabase
                const { data, error } = await signUp(formData.email, formData.password, formData);
                
                if (error) {
                    alert(`Error en el registro: ${error.message}`);
                    return;
                }

                alert('Registro exitoso! Por favor, verifica tu correo electrónico para confirmar tu cuenta.');
                registerForm.reset();
                showLoginForm(); // Cambiar a la vista de login
            } catch (err) {
                console.error("Error durante el registro:", err);
                alert("Ocurrió un error durante el registro. Por favor, intenta de nuevo.");
            }
        });
    }

    // Manejo del login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
                
            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;
            
            try {
                // Iniciar sesión con Supabase
                const { data, error } = await signIn(email, password);

                if (error) {
                    alert(`Error al iniciar sesión: ${error.message}`);
                    return;
                }

                if (data?.user) {
                    // Obtener URL de retorno si existe
                    const params = getUrlParams();
                    const returnUrl = params.returnUrl || '/index.html';
                    
                    // Redireccionar a la página solicitada o al inicio
                    window.location.href = returnUrl;
                }
            } catch (err) {
                console.error("Error durante el inicio de sesión:", err);
                alert("Ocurrió un error durante el inicio de sesión. Por favor, intenta de nuevo.");
            }
        });
    }
});