// NO importar supabase ni auth

// Helper para obtener el token CSRF (necesario para POST requests a Django)
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

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos DOM (Mantener)
    const flowersContainer = document.getElementById('flowers-container');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortBy = document.getElementById('sort-by');
    const resetButton = document.getElementById('filter-reset');
    const categoryTabsContainer = document.getElementById('category-tabs'); // Contenedor de UL
    const resultsCount = document.getElementById('results-count');
    const viewGridBtn = document.getElementById('view-grid');
    const viewListBtn = document.getElementById('view-list');
    const paginationContainer = document.getElementById('pagination'); // Contenedor UL

    // Variables de estado (Simplificado - currentPage y currentView son las principales)
    let currentView = localStorage.getItem('viewMode') || 'grid'; // 'grid' o 'list'
    let currentPage = 1;
    // Los productos y categorías ahora se manejan principalmente en el backend/plantillas

    // --- LÓGICA INICIAL ---
    // Aplica la vista inicial (grid/list) al contenedor principal
    const applyViewMode = () => {
         if (!flowersContainer) return;
         if (currentView === 'list') {
             flowersContainer.classList.add('list-view'); // Necesitarás CSS para .list-view
             flowersContainer.classList.remove('grid-view'); // Asumiendo grid como default
             viewListBtn?.classList.add('active');
             viewGridBtn?.classList.remove('active');
         } else {
             flowersContainer.classList.remove('list-view');
             flowersContainer.classList.add('grid-view');
             viewGridBtn?.classList.add('active');
             viewListBtn?.classList.remove('active');
         }
    }
    applyViewMode(); // Aplicar al cargar

    // Función para obtener datos (productos y paginación) desde Django vía AJAX
    const fetchProducts = async (page = 1) => {
        if (!flowersContainer) return;

        flowersContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span></div>
                <p class="mt-2">Cargando productos...</p>
            </div>`;
        paginationContainer.innerHTML = ''; // Limpiar paginación
        resultsCount.textContent = 'Cargando...';

        const searchTerm = searchInput?.value || '';
        const selectedCategory = categoryFilter?.value || '';
        const sortOption = sortBy?.value || 'name-asc';

        // Construir URL con parámetros de consulta
        // **IMPORTANTE**: Debes crear una URL en Django (ej. 'floresvalentin_app:catalogo_api')
        // que apunte a una vista que devuelva JSON.
        // Corrected URL based on main urls.py include
        const url = new URL(window.location.origin + '/catalogo/api/');
        url.searchParams.append('page', page);
        if (searchTerm) url.searchParams.append('search', searchTerm);
        if (selectedCategory) url.searchParams.append('category', selectedCategory);
        if (sortOption) url.searchParams.append('sort_by', sortOption);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); // Espera JSON con { products_html: "...", pagination_html: "...", count: X }

            // Renderizar HTML recibido del backend
            flowersContainer.innerHTML = data.products_html || '<p>No se encontraron productos.</p>';
            paginationContainer.innerHTML = data.pagination_html || '';
            resultsCount.textContent = `Mostrando ${data.count || 0} productos`;
            currentPage = page; // Actualizar página actual

            // Volver a vincular eventos a los elementos recién creados
            bindProductEvents();
            bindPaginationEvents();
            applyViewMode(); // Re-aplicar clase grid/list

        } catch (error) {
            console.error('Error cargando productos vía AJAX:', error);
            flowersContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Error al cargar los productos. Intente nuevamente.</p></div>';
            resultsCount.textContent = 'Error';
        }
    };

    // Función para renderizar productos (Ahora recibe HTML directamente) - Simplificada
    // ya que Django renderiza el HTML. La dejamos por si necesitamos renderizar desde JSON
    // en el futuro, pero por ahora no se usa directamente.
    const renderProducts = (productsHtml) => {
        if (!flowersContainer) return;
        flowersContainer.innerHTML = productsHtml || '<p>No se encontraron productos.</p>';
        bindProductEvents();
        applyViewMode();
    };

     // Función para renderizar paginación (Ahora recibe HTML directamente) - Simplificada
    const renderPagination = (paginationHtml) => {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = paginationHtml || '';
        bindPaginationEvents();
    }

    // Función para vincular eventos a los botones dentro de los productos
    const bindProductEvents = () => {
        document.querySelectorAll('.quick-view').forEach(button => {
             // Eliminar listeners antiguos para evitar duplicados
            button.replaceWith(button.cloneNode(true));
        });
         document.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id; // Usar dataset.id
                // Lógica de Vista Rápida (podría necesitar AJAX para detalles)
                showQuickView(productId);
            });
        });

        document.querySelectorAll('.add-to-cart').forEach(button => {
             // Eliminar listeners antiguos
             button.replaceWith(button.cloneNode(true));
        });
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenir envío de formulario si está dentro de uno
                const productId = e.currentTarget.dataset.id;
                addToCart(productId, e.currentTarget); // Pasar el botón para feedback
            });
        });
    };

    // Función para vincular eventos a los botones de paginación
    const bindPaginationEvents = () => {
        paginationContainer?.querySelectorAll('.page-link').forEach(button => {
            // Eliminar listeners antiguos
             button.replaceWith(button.cloneNode(true));
        });
         paginationContainer?.querySelectorAll('.page-link').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const pageLink = e.currentTarget;
                // Evitar click en disabled o active
                if (pageLink.parentElement.classList.contains('disabled') || pageLink.parentElement.classList.contains('active')) {
                    return;
                }
                const page = pageLink.dataset.page; // Asume que los botones tienen data-page="NUMBER"
                if (page) {
                    fetchProducts(parseInt(page));
                }
            });
        });
    };

    // Función para mostrar vista rápida (puede necesitar AJAX)
    const showQuickView = async (productId) => {
        // **Opción 1: Usar datos ya presentes en el HTML (si los pusiste en data-*)**
        // const productCard = flowersContainer.querySelector(`.product-card[data-id="${productId}"]`); // Necesitarías añadir data-id al card
        // if (productCard) {
        //     document.getElementById('quickViewName').textContent = productCard.dataset.name;
        //     // ... llenar otros campos del modal ...
        // }

        // **Opción 2: Fetch detalles desde una API de Django**
        const url = `/floresvalentin_app/producto/${productId}/api/`; // URL de API para detalles
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Producto no encontrado');
            const product = await response.json();

            // Llenar modal (Asegúrate que los IDs del modal sean correctos)
             const modal = document.getElementById('quickViewModal');
             if (!modal) return;

            modal.querySelector('#quickViewTitle').textContent = 'Vista Rápida: ' + product.name;
            modal.querySelector('#quickViewName').textContent = product.name;
            modal.querySelector('#quickViewDescription').textContent = product.description || '';
            modal.querySelector('#quickViewCategory').textContent = product.category_name || product.category || ''; // Asumiendo que la API devuelve category_name
            modal.querySelector('#quickViewPrice').textContent = '$' + parseFloat(product.price || 0).toLocaleString();
            modal.querySelector('#quickViewStock').textContent = product.stock !== undefined ? product.stock : 'N/A';
            modal.querySelector('#quickViewImage').src = product.image_url || '{% static "images/placeholder.png" %}'; // Usa placeholder si no hay imagen
            // Asegúrate que el botón de añadir al carrito en el modal también tenga el data-id
            const modalAddToCartBtn = modal.querySelector('.add-to-cart');
             if (modalAddToCartBtn) {
                modalAddToCartBtn.dataset.id = product.id;
                 // Re-vincular evento si es necesario, o usar delegación de eventos en el modal
             }


            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();

        } catch (error) {
            console.error('Error al obtener detalles para vista rápida:', error);
            alert('No se pudieron cargar los detalles del producto.');
        }
    };

    // Función para añadir al carrito vía AJAX
    const addToCart = async (productId, buttonElement) => {
        // **IMPORTANTE**: Debes crear una URL en Django (ej. 'floresvalentin_app:agregar_al_carrito')
        // que apunte a una vista que maneje POST.
        const url = `/floresvalentin_app/carrito/agregar/${productId}/`; // Ajusta la URL
        buttonElement.disabled = true; // Deshabilitar botón temporalmente
        buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>'; // Feedback visual

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json', // Opcional si no envías cuerpo
                    'X-Requested-With': 'XMLHttpRequest' // Para que Django sepa que es AJAX
                },
                // body: JSON.stringify({ quantity: 1 }) // Si necesitas enviar cantidad u otros datos
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({})); // Intenta obtener detalles del error
                throw new Error(errorData.error || `Error ${response.status}`);
            }

            const data = await response.json(); // Espera JSON con { success: true, cart_count: X, message: "..." }

            if (data.success) {
                // Actualizar contador del carrito en el header
                updateCartCounter(data.cart_count);
                // Mostrar mensaje de éxito
                showToast(data.message || `${productId} añadido al carrito.`);
            } else {
                throw new Error(data.error || 'Error al añadir al carrito.');
            }

        } catch (error) {
            console.error('Error añadiendo al carrito:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
             // Restaurar botón
             buttonElement.disabled = false;
            buttonElement.innerHTML = '<i class="fas fa-shopping-cart"></i>'; // O el icono original
        }
    };

    // Función para actualizar el contador del carrito
    const updateCartCounter = (count) => {
        const cartCounters = document.querySelectorAll('.cart-counter');
        cartCounters.forEach(counter => {
            counter.textContent = count;
            counter.style.display = count > 0 ? 'inline-block' : 'none'; // O 'flex' según tu CSS
        });
    };

     // Función para mostrar notificaciones (toast)
     const showToast = (message, type = 'success') => {
         // Reutiliza la lógica de tu showToast anterior o una librería como Toastify.js
         // Asegúrate de que funcione correctamente.
         // Ejemplo simple:
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
         // Limpiar del DOM después de ocultarse
         toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
     };

    // --- VINCULAR EVENT LISTENERS INICIALES ---
    searchInput?.addEventListener('input', () => fetchProducts(1)); // Reinicia a página 1 al buscar
    categoryFilter?.addEventListener('change', () => {
         // Actualizar tabs para reflejar la selección (si aún usas tabs)
        categoryTabsContainer?.querySelectorAll('button.nav-link').forEach(btn => {
             btn.classList.remove('active');
             if (btn.dataset.category === categoryFilter.value) {
                 btn.classList.add('active');
             }
         });
         fetchProducts(1); // Reinicia a página 1 al cambiar categoría
    });
     // Event listener para tabs (si existen)
     categoryTabsContainer?.addEventListener('click', (e) => {
         if (e.target.tagName === 'BUTTON' && e.target.classList.contains('nav-link')) {
             categoryTabsContainer.querySelectorAll('button.nav-link').forEach(btn => btn.classList.remove('active'));
             e.target.classList.add('active');
             const categoryValue = e.target.dataset.category;
             if (categoryFilter) categoryFilter.value = categoryValue; // Sincronizar dropdown
             fetchProducts(1);
         }
     });

    sortBy?.addEventListener('change', () => fetchProducts(1)); // Reinicia a página 1 al ordenar
    resetButton?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (sortBy) sortBy.value = 'name-asc';
         // Resetear tabs (si existen)
         categoryTabsContainer?.querySelectorAll('button.nav-link').forEach(btn => {
             btn.classList.remove('active');
             if (btn.dataset.category === '') btn.classList.add('active');
         });
        fetchProducts(1);
    });

    viewGridBtn?.addEventListener('click', () => {
        currentView = 'grid';
        localStorage.setItem('viewMode', 'grid');
        applyViewMode();
    });
    viewListBtn?.addEventListener('click', () => {
        currentView = 'list';
        localStorage.setItem('viewMode', 'list');
        applyViewMode();
    });

    // Vincular eventos a productos y paginación cargados inicialmente por Django
    bindProductEvents();
    bindPaginationEvents();

     // Inicializar tooltips de Bootstrap (si los usas)
     const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
     tooltipTriggerList.map(function (tooltipTriggerEl) {
         return new bootstrap.Tooltip(tooltipTriggerEl);
     });

     // Cargar contador inicial del carrito (si lo pasas desde Django)
    const initialCartCountElement = document.getElementById('initial-cart-count'); // Necesitas añadir este elemento oculto en tu base.html
     if (initialCartCountElement) {
         const initialCount = parseInt(initialCartCountElement.textContent || '0');
         updateCartCounter(initialCount);
     } else {
        // Intenta obtener el contador inicial de otra manera si es necesario
         updateCartCounter(0); // Default a 0 si no hay info inicial
     }
 
     // --- CARGA INICIAL DE PRODUCTOS ---
     fetchProducts(1); // Llama a fetchProducts para cargar la página 1 al inicio
 
 });
