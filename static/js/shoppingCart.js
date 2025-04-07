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

            const productId = cartItem.dataset.productId;
            const actionButton = target.closest('button'); // Encuentra el botón clickeado

            if (!actionButton) return;

            if (actionButton.classList.contains('quantity-btn')) {
                const action = actionButton.dataset.action; //'increase' o 'decrease'
                 const quantityInput = cartItem.querySelector('input[type="number"]');
                 let currentQuantity = parseInt(quantityInput.value);
                 let newQuantity = currentQuantity;

                 if (action === 'increase') {
                     newQuantity++;
                 } else if (action === 'decrease') {
                     newQuantity = Math.max(1, currentQuantity - 1); // No bajar de 1
                 }

                 if (newQuantity !== currentQuantity) {
                    await this.actualizarCantidad(productId, newQuantity, cartItem);
                 }

            } else if (actionButton.classList.contains('remove-item')) {
                e.preventDefault();
                 if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                    await this.eliminarProducto(productId, cartItem);
                 }
            }
        });
    }

    // Llama a la vista Django para actualizar cantidad
    async actualizarCantidad(productId, quantity, cartItemElement) {
        const url = `/floresvalentin_app/carrito/actualizar/${productId}/`; // URL Django
        this.showLoadingFeedback(cartItemElement);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ quantity: quantity })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}`);
            }

            const data = await response.json(); // Espera { success: true, item_html: "...", summary_html: "..." }

            if (data.success) {
                // Opción 1: Reemplazar solo el item afectado
                 const newItemHtml = data.item_html;
                 if (newItemHtml) {
                     const tempDiv = document.createElement('div');
                     tempDiv.innerHTML = newItemHtml;
                     cartItemElement.replaceWith(tempDiv.firstChild);
                 } else {
                     // Fallback si no viene HTML específico: Recargar sección del carrito
                     this.recargarSeccionCarrito();
                 }
                // Opción 2: Reemplazar todo el resumen del pedido
                this.actualizarResumenPedido(data.summary_html);
                 // Actualizar contador general
                 this.actualizarContadorHeader(data.cart_count);

            } else {
                throw new Error(data.error || 'Error al actualizar cantidad.');
            }

        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoadingFeedback(cartItemElement);
        }
    }

    // Llama a la vista Django para eliminar producto
    async eliminarProducto(productId, cartItemElement) {
        const url = `/floresvalentin_app/carrito/eliminar/${productId}/`; // URL Django
        this.showLoadingFeedback(cartItemElement);

        try {
            const response = await fetch(url, {
                method: 'POST', // O DELETE si tu vista lo soporta
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

             if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}`);
            }

            const data = await response.json(); // Espera { success: true, summary_html: "...", cart_count: X, message: "..." }

            if (data.success) {
                cartItemElement.remove(); // Eliminar del DOM
                this.actualizarResumenPedido(data.summary_html);
                this.actualizarContadorHeader(data.cart_count);
                 // Verificar si el carrito quedó vacío
                 if (this.contenedorProductos?.childElementCount === 0) {
                     this.mostrarMensajeCarritoVacio();
                 }
                this.showToast(data.message || 'Producto eliminado.');
            } else {
                 throw new Error(data.error || 'Error al eliminar producto.');
            }

        } catch (error) {
            console.error('Error al eliminar producto:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
             // No necesitamos ocultar feedback porque el elemento se elimina
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