import i18n from './i18n.js';
import LanguageSelector from './language.js';
import { getSession, signOut } from './auth.js';
import { initRouteProtection } from './routeProtection.js';

// Función para rotar banners
let banners = document.querySelectorAll('.banner');
let index = 0;
function rotateBanner() {
    banners.forEach((banner, i) => {
        banner.style.display = (i === index) ? 'block' : 'none';
    });
    index = (index + 1) % banners.length;
}
setInterval(rotateBanner, 3000);

// Función para actualizar los elementos de la interfaz según el estado de la sesión
async function updateUIBasedOnSession() {
    const session = await getSession();
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const actionButtons = document.querySelectorAll('.action-button');
    
    if (session) {
        // Usuario con sesión activa
        if (loginButton) loginButton.style.display = 'none';
        if (logoutButton) {
            logoutButton.style.display = 'block';
            // Asegúrate de que el evento click esté correctamente asignado
            logoutButton.addEventListener('click', async () => {
                await signOut();
            });
        }
        
        // Actualizar los enlaces de los botones de acción para ir directamente a las páginas correspondientes
        actionButtons.forEach(button => {
            // Eliminar cualquier evento click previo clonando y reemplazando el botón
            const newButton = button.cloneNode(true);
            
            // Asignar los nuevos href antes de reemplazar
            if (newButton.textContent.trim().includes('Pedido Especial') || 
                newButton.getAttribute('data-i18n') === 'special_order') {
                newButton.href = './specialOrder.html';
            } else if (newButton.textContent.trim().includes('Comprar Ahora') || 
                      newButton.getAttribute('data-i18n') === 'buy_now') {
                // Cambiar el texto a "Mi Carrito"
                const iconElement = newButton.querySelector('i');
                // Mantenemos el ícono pero cambiamos el texto
                if (iconElement) {
                    // Limpiamos el contenido y añadimos el ícono y el nuevo texto
                    newButton.innerHTML = '';
                    newButton.appendChild(iconElement);
                    
                    // Crear un nuevo span con atributo data-i18n actualizado
                    const span = document.createElement('span');
                    span.setAttribute('data-i18n', 'shopcart');
                    span.textContent = 'Mi Carrito';
                    newButton.appendChild(span);
                } else {
                    newButton.textContent = 'Mi Carrito';
                    newButton.setAttribute('data-i18n', 'shopcart');
                }
                newButton.href = './shoppingCart.html';
            }
            // Reemplazar el botón original con el nuevo
            button.parentNode.replaceChild(newButton, button);
        });
        
        // Actualizar las traducciones después de modificar el DOM
        i18n.updatePageContent();
    } else {
        // Usuario sin sesión
        if (loginButton) loginButton.style.display = 'block';
        if (logoutButton) logoutButton.style.display = 'none';
        
        // Asegurar que los botones de acción redirijan al login
        actionButtons.forEach(button => {
            button.href = './login.html';
        });
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar el selector de idiomas
    const languageSelector = new LanguageSelector();
    
    // Actualizar el contenido con las traducciones
    i18n.updatePageContent();
    
    // Verificar el estado de la sesión y actualizar la UI
    await updateUIBasedOnSession();
    
    // Inicializar protección de rutas
    initRouteProtection();
});