from django.urls import path
from . import views

app_name = 'floresvalentin_app'

urlpatterns = [
    # Página principal
    path('', views.index, name='index'),
    
    # Catálogo y productos
    path('catalogo/', views.catalog, name='catalogo'),
    path('catalogo/api/', views.catalog_api, name='catalogo_api'),  # API para filtrado AJAX
    path('producto/<uuid:product_id>/', views.product_detail, name='product_detail'),
    path('producto/<uuid:product_id>/api/', views.product_detail_api, name='product_detail_api'),
    
    # Carrito de compras
    path('carrito/', views.cart_detail, name='ver_carrito'),
    path('carrito/agregar/<uuid:product_id>/', views.cart_add, name='agregar_al_carrito'),
    path('carrito/actualizar/<uuid:product_id>/', views.cart_update, name='actualizar_carrito'),
    path('carrito/eliminar/<uuid:product_id>/', views.cart_remove, name='eliminar_del_carrito'),
    path('carrito/aplicar-cupon/', views.apply_coupon, name='aplicar_cupon'),
    
    # Proceso de compra
    path('checkout/', views.checkout, name='checkout'),
    path('checkout/confirmar/', views.checkout_confirm, name='checkout_confirm'),
    path('checkout/completado/<uuid:order_id>/', views.order_completed, name='order_completed'),
    
    # Pedidos especiales
    path('pedido-especial/', views.special_order_create, name='special_order_create'),
    path('pedido-especial/gracias/', views.special_order_thanks, name='special_order_thanks'),
    
    # Cuenta de usuario
    path('perfil/', views.profile, name='profile'),
    path('perfil/editar/', views.profile_edit, name='profile_edit'),
    path('mis-pedidos/', views.my_orders, name='my_orders'),
    path('mis-pedidos/<uuid:order_id>/', views.order_detail, name='order_detail'),
    
    # Otras páginas
    path('contact-submit/', views.contact_view, name='contact_submit'), # Changed URL and view name
    path('galeria/', views.gallery, name='gallery'), # Assuming gallery is part of index
    path('ubicacion/', views.location, name='location'), # Assuming location is also part of index or needs its own template

    # --- Product Management URLs ---
    path('manage-products/', views.manage_products_view, name='manage_products'),
    path('api/check-admin/', views.check_admin_status_api, name='check_admin_status_api'),
    path('api/manage-products/', views.manage_products_api, name='manage_products_api'), # For listing (GET) and creating (POST)
    path('api/manage-products/<uuid:product_id>/', views.manage_products_api, name='manage_products_api_detail'), # For deleting (DELETE)
]
