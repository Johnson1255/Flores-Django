import uuid
import json # *** ADD: Import json for parsing request body ***
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest # *** ADD: HttpResponseBadRequest ***
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.mixins import UserPassesTestMixin # Import for admin check
from django.views.decorators.http import require_POST, require_http_methods # For restricting HTTP methods
# from django.contrib.auth.views import LoginView
from django.contrib import messages
from django.urls import reverse_lazy, reverse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger # Added for pagination
from django.template.loader import render_to_string # Added for rendering partials
from django.db.models import Q, Avg # Added for search and average
from .forms import CommentForm #Para los comentarios
from .models import Comment, Product #Para los comentarios

# Corrected model imports
from .models import Product, Category, Order, OrderItem, SpecialOrder, ShoppingCart, Profile, ContactMessage
# Import the correct form
from .forms import SpecialOrderForm, ContactMessageForm, ProfileForm, CheckoutForm, CustomUserCreationForm, ProductForm, UserProfileForm # Added UserProfileForm

# Get an instance of a logger
logger = logging.getLogger(__name__)

# Página principal
def index(request):
    # Changed filter: Get first 6 available products, newest first, instead of non-existent 'featured' field
    featured_products = Product.objects.filter(available=True).order_by('-created_at')[:6]
    # Instantiate the contact form for the index page
    contact_form = ContactMessageForm()
    # TODO: Handle displaying errors if redirected from contact_view after invalid POST
    # This might involve checking session or specific GET parameters if needed.
    # For now, just passing a fresh form instance.
    return render(request, 'floresvalentin_app/index.html', {
        'featured_products': featured_products,
        'contact_form': contact_form, # Add form to context
    })

# Catálogo y productos
def catalog(request):
    categories = Category.objects.all()
    # products = Product.objects.all() # Removed, as products are loaded via API

    # Filtrado básico (No longer needed here as API handles it)
    # category_id = request.GET.get('category')
    # if category_id:
    #     products = products.filter(category_id=category_id)

    return render(request, 'floresvalentin_app/catalog.html', {
        'categories': categories,
        # 'products': products # Removed
    })

def catalog_api(request):
    try: # Added try block for robust error handling
        # Para filtrado, ordenamiento y paginación AJAX
        products_list = Product.objects.filter(available=True) # Start with available products

        # Filtrado
        category_id = request.GET.get('category')
        search_term = request.GET.get('search')
        # Add price filters if needed later
        # price_min = request.GET.get('price_min')
        # price_max = request.GET.get('price_max')

        if category_id:
            products_list = products_list.filter(category_id=category_id)
        if search_term:
            products_list = products_list.filter(
                Q(name__icontains=search_term) | Q(description__icontains=search_term)
            )
        # Add price filtering logic here if implemented

        # Ordenamiento
        sort_option = request.GET.get('sort_by', 'name-asc') # Default sort
        if sort_option == 'name-asc':
            products_list = products_list.order_by('name')
        elif sort_option == 'name-desc':
            products_list = products_list.order_by('-name')
        elif sort_option == 'price-asc':
            products_list = products_list.order_by('price')
        elif sort_option == 'price-desc':
            products_list = products_list.order_by('-price')
        # Add more sorting options if needed

        # Paginación
        paginator = Paginator(products_list, 9) # Show 9 products per page (adjust as needed)
        page_number_str = request.GET.get('page', '1') # Get page number as string
        try:
            page_number = int(page_number_str) # Attempt to convert to integer
            page_obj = paginator.page(page_number)
        except (ValueError, PageNotAnInteger): # Catch conversion errors too
            # If page is not an integer or invalid, deliver first page.
            page_obj = paginator.page(1)
        except EmptyPage:
            # If page is out of range (e.g. 9999) or list is empty, deliver first page.
            page_obj = paginator.page(1) # Return page 1 instead of last page

        # Renderizar partials a HTML
        # Pass the actual list of products from the page object
        products_html = render_to_string(
            'floresvalentin_app/partials/_product_list.html',
            {'products': page_obj.object_list}
        )
        pagination_html = render_to_string(
            'floresvalentin_app/partials/_pagination.html',
            {'page_obj': page_obj}
        )

        # Devolver JSON
        return JsonResponse({
            'products_html': products_html,
            'pagination_html': pagination_html,
            'count': paginator.count, # Total number of products matching filters
            'page': page_obj.number,
            'pages': paginator.num_pages,
        })
    except Exception as e:
        # Log the error for server-side debugging
        logger.error(f"Error in catalog_api view: {e}", exc_info=True)
        # Return an error response to the frontend
        # Note: The frontend JS currently shows a generic error, but this helps debugging
        return JsonResponse({'error': 'Internal server error processing catalog request.', 'details': str(e)}, status=500)


