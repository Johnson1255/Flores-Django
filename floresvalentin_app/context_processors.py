from .models import ShoppingCart

def cart_context(request):
    """
    Adds cart information to the template context.
    """
    cart_item_count = 0
    if request.user.is_authenticated:
        cart, created = ShoppingCart.objects.get_or_create(user=request.user)
        if cart and cart.items:
            # Sum quantities from the JSONField
            cart_item_count = sum(item.get('quantity', 0) for item in cart.items.values())
    # else:
        # Handle anonymous user cart count if implemented (e.g., from session)
        # pass

    return {
        'cart_item_count': cart_item_count,
    }

def logrocket_context(request):
    user_data = {}
    if request.user.is_authenticated:
        user_data = {
            'user_id': request.user.id,
            'username': request.user.username,
            'is_staff': request.user.is_staff,
        }
    return {'logrocket_user_data': user_data}