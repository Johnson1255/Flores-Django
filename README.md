# Flores San Valentín - Tienda de Arreglos Florales Online

<div align="center" width="200">
<p align="center"><img src="./static/images/logo.svg" alt="Flores San Valentín Logo" width="150"></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1.7-green.svg)](https://www.djangoproject.com/)
[![Selenium](https://img.shields.io/badge/Selenium-4.32.0-orange.svg)](https://www.selenium.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.0-purple.svg)](https://getbootstrap.com/)

</div>

## 📋 Descripción del Proyecto

Flores San Valentín es una aplicación web completa desarrollada con Django para una tienda de arreglos florales que permite a los clientes explorar el catálogo de productos, realizar pedidos personalizados y gestionar su carrito de compras. La aplicación cuenta con funcionalidades tanto para clientes como para administradores y está diseñada para ofrecer una experiencia de usuario fluida y atractiva, con soporte para múltiples idiomas y tema oscuro/claro.

## 🌟 Características Principales

### Para Clientes
- **Catálogo interactivo** con filtrado por categorías, búsqueda avanzada y vistas de rejilla/lista
- **Vista rápida** de productos con detalles completos sin cambiar de página
- **Sistema de carrito de compras** persistente con gestión dinámica mediante AJAX
- **Pedidos personalizados** para ocasiones especiales con formulario detallado
- **Sistema de comentarios** en productos para feedback de los clientes
- **Autenticación de usuarios** con registro y login
- **Perfiles de usuario** con historial de pedidos y direcciones guardadas
- **Modo oscuro/claro** para mejor experiencia visual
- **Diseño responsive** optimizado para dispositivos móviles
- **Soporte multilingüe** (español e inglés)

### Para Administradores
- **Panel de administración** para gestionar productos y categorías
- **Gestión de pedidos** con seguimiento de estado
- **Gestión de usuarios** y perfiles
- **Estadísticas** sobre ventas y productos populares
- **Automatización** para carga masiva de productos mediante Selenium

## 🛠️ Tecnologías Utilizadas

### Backend
- **Django 5.1.7**: Framework web de alto nivel
- **Python 3.10+**: Lenguaje de programación principal
- **SQLite/PostgreSQL**: Sistemas de gestión de bases de datos

### Frontend
- **HTML5/CSS3/JavaScript**: Tecnologías web estándar
- **Bootstrap 5**: Framework CSS para diseño responsive
- **FontAwesome**: Biblioteca de iconos vectoriales
- **AJAX**: Para actualización dinámica de contenido sin recargar

### Herramientas de Automatización y Testing
- **Selenium 4.32.0**: Automatización de navegador web
- **WebDriver Manager**: Gestión automática de controladores de navegador
- **Python-dotenv**: Gestión de variables de entorno
- **Requests**: Cliente HTTP para integración con APIs

### Características Avanzadas
- **Integración con DynaPictures API**: Para generación automática de imágenes
- **Sistema de carrito persistente**: Almacenamiento mediante JSONField de Django
- **Multidioma**: Implementado con el sistema de traducción de Django
- **Tema claro/oscuro**: Soporte para modos de visualización alternativos

## 📸 Capturas de Pantalla (TODO)

<div align="center">
<table>
<tr>
<td><img src="https://i.imgur.com/z9XxUeS.png" alt="Página Principal" width="400"/></td>
<td><img src="https://i.imgur.com/qL8WDCh.png" alt="Catálogo de Productos" width="400"/></td>
</tr>
<tr>
<td><img src="https://i.imgur.com/fCnImst.png" alt="Detalle de Producto" width="400"/></td>
<td><img src="https://i.imgur.com/V2AjFLp.png" alt="Carrito de Compras" width="400"/></td>
</tr>
</table>
</div>

## 🚀 Instalación y Configuración

### Prerrequisitos
- Python 3.10 o superior ([Descargar Python](https://www.python.org/downloads/))
- pip (gestor de paquetes de Python)
- Git ([Descargar Git](https://git-scm.com/downloads/))
- Navegadores web compatibles con Selenium (Firefox o Chrome/Chromium) para la automatización

### Paso a Paso

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Johnson1255/Flores-Django.git
   cd Flores-Django
   ```

2. **Crear y activar un entorno virtual:**
   ```bash
   # En Linux/macOS
   python3 -m venv venv
   source venv/bin/activate

   # En Windows
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Instalar las dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno:**
   - Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura (Puedes tomar el archivo de `env.example` como ejemplo y cambiarlos por tus credenciales):
     ```
     # Django Settings
     SECRET_KEY=your_secret_key_replace_with_random_string
     DEBUG=True
     ALLOWED_HOSTS=localhost,127.0.0.1
     
     # Selenium Automation Settings
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=your_admin_password
     BASE_URL=http://127.0.0.1:8000
     
     # External APIs Integration
     DYNAPICTURES_API_KEY=your_api_key_here
     ```
   - Para producción, considera añadir configuraciones adicionales de seguridad y email.

5. **Aplicar migraciones:**
   ```bash
   python manage.py makemigrations floresvalentin_app
   python manage.py migrate
   ```

6. **Crear un superusuario:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Recopilar archivos estáticos:**
   ```bash
   python manage.py collectstatic
   ```

8. **Iniciar el servidor de desarrollo:**
   ```bash
   python manage.py runserver
   ```

9. **Acceder a la aplicación:**
   - Frontend: `http://127.0.0.1:8000/`
   - Panel de administración: `http://127.0.0.1:8000/admin/`

## 🤖 Automatización con Selenium

Este proyecto incluye un script de automatización basado en Selenium para facilitar la carga masiva de productos y otras tareas administrativas.

### Uso Rápido

1. **Configura tus variables de entorno** en el archivo `.env`:
   ```
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_admin_password
   BASE_URL=http://127.0.0.1:8000
   ```

2. **Ejecuta el script de automatización**:
   ```bash
   python automation_script.py
   ```

### Capacidades Principales

- **Inicio de sesión automático** en la plataforma
- **Creación masiva de productos** con todos sus atributos
- **Generación automática de imágenes** mediante API externa
- **Compatibilidad** con Firefox y Chrome/Chromium
- **Manejo de errores** con capturas de pantalla para depuración

Para instrucciones detalladas, opciones de configuración avanzada y resolución de problemas, consulta la [documentación completa de automatización](AUTOMATION.md).

## 💻 Uso de la Aplicación

### Para Clientes

1. **Explorar el catálogo:**
   - Navega por categorías usando los filtros
   - Utiliza la búsqueda para encontrar productos específicos
   - Cambia entre vista de rejilla y lista según preferencia

2. **Visualizar productos:**
   - Usa la vista rápida para ver detalles sin cambiar de página
   - O accede a la página de detalle completa

3. **Gestionar el carrito:**
   - Añade productos desde el catálogo o la vista detallada
   - Ajusta cantidades o elimina productos
   - Aplica cupones de descuento (si están disponibles)

4. **Realizar compra:**
   - Completa el formulario de envío
   - Confirma pedido
   - Realiza seguimiento del estado

### Para Administradores

1. **Gestión de productos:**
   - Accede a `/floresvalentin_app/manage-products/`
   - Añade, edita o elimina productos
   - Gestiona categorías y stocks

2. **Gestión de pedidos:**
   - Visualiza pedidos pendientes
   - Actualiza estados de pedidos
   - Genera informes

3. **Automatización:**
   - Configura el script con los productos deseados
   - Ejecuta la automatización para cargas masivas

## 📚 Documentación

Este proyecto incluye la siguiente documentación:

- [**README.md**](README.md): Documentación principal del proyecto
- [**AUTOMATION.md**](AUTOMATION.md): Guía detallada para el uso de la automatización con Selenium
- [**LICENSE**](LICENSE): Licencia del proyecto

## 🔄 API RESTful

La aplicación incluye endpoints API para:

- Catálogo de productos con filtros
- Detalle de producto
- Gestión del carrito de compras
- Gestión de usuarios y perfiles

## 📈 Roadmap

**Próximas funcionalidades:**

- [ ] Integración con pasarelas de pago (PayPal, Stripe)
- [ ] Sistema de reseñas con valoración por estrellas
- [ ] Panel de analíticas avanzado
- [ ] Aplicación móvil usando REST API
- [ ] Integración con WhatsApp para notificaciones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

<div align="center">
⭐ ¡No olvides darle una estrella al proyecto si te ha sido útil! ⭐
Desarrollado con ❤️ para el curso de Plataformas de Programación Empresarial.
</div>