def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    comments = product.comments.all().order_by('-created_at')  # Ordenados por fecha más reciente
    comment_form = CommentForm()
    
    # Calcular el promedio de valoraciones de manera más precisa
    ratings = list(comments.values_list('rating', flat=True))
    total_ratings = len(ratings)
    
    if total_ratings > 0:
        # Cálculo manual del promedio para mayor control
        sum_ratings = sum(ratings)
        average_rating = sum_ratings / total_ratings
    else:
        average_rating = 0
    
    # Depuración - registrar información sobre las valoraciones
    logger.debug(f"Producto: {product.name}, ID: {product.id}")
    logger.debug(f"Total de comentarios: {total_ratings}")
    logger.debug(f"Valoraciones individuales: {ratings}")
    logger.debug(f"Suma de valoraciones: {sum(ratings) if ratings else 0}")
    logger.debug(f"Promedio calculado: {average_rating}")
    
    context = {
        'product': product,
        'comments': comments,
        'comment_form': comment_form,
        'average_rating': average_rating,
        'ratings_debug': {
            'individual_ratings': ratings,
            'total_comments': total_ratings,
            'sum_ratings': sum(ratings) if ratings else 0, 
            'manual_avg': average_rating
        }
    }
    return render(request, 'floresvalentin_app/product_detail.html', context)

def product_detail_api(request, product_id):
    try: # Added try block
        product = get_object_or_404(Product, id=product_id)

        product_data = {
            'id': str(product.id),
            'name': product.name,
            'price': float(product.price),
            'description': product.description,
            'stock': product.stock,
            # Safely access category name
            'category': product.category.name if product.category else None,
            'image_url': product.image_url,
        }

        return JsonResponse(product_data)
    except Exception as e:
        logger.error(f"Error in product_detail_api view for product {product_id}: {e}", exc_info=True)
        return JsonResponse({'error': 'Internal server error fetching product details.', 'details': str(e)}, status=500)


# Carrito de compras
# Refactored to use ShoppingCart model
def get_or_create_cart(request):
    if request.user.is_authenticated:
        # Use ShoppingCart model, user is the primary key
        cart, created = ShoppingCart.objects.get_or_create(user=request.user)
    else:
        # For anonymous users, we might need a different strategy
        # or decide not to support persistent carts for them.
        # For now, let's return None or handle session-based cart later.
        # This implementation assumes authenticated users for persistent cart.
        # If anonymous cart is needed, session logic would go here.
        # cart_id = request.session.get('shopping_cart_id')
        # if cart_id: ... etc.
        messages.error(request, "Debes iniciar sesión para usar el carrito persistente.")
        return None # Or redirect to login
    return cart

# Refactored to handle potential None cart and pass items differently
@login_required # Require login to view the persistent cart detail
def cart_detail(request):
    cart = get_or_create_cart(request) # This already handles user association
    cart_items_context = []
    cart_subtotal = 0
    if cart and cart.items:
        product_ids = cart.items.keys()
        products = Product.objects.filter(id__in=product_ids)
        products_dict = {str(p.id): p for p in products}

        for product_id, item_data in cart.items.items():
            product = products_dict.get(product_id)
            if product:
                quantity = item_data.get('quantity', 0)
                price = item_data.get('price', float(product.price)) # Use stored price or current
                total_price = quantity * price
                cart_items_context.append({
                    'product': product,
                    'quantity': quantity,
                    'price': price,
                    'total_price': total_price,
                    'id': product_id # Pass ID for update/remove forms
                })
                cart_subtotal += total_price

    # TODO: Calculate tax and total based on subtotal
    cart_tax = cart_subtotal * 0.19 # Example tax
    cart_total = cart_subtotal + cart_tax

    # Use the correct template name based on file structure
    return render(request, 'floresvalentin_app/shopping_cart_detail.html', {
        'cart': cart, # Pass the cart object itself if needed
        'cart_items': cart_items_context,
        'cart_subtotal': cart_subtotal,
        'cart_tax': cart_tax,
        'cart_total': cart_total,
    })

# Updated to handle AJAX requests and return JSON
def cart_add(request, product_id):
    # Check if it's an AJAX request (important for security and response type)
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    cart = get_or_create_cart(request)
    logger.debug(f"cart_add: User {request.user.username} attempting to add product {product_id}") # Added log
    if not cart:
        logger.warning(f"cart_add: Cart not found or user not logged in for user {request.user.username}") # Added log
        message = "Debes iniciar sesión para añadir productos al carrito."
        if is_ajax:
            return JsonResponse({'success': False, 'error': message, 'login_required': True}, status=401) # Unauthorized
        else:
            messages.error(request, message)
            return redirect('login') # Redirect non-AJAX requests

    try: # Added try block
        logger.debug(f"cart_add: Fetching product {product_id}") # Added log
        product = get_object_or_404(Product, id=product_id)
        logger.debug(f"cart_add: Product '{product.name}' found.") # Added log
        # For AJAX, quantity might come from JSON body, but JS currently doesn't send one. Default to 1.
        # quantity = int(request.POST.get('quantity', 1)) # Keep for non-AJAX if needed
        quantity = 1 # Default for current AJAX implementation
        product_id_str = str(product.id)

        logger.debug(f"cart_add: Cart items before update for user {request.user.username}: {cart.items}") # Added log

        # Update JSONField
        if product_id_str in cart.items:
            current_quantity = cart.items[product_id_str].get('quantity', 0)
            cart.items[product_id_str]['quantity'] = current_quantity + quantity
            logger.debug(f"cart_add: Updated quantity for product {product_id_str} to {cart.items[product_id_str]['quantity']}") # Added log
        else:
            cart.items[product_id_str] = {
                'quantity': quantity,
                'price': float(product.price) # Store price at time of adding
            }
            logger.debug(f"cart_add: Added new product {product_id_str} with quantity {quantity}") # Added log

        logger.debug(f"cart_add: Cart items after update, before save: {cart.items}") # Added log
        cart.save()
        logger.debug(f"cart_add: Cart saved successfully for user {request.user.username}") # Added log

        # Calculate current total items in cart for the counter
        cart_count = sum(item.get('quantity', 0) for item in cart.items.values())
        logger.debug(f"cart_add: Calculated cart count: {cart_count}") # Added log
        success_message = f'{product.name} añadido al carrito'

        if is_ajax:
            return JsonResponse({
                'success': True,
                'message': success_message,
                'cart_count': cart_count
            })
        else:
            # Fallback for non-AJAX requests (e.g., if JS fails)
            messages.success(request, success_message)
            return redirect(request.META.get('HTTP_REFERER', 'floresvalentin_app:catalogo')) # Redirect back or to catalog
    except Exception as e:
        logger.error(f"Error in cart_add view for product {product_id}: {e}", exc_info=True)
        if is_ajax:
            return JsonResponse({'success': False, 'error': 'Error adding item to cart.'}, status=500)
        else:
            messages.error(request, 'Error al añadir el producto al carrito.')
            return redirect(request.META.get('HTTP_REFERER', 'floresvalentin_app:catalogo'))


