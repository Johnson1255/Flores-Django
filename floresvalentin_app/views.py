import uuid
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
# Corrected model imports: Replaced Cart with ShoppingCart, removed CartItem and Coupon
from .models import Product, Category, Order, OrderItem, SpecialOrder, ShoppingCart
from .forms import SpecialOrderForm, ContactForm, ProfileForm, CheckoutForm # Assuming CheckoutForm exists

# Página principal
def index(request):
    featured_products = Product.objects.filter(featured=True)[:6]
    return render(request, 'floresvalentin_app/index.html', {
        'featured_products': featured_products
    })

# Catálogo y productos
def catalog(request):
    categories = Category.objects.all()
    products = Product.objects.all()
    
    # Filtrado básico
    category_id = request.GET.get('category')
    if category_id:
        products = products.filter(category_id=category_id)
    
    return render(request, 'floresvalentin_app/catalog.html', {
        'categories': categories,
        'products': products
    })

def catalog_api(request):
    # Para filtrado AJAX
    products = Product.objects.all()
    
    # Aplicar filtros si existen
    category_id = request.GET.get('category')
    price_min = request.GET.get('price_min')
    price_max = request.GET.get('price_max')
    
    if category_id:
        products = products.filter(category_id=category_id)
    if price_min:
        products = products.filter(price__gte=float(price_min))
    if price_max:
        products = products.filter(price__lte=float(price_max))
    
    # Convertir a JSON
    products_data = [{
        'id': str(p.id),
        'name': p.name,
        'price': float(p.price),
        'image_url': p.image.url if p.image else None,
        'url': f'/producto/{p.id}/'
    } for p in products]
    
    return JsonResponse({'products': products_data})

def product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    related_products = Product.objects.filter(category=product.category).exclude(id=product_id)[:4]
    
    return render(request, 'floresvalentin_app/product_detail.html', {
        'product': product,
        'related_products': related_products
    })

def product_detail_api(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    product_data = {
        'id': str(product.id),
        'name': product.name,
        'price': float(product.price),
        'description': product.description,
        'stock': product.stock,
        'category': product.category.name,
        'image_url': product.image.url if product.image else None,
    }
    
    return JsonResponse(product_data)

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
def cart_detail(request):
    cart = get_or_create_cart(request)
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

# Needs refactoring to use ShoppingCart.items JSONField
def cart_add(request, product_id):
    cart = get_or_create_cart(request)
    if not cart:
        # Handle case where user is not logged in or cart creation failed
        return redirect('login') # Or wherever appropriate

    product = get_object_or_404(Product, id=product_id)
    quantity = int(request.POST.get('quantity', 1))
    product_id_str = str(product.id)

    # Update JSONField
    if product_id_str in cart.items:
        cart.items[product_id_str]['quantity'] += quantity
    else:
        cart.items[product_id_str] = {
            'quantity': quantity,
            'price': float(product.price) # Store price at time of adding
        }
    cart.save()
    
    messages.success(request, f'{product.name} añadido al carrito')
    # Use the correct URL name from floresvalentin_app/urls.py
    return redirect('floresvalentin_app:ver_carrito')

# Needs refactoring to use ShoppingCart.items JSONField
def cart_update(request, item_id): # Changed parameter to item_id (which is product_id here)
    cart = get_or_create_cart(request)
    if not cart:
        return redirect('login')

    product_id_str = str(item_id) # item_id is the product UUID string
    quantity = int(request.POST.get('quantity', 0))

    if product_id_str in cart.items:
        if quantity > 0:
            cart.items[product_id_str]['quantity'] = quantity
            messages.success(request, 'Cantidad actualizada.')
        else:
            # If quantity is 0 or less, remove the item
            del cart.items[product_id_str]
            messages.success(request, 'Producto eliminado del carrito.')
        cart.save()
    else:
         messages.error(request, 'Producto no encontrado en el carrito.')

    return redirect('floresvalentin_app:ver_carrito')

# Needs refactoring to use ShoppingCart.items JSONField
def cart_remove(request, item_id): # Changed parameter to item_id
    cart = get_or_create_cart(request)
    if not cart:
        return redirect('login')

    product_id_str = str(item_id) # item_id is the product UUID string

    if product_id_str in cart.items:
        del cart.items[product_id_str]
        cart.save()
        messages.success(request, 'Producto eliminado del carrito.')
    else:
        messages.error(request, 'Producto no encontrado en el carrito.')

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
                 cart_subtotal += quantity * price

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
        else:
             # Form is invalid, re-render checkout page with errors
             cart = get_or_create_cart(request) # Need cart context again
             # Recalculate totals again for the template
             cart_subtotal = 0
             if cart and cart.items:
                 product_ids = cart.items.keys()
                 products = Product.objects.filter(id__in=product_ids)
                 products_dict = {str(p.id): p for p in products}
                 for product_id, item_data in cart.items.items():
                      product = products_dict.get(product_id)
                      if product:
                          quantity = item_data.get('quantity', 0)
                          price = item_data.get('price', float(product.price))
                          cart_subtotal += quantity * price
             cart_tax = cart_subtotal * 0.19
             cart_total = cart_subtotal + cart_tax

             messages.error(request, "Por favor corrige los errores en el formulario.")
             return render(request, 'floresvalentin_app/checkout.html', {
                 'cart': cart,
                 'form': form, # Pass invalid form back
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
def special_order_create(request):
    if request.method == 'POST':
        form = SpecialOrderForm(request.POST, request.FILES)
        if form.is_valid():
            special_order = form.save(commit=False)
            if request.user.is_authenticated:
                special_order.user = request.user
            special_order.save()
            return redirect('floresvalentin_app:special_order_thanks')
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
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Perfil actualizado correctamente')
            return redirect('floresvalentin_app:profile')
    else:
        form = ProfileForm(instance=request.user)
    
    return render(request, 'floresvalentin_app/profile_edit.html', {'form': form})

@login_required
def my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'floresvalentin_app/my_orders.html', {'orders': orders})

@login_required
def order_detail(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'floresvalentin_app/order_detail.html', {'order': order})

# Otras páginas
def contact(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            # Enviar correo o guardar mensaje
            messages.success(request, 'Tu mensaje ha sido enviado. Te contactaremos pronto.')
            return redirect('floresvalentin_app:contact')
    else:
        form = ContactForm()
    
    return render(request, 'floresvalentin_app/contact.html', {'form': form})

def gallery(request):
    return render(request, 'floresvalentin_app/gallery.html')

def location(request):
    return render(request, 'floresvalentin_app/location.html')
