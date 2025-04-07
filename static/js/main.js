// Importaciones opcionales si mantienes i18n JS (no recomendado)
// import i18n from './i18n.js';
// import LanguageSelector from './language.js';
// NO importes auth.js, routeProtection.js, etc.

// Función para rotar banners (Mantenida)
let banners = document.querySelectorAll('.banner');
let currentBannerIndex = 0; // Renombrado para evitar conflicto con 'index' global
function rotateBanner() {
    if (banners.length === 0) return; // Evitar errores si no hay banners
    banners.forEach((banner, i) => {
        banner.style.display = (i === currentBannerIndex) ? 'block' : 'none';
    });
    currentBannerIndex = (currentBannerIndex + 1) % banners.length;
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar rotación de banner si existen
    if (banners.length > 0) {
        setInterval(rotateBanner, 3000);
        rotateBanner(); // Mostrar el primer banner inmediatamente
    }

    // Inicializar otras funcionalidades de UI pura si las hay
    // Ejemplo: si mantienes i18n JS (no recomendado)
    // const languageSelector = new LanguageSelector();
    // i18n.updatePageContent();

    console.log("Main JS de Flores Valentín inicializado (versión Django).");

    // La lógica de actualizar UI basada en sesión (login/logout buttons, hrefs)
    // AHORA SE HACE EN LA PLANTILLA DJANGO (base.html) usando {% if user.is_authenticated %} y {% url %}.
    // No es necesario hacerlo aquí en JS.

    // La protección de rutas AHORA SE HACE EN LAS VISTAS DJANGO con @login_required.
});

// Puedes añadir aquí otras funciones globales de UI si es necesario,
// pero evita lógica de datos o autenticación.