# *** ADD Helper function to get cart context data ***
def _get_cart_context(cart):
    """Calculates totals and prepares item context for rendering."""
    cart_items_context = []
    cart_subtotal = 0
    cart_count = 0
    if cart and cart.items:
        product_ids = cart.items.keys()
        products = Product.objects.filter(id__in=product_ids)
        products_dict = {str(p.id): p for p in products}

        for product_id, item_data in cart.items.items():
            product = products_dict.get(product_id)
            if product:
                quantity = item_data.get('quantity', 0)
                price = item_data.get('price', float(product.price)) # Use stored price or current
                total_price = quantity * price
                cart_items_context.append({
                    'product': product,
                    'quantity': quantity,
                    'price': price,
                    'total_price': total_price,
                    'id': product_id # Pass ID for update/remove forms
                })
                cart_subtotal += total_price
                cart_count += quantity

    cart_tax = cart_subtotal * 0.19 # Example tax
    cart_total = cart_subtotal + cart_tax
    return {
        'cart_items': cart_items_context,
        'cart_subtotal': cart_subtotal,
        'cart_tax': cart_tax,
        'cart_total': cart_total,
        'cart_count': cart_count,
    }

# *** ADD Helper function to render summary partial ***
def _render_cart_summary(cart):
    """Renders the cart summary partial template."""
    context = _get_cart_context(cart)
    # Assuming a partial template exists at this path
    return render_to_string('floresvalentin_app/partials/_cart_summary.html', context)

# *** ADD Helper function to render item partial ***
def _render_cart_item(product_id, cart):
    """Renders a single cart item partial template."""
    context = _get_cart_context(cart)
    # Find the specific item in the context
    item_context = next((item for item in context['cart_items'] if item['id'] == product_id), None)
    if item_context:
        # Assuming a partial template exists at this path
        return render_to_string('floresvalentin_app/partials/_cart_item.html', {'item': item_context})
    return None


# *** REVISED cart_update to handle AJAX ***
@login_required # Ensure user is logged in
def cart_update(request, product_id):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    cart = get_or_create_cart(request)

    if not cart:
        message = "Carrito no encontrado o usuario no autenticado."
        if is_ajax:
            return JsonResponse({'success': False, 'error': message, 'login_required': True}, status=401)
        else:
            messages.error(request, message)
            return redirect('login')

    product_id_str = str(product_id)
    new_quantity = 0 # Initialize

    if request.method == 'POST':
        try:
            if is_ajax:
                # Parse quantity from JSON body for AJAX
                data = json.loads(request.body)
                new_quantity = int(data.get('quantity', 0))
            else:
                # Parse quantity from form data for non-AJAX (fallback)
                new_quantity = int(request.POST.get('quantity', 0))

            if product_id_str in cart.items:
                if new_quantity > 0:
                    cart.items[product_id_str]['quantity'] = new_quantity
                    message = 'Cantidad actualizada.'
                else:
                    # If quantity is 0 or less, remove the item
                    del cart.items[product_id_str]
                    message = 'Producto eliminado del carrito.'
                cart.save()

                if is_ajax:
                    # Prepare data for JSON response
                    context_data = _get_cart_context(cart)
                    item_context = next((item for item in context_data['cart_items'] if item['id'] == product_id_str), None)
                    item_subtotal = item_context['total_price'] if item_context else 0

                    return JsonResponse({
                        'success': True,
                        'message': message,
                        'cart_count': context_data['cart_count'],
                        'summary_html': _render_cart_summary(cart),
                        # Optionally render and return the specific item's HTML
                        # 'item_html': _render_cart_item(product_id_str, cart),
                        'item_subtotal': item_subtotal, # Send updated item subtotal
                        'quantity': new_quantity if new_quantity > 0 else 0 # Send final quantity
                    })
                else:
                    messages.success(request, message)
                    return redirect('floresvalentin_app:ver_carrito')
            else:
                 message = 'Producto no encontrado en el carrito.'
                 if is_ajax:
                     return JsonResponse({'success': False, 'error': message}, status=404)
                 else:
                     messages.error(request, message)
                     return redirect('floresvalentin_app:ver_carrito')

        except (ValueError, json.JSONDecodeError):
            message = 'Datos inválidos.'
            if is_ajax:
                return JsonResponse({'success': False, 'error': message}, status=400) # Bad Request
            else:
                messages.error(request, message)
                return redirect('floresvalentin_app:ver_carrito')
        except Exception as e:
            logger.error(f"Error in cart_update view for product {product_id}: {e}", exc_info=True)
            message = 'Error al actualizar el carrito.'
            if is_ajax:
                return JsonResponse({'success': False, 'error': message}, status=500) # Internal Server Error
            else:
                messages.error(request, message)
                return redirect('floresvalentin_app:ver_carrito')
    else:
        # Handle non-POST requests (e.g., GET) if necessary, maybe redirect or return error
        if is_ajax:
            return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
        else:
            return redirect('floresvalentin_app:ver_carrito')


