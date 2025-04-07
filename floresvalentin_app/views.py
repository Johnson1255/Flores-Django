import uuid
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Product, Category, Order, OrderItem, SpecialOrder, Cart, CartItem, Coupon
from .forms import SpecialOrderForm, ContactForm, ProfileForm, CheckoutForm

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
def get_or_create_cart(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
    else:
        cart_id = request.session.get('cart_id')
        if cart_id:
            try:
                cart = Cart.objects.get(id=cart_id)
            except Cart.DoesNotExist:
                cart = Cart.objects.create()
                request.session['cart_id'] = str(cart.id)
        else:
            cart = Cart.objects.create()
            request.session['cart_id'] = str(cart.id)
    return cart

def cart_detail(request):
    cart = get_or_create_cart(request)
    return render(request, 'floresvalentin_app/cart.html', {'cart': cart})

def cart_add(request, product_id):
    cart = get_or_create_cart(request)
    product = get_object_or_404(Product, id=product_id)
    quantity = int(request.POST.get('quantity', 1))
    
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity}
    )
    
    if not created:
        cart_item.quantity += quantity
        cart_item.save()
    
    messages.success(request, f'{product.name} añadido al carrito')
    return redirect('floresvalentin_app:ver_carrito')

def cart_update(request, product_id):
    cart = get_or_create_cart(request)
    product = get_object_or_404(Product, id=product_id)
    quantity = int(request.POST.get('quantity', 1))
    
    try:
        cart_item = CartItem.objects.get(cart=cart, product=product)
        cart_item.quantity = quantity
        cart_item.save()
    except CartItem.DoesNotExist:
        pass
    
    return redirect('floresvalentin_app:ver_carrito')

def cart_remove(request, product_id):
    cart = get_or_create_cart(request)
    product = get_object_or_404(Product, id=product_id)
    
    try:
        cart_item = CartItem.objects.get(cart=cart, product=product)
        cart_item.delete()
    except CartItem.DoesNotExist:
        pass
    
    return redirect('floresvalentin_app:ver_carrito')

def apply_coupon(request):
    if request.method == 'POST':
        coupon_code = request.POST.get('coupon_code')
        
        try:
            coupon = Coupon.objects.get(code=coupon_code, active=True)
            cart = get_or_create_cart(request)
            cart.coupon = coupon
            cart.save()
            messages.success(request, 'Cupón aplicado correctamente')
        except Coupon.DoesNotExist:
            messages.error(request, 'El cupón no es válido')
    
    return redirect('floresvalentin_app:ver_carrito')

# Proceso de compra
@login_required
def checkout(request):
    cart = get_or_create_cart(request)
    form = CheckoutForm(initial={
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'email': request.user.email,
    })
    
    return render(request, 'floresvalentin_app/checkout.html', {
        'cart': cart,
        'form': form
    })

@login_required
def checkout_confirm(request):
    if request.method == 'POST':
        form = CheckoutForm(request.POST)
        if form.is_valid():
            cart = get_or_create_cart(request)
            
            # Crear orden
            order = Order.objects.create(
                user=request.user,
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name'],
                email=form.cleaned_data['email'],
                address=form.cleaned_data['address'],
                postal_code=form.cleaned_data['postal_code'],
                city=form.cleaned_data['city'],
                phone=form.cleaned_data['phone'],
                total_price=cart.get_total_price(),
                coupon=cart.coupon
            )
            
            # Crear items de la orden
            for item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    price=item.product.price,
                    quantity=item.quantity
                )
            
            # Vaciar carrito
            cart.items.all().delete()
            cart.coupon = None
            cart.save()
            
            return redirect('floresvalentin_app:order_completed', order_id=order.id)
    else:
        form = CheckoutForm()
    
    return render(request, 'floresvalentin_app/checkout_confirm.html', {'form': form})

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