# Automatización con Selenium para Flores San Valentín

Este documento explica cómo utilizar el script de automatización basado en Selenium incluido en el proyecto Flores San Valentín para facilitar tareas administrativas como la carga masiva de productos.

## 🛠️ Requisitos Previos

Para utilizar la automatización, necesitarás:

1. **Python 3.10+** instalado en tu sistema
2. **Navegadores Web**:
   - Firefox (recomendado como primera opción)
   - Chrome/Chromium como alternativa
3. **Dependencias de Python** (incluidas en `requirements.txt`):
   - selenium==4.32.0
   - webdriver-manager==4.0.2
   - python-dotenv==1.1.0
   - requests==2.32.3

## ⚙️ Configuración

1. **Configurar Variables de Entorno**:
   
   Asegúrate de que tu archivo `.env` incluya las siguientes variables:
   ```
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_admin_password
   BASE_URL=http://127.0.0.1:8000
   DYNAPICTURES_API_KEY=your_api_key_if_available  # Opcional, para generación automática de imágenes
   ```

2. **Servidor Django**:
   
   El servidor de Django debe estar en ejecución antes de ejecutar el script de automatización:
   ```bash
   python manage.py runserver
   ```

## 📋 Funcionalidades del Script

El script de automatización `automation_script.py` ofrece las siguientes capacidades:

1. **Inicio de Sesión Automático**: Se conecta a la aplicación y accede con las credenciales proporcionadas.
2. **Creación de Productos**: Añade productos al catálogo con todos sus atributos.
3. **Manejo de Imágenes**:
   - Utiliza URLs de imágenes proporcionadas manualmente
   - Opcionalmente, puede generar URLs de imágenes automáticamente utilizando DynaPictures API
4. **Gestión de Errores**: Captura de pantalla en caso de error para facilitar la depuración.
5. **Compatibilidad Multi-Navegador**: Funciona con Firefox o Chrome/Chromium.

## 🚀 Uso Básico

Para utilizar el script con la configuración básica:

```bash
python automation_script.py
```

Esto ejecutará la automatización con los productos de ejemplo definidos al final del script.

## 🔧 Personalización de Productos

Puedes personalizar los productos a crear modificando la lista `products_to_create` al final del archivo `automation_script.py`:

```python
products_to_create = [
    {
        "name": "Ramo de Rosas Rojas",
        "description": "Hermoso ramo de rosas rojas ideal para ocasiones especiales",
        "price": 45.99,
        "category": "Rosas",
        "stock": 10,
        "available": True,
        "image_url": "https://example.com/roses.jpg"  # URL de imagen opcional
    },
    # Añadir más productos según sea necesario
]
```

### Opciones de Configuración por Producto:

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| name | string | Nombre del producto | Sí |
| description | string | Descripción detallada | Sí |
| price | float | Precio en pesos colombianos | Sí |
| category | string | Categoría (debe existir en el sistema) | Sí |
| stock | integer | Cantidad disponible | No (default: 0) |
| available | boolean | Disponibilidad del producto | No (default: true) |
| image_url | string | URL de la imagen | No |
| auto_image | boolean | Generar URL de imagen automáticamente | No (default: false) |

## 🔍 Generación Automática de Imágenes

Si tienes una clave API de DynaPictures, puedes aprovechar la generación automática de imágenes:

1. Configura `DYNAPICTURES_API_KEY` en tu archivo `.env`
2. En la definición del producto, establece `"auto_image": True` en lugar de proporcionar una `image_url`

```python
{
    "name": "Lirios Blancos",
    "description": "Elegante arreglo de lirios blancos",
    "price": 55.99,
    "category": "Lirios",
    "auto_image": True  # Generará automáticamente una URL de imagen basada en el nombre
}
```

## ⚠️ Resolución de Problemas

### Problemas Comunes:

1. **Error de Inicio de Sesión**:
   - Verifica que las credenciales en `.env` sean correctas
   - Asegúrate de que el usuario tenga permisos de administrador

2. **WebDriver no encontrado**:
   - El script intenta gestionar automáticamente los controladores a través de webdriver-manager
   - Si hay problemas, intenta instalar manualmente el controlador adecuado para tu navegador

3. **Problemas de Rendimiento**:
   - En máquinas lentas, puedes aumentar los tiempos de espera modificando la línea:
     ```python
     self.wait = WebDriverWait(self.driver, 20)  # Aumenta a 30 o más segundos si es necesario
     ```

4. **Capturas de Pantalla de Error**:
   - El script genera `error_screenshot.png` en caso de fallos
   - Revisa esta imagen para entender el estado de la aplicación cuando ocurrió el error

## 📝 Registro de Actividades

La automatización genera un archivo `automation.log` que contiene información detallada sobre su ejecución. Revisa este archivo para diagnosticar problemas o verificar el funcionamiento correcto.

## 🔄 Extendiendo la Automatización

Puedes extender el script para implementar funcionalidades adicionales:

1. **Gestión de Categorías**:
   ```python
   def create_category(self, category_data):
       # Implementación para crear categorías
   ```

2. **Gestión de Pedidos**:
   ```python
   def update_order_status(self, order_id, new_status):
       # Implementación para actualizar estados de pedidos
   ```

3. **Testing de Interfaz**:
   ```python
   def test_checkout_process(self):
       # Implementación para probar el proceso completo de compra
   ```

## 🔐 Seguridad

**Importante**: Nunca incluyas credenciales directamente en el script. Siempre utiliza variables de entorno o un archivo `.env` seguro.

## 🤝 Contribuciones

Si mejoras el script de automatización, considera contribuir al proyecto a través de un Pull Request. Las posibles mejoras incluyen:

- Implementación de más funciones administrativas
- Mejora del manejo de errores y reportes
- Adición de capacidades de testing automatizado
- Optimización del rendimiento 