# *** REVISED cart_remove to handle AJAX ***
@login_required # Ensure user is logged in
def cart_remove(request, product_id):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    cart = get_or_create_cart(request)

    if not cart:
        message = "Carrito no encontrado o usuario no autenticado."
        if is_ajax:
            return JsonResponse({'success': False, 'error': message, 'login_required': True}, status=401)
        else:
            messages.error(request, message)
            return redirect('login')

    product_id_str = str(product_id)

    if request.method == 'POST': # Should be POST or DELETE
        try:
            if product_id_str in cart.items:
                del cart.items[product_id_str]
                cart.save()
                message = 'Producto eliminado del carrito.'

                if is_ajax:
                    context_data = _get_cart_context(cart)
                    return JsonResponse({
                        'success': True,
                        'message': message,
                        'cart_count': context_data['cart_count'],
                        'summary_html': _render_cart_summary(cart)
                    })
                else:
                    messages.success(request, message)
                    return redirect('floresvalentin_app:ver_carrito')
            else:
                message = 'Producto no encontrado en el carrito.'
                if is_ajax:
                    return JsonResponse({'success': False, 'error': message}, status=404)
                else:
                    messages.error(request, message)
                    return redirect('floresvalentin_app:ver_carrito')
        except Exception as e:
            logger.error(f"Error in cart_remove view for product {product_id}: {e}", exc_info=True)
            message = 'Error al eliminar el producto del carrito.'
            if is_ajax:
                return JsonResponse({'success': False, 'error': message}, status=500)
            else:
                messages.error(request, message)
                return redirect('floresvalentin_app:ver_carrito')
    else:
        # Handle non-POST requests
        if is_ajax:
            return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
        else:
            return redirect('floresvalentin_app:ver_carrito')

# Needs refactoring - No Coupon model exists currently
def apply_coupon(request):
    # This function needs a Coupon model and logic to work.
    # For now, just display a message.
    if request.method == 'POST':
        coupon_code = request.POST.get('coupon_code')
        messages.info(request, f'Funcionalidad de cupón "{coupon_code}" no implementada.')

    return redirect('floresvalentin_app:ver_carrito')

# Proceso de compra
@login_required
def checkout(request):
    cart = get_or_create_cart(request)
    if not cart or not cart.items:
         messages.warning(request, 'Tu carrito está vacío.')
         return redirect('floresvalentin_app:ver_carrito')

    # Recalculate totals here before passing to template/form
    cart_items_context = []
    cart_subtotal = 0
    if cart.items:
        product_ids = cart.items.keys()
        products = Product.objects.filter(id__in=product_ids)
        products_dict = {str(p.id): p for p in products}
        for product_id, item_data in cart.items.items():
             product = products_dict.get(product_id)
             if product:
                 quantity = item_data.get('quantity', 0)
                 price = item_data.get('price', float(product.price))
                 total_price = quantity * price
                 cart_subtotal += total_price
                 # Añadir datos de producto al contexto
                 cart_items_context.append({
                    'product': product,
                    'quantity': quantity,
                    'price': price,
                    'total_price': total_price
                 })

    cart_tax = cart_subtotal * 0.19 # Example tax
    cart_total = cart_subtotal + cart_tax

    # Pass calculated totals to the template
    # Initialize form with user data if available
    initial_data = {
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'email': request.user.email,
    }
    # Add address info if available in Profile model
    if hasattr(request.user, 'profile'):
         initial_data.update({
             'address': request.user.profile.address,
             'city': request.user.profile.city,
             'postal_code': request.user.profile.postal_code,
             'phone': request.user.profile.phone,
         })
    form = CheckoutForm(initial=initial_data)

    return render(request, 'floresvalentin_app/checkout.html', {
        'cart': cart,
        'form': form,
        'cart_items': cart_items_context,
        'cart_subtotal': cart_subtotal,
        'cart_tax': cart_tax,
        'cart_total': cart_total,
    })

