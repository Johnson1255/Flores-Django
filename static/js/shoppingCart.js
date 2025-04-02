// Importación de la configuración de Supabase
import { supabase } from './supabase.js';

class CarritoCompras {
    // Constructor: Inicializa el carrito y sus componentes principales
    constructor() {
        this.productos = []; // Array para almacenar los productos del carrito
        this.supabase = supabase; // Instancia de Supabase para operaciones con la base de datos
        this.inicializarElementos(); // Inicializa referencias a elementos del DOM
        this.cargarCarritoDeSupabase(); // Carga inicial del carrito desde Supabase
        this.vincularEventos(); // Configura los event listeners
    }

    // Inicializa las referencias a elementos del DOM necesarios para el carrito
    inicializarElementos() {
        this.contenedorProductos = document.getElementById('cartItems');
        this.elementoSubtotal = document.getElementById('subtotal');
        this.elementoEnvio = document.getElementById('shipping');
        this.elementoImpuesto = document.getElementById('tax');
        this.elementoTotal = document.getElementById('total');
        this.botonPagar = document.querySelector('.checkout-button');
        this.inputCupon = document.querySelector('.coupon-card input');
        this.botonCupon = document.querySelector('.coupon-card button');
    }

    // Configura los event listeners para las interacciones del usuario
    vincularEventos() {
        // Event listener para el botón de pago
        this.botonPagar?.addEventListener('click', () => this.procesarPago());
        // Event listener para aplicar cupón de descuento
        this.botonCupon?.addEventListener('click', () => this.aplicarCupon());

        // Event delegation para los botones de cantidad y eliminar
        this.contenedorProductos?.addEventListener('click', async (e) => {
            const target = e.target;
            const cartItem = target.closest('.cart-item');
            
            if (!cartItem) return;
            
            const productId = cartItem.dataset.productId;

            // Manejo de botones de cantidad
            if (target.classList.contains('quantity-btn')) {
                const action = target.dataset.action;
                await this.actualizarCantidad(productId, action);
            }

            // Manejo del botón eliminar
            if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
                e.preventDefault();
                await this.eliminarProducto(productId);
            }
        });
    }

    // Actualiza la cantidad de un producto específico
    async actualizarCantidad(idProducto, accion) {
        const producto = this.productos.find(item => item.id === idProducto);
        if (!producto) return;

        if (accion === 'increase') {
            producto.quantity++;
        } else if (accion === 'decrease' && producto.quantity > 1) {
            producto.quantity--;
        }

        await this.actualizarCarrito();
        this.mostrarConfirmacion(`Cantidad actualizada: ${producto.name}`, producto.quantity);
    }

    // Elimina un producto del carrito
    async eliminarProducto(idProducto) {
        try {
            const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este producto?');
            
            if (confirmDelete) {
                // Eliminar del array local
                this.productos = this.productos.filter(item => item.id !== idProducto);
                
                // Actualizar en localStorage
                this.guardarCarritoEnLocal();
                
                // Actualizar en Supabase de forma explícita
                try {
                    const usuario = await this.supabase.auth.getUser();
                    if (usuario.data?.user) {
                        const { error } = await this.supabase
                            .from('shopping_cart')
                            .upsert({
                                user_id: usuario.data.user.id,
                                items: this.productos,
                                updated_at: new Date().toISOString()
                            }, {
                                onConflict: 'user_id'
                            });
                        
                        if (error) throw error;
                    }
                } catch (error) {
                    console.error('Error al actualizar Supabase:', error);
                }
                
                // Actualizar la UI
                this.renderizarCarrito();
                this.calcularTotales();
                
                // Eliminar el elemento del DOM si existe
                const itemElement = this.contenedorProductos.querySelector(`[data-product-id="${idProducto}"]`);
                if (itemElement) {
                    itemElement.remove();
                }
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
        }
    }

    // Actualiza el estado del carrito en todas las capas (local, Supabase y UI)
    async actualizarCarrito() {
        this.guardarCarritoEnLocal();
        await this.sincronizarConSupabase();
        this.renderizarCarrito();
        this.calcularTotales();
    }

    // Sincroniza el estado del carrito con Supabase
    async sincronizarConSupabase() {
        try {
            const usuario = await this.supabase.auth.getUser();
            if (!usuario.data?.user) return;

            // Actualiza o inserta el carrito en Supabase
            const { error } = await this.supabase
                .from('shopping_cart')
                .upsert({
                    user_id: usuario.data.user.id,
                    items: this.productos,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error al sincronizar con Supabase:', error);
        }
    }

    // Calcula los totales del carrito (subtotal, envío, impuestos y total)
    calcularTotales() {
        const subtotal = this.productos.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const envio = subtotal > 0 ? 15000.00 : 0;
        const impuesto = subtotal * 0.19; // 19% IVA
        const total = subtotal + envio + impuesto;

        // Actualiza los elementos en la UI con los nuevos totales
        if (this.elementoSubtotal) this.elementoSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (this.elementoEnvio) this.elementoEnvio.textContent = `$${envio.toFixed(2)}`;
        if (this.elementoImpuesto) this.elementoImpuesto.textContent = `$${impuesto.toFixed(2)}`;
        if (this.elementoTotal) this.elementoTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Renderiza los productos del carrito en la UI
    renderizarCarrito() {
        if (!this.contenedorProductos) return;

        // Si el carrito está vacío, mostrar mensaje
        if (this.productos.length === 0) {
            this.contenedorProductos.innerHTML = `
                <div class="cart-empty text-center p-4">
                    <i class="fas fa-shopping-cart fa-3x mb-3"></i>
                    <p>Tu carrito está vacío</p>
                    <a href="./catalog.html" class="btn btn-primary">Ver catálogo</a>
                </div>
            `;
            return;
        }

        // Genera el HTML para cada producto en el carrito
        this.contenedorProductos.innerHTML = this.productos.map(item => `
            <div class="cart-item d-flex align-items-center mb-3 p-3 border rounded" data-product-id="${item.id}">
                <div class="cart-item-image-container me-4" style="width: 120px; height: 120px; flex-shrink: 0; overflow: hidden;">
                    <img src="${item.image_url}" 
                         alt="${item.name}" 
                         class="cart-item-image"
                         style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="cart-item-details flex-grow-1">
                    <h5 class="cart-item-title">${item.name}</h5>
                    <p class="cart-item-price mb-1">$${(item.price * item.quantity).toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="btn btn-sm btn-outline-secondary quantity-btn" data-action="decrease">-</button>
                        <input type="number" class="form-control d-inline-block mx-2" style="width: 60px;" value="${item.quantity}" readonly>
                        <button class="btn btn-sm btn-outline-secondary quantity-btn" data-action="increase">+</button>
                    </div>
                </div>
                <button class="btn btn-link text-danger remove-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // Guarda el estado del carrito en localStorage
    guardarCarritoEnLocal() {
        localStorage.setItem('cart', JSON.stringify(this.productos));
    }

    // Carga el carrito desde localStorage
    cargarCarritoDeLocal(){
        try {
            const carritoGuardado = localStorage.getItem('cart');
            this.productos = carritoGuardado ? JSON.parse(carritoGuardado) : [];
            if (this.productos.length === 0) return;
            this.renderizarCarrito();
            this.calcularTotales();
        } catch (error) {
            console.error('Error al cargar el carrito desde localStorage:', error);
        }
    }

    // Carga el carrito desde Supabase o localStorage como fallback
    async cargarCarritoDeSupabase() {
        try {
            const usuario = await this.supabase.auth.getUser();
            if (usuario.data?.user) {
                const { data, error } = await this.supabase
                    .from('shopping_cart')
                    .select('items')
                    .eq('user_id', usuario.data.user.id)
                    .single();

                if (error) throw error;
                if (data?.items) {
                    this.productos = data.items;
                }
            } else {
                this.cargarCarritoDeLocal();
            }
        } catch (error) {
            console.error('Error al cargar el carrito de Supabase:', error);
            this.cargarCarritoDeLocal();
        }
        if (this.productos.length === 0) return;
        this.renderizarCarrito();
        this.calcularTotales();
    }

    // Maneja la lógica de aplicación de cupones de descuento
    aplicarCupon() {
        const codigoCupon = this.inputCupon?.value.trim();
        if (!codigoCupon) {
            alert('Por favor ingrese un código de cupón');
            return;
        }

        alert('Funcionalidad de cupones en desarrollo');
    }

    // Procesa el pago y crea la orden en Supabase
    async procesarPago() {
        if (this.productos.length === 0) {
            alert('Su carrito está vacío');
            return;
        }

        try {
            const usuario = await this.supabase.auth.getUser();
            if (!usuario.data?.user) {
                alert('Por favor inicie sesión para continuar con la compra');
                window.location.href = '/login.html';
                return;
            }

            // Crea la orden en Supabase
            const { data, error } = await this.supabase
                .from('orders')
                .insert({
                    user_id: usuario.data.user.id,
                    items: this.productos,
                    total_amount: this.calcularTotal(),
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Limpia el carrito y redirige al checkout
            this.productos = [];
            await this.actualizarCarrito();

            window.location.href = `/checkout.html?order_id=${data.id}`;
        } catch (error) {
            console.error('Error durante el checkout:', error);
            alert('Ha ocurrido un error durante el proceso de pago');
        }
    }

    // Calcula el total final incluyendo subtotal, envío e impuestos
    calcularTotal() {
        const subtotal = this.productos.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const envio = subtotal > 0 ? 15000.00 : 0;
        const impuesto = subtotal * 0.19;
        return subtotal + envio + impuesto;
    }

    // Método para añadir un producto al carrito
    async agregarProducto(producto, cantidad = 1) {
        // Verificar si el producto ya está en el carrito
        const productoExistente = this.productos.find(item => item.id === producto.id);
        
        if (productoExistente) {
            // Si el producto ya existe, actualiza su cantidad
            productoExistente.quantity += cantidad;
        } else {
            // Si no existe, agrega el producto con la cantidad especificada
            this.productos.push({
                id: producto.id,
                name: producto.name,
                price: producto.price,
                image_url: producto.image_url,
                quantity: cantidad
            });
        }
        
        // Actualiza el carrito en todas las capas
        await this.actualizarCarrito();
        
        // Opcional: Mostrar confirmación visual
        this.mostrarConfirmacion(producto.name, cantidad);
    }
    
    // Método para mostrar una confirmación visual de producto añadido
    mostrarConfirmacion(nombreProducto, cantidad) {
        const mensaje = `${nombreProducto} (${cantidad}) añadido al carrito`;
        
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = 'alert alert-success position-fixed top-0 end-0 m-3';
        notificacion.style.zIndex = '1000';
        notificacion.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${mensaje}
        `;
        
        // Añadir al DOM
        document.body.appendChild(notificacion);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }
}

// Inicializa el carrito cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    window.carrito = new CarritoCompras();
});

// Exponer el carrito globalmente para que pueda ser usado desde otras páginas
export default CarritoCompras;