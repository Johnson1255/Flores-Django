// NO importar supabase ni auth

document.addEventListener('DOMContentLoaded', async function() {
    // --- IMPORTANTE ---
    // La verificación de autenticación AHORA SE HACE en la vista Django que sirve
    // esta página usando @login_required. No necesitas verificarlo aquí.

    // Lógica de UI (Mantener): limitar checkboxes, visibilidad, fecha mínima
    const limitCheckboxes = (selector, max) => {
        document.querySelectorAll(selector).forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const checked = document.querySelectorAll(`${selector}:checked`);
                if (checked.length > max) {
                    this.checked = false;
                    alert(`Por favor selecciona máximo ${max} opciones.`);
                }
            });
        });
    };

    limitCheckboxes('.flower-pref', 3);
    limitCheckboxes('.color-pref', 3);
    limitCheckboxes('.chocolate-pref', 2);
    limitCheckboxes('.gift-pref', 2);

    const setupVisibilityToggle = (switchId, optionsId) => {
        const switchElement = document.getElementById(switchId);
        const optionsElement = document.getElementById(optionsId);
        if (switchElement && optionsElement) {
            // Asegura estado inicial correcto
             optionsElement.classList.toggle('d-none', !switchElement.checked);
            // Añade listener
            switchElement.addEventListener('change', function() {
                optionsElement.classList.toggle('d-none', !this.checked);
            });
        }
    };

    setupVisibilityToggle('include-flowers', 'flowers-options');
    setupVisibilityToggle('include-chocolates', 'chocolates-options');
    setupVisibilityToggle('include-plushies', 'plushies-options');
    setupVisibilityToggle('include-gifts', 'gifts-options');

    const deliveryDateInput = document.getElementById('delivery-date');
    if (deliveryDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        try {
             deliveryDateInput.min = tomorrow.toISOString().split('T')[0];
        } catch(e) {
            console.warn("No se pudo establecer la fecha mínima:", e);
        }
    }

    // --- IMPORTANTE ---
    // La lógica de envío del formulario (submit listener y llamada a Supabase) se ha ELIMINADO.
    // El formulario HTML debe tener method="post", action="{% url 'floresvalentin_app:special_order_create' %}"
    // y {% csrf_token %}. Django manejará el procesamiento.
    // Puedes añadir validaciones de frontend aquí si lo deseas.
    const form = document.getElementById('special-order-form');
     if (form) {
         form.addEventListener('submit', function(event) {
             // Aquí podrías añadir validaciones *antes* del envío, por ejemplo:
             const deliveryDate = deliveryDateInput.value;
             if (!deliveryDate) {
                 alert('Por favor, selecciona una fecha de entrega.');
                 event.preventDefault(); // Detener el envío si la validación falla
                 return;
             }
             // Si la validación JS pasa, el form se enviará a Django.
             console.log("Enviando formulario de pedido especial a Django...");
         });
     }

});