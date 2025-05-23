// NO importar supabase

// Helper CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

class CarritoCompras {
    constructor() {
        // No mantenemos `this.productos` como fuente de verdad.
        // Los datos vienen de la plantilla o se actualizan vía AJAX.
        this.inicializarElementos();
        this.vincularEventos();
        // La carga inicial la hace Django al renderizar la plantilla.
        // Los totales iniciales también los calcula Django.
        console.log("Clase CarritoCompras (Django) inicializada.");
    }

    inicializarElementos() {
        this.contenedorProductos = document.getElementById('cartItems');
        this.elementoSubtotal = document.getElementById('subtotal');
        this.elementoEnvio = document.getElementById('shipping');
        this.elementoImpuesto = document.getElementById('tax');
        this.elementoTotal = document.getElementById('total');
        this.botonPagar = document.querySelector('.checkout-button');
        this.inputCupon = document.querySelector('#couponInput'); // Usar ID
        this.botonCupon = document.querySelector('#applyCoupon'); // Usar ID
        this.resumenPedidoContainer = document.querySelector('.cart-summary'); // Para actualizar totales
    }

    vincularEventos() {
        // Botón Pagar ahora debe redirigir a la URL de checkout de Django
        this.botonPagar?.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir comportamiento default si es un botón en form
            // Asume que tienes una URL 'checkout' en tu app Django
            const checkoutUrl = this.botonPagar.dataset.checkoutUrl || '/floresvalentin_app/checkout/'; // Obtener URL del botón o usar default
            const itemCount = this.contenedorProductos?.querySelectorAll('.cart-item').length || 0;
            if (itemCount === 0) {
                alert('Su carrito está vacío.');
                return;
            }
            window.location.href = checkoutUrl;
        });

        // Aplicar cupón (necesita endpoint Django)
        this.botonCupon?.addEventListener('click', () => this.aplicarCupon());

        // Delegación de eventos para actualizar/eliminar
        this.contenedorProductos?.addEventListener('click', async (e) => {
            const target = e.target;
            const cartItem = target.closest('.cart-item');
            if (!cartItem) return;

            const itemId = cartItem.dataset.itemId; // *** FIX: Use data-item-id ***
            const actionButton = target.closest('button'); // Encuentra el botón clickeado

            if (!actionButton || !itemId) return; // Ensure we have an item ID

            // --- Logic for Quantity Buttons ---
            if (actionButton.classList.contains('quantity-decrease') || actionButton.classList.contains('quantity-increase')) {
                e.preventDefault(); // *** ADD: Prevent default button action ***
                const quantityInput = cartItem.querySelector('input[type="number"].quantity-input');
                if (!quantityInput) return;

                let currentQuantity = parseInt(quantityInput.value);
                let newQuantity = currentQuantity;

                if (actionButton.classList.contains('quantity-increase')) {
                    newQuantity++;
                } else if (actionButton.classList.contains('quantity-decrease')) {
                    newQuantity = Math.max(1, currentQuantity - 1); // No bajar de 1
                }

                if (newQuantity !== currentQuantity) {
                    // Update the input visually immediately for responsiveness
                    // quantityInput.value = newQuantity; // Update happens on success now
                    // *** CHANGE: Call the AJAX update function instead of submitting form ***
                    await this.actualizarCantidad(itemId, newQuantity, cartItem);
                }
            // --- Logic for Remove Button ---
            } else if (actionButton.classList.contains('remove-item')) {
                e.preventDefault(); // *** ADD: Prevent default form submission ***
                 if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                    // *** CHANGE: Call the AJAX remove function ***
                    await this.eliminarProducto(itemId, cartItem);
                 }
            }
        });
    }

    // Llama a la vista Django para actualizar cantidad (NOW USED for AJAX)
    async actualizarCantidad(itemId, quantity, cartItemElement) {
        const updateForm = cartItemElement?.querySelector('.update-cart-form');
        const url = updateForm?.action; // Get URL from form action
        if (!url) {
            console.error("Could not find update form action URL for item:", itemId);
            this.showToast('Error: No se pudo encontrar la URL para actualizar.', 'error');
            return;
        }
        // Store current quantity in case of error
        const quantityInput = cartItemElement.querySelector('.quantity-input');
        const currentQuantity = quantityInput ? parseInt(quantityInput.value) : null;

        this.showLoadingFeedback(cartItemElement);

        try {
            // *** Use fetch for AJAX POST ***
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json', // *** Ensure Content-Type is application/json ***
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ quantity: quantity }) // *** Send quantity as JSON ***
            });

            // Get response data regardless of ok status first
            const data = await response.json().catch(() => ({ // Default empty object on JSON parse error
                success: false,
                error: 'Respuesta inválida del servidor.'
            }));

            if (!response.ok) {
                // Throw error using message from JSON if available
                throw new Error(data.error || `Error ${response.status}`);
            }

            // At this point, response was ok (status 2xx)
            if (data.success) {
                // Option 1: Replace only the affected item (if item_html is provided)
                 const newItemHtml = data.item_html;
                 if (newItemHtml) {
                     const tempDiv = document.createElement('div');
                     tempDiv.innerHTML = newItemHtml.trim(); // Trim whitespace
                     const newItemElement = tempDiv.firstChild;
                     if (newItemElement) {
                        // Ensure the new element doesn't have the loading class
                        newItemElement.classList.remove('loading-item');
                        cartItemElement.replaceWith(newItemElement);
                        // Update reference to the element for hiding feedback later
                        cartItemElement = newItemElement;
                     } else {
                         console.error("Failed to create new item element from HTML:", newItemHtml);
                         // Fallback: Update values directly if replacement failed
                         if(quantityInput) quantityInput.value = data.quantity;
                         const itemSubtotalSpan = cartItemElement.querySelector('.item-subtotal-price');
                         if(itemSubtotalSpan && data.item_subtotal) itemSubtotalSpan.textContent = `$${parseFloat(data.item_subtotal).toFixed(2)}`;
                     }
                 } else {
                     // Fallback if no specific item HTML: Update values directly
                     if(quantityInput) quantityInput.value = data.quantity; // Update quantity if returned
                     const itemSubtotalSpan = cartItemElement.querySelector('.item-subtotal-price');
                     if(itemSubtotalSpan && data.item_subtotal) itemSubtotalSpan.textContent = `$${parseFloat(data.item_subtotal).toFixed(2)}`; // Update item subtotal if returned
                 }
                // Option 2: Replace the entire order summary
                this.actualizarResumenPedido(data.summary_html);
                 // Update general counter
                 this.actualizarContadorHeader(data.cart_count);
                 this.showToast(data.message || 'Cantidad actualizada.'); // Show success message

            } else {
                // Response was ok, but backend indicated failure
                throw new Error(data.error || 'Error al actualizar cantidad.');
            }

        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            this.showToast(`Error: ${error.message}`, 'error');
            // *** Revert quantity input on error ***
            if (quantityInput && currentQuantity !== null) {
                quantityInput.value = currentQuantity;
            }
        } finally {
            // Ensure loading feedback is hidden
            // Use the potentially updated cartItemElement reference
            this.hideLoadingFeedback(cartItemElement);
        }
    }

    // Llama a la vista Django para eliminar producto (NOW USED for AJAX)
    async eliminarProducto(itemId, cartItemElement) {
        const removeForm = cartItemElement?.querySelector('.remove-cart-form');
        const url = removeForm?.action; // Get URL from form action
         if (!url) {
            console.error("Could not find remove form action URL for item:", itemId);
            this.showToast('Error: No se pudo encontrar la URL para eliminar.', 'error');
            return;
        }
        // Optional: Add loading feedback visually
        this.showLoadingFeedback(cartItemElement);

        try {
            // *** Use fetch for AJAX POST ***
            const response = await fetch(url, {
                method: 'POST', // Or 'DELETE' if your backend view supports it
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                    // No 'Content-Type' needed if not sending a body
                }
                // No body needed for simple removal by ID in URL
            });

            // Get response data regardless of ok status first
            const data = await response.json().catch(() => ({ // Default empty object on JSON parse error
                success: false,
                error: 'Respuesta inválida del servidor.'
            }));

             if (!response.ok) {
                // Throw error using message from JSON if available
                throw new Error(data.error || `Error ${response.status}`);
            }

            // At this point, response was ok (status 2xx)
            if (data.success) {
                // Remove element smoothly (e.g., fade out then remove)
                cartItemElement.style.transition = 'opacity 0.3s ease-out';
                cartItemElement.style.opacity = '0';
                await new Promise(resolve => setTimeout(resolve, 300)); // Wait for fade out
                cartItemElement.remove(); // Eliminar del DOM

                this.actualizarResumenPedido(data.summary_html);
                this.actualizarContadorHeader(data.cart_count);
                 // Verificar si el carrito quedó vacío AFTER removal
                 if (this.contenedorProductos?.childElementCount === 0) {
                     this.mostrarMensajeCarritoVacio();
                 }
                this.showToast(data.message || 'Producto eliminado.');
            } else {
                 // Response was ok, but backend indicated failure
                 throw new Error(data.error || 'Error al eliminar producto.');
            }

        } catch (error) {
            console.error('Error al eliminar producto:', error);
            this.showToast(`Error: ${error.message}`, 'error');
            // If removal failed, ensure loading feedback is removed
            this.hideLoadingFeedback(cartItemElement);
        } finally {
             // Feedback is handled within try/catch based on outcome
        }
    }

     // Muestra feedback visual de carga en un item
     showLoadingFeedback(element) {
         element?.classList.add('loading-item'); // Añade una clase para styling (ej. opacidad)
         // Podrías añadir un spinner específico si quieres
     }

     // Oculta feedback visual de carga
     hideLoadingFeedback(element) {
         element?.classList.remove('loading-item');
     }

    // Actualiza el HTML del resumen del pedido
    actualizarResumenPedido(summaryHtml) {
        if (this.resumenPedidoContainer && summaryHtml) {
            this.resumenPedidoContainer.innerHTML = summaryHtml;
             // Volver a buscar elementos de resumen si es necesario para recalcular
             this.elementoSubtotal = document.getElementById('subtotal');
             this.elementoEnvio = document.getElementById('shipping');
             this.elementoImpuesto = document.getElementById('tax');
             this.elementoTotal = document.getElementById('total');
        } else {
            // Si no viene HTML, intenta recalcular desde los datos actuales (menos preciso)
             console.warn("No se recibió HTML de resumen, se recalculará localmente (puede ser impreciso).");
             this.recalcularTotalesLocalmente(); // Fallback
        }
    }

     // Actualiza el contador del carrito en el header
     actualizarContadorHeader(count) {
         if (count !== undefined) {
            const cartCounters = document.querySelectorAll('.cart-counter');
            cartCounters.forEach(counter => {
                counter.textContent = count;
                counter.style.display = count > 0 ? 'inline-block' : 'none';
            });
         }
     }

     // Muestra el mensaje de carrito vacío
     mostrarMensajeCarritoVacio() {
         if (this.contenedorProductos) {
            this.contenedorProductos.innerHTML = `
                <div class="cart-empty text-center p-4">
                    <i class="fas fa-shopping-cart fa-3x mb-3"></i>
                    <p>Tu carrito está vacío</p>
                    <a href="/floresvalentin_app/catalogo/" class="btn btn-primary">Ver catálogo</a>
                </div>
            `; // Asegúrate que la URL del catálogo sea correcta
         }
     }

      // Fallback: Recalcula totales basado en el DOM (menos fiable que recibirlo del backend)
      recalcularTotalesLocalmente() {
         let subtotal = 0;
         this.contenedorProductos?.querySelectorAll('.cart-item').forEach(item => {
             const priceText = item.querySelector('.cart-item-price')?.textContent || '$0';
             const price = parseFloat(priceText.replace(/[^0-9.-]+/g,""));
             subtotal += price;
         });

         const envio = subtotal > 0 ? 15000.00 : 0; // Asume la misma lógica de envío
         const impuesto = subtotal * 0.19; // Asume mismo IVA
         const total = subtotal + envio + impuesto;

         if (this.elementoSubtotal) this.elementoSubtotal.textContent = `$${subtotal.toFixed(2)}`;
         if (this.elementoEnvio) this.elementoEnvio.textContent = `$${envio.toFixed(2)}`;
         if (this.elementoImpuesto) this.elementoImpuesto.textContent = `$${impuesto.toFixed(2)}`;
         if (this.elementoTotal) this.elementoTotal.textContent = `$${total.toFixed(2)}`;
      }


    // Llama a la vista Django para aplicar cupón
    async aplicarCupon() {
        const codigoCupon = this.inputCupon?.value.trim();
        if (!codigoCupon) {
            alert('Por favor ingrese un código de cupón');
            return;
        }

        const url = '/floresvalentin_app/carrito/aplicar-cupon/'; // URL Django
        this.botonCupon.disabled = true;

        try {
             const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ coupon_code: codigoCupon })
            });

             if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}`);
            }

             const data = await response.json(); // Espera { success: true, summary_html: "...", message: "..." }

             if (data.success) {
                 this.actualizarResumenPedido(data.summary_html);
                 this.showToast(data.message || 'Cupón aplicado.');
                 if (this.inputCupon) this.inputCupon.value = ''; // Limpiar input
             } else {
                 throw new Error(data.error || 'Cupón inválido o no aplicable.');
             }

        } catch (error) {
            console.error('Error al aplicar cupón:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.botonCupon.disabled = false;
        }
    }

     // Función para mostrar notificaciones (reutilizar la de catalog.js o similar)
     showToast(message, type = 'success') {
         // Implementación similar a la de catalog.js
         const toastId = `toast-${Date.now()}`;
         const toastHtml = `
             <div id="${toastId}" class="toast show align-items-center text-white ${type === 'success' ? 'bg-success' : 'bg-danger'} border-0 position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true" style="z-index: 1050;">
               <div class="d-flex">
                 <div class="toast-body">
                   ${message}
                 </div>
                 <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
               </div>
             </div>
         `;
         document.body.insertAdjacentHTML('beforeend', toastHtml);
         const toastElement = document.getElementById(toastId);
         const bsToast = new bootstrap.Toast(toastElement, { delay: 3000 });
         bsToast.show();
         toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
     }
}

// Inicializar el carrito cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // No necesitamos exponerlo globalmente si solo se usa en esta página
    const carrito = new CarritoCompras();
});