# Needs refactoring for ShoppingCart and Order creation
@login_required
def checkout_confirm(request):
    if request.method == 'POST':
        form = CheckoutForm(request.POST)
        if form.is_valid():
            cart = get_or_create_cart(request)
            if not cart or not cart.items:
                messages.error(request, 'Error: Tu carrito está vacío.')
                return redirect('floresvalentin_app:ver_carrito')

            try: # Added try block for order creation process
                # Recalculate total for the order
                cart_subtotal = 0
                product_ids = cart.items.keys()
                products = Product.objects.filter(id__in=product_ids)
                products_dict = {str(p.id): p for p in products}
                order_items_data = [] # To store data for OrderItem creation

                for product_id, item_data in cart.items.items():
                     product = products_dict.get(product_id)
                     if product:
                         quantity = item_data.get('quantity', 0)
                         price = item_data.get('price', float(product.price))
                         cart_subtotal += quantity * price
                         order_items_data.append({
                             'product': product,
                             'quantity': quantity,
                             'price': price
                         })

                cart_tax = cart_subtotal * 0.19 # Example tax
                cart_total = cart_subtotal + cart_tax

                # Crear orden
                order = Order.objects.create(
                    user=request.user,
                    # Get data from the VALID form
                    # first_name=form.cleaned_data['first_name'], # Assuming these fields are in CheckoutForm
                    # last_name=form.cleaned_data['last_name'],
                    # email=form.cleaned_data['email'],
                    # address=form.cleaned_data['address'],
                    # postal_code=form.cleaned_data['postal_code'],
                    # city=form.cleaned_data['city'],
                    # phone=form.cleaned_data['phone'],
                    total_amount=cart_total, # Use calculated total
                    # coupon=cart.coupon # No coupon model/field yet
                )

                # Crear items de la orden from collected data
                for item_data in order_items_data:
                    OrderItem.objects.create(
                        order=order,
                        product=item_data['product'],
                        price=item_data['price'],
                        quantity=item_data['quantity']
                    )

                # Vaciar carrito (JSONField)
                cart.items = {}
                cart.save()

                # TODO: Add payment processing logic here if needed

                return redirect('floresvalentin_app:order_completed', order_id=order.id)

            except Exception as e:
                logger.error(f"Error during checkout confirmation for user {request.user.id}: {e}", exc_info=True)
                messages.error(request, 'Ocurrió un error inesperado al procesar tu orden. Por favor, intenta de nuevo.')
                # Redirect back to checkout page, keeping form data might be tricky here
                # Re-rendering with the original form might be the simplest approach
                # Need to recalculate totals again for the template
                cart_subtotal = 0
                cart_items_context = []
                if cart and cart.items:
                    product_ids = cart.items.keys()
                    products = Product.objects.filter(id__in=product_ids)
                    products_dict = {str(p.id): p for p in products}
                    for product_id, item_data in cart.items.items():
                         product = products_dict.get(product_id)
                         if product:
                             quantity = item_data.get('quantity', 0)
                             price = item_data.get('price', float(product.price))
                             total_price = quantity * price
                             cart_subtotal += total_price
                             # Añadir datos de producto al contexto
                             cart_items_context.append({
                                'product': product,
                                'quantity': quantity,
                                'price': price,
                                'total_price': total_price
                             })
                cart_tax = cart_subtotal * 0.19
                cart_total = cart_subtotal + cart_tax
                return render(request, 'floresvalentin_app/checkout.html', {
                    'cart': cart,
                    'form': form, # Pass the submitted form back
                    'cart_items': cart_items_context,
                    'cart_subtotal': cart_subtotal,
                    'cart_tax': cart_tax,
                    'cart_total': cart_total,
                })

        else:
             # Form is invalid, re-render checkout page with errors
             cart = get_or_create_cart(request) # Need cart context again
             # Recalculate totals again for the template
             cart_subtotal = 0
             cart_items_context = []
             if cart and cart.items:
                 product_ids = cart.items.keys()
                 products = Product.objects.filter(id__in=product_ids)
                 products_dict = {str(p.id): p for p in products}
                 for product_id, item_data in cart.items.items():
                      product = products_dict.get(product_id)
                      if product:
                          quantity = item_data.get('quantity', 0)
                          price = item_data.get('price', float(product.price))
                          total_price = quantity * price
                          cart_subtotal += total_price
                          # Añadir datos de producto al contexto
                          cart_items_context.append({
                             'product': product,
                             'quantity': quantity,
                             'price': price,
                             'total_price': total_price
                          })
             cart_tax = cart_subtotal * 0.19
             cart_total = cart_subtotal + cart_tax

             messages.error(request, "Por favor corrige los errores en el formulario.")
             return render(request, 'floresvalentin_app/checkout.html', {
                 'cart': cart,
                 'form': form, # Pass invalid form back
                 'cart_items': cart_items_context,
                 'cart_subtotal': cart_subtotal,
                 'cart_tax': cart_tax,
                 'cart_total': cart_total,
             })

    # If GET request, redirect to checkout page
    return redirect('floresvalentin_app:checkout')


def order_completed(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'floresvalentin_app/order_completed.html', {'order': order})

