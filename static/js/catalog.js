document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos DOM
    const flowersContainer = document.getElementById('flowers-container');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortBy = document.getElementById('sort-by');
    const resetButton = document.getElementById('filter-reset');
    const categoryTabs = document.getElementById('category-tabs').querySelector('ul');
    const resultsCount = document.getElementById('results-count');
    const viewGridBtn = document.getElementById('view-grid');
    const viewListBtn = document.getElementById('view-list');
    const pagination = document.getElementById('pagination');
    const logoutButton = document.getElementById('logout-button');
    const catalogContainer = document.getElementById('catalog-container');
    
    // Variables de estado
    let products = []; // Se llenará con datos de la API
    let filteredProducts = [];
    let currentView = localStorage.getItem('viewMode') || 'grid'; // 'grid' o 'list'
    let currentPage = 1;
    const productsPerPage = 12;
    let categories = new Set();

    if (catalogContainer) {
        catalogContainer.style.display = 'block';
    }

    // Mostrar catálogo (solo para usuarios autenticados)
    const showCatalog = () => {
        if (authContainer && catalogContainer) {
            authContainer.style.display = 'none';
            catalogContainer.style.display = 'block';
            
            // Cargar productos
            loadProducts();
        }
    };

    // Manejar logout
    const handleLogout = async () => {
        try {
            // Importa la función signOut de auth.js
            const { signOut } = await import('./auth.js');
            await signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Función para cargar productos desde Supabase
    const loadProducts = async () => {
        try {
            flowersContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Cargando productos...</p>
                </div>
            `;

            const { supabase } = await import('./supabase.js');

            // Obtener productos de Supabase
            const { data, error } = await supabase
                .from('products')  // Asegúrate de que este es el nombre correcto de tu tabla
                .select('*')       // Seleccionar todos los campos
                .order('name');    // Ordenar por nombre
            
            if (error) throw error;
            
            products = data || [];
            
            // Recopilar categorías únicas
            categories = new Set(products.map(product => product.category));
            
            // Llenar selectores de categoría
            populateCategorySelectors();
            
            // Aplicar filtros iniciales
            applyFilters();
            
            // Configurar la vista (grid o list)
            if (currentView === 'list') {
                viewListBtn.classList.add('active');
                viewGridBtn.classList.remove('active');
            } else {
                viewGridBtn.classList.add('active');
                viewListBtn.classList.remove('active');
            }
            
            renderProducts();
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            flowersContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Error al cargar los productos. Intente nuevamente.</p></div>';
        }
    };

    // Función para poblar selectores de categoría
    const populateCategorySelectors = () => {
        // Llenar el selector dropdown
        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Llenar las pestañas de categoría
        categoryTabs.innerHTML = '<li class="nav-item"><button class="nav-link active" data-category="">Todas</button></li>';
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            const button = document.createElement('button');
            button.className = 'nav-link';
            button.setAttribute('data-category', category);
            button.textContent = category;
            li.appendChild(button);
            categoryTabs.appendChild(li);
        });

        // Agregar event listeners a las pestañas
        categoryTabs.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                categoryTabs.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                categoryFilter.value = button.getAttribute('data-category');
                applyFilters();
            });
        });
    };

    // Función para aplicar filtros
    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const sortOption = sortBy.value;

        // Filtrar productos
        filteredProducts = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                  product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });

        // Ordenar productos
        switch (sortOption) {
            case 'name-asc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price-asc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
        }

        // Actualizar contador de resultados
        resultsCount.textContent = `Mostrando ${filteredProducts.length} productos`;

        // Resetear paginación
        currentPage = 1;
        
        // Renderizar productos
        renderProducts();
        renderPagination();
    };

    // Función para renderizar productos
    const renderProducts = () => {
        // Calcular productos para la página actual
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const currentProducts = filteredProducts.slice(startIndex, endIndex);

        // Limpiar contenedor
        flowersContainer.innerHTML = '';

        if (currentProducts.length === 0) {
            flowersContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No se encontraron productos que coincidan con su búsqueda.</p></div>';
            return;
        }

        // Renderizar cada producto
        currentProducts.forEach(product => {
            const productCard = document.createElement('div');
            
            if (currentView === 'grid') {
                productCard.className = 'col-md-4 mb-4';
                productCard.innerHTML = `
                    <div class="card h-100 product-card">
                        <img src="${product.image_url}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-muted mb-2">
                                <span class="badge bg-light text-dark">${product.category}</span>
                            </p>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text text-primary fw-bold">$${(product.price).toLocaleString()}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <button class="btn btn-primary btn-sm quick-view" data-id="${product.id}">
                                    <i class="fas fa-eye"></i> Vista Rápida
                                </button>
                                <button class="btn btn-outline-primary btn-sm add-to-cart" data-id="${product.id}">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                productCard.className = 'col-12 mb-3';
                productCard.innerHTML = `
                    <div class="card product-card-list">
                        <div class="row g-0">
                            <div class="col-md-3">
                                <img src="${product.image_url}" class="img-fluid rounded-start h-100" alt="${product.name}">
                            </div>
                            <div class="col-md-9">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between">
                                        <h5 class="card-title">${product.name}</h5>
                                        <span class="badge bg-primary">$${(product.price).toLocaleString()}</span>
                                    </div>
                                    <p class="card-text text-muted mb-2">
                                        <span class="badge bg-light text-dark">${product.category}</span>
                                    </p>
                                    <p class="card-text">${product.description}</p>
                                    <p class="card-text">
                                        <small class="text-muted">
                                            <i class="fas fa-box me-1"></i> ${product.stock} unidades disponibles
                                        </small>
                                    </p>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-primary btn-sm quick-view" data-id="${product.id}">
                                            <i class="fas fa-eye"></i> Vista Rápida
                                        </button>
                                        <button class="btn btn-outline-primary btn-sm add-to-cart" data-id="${product.id}">
                                            <i class="fas fa-shopping-cart"></i> Añadir al Carrito
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            flowersContainer.appendChild(productCard);
        });

        // Agregar event listeners a los botones de vista rápida
        document.querySelectorAll('.quick-view').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.getAttribute('data-id');
                showQuickView(productId);
            });
        });

        // Agregar event listeners a los botones de añadir al carrito
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.getAttribute('data-id');
                addToCart(productId);
            });
        });
    };

    // Función para renderizar la paginación
    const renderPagination = () => {
        pagination.innerHTML = '';
        
        // Si no hay suficientes productos para paginar
        if (filteredProducts.length <= productsPerPage) {
            return;
        }
        
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        
        // Botón anterior
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-link';
        prevBtn.innerHTML = '&laquo;';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
                renderPagination();
            }
        });
        prevLi.appendChild(prevBtn);
        pagination.appendChild(prevLi);
        
        // Páginas numeradas
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-link';
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderProducts();
                renderPagination();
            });
            pageLi.appendChild(pageBtn);
            pagination.appendChild(pageLi);
        }
        
        // Botón siguiente
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-link';
        nextBtn.innerHTML = '&raquo;';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
                renderPagination();
            }
        });
        nextLi.appendChild(nextBtn);
        pagination.appendChild(nextLi);
    };

    // Función para mostrar vista rápida del producto
    const showQuickView = (productId) => {
        const product = products.find(p => p.id === productId);
        
        // Llenar modal con datos del producto
        document.getElementById('quickViewTitle').textContent = 'Vista Rápida: ' + product.name;
        document.getElementById('quickViewName').textContent = product.name;
        document.getElementById('quickViewDescription').textContent = product.description;
        document.getElementById('quickViewCategory').textContent = product.category;
        document.getElementById('quickViewPrice').textContent = '$' + (product.price).toLocaleString();
        document.getElementById('quickViewStock').textContent = product.stock;
        document.getElementById('quickViewImage').src = product.image_url;
        
        // Mostrar modal (asegúrate de que el modal exista)
        const quickViewModal = document.getElementById('quickViewModal');
        
        if (quickViewModal) {
            try {
                const bsModal = new bootstrap.Modal(quickViewModal);
                bsModal.show();
            } catch (error) {
                console.error('Error al mostrar modal:', error);
            }
        } else {
            console.error('El elemento quickViewModal no existe en el DOM');
        }
    };

    const addToCart = async (productId) => {
        try {
            const { supabase } = await import('./supabase.js');

            // Get full product details from Supabase
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            
            if (error) throw error;
            
            if (!product) {
                console.error('Product not found');
                return;
            }
            
            // Use CarritoCompras instance if available
            if (window.carrito) {
                await window.carrito.agregarProducto(product, 1);
            } else {
                // Fallback to localStorage if CarritoCompras not initialized
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                const existingProductIndex = cart.findIndex(item => item.id === product.id);
                
                if (existingProductIndex >= 0) {
                    cart[existingProductIndex].quantity += 1;
                } else {
                    cart.push({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        quantity: 1
                    });
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCounter();
                
                // Show confirmation toast
                showToast(`${product.name} ha sido añadido al carrito.`);
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
        }
    };
    
    // Add helper function for toast display if window.carrito isn't available
    const showToast = (message) => {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        toastContainer.innerHTML = `
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Flores San Valentín</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <span>${message}</span>
                    </div>
                    <div class="mt-2 d-flex justify-content-end">
                        <a href="./shoppingCart.html" class="btn btn-primary btn-sm">Ver carrito</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(toastContainer);
        
        setTimeout(() => {
            toastContainer.querySelector('.toast').classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toastContainer);
            }, 300);
        }, 3000);
    };

    // Event listeners para los filtros
    searchInput.addEventListener('input', () => {
        applyFilters();
    });

    categoryFilter.addEventListener('change', () => {
        // Actualizar tabs para reflejar la selección
        categoryTabs.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === categoryFilter.value) {
                btn.classList.add('active');
            }
        });
        
        if (categoryFilter.value === '') {
            categoryTabs.querySelector('button[data-category=""]').classList.add('active');
        }
        
        applyFilters();
    });

    sortBy.addEventListener('change', () => {
        applyFilters();
    });

    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        sortBy.value = 'name-asc';
        
        // Resetear tabs
        categoryTabs.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
        });
        categoryTabs.querySelector('button[data-category=""]').classList.add('active');
        
        applyFilters();
    });

    viewGridBtn.addEventListener('click', () => {
        currentView = 'grid';
        localStorage.setItem('viewMode', 'grid');
        viewGridBtn.classList.add('active');
        viewListBtn.classList.remove('active');
        renderProducts();
    });

    viewListBtn.addEventListener('click', () => {
        currentView = 'list';
        localStorage.setItem('viewMode', 'list');
        viewListBtn.classList.add('active');
        viewGridBtn.classList.remove('active');
        renderProducts();
    });

    // Event listeners para logout
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Agregar CSS personalizado
    const addCustomCSS = () => {
        const style = document.createElement('style');
        style.textContent = `
            /* Estilos para el formulario de login */
            .login-container {
                max-width: 400px;
                margin: 100px auto;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                background-color: #fff;
            }
            
            /* Estilos para el catálogo */
            .product-card {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .product-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            
            .product-card .card-img-top {
                height: 200px;
                object-fit: cover;
            }
            
            .product-card-list .img-fluid {
                object-fit: cover;
                height: 100%;
            }
            
            .category-tabs .nav-link {
                cursor: pointer;
                border-radius: 20px;
                padding: 0.5rem 1rem;
                margin-right: 0.5rem;
                transition: all 0.3s ease;
            }
            
            .category-tabs .nav-link:hover {
                background-color: rgba(var(--bs-primary-rgb), 0.1);
            }
            
            .category-tabs .nav-link.active {
                background-color: var(--bs-primary);
                color: white;
            }
            
            /* Estilos para el header de usuario autenticado */
            .user-header {
                background-color: #f8f9fa;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .user-header .btn-logout {
                border-radius: 20px;
                padding: 0.25rem 0.75rem;
            }
        `;
        document.head.appendChild(style);
    };

    // Inicializar
    const initialize = () => {
        addCustomCSS();
        loadProducts();
        updateCartCounter();
        
        // Inicializar tooltips de Bootstrap
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Inicializar modales de Bootstrap
        const quickViewModal = document.getElementById('quickViewModal');
        if (quickViewModal) {
            new bootstrap.Modal(quickViewModal);
        }
    };

    const updateCartCounter = () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        
        // Update cart counters in headers
        const cartCounters = document.querySelectorAll('.cart-counter');
        cartCounters.forEach(counter => {
            counter.textContent = cartCount;
            counter.style.display = cartCount > 0 ? 'flex' : 'none';
        });
    };

    initialize();
});