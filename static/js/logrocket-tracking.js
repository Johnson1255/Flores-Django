// Initialize tracking
function initLogRocketTracking() {
    if (!window.LogRocket) {
      console.warn('LogRocket not loaded');
      return;
    }
  
    // Track page views with custom data
    LogRocket.track('pageview', {
      page: window.location.pathname,
      referrer: document.referrer
    });
  
    // Set up e-commerce tracking
    setupEcommerceTracking();
    
    // Set up user interaction tracking
    setupUserInteractionTracking();
  }
  
  // E-commerce tracking
  function setupEcommerceTracking() {
    // Track "Add to Cart" actions
    document.addEventListener('click', function(e) {
      const addToCartBtn = e.target.closest('.btn-add-to-cart');
      if (addToCartBtn) {
        const productId = addToCartBtn.dataset.productId;
        const productName = addToCartBtn.dataset.productName || 
                           document.querySelector('.product-title')?.textContent || 
                           'Unknown Product';
        const price = parseFloat(addToCartBtn.dataset.price || '0');
        
        LogRocket.track('add_to_cart', {
          product_id: productId,
          product_name: productName,
          price: price
        });
      }
    });
  
    // Track checkout process
    if (window.location.pathname.includes('/checkout')) {
      LogRocket.track('begin_checkout');
      
      const checkoutForm = document.querySelector('form[id="checkout-form"]');
      if (checkoutForm) {
        checkoutForm.addEventListener('submit', function() {
          LogRocket.track('complete_checkout');
        });
      }
    }
    
    // Track shopping cart views
    if (window.location.pathname.includes('/cart')) {
      LogRocket.track('view_cart');
    }
    
    // Track special orders
    const specialOrderForm = document.getElementById('special-order-form');
    if (specialOrderForm) {
      specialOrderForm.addEventListener('submit', function() {
        LogRocket.track('special_order_submitted', {
          form_data: getFormDataObject(specialOrderForm)
        });
      });
    }
  }
  
  // User interaction tracking
  function setupUserInteractionTracking() {
    // Track login/register actions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function() {
        LogRocket.track('login_attempt');
      });
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', function() {
        LogRocket.track('register_attempt');
      });
    }
    
    // Track catalog filter usage
    const filterForms = document.querySelectorAll('.filter-form');
    filterForms.forEach(form => {
      form.addEventListener('submit', function() {
        LogRocket.track('filter_products', {
          filters: getFormDataObject(form)
        });
      });
    });
    
    // Track search usage
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
      searchForm.addEventListener('submit', function() {
        const searchInput = searchForm.querySelector('input[type="search"]');
        LogRocket.track('search', {
          query: searchInput ? searchInput.value : 'unknown query'
        });
      });
    }
    
    // Track language change
    const languageSelectors = document.querySelectorAll('.language-selector');
    languageSelectors.forEach(selector => {
      selector.addEventListener('change', function(e) {
        LogRocket.track('language_change', {
          language: e.target.value
        });
      });
    });
  }
  
  // Helper function to get form data as object
  function getFormDataObject(form) {
    const formData = new FormData(form);
    const data = {};
    
    // Convert FormData to plain object (exclude sensitive fields)
    for (let [key, value] of formData.entries()) {
      // Skip sensitive fields
      if (['password', 'csrfmiddlewaretoken', 'credit_card'].includes(key)) {
        continue;
      }
      data[key] = value;
    }
    
    return data;
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', initLogRocketTracking);