// Función para verificar la preferencia guardada del usuario
function getThemePreference() {
    return localStorage.getItem('theme') || 'light';
  }
  
// Función para aplicar el tema
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Añadir soporte para Bootstrap 5 dark mode
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-bs-theme');
  }
  
  localStorage.setItem('theme', theme);
}
  
  // Función para alternar entre temas
  function toggleTheme() {
    const currentTheme = getThemePreference();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    
    // Opcional: añadir una línea de log para depuración
    console.log('Tema cambiado a:', newTheme);
  }
  
  // Inicializar el tema cuando se carga la página
  function initTheme() {
    const savedTheme = getThemePreference();
    applyTheme(savedTheme);
    
    // Añadir event listener al botón de tema si existe
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
      console.log('Botón de tema inicializado');
    } else {
      console.error('El botón de tema no se encontró en el DOM');
    }
  }
  
  // Ejecutar al cargar el documento
  document.addEventListener('DOMContentLoaded', initTheme);
  
  // Exportar todas las funciones
  export { toggleTheme, getThemePreference, applyTheme, initTheme };