# Pedidos especiales
@login_required # Require login to create a special order
def special_order_create(request):
    if request.method == 'POST':
        form = SpecialOrderForm(request.POST, request.FILES)
        if form.is_valid():
            try: # Added try block
                special_order = form.save(commit=False)
                if request.user.is_authenticated: # Check again just in case
                    special_order.user = request.user
                special_order.save()
                return redirect('floresvalentin_app:special_order_thanks')
            except Exception as e:
                logger.error(f"Error saving special order for user {request.user.id}: {e}", exc_info=True)
                messages.error(request, 'Ocurrió un error al guardar tu pedido especial.')
                # Re-render form with errors
                return render(request, 'floresvalentin_app/special_order_form.html', {'form': form})
        else:
             # Form is invalid, re-render with errors
             return render(request, 'floresvalentin_app/special_order_form.html', {'form': form})
    else:
        form = SpecialOrderForm()

    return render(request, 'floresvalentin_app/special_order_form.html', {'form': form})

def special_order_thanks(request):
    return render(request, 'floresvalentin_app/special_order_thanks.html')

# Cuenta de usuario
@login_required
def profile(request):
    return render(request, 'floresvalentin_app/profile.html', {'user': request.user})

@login_required
def profile_edit(request):
    # Ensure profile exists, create if not (should be handled by signal, but good practice)
    profile, created = Profile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        # Usamos el formulario combinado que maneja User y Profile
        form = UserProfileForm(request.POST, user=request.user)
        if form.is_valid():
            try:
                form.save()
                messages.success(request, 'Perfil actualizado correctamente')
                return redirect('floresvalentin_app:profile')
            except Exception as e:
                logger.error(f"Error updating profile for user {request.user.id}: {e}", exc_info=True)
                messages.error(request, 'Ocurrió un error al actualizar tu perfil.')
    else:
        # Crear instancia del formulario y poblarlo con datos actuales
        initial_data = {
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'phone': profile.phone,
            'country': profile.country,
            'city': profile.city,
            'neighborhood': profile.neighborhood,
            'address': profile.address,
            'postal_code': profile.postal_code,
            'preferences': profile.preferences,
            'newsletter': profile.newsletter
        }
        form = UserProfileForm(initial=initial_data, user=request.user)

    return render(request, 'floresvalentin_app/profile_edit.html', {'form': form})


@login_required
def my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'floresvalentin_app/my_orders.html', {'orders': orders})

@login_required
def order_detail(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'floresvalentin_app/order_detail.html', {'order': order})

# Otras páginas (Contact View updated to save to DB)
def contact_view(request): # Renamed view for clarity
    if request.method == 'POST':
        form = ContactMessageForm(request.POST)
        if form.is_valid():
            try: # Added try block
                form.save() # Save the message to the database
                messages.success(request, '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.')
                # Redirect back to the index page (or wherever the form was)
                # Assuming the form is on the index page based on previous context
                return redirect(reverse('floresvalentin_app:index') + '#contacto')
            except Exception as e:
                logger.error(f"Error saving contact message: {e}", exc_info=True)
                messages.error(request, 'Ocurrió un error al enviar tu mensaje.')
                # Re-render index page with the form containing errors
                # Need to fetch index context again
                featured_products = Product.objects.filter(available=True).order_by('-created_at')[:6]
                return render(request, 'floresvalentin_app/index.html', {
                    'featured_products': featured_products,
                    'contact_form': form, # Pass the invalid form back
                })
        else:
            # If form is invalid, add an error message
            # We will render the index page again, passing the invalid form
            # This requires modifying the index view slightly to handle this
            messages.error(request, 'Hubo un error en el formulario. Por favor, revisa los campos.')
            # Re-render index page with the form containing errors
            featured_products = Product.objects.filter(available=True).order_by('-created_at')[:6]
            return render(request, 'floresvalentin_app/index.html', {
                'featured_products': featured_products,
                'contact_form': form, # Pass the invalid form back
            })
    else:
        # If GET request, redirect to index page where the form is displayed
        return redirect(reverse('floresvalentin_app:index') + '#contacto')


def gallery(request):
    # This view likely isn't used if gallery is just a section on index.html
    # If it should be a separate page, create gallery.html template
    return render(request, 'floresvalentin_app/gallery.html') # Assuming template exists if needed

def location(request):
    return render(request, 'floresvalentin_app/location.html')


# --- Authentication Views ---

def login_view(request): # Renamed from login_register_view
    """
    Handles GET requests to display the login form
    and POST requests for login attempts.
    """
    if request.user.is_authenticated:
        return redirect('floresvalentin_app:index') # Redirect logged-in users

    if request.method == 'POST':
        login_form = AuthenticationForm(request, data=request.POST)
        if login_form.is_valid():
            username = login_form.cleaned_data.get('username')
            password = login_form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Bienvenido de nuevo, {user.username}!')
                next_url = request.POST.get('next', request.GET.get('next', ''))
                # Basic security check for next_url
                if next_url and not next_url.startswith('/'):
                    next_url = reverse('floresvalentin_app:index')
                return redirect(next_url or 'floresvalentin_app:index')
            else:
                messages.error(request, 'Usuario o contraseña inválidos.')
                # Fall through to render the page again with the login_form containing errors
        else:
            # Login form is not valid
            if '__all__' not in login_form.errors: # Avoid double messaging if form has general errors
                 messages.error(request, 'Por favor corrige los errores en el formulario.')
            # Fall through to render the page again with the login_form containing errors
    else: # GET request
        login_form = AuthenticationForm()

    # Context for GET request or failed POST login attempt
    context = {
        'form': login_form, # Pass the form as 'form' consistent with login.html
    }
    return render(request, 'registration/login.html', context)


