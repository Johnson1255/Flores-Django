from django.contrib import admin
from .models import Category, Product, Order, OrderItem, SpecialOrder, Profile, ShoppingCart, ContactMessage

# Basic registration for models to appear in admin

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'available', 'created_at')
    list_filter = ('available', 'category', 'created_at')
    list_editable = ('price', 'stock', 'available')
    search_fields = ('name', 'description')
    # prepopulated_fields = {'slug': ('name',)} # Product model does not have a slug field

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    raw_id_fields = ['product'] # Use raw_id_fields for better performance with many products
    extra = 0 # Don't show extra empty forms

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'user__username', 'user__email') # Search by user fields
    inlines = [OrderItemInline]

@admin.register(SpecialOrder)
class SpecialOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'recipient_name', 'occasion', 'delivery_date', 'status', 'created_at')
    list_filter = ('status', 'occasion', 'delivery_date', 'created_at')
    search_fields = ('id', 'user__username', 'recipient_name', 'delivery_address')
    # Make user field searchable and linkable
    raw_id_fields = ['user']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'city', 'role', 'newsletter')
    search_fields = ('user__username', 'user__email', 'phone', 'city')
    list_filter = ('role', 'newsletter', 'city', 'country')

@admin.register(ShoppingCart)
class ShoppingCartAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    search_fields = ('user__username',)

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'submitted_at', 'is_read')
    list_filter = ('is_read', 'submitted_at')
    search_fields = ('name', 'email', 'message')
    list_editable = ('is_read',) # Allow marking as read directly in the list view

# If you only wanted to register SpecialOrder initially:
# from django.contrib import admin
# from .models import SpecialOrder
#
# admin.site.register(SpecialOrder)
