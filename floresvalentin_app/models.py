import uuid
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _ # Import gettext_lazy

# Modelo para Categorías
class Category(models.Model):
    # Usamos un ID normal autoincremental aquí, pero podemos usar UUID
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=110, unique=True, blank=True, help_text="")

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"


# Modelo para Productos
class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL, # Si se borra la categoría, el producto no se borra, solo queda sin categoría
        null=True,
        blank=True,
        related_name='products' # Para acceder desde una categoría: category.products.all()
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True) # blank=True significa que no es requerido en formularios
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # Usamos ImageField para mejor manejo de archivos en Django
    image = models.ImageField(upload_to='products/', blank=True, null=True) # null=True permite valor NULL en DB
    stock = models.PositiveIntegerField(default=0) # PositiveIntegerField asegura >= 0
    available = models.BooleanField(default=True) # Campo útil para marcar si se muestra o no
    created_at = models.DateTimeField(auto_now_add=True) # Se establece al crear
    updated_at = models.DateTimeField(auto_now=True) # Se actualiza al guardar

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        from django.urls import reverse
        # Assumes 'product_detail' is the name of the URL pattern for product details
        # and it takes 'product_id' as an argument. Adjust if your URL name is different.
        return reverse('floresvalentin_app:product_detail', kwargs={'product_id': self.id})

    class Meta:
        ordering = ['name'] # Ordenar por nombre por defecto


# Modelo de Perfil de Usuario (extiende el User de Django)
class Profile(models.Model):
    # OneToOneField asegura que cada User tenga solo un Profile
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, # Referencia al modelo User activo
        on_delete=models.CASCADE, # Si se borra el User, se borra el Profile
        primary_key=True # Usa el ID del User como PK del Profile
    )
    # Los campos first_name y last_name ya están en el modelo User de Django
    phone = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=50, blank=True)
    neighborhood = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)

    preferences = models.JSONField(blank=True, null=True, default=list) # Almacena una lista Python

    newsletter = models.BooleanField(default=False)

    # Roles - Usamos choices para limitar las opciones
    ROLE_CHOICES = (
        ('user', 'Usuario'),
        ('admin', 'Administrador'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"

# Signal para crear/actualizar Profile automáticamente cuando se crea/actualiza User
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        profile = Profile.objects.create(user=instance)
    else:
        profile = instance.profile

    if profile.role == 'admin':
        instance.is_staff = True
    else:
        instance.is_staff = False
    instance.save()


# Modelo de Órdenes
class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('shipped', 'Enviado'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # Puede calcularse después
    # Puedes añadir campos de dirección de envío aquí si no están en el perfil
    # o si pueden ser diferentes por orden
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Orden {self.id} de {self.user.username}"

    class Meta:
        ordering = ['-created_at'] # Ordenar por fecha descendente


# Modelo de Items de Órdenes
class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='order_items', on_delete=models.SET_NULL, null=True) # No borrar item si se borra producto
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Precio al momento de la compra

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Producto eliminado'}"

    def get_cost(self):
        return self.price * self.quantity


# Modelo para Pedidos Especiales
class SpecialOrder(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('reviewing', 'En Revisión'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('in_progress', _('En Progreso')),
        ('completed', _('Completado')),
    )
    # Define choices for the occasion field, marked for translation
    OCCASION_CHOICES = [
        ('cumpleanos', _('Cumpleaños')),
        ('aniversario', _('Aniversario')),
        ('boda', _('Boda')),
        ('condolencias', _('Condolencias')),
        ('agradecimiento', _('Agradecimiento')),
        ('nacimiento', _('Nacimiento')),
        ('otro', _('Otro')),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_("Usuario"), on_delete=models.CASCADE)
    recipient_name = models.CharField(_("Nombre del destinatario"), max_length=150)
    recipient_phone = models.CharField(_("Teléfono del destinatario"), max_length=20, blank=True)
    delivery_address = models.CharField(_("Dirección de entrega"), max_length=255)
    delivery_city = models.CharField(_("Ciudad de entrega"), max_length=50)
    delivery_postal_code = models.CharField(_("Código postal de entrega"), max_length=20, blank=True)
    occasion = models.CharField(_("Ocasión"), max_length=100, choices=OCCASION_CHOICES, default='otro') # Use choices
    delivery_date = models.DateField(_("Fecha de entrega"))
    delivery_time = models.CharField(_("Hora de entrega"), max_length=50, blank=True) # Removed help_text
    budget = models.DecimalField(_("Presupuesto"), max_digits=10, decimal_places=2, null=True, blank=True)
    message = models.TextField(_("Mensaje para la tarjeta"), blank=True)
    special_instructions = models.TextField(_("Instrucciones especiales"), blank=True)
    # Almacenaremos la descripción de los productos deseados o IDs como JSON
    products = models.JSONField(_("Productos deseados"), blank=True, null=True, help_text=_("Descripción o lista de productos deseados"))
    status = models.CharField(_("Estado"), max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(_("Fecha de creación"), auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pedido especial {self.id} para {self.recipient_name} de {self.user.username}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = _("Pedido Especial")
        verbose_name_plural = _("Pedidos Especiales")


# Modelo para Carrito de Compras Persistente (Opcional)
# si no necesitas que el carrito persista entre dispositivos o sesiones largas.
class ShoppingCart(models.Model):
    # OneToOneField asegura un solo carrito por usuario
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True)
    # Items almacenados como JSON: { "product_uuid": {"quantity": Q, "price": P}, ... }
    items = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carrito de {self.user.username}"


# Modelo para Mensajes de Contacto
class ContactMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False) # Optional: track if message has been read

    def __str__(self):
        return f"Mensaje de {self.name} ({self.email}) el {self.submitted_at.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-submitted_at'] # Show newest messages first
        verbose_name = "Mensaje de Contacto"
        verbose_name_plural = "Mensajes de Contacto"
