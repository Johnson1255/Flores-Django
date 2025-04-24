document.addEventListener('DOMContentLoaded', () => {
    const adminStatusDiv = document.getElementById('adminStatus');
    const productListTbody = document.querySelector('#productList tbody');
    const manageResultDiv = document.getElementById('manageResult');
    const insertForm = document.getElementById('insertProductForm');
    const insertResultDiv = document.getElementById('result');
    const insertBtn = document.getElementById('insertBtn');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    let isAdmin = false; // Store admin status globally in this script

    // URLs (assuming Django's reverse mechanism isn't directly available in JS)
    // It's often better to pass these via data attributes in the HTML if they might change
    const checkAdminUrl = '/floresvalentin_app/api/check-admin/';
    const manageProductsApiUrl = '/floresvalentin_app/api/manage-products/'; // Base URL for GET/POST
    const manageProductsApiDetailUrl = (id) => `/floresvalentin_app/api/manage-products/${id}/`; // URL for DELETE

    // Function to get CSRF token (needed for POST/DELETE requests)
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
        setupFormListener();
        updateAdminUIElements(); // Enable/disable elements based on admin status
    }

    // --- Admin Status Check ---

    async function checkAdminStatus() {
        try {
            const response = await fetch(checkAdminUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            isAdmin = data.is_admin;

            if (isAdmin) {
                adminStatusDiv.innerHTML = '<div class="status-indicator admin-status">✅ Tienes permisos de administrador. Puedes añadir y eliminar productos.</div>';
            } else {
                adminStatusDiv.innerHTML = '<div class="status-indicator no-admin-status">⚠️ No tienes permisos de administrador. Solo puedes ver productos.</div>';
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            adminStatusDiv.innerHTML = '<div class="status-indicator no-admin-status">❌ Error al verificar permisos.</div>';
            isAdmin = false; // Assume not admin if check fails
        }
    }

    // --- Load and Display Products ---

    async function loadProducts() {
        manageResultDiv.innerHTML = '<p>Cargando productos...</p>';
        productListTbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>'; // Clear table body

        try {
            const response = await fetch(manageProductsApiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.products && data.products.length > 0) {
                displayProducts(data.products);
                manageResultDiv.innerHTML = `<p>Se cargaron ${data.products.length} productos.</p>`;
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
            row.setAttribute('data-product-id', product.id); // Add data attribute

            const shortId = product.id.substring(0, 8) + '...';
            const categoryName = product.category ? product.category.name : 'N/A';
            const priceFormatted = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(product.price);
            const availableText = product.available ? 'Sí' : 'No';

            row.innerHTML = `
                <td title="${product.id}">${shortId}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(categoryName)}</td>
                <td>${priceFormatted}</td>
                <td>${product.stock}</td>
                <td>${availableText}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}" ${!isAdmin ? 'disabled title="Necesitas permisos de administrador"' : ''}>
                        Eliminar
                    </button>
                </td>
            `;

            // Add event listener for the delete button IF admin
            if (isAdmin) {
                const deleteBtn = row.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', handleDeleteProduct);
            }
        });
    }

    // --- Tab Management ---

    function setupTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Deactivate all
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Activate selected
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId + 'Tab').classList.add('active');
            });
        });
    }

    // --- Insert Product Form Handling ---

    function setupFormListener() {
        insertForm.addEventListener('submit', handleInsertProduct);
    }

    async function handleInsertProduct(event) {
        event.preventDefault(); // Prevent default form submission
        insertBtn.disabled = true; // Disable button during submission
        insertResultDiv.innerHTML = '<p>Insertando producto...</p>';
        clearFormErrors();

        const formData = new FormData(insertForm);
        const data = {
            name: formData.get('name'),
            category: formData.get('category'), // Send category ID
            description: formData.get('description'),
            price: formData.get('price'),
            stock: formData.get('stock'),
            available: formData.get('available') === 'on', // Convert checkbox value
        };

        try {
            const response = await fetch(manageProductsApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (response.ok && response.status === 201) { // Check for 201 Created status
                insertResultDiv.innerHTML = `<p class="text-success">${responseData.message || 'Producto insertado correctamente.'}</p>`;
                insertForm.reset(); // Clear the form
                await loadProducts(); // Refresh the product list
                // Optionally switch back to the manage tab
                // document.querySelector('.tab[data-tab="manage"]').click();
            } else {
                // Handle validation errors or other server errors
                if (response.status === 400 && responseData.errors) {
                    displayFormErrors(responseData.errors);
                    insertResultDiv.innerHTML = '<p class="text-danger">Error de validación. Por favor revise los campos.</p>';
                } else {
                    throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
                }
            }
        } catch (error) {
            console.error('Error inserting product:', error);
            insertResultDiv.innerHTML = `<p class="text-danger">Error al insertar producto: ${error.message}</p>`;
        } finally {
             // Re-enable button only if user is admin
            insertBtn.disabled = !isAdmin;
        }
    }

    function displayFormErrors(errors) {
        for (const field in errors) {
            const errorDiv = document.getElementById(`error-${field}`);
            if (errorDiv) {
                errorDiv.textContent = errors[field].join(' '); // Join multiple errors for a field
            }
        }
    }

    function clearFormErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }


    // --- Delete Product Handling ---

    async function handleDeleteProduct(event) {
        const button = event.target;
        const productId = button.getAttribute('data-id');
        const productName = button.closest('tr').querySelector('td:nth-child(2)').textContent; // Get name from table

        if (!productId) return;

        if (confirm(`¿Estás seguro de eliminar el producto "${productName}" (ID: ${productId.substring(0,8)}...)?`)) {
            button.disabled = true; // Disable button during deletion
            manageResultDiv.innerHTML = `<p>Eliminando "${productName}"...</p>`;

            try {
                const response = await fetch(manageProductsApiDetailUrl(productId), {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': csrftoken,
                    },
                });

                const responseData = await response.json();

                if (response.ok) {
                    manageResultDiv.innerHTML = `<p class="text-success">${responseData.message || 'Producto eliminado.'}</p>`;
                    // Remove row from table
                    button.closest('tr').remove();
                    // Check if table is now empty
                    if (productListTbody.rows.length === 0) {
                         productListTbody.innerHTML = '<tr><td colspan="7">No se encontraron productos.</td></tr>';
                    }
                } else {
                     throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
                }

            } catch (error) {
                console.error('Error deleting product:', error);
                manageResultDiv.innerHTML = `<p class="text-danger">Error al eliminar producto: ${error.message}</p>`;
                 // Re-enable button on error if it still exists
                 const row = productListTbody.querySelector(`tr[data-product-id="${productId}"]`);
                 if (row) {
                     const btn = row.querySelector('.delete-btn');
                     if (btn) btn.disabled = false;
                 }
            }
            // Button remains disabled on success as the row is removed
        }
    }

    // --- UI Updates based on Admin Status ---
    function updateAdminUIElements() {
        // Enable/disable insert form button
        insertBtn.disabled = !isAdmin;
        if (!isAdmin) {
            insertBtn.title = "Necesitas permisos de administrador para añadir productos";
        } else {
             insertBtn.title = "";
        }

        // Disable form fields if not admin? (Optional, prevents typing)
        // insertForm.querySelectorAll('input, select, textarea').forEach(el => el.disabled = !isAdmin);

        // Delete buttons are handled during table rendering
    }

    // --- Utility ---
    // Corrected escapeHtml function
    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') {
            return '';
        }
        return unsafe
             .toString()
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, '"') // Use single quotes here
             .replace(/'/g, "&#039;"); // Double quotes are fine here
     }


    // --- Start the process ---
    initializePage();

});