def register_view(request): # Renamed from register
    """ Handles GET and POST requests for user registration """
    if request.user.is_authenticated:
        return redirect('floresvalentin_app:index') # Redirect logged-in users

    if request.method == 'POST':
        # Instantiate both forms with POST data
        user_form = CustomUserCreationForm(request.POST)
        profile_form = ProfileForm(request.POST)

        # Validate both forms
        if user_form.is_valid() and profile_form.is_valid():
            try: # Added try block for user/profile creation
                # Save the User form first (commit=True is default and fine here)
                user = user_form.save()

                # Save the Profile form, associating it with the new user
                # The Profile is created automatically by the signal, so we update it.
                profile = user.profile # Get the auto-created profile
                # Update profile fields from the profile_form
                profile.phone = profile_form.cleaned_data['phone']
                profile.country = profile_form.cleaned_data['country']
                profile.city = profile_form.cleaned_data['city']
                profile.neighborhood = profile_form.cleaned_data['neighborhood']
                profile.address = profile_form.cleaned_data['address']
                profile.postal_code = profile_form.cleaned_data['postal_code']
                profile.preferences = profile_form.cleaned_data['preferences']
                profile.newsletter = profile_form.cleaned_data['newsletter']
                profile.save() # Save the updated profile

                login(request, user) # Log the user in directly
                messages.success(request, 'Registro exitoso. ¡Bienvenido!')
                return redirect('floresvalentin_app:index') # Redirect to home page
            except Exception as e:
                logger.error(f"Error during registration for user {user_form.cleaned_data.get('username')}: {e}", exc_info=True)
                messages.error(request, 'Ocurrió un error durante el registro. Por favor, intenta de nuevo.')
                # Re-render with forms containing original data and potential errors
                context = {
                    'user_form': user_form,
                    'profile_form': profile_form
                }
                return render(request, 'registration/register.html', context)
        else:
            # One or both forms are invalid. Re-render with errors.
            # The template needs to display errors from both forms.
            context = {
                'user_form': user_form, # Pass user form back (might contain errors)
                'profile_form': profile_form # Pass profile form back (might contain errors)
            }
            return render(request, 'registration/register.html', context) # Render register.html
    else: # GET request
        # Instantiate empty forms for GET request
        user_form = CustomUserCreationForm()
        profile_form = ProfileForm()
        context = {
            'user_form': user_form,
            'profile_form': profile_form
        }
        return render(request, 'registration/register.html', context) # Render register.html

# Logout view will use Django's built-in view configured in urls.py


# --- Product Management Views (Admin Frontend) ---

