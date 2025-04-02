import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar si el usuario está autenticado
    const user = await getCurrentUser();
    if (!user) {
        // Redirigir al login si no está autenticado
        window.location.href = '/login.html';
        return;
    }
    
    // Limitar selección de flores a máximo 3
    const flowerPrefs = document.querySelectorAll('.flower-pref');
    flowerPrefs.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checked = document.querySelectorAll('.flower-pref:checked');
            if (checked.length > 3) {
                this.checked = false;
                alert('Por favor selecciona máximo 3 tipos de flores');
            }
        });
    });
    
    // Limitar selección de colores a máximo 3
    const colorPrefs = document.querySelectorAll('.color-pref');
    colorPrefs.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checked = document.querySelectorAll('.color-pref:checked');
            if (checked.length > 3) {
                this.checked = false;
                alert('Por favor selecciona máximo 3 colores');
            }
        });
    });
    
    // Limitar selección de chocolates a máximo 2
    const chocolatePrefs = document.querySelectorAll('.chocolate-pref');
    chocolatePrefs.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checked = document.querySelectorAll('.chocolate-pref:checked');
            if (checked.length > 2) {
                this.checked = false;
                alert('Por favor selecciona máximo 2 tipos de chocolates');
            }
        });
    });
    
    // Limitar selección de regalos adicionales a máximo 2
    const giftPrefs = document.querySelectorAll('.gift-pref');
    giftPrefs.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checked = document.querySelectorAll('.gift-pref:checked');
            if (checked.length > 2) {
                this.checked = false;
                alert('Por favor selecciona máximo 2 tipos de regalos adicionales');
            }
        });
    });
    
    // Manejar visibilidad de opciones basado en switches
    const includeFlowers = document.getElementById('include-flowers');
    const flowersOptions = document.getElementById('flowers-options');
    includeFlowers.addEventListener('change', function() {
        flowersOptions.classList.toggle('d-none', !this.checked);
    });
    
    const includeChocolates = document.getElementById('include-chocolates');
    const chocolatesOptions = document.getElementById('chocolates-options');
    includeChocolates.addEventListener('change', function() {
        chocolatesOptions.classList.toggle('d-none', !this.checked);
    });
    
    const includePlushies = document.getElementById('include-plushies');
    const plushiesOptions = document.getElementById('plushies-options');
    includePlushies.addEventListener('change', function() {
        plushiesOptions.classList.toggle('d-none', !this.checked);
    });
    
    const includeGifts = document.getElementById('include-gifts');
    const giftsOptions = document.getElementById('gifts-options');
    includeGifts.addEventListener('change', function() {
        giftsOptions.classList.toggle('d-none', !this.checked);
    });
    
    // Establecer fecha mínima a mañana
    const deliveryDateInput = document.getElementById('delivery-date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    deliveryDateInput.min = tomorrow.toISOString().split('T')[0];
    
    // Manejar envío del formulario
    const form = document.getElementById('special-order-form');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        try {
            // Obtener valores del formulario
            const recipientName = document.getElementById('recipient-name').value;
            const recipientPhone = document.getElementById('recipient-phone').value;
            const deliveryAddress = document.getElementById('delivery-address').value;
            const deliveryCity = document.getElementById('delivery-city').value;
            const deliveryPostalCode = document.getElementById('delivery-postal-code').value;
            const occasion = document.getElementById('occasion').value;
            const budget = document.getElementById('budget').value;
            const deliveryDate = document.getElementById('delivery-date').value;
            const deliveryTime = document.getElementById('delivery-time').value;
            const message = document.getElementById('message').value;
            const specialInstructions = document.getElementById('special-instructions').value;
            
            // Obtener productos seleccionados
            let products = [];
            
            // Flores - si están incluidas
            if (includeFlowers.checked) {
                // Obtener preferencias de flores seleccionadas
                const flowerPreferences = Array.from(document.querySelectorAll('.flower-pref:checked'))
                    .map(checkbox => checkbox.value);
                
                // Obtener preferencias de colores seleccionados
                const colorPreferences = Array.from(document.querySelectorAll('.color-pref:checked'))
                    .map(checkbox => checkbox.value);
                
                products.push({
                    type: 'flowers',
                    preferences: {
                        flowers: flowerPreferences,
                        colors: colorPreferences
                    }
                });
            }
            
            // Chocolates - si están incluidos
            if (includeChocolates.checked) {
                const chocolatePreferences = Array.from(document.querySelectorAll('.chocolate-pref:checked'))
                    .map(checkbox => checkbox.value);
                
                products.push({
                    type: 'chocolates',
                    preferences: chocolatePreferences
                });
            }
            
            // Peluches - si están incluidos
            if (includePlushies.checked) {
                const plushiePreference = document.querySelector('input[name="plushie-type"]:checked')?.value || null;
                
                if (plushiePreference) {
                    products.push({
                        type: 'plushie',
                        preference: plushiePreference
                    });
                }
            }
            
            // Otros regalos - si están incluidos
            if (includeGifts.checked) {
                const giftPreferences = Array.from(document.querySelectorAll('.gift-pref:checked'))
                    .map(checkbox => checkbox.value);
                
                products.push({
                    type: 'additional_gifts',
                    preferences: giftPreferences
                });
            }
            
            // Crear objeto con datos del pedido
            const orderData = {
                user_id: user.id,
                recipient_name: recipientName,
                recipient_phone: recipientPhone,
                delivery_address: deliveryAddress,
                delivery_city: deliveryCity,
                delivery_postal_code: deliveryPostalCode,
                occasion: occasion,
                delivery_date: deliveryDate,
                delivery_time: deliveryTime,
                budget: budget || null,
                message: message,
                special_instructions: specialInstructions,
                products: products
            };
            
            // Guardar pedido en la base de datos
            const { data, error } = await supabase
                .from('special_orders')
                .insert([orderData]);
                
            if (error) throw error;
            
            // Mostrar mensaje de éxito y redirigir
            alert('¡Tu pedido especial ha sido enviado correctamente! Nos pondremos en contacto contigo pronto.');
            window.location.href = '/index.html';
            
        } catch (error) {
            console.error('Error al enviar el pedido especial:', error.message);
            alert('Ocurrió un error al enviar tu pedido. Por favor intenta de nuevo.');
        }
    });
});