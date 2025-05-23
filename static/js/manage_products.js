document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const adminStatusDiv = document.getElementById('adminStatus');
    const productListTbody = document.querySelector('#productList tbody');
    const manageResultDiv = document.getElementById('manageResult');
    const insertForm = document.getElementById('insertProductForm');
    const insertResultDiv = document.getElementById('result');
    const insertBtn = document.getElementById('insertBtn');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    // Search Elements
    const productSearchInput = document.getElementById('productSearchInput');
    const productSearchBtn = document.getElementById('productSearchBtn');
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    // Edit Modal Elements
    const editModal = document.getElementById('editProductModal');
    const editForm = document.getElementById('editProductForm');
    const editResultDiv = document.getElementById('editResult');
    const editProductIdInput = document.getElementById('editProductId');
    const editProductNameInput = document.getElementById('editProductName');
    const editProductCategorySelect = document.getElementById('editProductCategory');
    const editProductDescriptionTextarea = document.getElementById('editProductDescription');
    const editProductPriceInput = document.getElementById('editProductPrice');
    const editProductStockInput = document.getElementById('editProductStock');
    const editProductAvailableCheckbox = document.getElementById('editProductAvailable');
    const saveEditBtn = document.getElementById('saveEditBtn'); // Added reference to save button

    // --- State ---
    let isAdmin = false; // Store admin status globally in this script
    let currentProducts = []; // Store fetched products to easily find data for editing
    let allProducts = []; // Store all products for filtering

    // --- URLs ---
    const checkAdminUrl = '/floresvalentin_app/api/check-admin/';
    const manageProductsApiUrl = '/floresvalentin_app/api/manage-products/'; // Base URL for GET/POST
    const manageProductsApiDetailUrl = (id) => `/floresvalentin_app/api/manage-products/${id}/`; // URL for PUT/DELETE

    // --- CSRF Token ---
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

    // --- Initialization ---
    async function initializePage() {
        await checkAdminStatus();
        await loadProducts();
        setupTabs();
        setupFormListeners(); // Setup listeners for both forms
        setupSearchFunctionality(); // Setup product search
        updateAdminUIElements(); // Enable/disable elements based on admin status
        setupModalCloseHandlers(); // Setup modal close handlers
    }

    // --- Admin Status Check ---
    async function checkAdminStatus() {
        try {
            const response = await fetch(checkAdminUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            isAdmin = data.is_admin;
            adminStatusDiv.innerHTML = isAdmin
                ? '<div class="status-indicator admin-status">✅ Tienes permisos de administrador. Puedes añadir, editar y eliminar productos.</div>'
                : '<div class="status-indicator no-admin-status">⚠️ No tienes permisos de administrador. Solo puedes ver productos.</div>';
        } catch (error) {
            console.error('Error checking admin status:', error);
            adminStatusDiv.innerHTML = '<div class="status-indicator no-admin-status">❌ Error al verificar permisos.</div>';
            isAdmin = false;
        }
    }

    // --- Load and Display Products ---
    async function loadProducts() {
        manageResultDiv.innerHTML = '<p>Cargando productos...</p>';
        productListTbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
        currentProducts = []; // Reset current products
        allProducts = []; // Reset all products

        try {
            const response = await fetch(manageProductsApiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.products && data.products.length > 0) {
                allProducts = data.products; // Store all fetched products
                currentProducts = [...allProducts]; // Create a copy for current display
                displayProducts(currentProducts);
                manageResultDiv.innerHTML = `<p>Se cargaron ${currentProducts.length} productos.</p>`;
                // Clear search input on reload
                if (productSearchInput) productSearchInput.value = '';
            } else {
                productListTbody.innerHTML = '<tr><td colspan="7">No se encontraron productos.</td></tr>';
                manageResultDiv.innerHTML = '<p>No hay productos para mostrar.</p>';
            }
        } catch (error) {
            console.error('Error loading products:', error);
            productListTbody.innerHTML = '<tr><td colspan="7">Error al cargar productos.</td></tr>';
            manageResultDiv.innerHTML = `<p>Error al cargar productos: ${error.message}</p>`;
        }
    }

    function displayProducts(products) {
        productListTbody.innerHTML = ''; // Clear table body

        products.forEach(product => {
            const row = productListTbody.insertRow();
            row.setAttribute('data-product-id', product.id); // Add data attribute for easy row finding

            updateProductRow(row, product); // Use a helper to populate/update row content
        });
    }

    // Helper function to update a table row with product data
    function updateProductRow(row, product) {
        const shortId = product.id.substring(0, 8) + '...';
        const categoryName = product.category ? product.category.name : 'N/A';
        // Ensure price is treated as a number before formatting
        const priceNumber = parseFloat(product.price);
        const priceFormatted = !isNaN(priceNumber)
            ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(priceNumber)
            : 'N/A'; // Handle potential non-numeric price
        const availableText = product.available ? 'Sí' : 'No';

        // Clear existing content first
        row.innerHTML = `
            <td title="${product.id}">${shortId}</td>
            <td>${escapeHtml(product.name)}</td>
            <td>${escapeHtml(categoryName)}</td>
            <td>${priceFormatted}</td>
            <td>${product.stock}</td>
            <td>${availableText}</td>
            <td>
                <button class="btn btn-sm edit-btn" data-id="${product.id}" ${!isAdmin ? 'disabled title="Necesitas permisos de administrador"' : ''}>
                    Editar
                </button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}" ${!isAdmin ? 'disabled title="Necesitas permisos de administrador"' : ''}>
                    Eliminar
                </button>
            </td>
        `;

        // Add event listeners IF admin
        if (isAdmin) {
            const editBtn = row.querySelector('.edit-btn');
            const deleteBtn = row.querySelector('.delete-btn');
            if (editBtn) editBtn.addEventListener('click', handleEditClick);
            if (deleteBtn) deleteBtn.addEventListener('click', handleDeleteProduct);
        }
    }


    // --- Tab Management ---
    function setupTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId + 'Tab').classList.add('active');
            });
        });
    }

    // --- Form Handling (Insert & Edit) ---
    function setupFormListeners() {
        if (insertForm) insertForm.addEventListener('submit', handleInsertProduct);
        if (editForm) editForm.addEventListener('submit', handleEditSubmit);
    }

    // --- Search Functionality ---
    function setupSearchFunctionality() {
        if (productSearchBtn) {
            productSearchBtn.addEventListener('click', () => {
                searchProducts(productSearchInput.value.trim());
            });
        }

        if (productSearchInput) {
            productSearchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    searchProducts(productSearchInput.value.trim());
                }
            });
        }

        if (resetSearchBtn) {
            resetSearchBtn.addEventListener('click', () => {
                productSearchInput.value = '';
                resetSearch();
            });
        }
    }

    function searchProducts(searchTerm) {
        if (!searchTerm) {
            resetSearch();
            return;
        }

        searchTerm = searchTerm.toLowerCase();
        
        const filteredProducts = allProducts.filter(product => {
            const productId = product.id.toLowerCase();
            const productName = product.name.toLowerCase();
            const categoryName = product.category ? product.category.name.toLowerCase() : '';
            
            return productId.includes(searchTerm) || 
                  productName.includes(searchTerm) || 
                  categoryName.includes(searchTerm);
        });

        currentProducts = filteredProducts;
        
        if (filteredProducts.length > 0) {
            displayProducts(filteredProducts);
            manageResultDiv.innerHTML = `<p>Se encontraron ${filteredProducts.length} productos con "${searchTerm}".</p>`;
        } else {
            productListTbody.innerHTML = '<tr><td colspan="7">No se encontraron productos con los criterios de búsqueda.</td></tr>';
            manageResultDiv.innerHTML = `<p>No se encontraron productos que coincidan con "${searchTerm}".</p>`;
        }
    }

    function resetSearch() {
        currentProducts = [...allProducts];
        displayProducts(currentProducts);
        manageResultDiv.innerHTML = `<p>Se muestran todos los productos (${currentProducts.length}).</p>`;
    }

    // -- Insert Product --
    async function handleInsertProduct(event) {
        event.preventDefault();
        if (!isAdmin) return; // Double check permission

        insertBtn.disabled = true;
        insertResultDiv.innerHTML = '<p>Insertando producto...</p>';
        clearInsertFormErrors();

        const formData = new FormData(insertForm);
        const data = {
            name: formData.get('name'),
            category: formData.get('category'),
            description: formData.get('description'),
            price: formData.get('price'),
            stock: formData.get('stock'),
            available: formData.get('available') === 'on',
            image_url: formData.get('image_url'),
        };

        try {
            const response = await fetch(manageProductsApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                body: JSON.stringify(data),
            });
            const responseData = await response.json();

            if (response.ok && response.status === 201) {
                insertResultDiv.innerHTML = `<p class="text-success">${responseData.message || 'Producto insertado correctamente.'}</p>`;
                insertForm.reset();
                await loadProducts(); // Refresh list
                if (productSearchInput && productSearchInput.value) {
                    productSearchInput.value = ''; // Reset search input after new product is added
                }
            } else if (response.status === 400 && responseData.errors) {
                displayInsertFormErrors(responseData.errors);
                insertResultDiv.innerHTML = '<p class="text-danger">Error de validación. Por favor revise los campos.</p>';
            } else {
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error inserting product:', error);
            insertResultDiv.innerHTML = `<p class="text-danger">Error al insertar producto: ${error.message}</p>`;
        } finally {
            insertBtn.disabled = !isAdmin;
        }
    }

    function displayInsertFormErrors(errors) {
        clearInsertFormErrors();
        for (const field in errors) {
            const errorDiv = document.getElementById(`error-${field}`);
            if (errorDiv) {
                errorDiv.textContent = errors[field].join(' ');
            }
        }
    }

    function clearInsertFormErrors() {
        insertForm.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }

    // -- Edit Product --
    function handleEditClick(event) {
        const productId = event.target.getAttribute('data-id');
        const product = currentProducts.find(p => p.id === productId);

        if (!product) {
            console.error("Product data not found for ID:", productId);
            manageResultDiv.innerHTML = `<p class="text-danger">Error: No se encontraron datos para el producto ${productId}.</p>`;
            return;
        }

        // Populate modal form
        editProductIdInput.value = product.id;
        editProductNameInput.value = product.name;
        editProductCategorySelect.value = product.category ? product.category.id : ''; // Handle null category
        editProductDescriptionTextarea.value = product.description || '';
        editProductPriceInput.value = product.price;
        editProductStockInput.value = product.stock;
        editProductAvailableCheckbox.checked = product.available;
        
        // Set image URL if it exists
        const imageUrlInput = document.getElementById('editProductImageUrl');
        if (imageUrlInput) {
            imageUrlInput.value = product.image_url || '';
        }

        openEditModal();
    }

    async function handleEditSubmit(event) {
        event.preventDefault();
        if (!isAdmin) return; // Double check permission

        saveEditBtn.disabled = true;
        editResultDiv.innerHTML = '<p>Guardando cambios...</p>';
        clearEditFormErrors();

        const productId = editProductIdInput.value;
        const data = {
            name: editProductNameInput.value,
            category: editProductCategorySelect.value,
            description: editProductDescriptionTextarea.value,
            price: editProductPriceInput.value,
            stock: editProductStockInput.value,
            available: editProductAvailableCheckbox.checked,
            image_url: document.getElementById('editProductImageUrl')?.value || '',
        };

        try {
            const response = await fetch(manageProductsApiDetailUrl(productId), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                body: JSON.stringify(data),
            });
            const responseData = await response.json();

            if (response.ok) {
                editResultDiv.innerHTML = `<p class="text-success">${responseData.message || 'Producto actualizado correctamente.'}</p>`;

                // Update both data stores
                const indexCurrent = currentProducts.findIndex(p => p.id === productId);
                if (indexCurrent !== -1) {
                    currentProducts[indexCurrent] = responseData.product;
                }
                
                const indexAll = allProducts.findIndex(p => p.id === productId);
                if (indexAll !== -1) {
                    allProducts[indexAll] = responseData.product;
                }

                // If there's an active search, we need to check if edited product still matches search criteria
                if (productSearchInput && productSearchInput.value.trim()) {
                    const searchTerm = productSearchInput.value.trim().toLowerCase();
                    const updatedProduct = responseData.product;
                    const productName = updatedProduct.name.toLowerCase();
                    const categoryName = updatedProduct.category ? updatedProduct.category.name.toLowerCase() : '';
                    
                    // Check if product still matches search criteria
                    if (productId.toLowerCase().includes(searchTerm) || 
                        productName.includes(searchTerm) || 
                        categoryName.includes(searchTerm)) {
                        // Product still matches - update the row
                        const row = productListTbody.querySelector(`tr[data-product-id="${productId}"]`);
                        if (row) {
                            updateProductRow(row, updatedProduct);
                        } else {
                            // If row not found, rerun search to refresh display
                            searchProducts(productSearchInput.value.trim());
                        }
                    } else {
                        // Product no longer matches search - remove it from view and update currentProducts
                        currentProducts = currentProducts.filter(p => p.id !== productId);
                        const row = productListTbody.querySelector(`tr[data-product-id="${productId}"]`);
                        if (row) {
                            row.remove();
                        }
                        if (productListTbody.rows.length === 0) {
                            productListTbody.innerHTML = '<tr><td colspan="7">No se encontraron productos con los criterios de búsqueda.</td></tr>';
                        }
                        // Update message to reflect removal from search results
                        manageResultDiv.innerHTML = `<p>Producto actualizado. Ya no coincide con la búsqueda "${productSearchInput.value.trim()}" y ha sido removido de los resultados.</p>`;
                    }
                } else {
                    // No active search - just update the row
                    const row = productListTbody.querySelector(`tr[data-product-id="${productId}"]`);
                    if (row) {
                        updateProductRow(row, responseData.product);
                    } else {
                        // If row not found, reload the whole table (less ideal)
                        await loadProducts();
                    }
                }

                setTimeout(closeEditModal, 1000); // Close modal after a short delay

            } else if (response.status === 400 && responseData.errors) {
                displayEditFormErrors(responseData.errors);
                editResultDiv.innerHTML = '<p class="text-danger">Error de validación. Por favor revise los campos.</p>';
            } else {
                 throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            editResultDiv.innerHTML = `<p class="text-danger">Error al actualizar producto: ${error.message}</p>`;
        } finally {
            saveEditBtn.disabled = !isAdmin; // Re-enable based on admin status
        }
    }

     function displayEditFormErrors(errors) {
        clearEditFormErrors();
        for (const field in errors) {
            // Map backend field names to modal input IDs if necessary
            const errorDiv = document.getElementById(`edit-error-${field}`);
            if (errorDiv) {
                errorDiv.textContent = errors[field].join(' ');
            } else {
                console.warn(`No error display element found for field: edit-error-${field}`);
            }
        }
    }

    function clearEditFormErrors() {
        editForm.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }


    // --- Delete Product Handling ---
    async function handleDeleteProduct(event) {
        const button = event.target;
        const productId = button.getAttribute('data-id');
        const productName = currentProducts.find(p => p.id === productId)?.name || `ID: ${productId.substring(0,8)}...`; // Get name from stored data

        if (!productId || !isAdmin) return;

        if (confirm(`¿Estás seguro de eliminar el producto "${productName}"?`)) {
            button.disabled = true;
            manageResultDiv.innerHTML = `<p>Eliminando "${productName}"...</p>`;

            try {
                const response = await fetch(manageProductsApiDetailUrl(productId), {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrftoken },
                });
                const responseData = await response.json();

                if (response.ok) {
                    manageResultDiv.innerHTML = `<p class="text-success">${responseData.message || 'Producto eliminado.'}</p>`;
                    
                    // Update the global allProducts array to remove the deleted product
                    allProducts = allProducts.filter(p => p.id !== productId);
                    
                    // If there's an active search, update the filtered list and refresh display
                    if (productSearchInput && productSearchInput.value.trim()) {
                        searchProducts(productSearchInput.value.trim());
                    } else {
                        // Remove from local store
                        currentProducts = currentProducts.filter(p => p.id !== productId);
                        // Remove row from table
                        button.closest('tr').remove();
                        if (productListTbody.rows.length === 0) {
                            productListTbody.innerHTML = '<tr><td colspan="7">No se encontraron productos.</td></tr>';
                        }
                    }
                } else {
                     throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                manageResultDiv.innerHTML = `<p class="text-danger">Error al eliminar producto: ${error.message}</p>`;
                 const row = productListTbody.querySelector(`tr[data-product-id="${productId}"]`);
                 if (row) {
                     const btn = row.querySelector('.delete-btn');
                     if (btn) btn.disabled = false; // Re-enable on error
                 }
            }
        }
    }

    // --- UI Updates based on Admin Status ---
    function updateAdminUIElements() {
        // Enable/disable insert form button
        insertBtn.disabled = !isAdmin;
        insertBtn.title = isAdmin ? "" : "Necesitas permisos de administrador para añadir productos";

        // Enable/disable edit/delete buttons (done during table rendering)
        // Re-run displayProducts if admin status changes after initial load (unlikely scenario here)
        // displayProducts(currentProducts); // Could cause issues if called unnecessarily

        // Enable/disable edit form save button
        saveEditBtn.disabled = !isAdmin;
        saveEditBtn.title = isAdmin ? "" : "Necesitas permisos de administrador para guardar cambios";

        // Optionally disable form fields if not admin
        // insertForm.querySelectorAll('input, select, textarea').forEach(el => el.disabled = !isAdmin);
        // editForm.querySelectorAll('input, select, textarea').forEach(el => el.disabled = !isAdmin);
    }

    // --- Modal Control ---
    function openEditModal() {
        if (editModal) editModal.style.display = 'block';
    }

    function closeEditModal() {
        if (editModal) editModal.style.display = 'none';
        editResultDiv.innerHTML = ''; // Clear results
        clearEditFormErrors(); // Clear errors
    }

    function setupModalCloseHandlers() {
         // Close button inside modal
        const closeBtn = editModal?.querySelector('.close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeEditModal);

        // Cancel button inside modal
        const cancelBtn = editModal?.querySelector('.modal-footer .btn-secondary');
        if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);

        // Close modal if user clicks outside of the modal content
        window.addEventListener('click', (event) => {
            if (event.target == editModal) {
                closeEditModal();
            }
        });
    }

    // --- Utility ---
    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        // Ensure it's a string before replacing
        return String(unsafe)
             .replace(/&/g, "&") // Must be first
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, '\\"') // Escape the double quote character
             .replace(/'/g, "&#039;"); // Keep single quote as entity
     }

    // --- Start the process ---
    initializePage();
});
