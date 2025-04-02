import Polyglot from 'node-polyglot';

class I18nManager {
  constructor() {
    this.polyglot = new Polyglot();
    this.currentLocale = 'es'; // Idioma por defecto (español)
    this.phrases = {
      es: {}, // Español
      en: {}, // Inglés
      // Podemos añadir más idiomas
    };
    
    this.loadTranslations();
    this.setLocale(this.getSavedLocale() || this.currentLocale);
  }
  
  // Carga traducciones para todos los idiomas
  loadTranslations() {
    // Español
    this.phrases.es = {
      // General
      'welcome': 'Bienvenido a Flores San Valentín',
      'slogan': 'Arreglos florales únicos y personalizados',
      'shopcart': 'Mi Carrito de Compras',
      
      // Navegación
      'home': 'Inicio',
      'catalog': 'Catálogo',
      'gallery': 'Galería',
      'location': 'Ubicación',
      'contact': 'Contacto',
      
      // Botones de acción
      'special_order': 'Pedido Especial',
      'buy_now': 'Comprar Ahora',
      'auth_login': 'Iniciar Sesión',
      'auth_logout': 'Cerrar Sesión',
      
      // Contacto y ubicación
      'phone': 'Teléfono',
      'email': 'Correo Electrónico',
      'address': 'Dirección',
      'opening_hours': 'Horario de atención',
      'monday_friday': 'Lunes a Viernes: 9:00 - 20:00',
      'saturday': 'Sábados: 9:00 - 18:00',
      'sunday': 'Domingos: 10:00 - 14:00',
      'contact_us': 'Contacto',
      'name': 'Nombre',
      'message': 'Mensaje',
      'send': 'Enviar',
      'directions': 'Cómo llegar',
      'visit_us': 'Visítanos',
      
      // Catálogo
      'our_catalog': 'Nuestro Catálogo',
      'red_roses': 'Rosas Rojas',
      'red_roses_desc': 'Ramos elegantes de rosas rojas, perfectos para expresar amor y pasión.',
      'tulips': 'Tulipanes',
      'tulips_desc': 'Arreglos coloridos de tulipanes holandeses frescos.',
      'orchids': 'Orquídeas',
      'orchids_desc': 'Elegantes arreglos de orquídeas para ocasiones especiales.',
      'from': 'Desde',
      'view_details': 'Ver detalles',
      
      // Galería
      'image_gallery': 'Galería de Imágenes',
      
      // Ubicación
      'our_location': 'Nuestra Ubicación',
      
      // Footer
      'about_us': 'Sobre Nosotros',
      'about_us_desc': 'Somos especialistas en arreglos florales únicos y personalizados. Con más de 15 años de experiencia llevando belleza y color a momentos especiales.',
      'follow_us': 'Síguenos',
      'all_rights_reserved': 'Todos los derechos reservados.',
      'privacy_policy': 'Política de Privacidad',
      'terms_conditions': 'Términos y Condiciones',
      'cookie_policy': 'Política de Cookies',
      
      // Login
      'login': 'Iniciar Sesión',
      'register': 'Registrarse',
      'welcome_flowers': 'Bienvenido a Flores San Valentín',
      'login_message': 'Para continuar con tu compra, por favor inicia sesión o crea una cuenta nueva',
      'password': 'Contraseña',
      'remember_me': 'Recordarme',
      'forgot_password': '¿Olvidaste tu contraseña?',
      'or_login_with': 'O inicia sesión con',
      'back_to_home': 'Volver al inicio',
      'create_account': 'Crear Cuenta',
      
      // Registro
      'personal_info': 'Información Personal',
      'first_name': 'Nombre',
      'last_name': 'Apellidos',
      'phone_number': 'Teléfono',
      'country': 'País',
      'city': 'Ciudad',
      'neighborhood': 'Barrio',
      'delivery_address': 'Dirección de Entrega',
      'postal_code': 'Código Postal',
      'confirm_password': 'Confirmar Contraseña',
      'occasions': 'Ocasiones de interés (opcional)',
      'birthdays': 'Cumpleaños',
      'anniversaries': 'Aniversarios',
      'weddings': 'Bodas',
      'condolences': 'Condolencias',
      'newsletter': 'Deseo recibir ofertas y novedades por correo electrónico',
      'terms_accept': 'Acepto los términos y condiciones y la política de privacidad*'
    };
    
    // Inglés
    this.phrases.en = {
      // General
      'welcome': 'Welcome to Valentine\'s Flowers',
      'slogan': 'Unique and personalized floral arrangements',
      'shopcart': 'My Shopping Cart',
      
      // Navegación
      'home': 'Home',
      'catalog': 'Catalog',
      'gallery': 'Gallery',
      'location': 'Location',
      'contact': 'Contact',
      
      // Botones de acción
      'special_order': 'Special Order',
      'buy_now': 'Buy Now',
      'auth_login': 'Sign In',
      'auth_logout': 'Log Out',
      
      // Contacto y ubicación
      'phone': 'Phone',
      'email': 'Email',
      'address': 'Address',
      'opening_hours': 'Opening Hours',
      'monday_friday': 'Monday to Friday: 9:00 - 20:00',
      'saturday': 'Saturday: 9:00 - 18:00',
      'sunday': 'Sunday: 10:00 - 14:00',
      'contact_us': 'Contact Us',
      'name': 'Name',
      'message': 'Message',
      'send': 'Send',
      'directions': 'Get Directions',
      'visit_us': 'Visit Us',
      
      // Catálogo
      'our_catalog': 'Our Catalog',
      'red_roses': 'Red Roses',
      'red_roses_desc': 'Elegant red rose bouquets, perfect for expressing love and passion.',
      'tulips': 'Tulips',
      'tulips_desc': 'Colorful arrangements of fresh Dutch tulips.',
      'orchids': 'Orchids',
      'orchids_desc': 'Elegant orchid arrangements for special occasions.',
      'from': 'From',
      'view_details': 'View Details',
      
      // Galería
      'image_gallery': 'Image Gallery',
      
      // Ubicación
      'our_location': 'Our Location',
      
      // Footer
      'about_us': 'About Us',
      'about_us_desc': 'We specialize in unique and personalized floral arrangements. With over 15 years of experience bringing beauty and color to special moments.',
      'follow_us': 'Follow Us',
      'all_rights_reserved': 'All rights reserved.',
      'privacy_policy': 'Privacy Policy',
      'terms_conditions': 'Terms and Conditions',
      'cookie_policy': 'Cookie Policy',
      
      // Login
      'login': 'Login',
      'register': 'Register',
      'welcome_flowers': 'Welcome to Valentine\'s Flowers',
      'login_message': 'To continue with your purchase, please login or create a new account',
      'password': 'Password',
      'remember_me': 'Remember me',
      'forgot_password': 'Forgot your password?',
      'or_login_with': 'Or login with',
      'back_to_home': 'Back to home',
      'create_account': 'Create Account',
      
      // Registro
      'personal_info': 'Personal Information',
      'first_name': 'First Name',
      'last_name': 'Last Name',
      'phone_number': 'Phone Number',
      'country': 'Country',
      'city': 'City',
      'neighborhood': 'Neighborhood',
      'delivery_address': 'Delivery Address',
      'postal_code': 'Postal Code',
      'confirm_password': 'Confirm Password',
      'occasions': 'Occasions of interest (optional)',
      'birthdays': 'Birthdays',
      'anniversaries': 'Anniversaries',
      'weddings': 'Weddings',
      'condolences': 'Condolences',
      'newsletter': 'I want to receive offers and news by email',
      'terms_accept': 'I accept the terms and conditions and privacy policy*'
    };
  }
  
  // Obtener el idioma guardado en el navegador
  getSavedLocale() {
    return localStorage.getItem('preferred_language');
  }
  
  // Establecer el idioma
  setLocale(locale) {
    if (this.phrases[locale]) {
      this.currentLocale = locale;
      this.polyglot.locale(locale);
      this.polyglot.replace(this.phrases[locale]);
      localStorage.setItem('preferred_language', locale);
      this.updatePageContent();
      return true;
    }
    return false;
  }
  
  // Traducir un texto
  t(key, options = {}) {
    return this.polyglot.t(key, options);
  }
  
  // Actualizar el contenido de la página
  updatePageContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });
    
    document.querySelectorAll('[data-i18n-value]').forEach(element => {
      const key = element.getAttribute('data-i18n-value');
      element.value = this.t(key);
    });
  }
}

// Exportamos una instancia única
const i18n = new I18nManager();
export default i18n;