# Helper decorator for admin check
def admin_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        # Check if profile exists and role is admin
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'admin':
            return JsonResponse({'error': 'Admin privileges required'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view

@login_required
def manage_products_view(request):
    """Renders the product management page."""
    # Basic permission check (must be logged in)
    # More granular checks (is_admin) will happen in API calls / JS
    categories = Category.objects.all()
    return render(request, 'floresvalentin_app/manage_products.html', {'categories': categories})

@login_required
def check_admin_status_api(request):
    """Checks if the current user has admin privileges by checking for product change permission."""
    # Check if the user has the permission to change products
    has_permission = request.user.has_perm('floresvalentin_app.change_product')
    return JsonResponse({'is_admin': has_permission}) # Return has_permission as is_admin for frontend compatibility


@login_required
@permission_required('floresvalentin_app.change_product', login_url='login', raise_exception=True)
# Allow GET, POST, PUT, DELETE
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def manage_products_api(request, product_id=None):
    """
    API endpoint for managing products.
    GET /api/manage-products/ -> List all products
    POST /api/manage-products/ -> Create a new product (Staff/Admin only)
    PUT /api/manage-products/<uuid:product_id>/ -> Update a product (Staff/Admin only)
    DELETE /api/manage-products/<uuid:product_id>/ -> Delete a product (Staff/Admin only)
    """
    # Use Django's standard is_staff check for admin privileges
    # Superusers automatically have is_staff = True
    is_admin = request.user.is_staff

    # --- LIST Products (GET) ---
    if request.method == 'GET':
        try:
            products = Product.objects.select_related('category').order_by('name').all()
            data = [{
                'id': str(p.id),
                'name': p.name,
                'category': {'id': p.category.id, 'name': p.category.name} if p.category else None,
                'price': str(p.price), # Send as string for consistency
                'stock': p.stock,
                'available': p.available,
                'description': p.description, # Include description
                'image_url': p.image_url # Include image url
            } for p in products]
            return JsonResponse({'products': data})
        except Exception as e:
            logger.error(f"Error listing products in manage_products_api: {e}", exc_info=True)
            return JsonResponse({'error': 'Failed to retrieve products'}, status=500)

    # --- CREATE Product (POST) ---
    elif request.method == 'POST':
        try:
            # Assuming JSON data is sent
            data = json.loads(request.body)
            form = ProductForm(data) # Use ProductForm for validation

            if form.is_valid():
                product = form.save()
                # Return the created product data
                product_data = {
                    'id': str(product.id),
                    'name': product.name,
                    'category': {'id': product.category.id, 'name': product.category.name} if product.category else None,
                    'price': str(product.price),
                    'stock': product.stock,
                    'available': product.available,
                    'description': product.description,
                    'image_url': product.image_url
                }
                return JsonResponse({'product': product_data, 'message': 'Producto creado exitosamente'}, status=201)
            else:
                # Return validation errors
                return JsonResponse({'errors': form.errors}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Error creating product in manage_products_api: {e}", exc_info=True)
            return JsonResponse({'error': 'Failed to create product'}, status=500)

    # --- UPDATE Product (PUT) ---
    elif request.method == 'PUT':
        if not product_id:
            return JsonResponse({'error': 'Product ID is required for update'}, status=400)

        try:
            product = get_object_or_404(Product, id=product_id)
            data = json.loads(request.body)
            # Pass instance=product to update the existing object
            form = ProductForm(data, instance=product)

            if form.is_valid():
                updated_product = form.save()
                # Return the updated product data
                product_data = {
                    'id': str(updated_product.id),
                    'name': updated_product.name,
                    'category': {'id': updated_product.category.id, 'name': updated_product.category.name} if updated_product.category else None,
                    'price': str(updated_product.price),
                    'stock': updated_product.stock,
                    'available': updated_product.available,
                    'description': updated_product.description,
                    'image_url': updated_product.image_url
                }
                return JsonResponse({'product': product_data, 'message': 'Producto actualizado exitosamente'})
            else:
                # Return validation errors
                return JsonResponse({'errors': form.errors}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Product.DoesNotExist:
            return JsonResponse({'error': 'Product not found'}, status=404)
        except Exception as e:
            logger.error(f"Error updating product {product_id} in manage_products_api: {e}", exc_info=True)
            return JsonResponse({'error': 'Failed to update product'}, status=500)

    # --- DELETE Product (DELETE) ---
    elif request.method == 'DELETE':
        if not product_id:
             return JsonResponse({'error': 'Product ID is required for deletion'}, status=400)

        try:
            product = get_object_or_404(Product, id=product_id)
            product_name = product.name # Get name before deleting
            product.delete()
            return JsonResponse({'message': f'Producto "{product_name}" eliminado exitosamente'})
        except Product.DoesNotExist:
             return JsonResponse({'error': 'Product not found'}, status=404)
        except Exception as e:
            logger.error(f"Error deleting product {product_id} in manage_products_api: {e}", exc_info=True)
            return JsonResponse({'error': 'Failed to delete product'}, status=500)

    # Should not happen due to @require_http_methods
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@login_required
def add_comment(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            # Verificar comentarios duplicados
            existing_comment = Comment.objects.filter(
                user=request.user,
                product=product,
                content=form.cleaned_data['content']
            ).exists()
            
            if existing_comment:
                messages.error(request, 'Ya has publicado este comentario exacto.')
            else:
                comment = form.save(commit=False)
                comment.user = request.user
                comment.product = product
                
                # Obtener y guardar la valoración
                rating = request.POST.get('rating')
                if rating and rating.isdigit() and 1 <= int(rating) <= 5:
                    comment.rating = int(rating)
                else:
                    comment.rating = 5  # Valor por defecto
                
                comment.save()
                messages.success(request, '¡Tu comentario ha sido añadido exitosamente!')
                
    return redirect('floresvalentin_app:product_detail', product_id=product_id)

@login_required
def edit_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Verificar que el usuario sea el autor del comentario
    if comment.user != request.user:
        messages.error(request, 'No tienes permiso para editar este comentario.')
        return redirect('floresvalentin_app:product_detail', product_id=comment.product.id)
    
    if request.method == 'POST':
        form = CommentForm(request.POST, instance=comment)
        if form.is_valid():
            # Actualizar el contenido
            edited_comment = form.save(commit=False)
            
            # Obtener y actualizar la valoración
            rating = request.POST.get('rating')
            if rating and rating.isdigit() and 1 <= int(rating) <= 5:
                edited_comment.rating = int(rating)
            
            # Marcar como editado (aunque esto también se hace en el método save del modelo)
            edited_comment.is_edited = True
            
            edited_comment.save()
            messages.success(request, 'Tu comentario ha sido actualizado exitosamente.')
            return redirect('floresvalentin_app:product_detail', product_id=comment.product.id)
    else:
        form = CommentForm(instance=comment)
    
    context = {
        'form': form,
        'comment': comment,
        'product': comment.product
    }
    return render(request, 'floresvalentin_app/edit_comment.html', context)

@login_required
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Verificar que el usuario sea el autor del comentario
    if comment.user != request.user:
        messages.error(request, 'No tienes permiso para eliminar este comentario.')
        return redirect('floresvalentin_app:product_detail', product_id=comment.product.id)
    
    product_id = comment.product.id
    
    if request.method == 'POST':
        comment.delete()
        messages.success(request, 'Tu comentario ha sido eliminado exitosamente.')
    
    return redirect('floresvalentin_app:product_detail', product_id=product_id)