// Initialize tracking
function initLogRocketTracking() {
    if (!window.LogRocket) return;
  
    // Track page views
    LogRocket.track('pageview', {
      page: window.location.pathname,
      referrer: document.referrer
    });
  
    // Set up e-commerce tracking
    setupEcommerceTracking();
  }
  
  // Track add-to-cart, checkout, and form submissions
  function setupEcommerceTracking() {
    // Add to cart tracking
    document.addEventListener('click', function(e) {
      const addToCartBtn = e.target.closest('.add-to-cart-btn');
      if (addToCartBtn) {
        LogRocket.track('add_to_cart', {
          product_id: addToCartBtn.dataset.productId,
          product_name: addToCartBtn.dataset.productName,
          price: parseFloat(addToCartBtn.dataset.price || '0')
        });
      }
    });
  
    // Track form submissions
    document.addEventListener('submit', function(e) {
      if (e.target.id === 'special-order-form') {
        LogRocket.track('special_order_submitted');
      }
    });
  }
  
  document.addEventListener('DOMContentLoaded', initLogRocketTracking);