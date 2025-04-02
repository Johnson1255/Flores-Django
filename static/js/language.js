import i18n from './i18n.js';

class LanguageSelector {
  constructor() {
    this.availableLanguages = {
      'es': 'Español',
      'en': 'English',
      // Puedes añadir más idiomas según necesites
    };
    
    this.init();
  }
  
  init() {
    // Creamos el contenedor para el selector
    this.createSelector();
  }
  
  createSelector() {
    // Crear el elemento select
    const selector = document.createElement('select');
    selector.id = 'language-selector';
    selector.classList.add('language-selector');
    
    // Añadir opciones para cada idioma
    Object.entries(this.availableLanguages).forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = name;
      selector.appendChild(option);
    });
    
    // Establecer el idioma actual
    selector.value = i18n.currentLocale;
    
    // Añadir evento de cambio
    selector.addEventListener('change', (e) => {
      i18n.setLocale(e.target.value);
    });
    
    // Crear el contenedor
    const container = document.createElement('div');
    container.classList.add('language-selector-container');
    
    // Añadir icono
    const icon = document.createElement('i');
    icon.classList.add('fas', 'fa-globe');
    container.appendChild(icon);
    
    // Añadir el selector
    container.appendChild(selector);
    
    // Añadir estilos básicos
    const style = document.createElement('style');
    style.textContent = `
      .language-selector-container {
        display: flex;
        align-items: center;
        margin-left: 15px;
      }
      
      .language-selector-container i {
        margin-right: 5px;
        color: #555;
      }
      
      .language-selector {
        padding: 3px 5px;
        border-radius: 4px;
        border: 1px solid #ccc;
        background-color: white;
        cursor: pointer;
        font-size: 0.8rem;
      }
      
      /* Estilos para tema oscuro */
      body.dark-mode .language-selector {
        background-color: #333;
        color: #fff;
        border-color: #555;
      }
      
      body.dark-mode .language-selector-container i {
        color: #ccc;
      }
    `;
    document.head.appendChild(style);
    
    // Buscamos el lugar adecuado para colocarlo en la interfaz
    const targetContainer = document.querySelector('.social-icons');
    if (targetContainer) {
      // Lo insertamos antes del botón de tema
      const themeButton = document.querySelector('#theme-toggle');
      if (themeButton) {
        targetContainer.insertBefore(container, themeButton);
      } else {
        targetContainer.appendChild(container);
      }
    } else {
      // Si no encontramos el lugar ideal, lo añadimos al final del header
      const header = document.querySelector('.top-bar-right');
      if (header) {
        header.appendChild(container);
      }
    }
  }
}

export default LanguageSelector;