# Flores San Valentín - Tienda de Arreglos Florales Online

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Descripción del Proyecto

Flores San Valentín es una aplicación web desarrollada con Django para una tienda de arreglos florales que permite a los clientes explorar el catálogo de productos, realizar pedidos personalizados y gestionar su carrito de compras. La aplicación cuenta con funcionalidades tanto para clientes como para administradores y está diseñada para ofrecer una experiencia de usuario fluida y atractiva.

## 🌟 Características

### Para clientes
- **Catálogo interactivo** con filtrado por categorías y búsqueda
- **Vista rápida** de productos con detalles completos
- **Carrito de compras** con gestión dinámica de productos
- **Pedidos personalizados** para ocasiones especiales
- **Autenticación de usuarios** con registro y login
- **Perfiles de usuario** con historial de pedidos
- **Modo oscuro/claro** para mejor experiencia visual
- **Diseño responsive** optimizado para dispositivos móviles
- **Múltiples idiomas** (español e inglés) soportados

### Para administradores
- **Panel de administración** para gestionar productos y categorías
- **Gestión de pedidos** con seguimiento de estado
- **Gestión de usuarios** y perfiles
- **Estadísticas** sobre ventas y productos populares

## 🛠️ Tecnologías Utilizadas

- **Backend**:
  - Django 4.2+
  - Python 3.10+
  - SQLite (desarrollo) / PostgreSQL (producción)

- **Frontend**:
  - HTML5 / CSS3 / JavaScript
  - Bootstrap 5
  - Leaflet (mapas interactivos)
  - FontAwesome (iconos)
  - Howler.js (audio)

- **Herramientas adicionales**:
  - Gestión de entorno virtual con venv
  - Control de versiones con Git

## 🖼️ Vistazo Rápido (Próximamente - TODO)

- *Ejemplo: Pantalla de inicio*
- *Ejemplo: Catálogo de productos*
- *Ejemplo: Carrito de compras*

## 🚀 Instalación y Configuración

Sigue estos pasos para configurar el proyecto en tu entorno local:

### Prerrequisitos
- Python 3.10 o superior ([Descargar Python](https://www.python.org/downloads/))
- pip (generalmente viene con Python)
- Git ([Descargar Git](https://git-scm.com/downloads/))
- (Opcional pero recomendado) Un gestor de entornos virtuales como `venv`

### Pasos de Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/Johnson1255/Flores-Django.git
    cd Flores-Django
    ```

2.  **Crea y activa un entorno virtual** (recomendado):
    ```bash
    # En Linux/macOS
    python3 -m venv venv
    source venv/bin/activate

    # En Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Instala las dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configura las variables de entorno:**
    - Copia el archivo `.env.example` a `.env`:
      ```bash
      cp .env.example .env
      ```
    - Edita el archivo `.env` y configura las variables necesarias (como `SECRET_KEY`, configuración de base de datos si usas PostgreSQL, etc.). Para desarrollo inicial, la `SECRET_KEY` generada en `.env.example` puede ser suficiente.

5.  **Realiza las migraciones de la base de datos:**
    ```bash
    python manage.py migrate
    ```

6.  **Crea un superusuario** (para acceder al panel de administración):
    ```bash
    python manage.py createsuperuser
    ```

7.  **Recolecta los archivos estáticos** (necesario en algunos entornos):
    ```bash
    python manage.py collectstatic
    ```

8.  **Ejecuta el servidor de desarrollo:**
    ```bash
    python manage.py runserver
    ```

9.  Abre tu navegador y ve a `http://127.0.0.1:8000/`.

## 💻 Uso

Una vez que el servidor esté corriendo:
- Explora la página de inicio para ver productos destacados.
- Navega al **Catálogo** para ver todos los arreglos, filtrar por categoría o buscar.
- Haz clic en un producto para ver detalles o usar la **Vista Rápida**.
- Añade productos al **Carrito de Compras**.
- Regístrate o inicia sesión para gestionar tu perfil y ver tu historial (funcionalidad en desarrollo/futura).
- Realiza un **Pedido Personalizado** a través del formulario dedicado.
- Accede al panel de administración en `http://127.0.0.1:8000/admin/` con tu cuenta de superusuario para gestionar productos, categorías, etc.

## 🚧 Estado del Proyecto

Este proyecto se encuentra **en desarrollo activo**. Algunas funcionalidades pueden estar incompletas o sujetas a cambios. ¡Tu feedback y contribuciones son bienvenidos!

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
