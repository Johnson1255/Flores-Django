from django import forms
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Comment
# Import gettext_lazy for translations in forms/models
from django.utils.translation import gettext_lazy as _
# Import the new ContactMessage model
import json # Import json for handling the JSONField
from .models import SpecialOrder, Profile, ContactMessage, Product # Import Product model

class SpecialOrderForm(forms.ModelForm):
    # Define fields for product types - these are not directly in the model
    include_flowers = forms.BooleanField(
        label=_("Incluir Flores"),
        required=False,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    include_chocolates = forms.BooleanField(
        label=_("Incluir Chocolates"),
        required=False,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    include_plushies = forms.BooleanField(
        label=_("Incluir Peluches"),
        required=False,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    other_items = forms.CharField(
        label=_("Otros artículos o detalles"),
        required=False,
        widget=forms.Textarea(attrs={'rows': 3, 'class': 'form-control', 'placeholder': _('Especifique otros artículos o detalles aquí...')})
    )

    class Meta:
        model = SpecialOrder
        # Exclude the original 'products' field as we handle it manually
        exclude = ['user', 'status', 'created_at', 'updated_at', 'products']
        widgets = {
            # Basic Bootstrap classes
            'recipient_name': forms.TextInput(attrs={'class': 'form-control'}),
            'recipient_phone': forms.TextInput(attrs={'class': 'form-control'}),
            'delivery_address': forms.TextInput(attrs={'class': 'form-control'}),
            'delivery_city': forms.TextInput(attrs={'class': 'form-control'}),
            'delivery_postal_code': forms.TextInput(attrs={'class': 'form-control'}),
            'occasion': forms.Select(attrs={'class': 'form-select'}),
            'delivery_date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'delivery_time': forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Ej: Mañana, Tarde, 14:00-16:00')}),
            'budget': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'message': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            'special_instructions': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
        }
        # Add labels if needed, using gettext_lazy for translation
        labels = {
            'recipient_name': _("Nombre del destinatario"),
            'recipient_phone': _("Teléfono del destinatario"),
            'delivery_address': _("Dirección de entrega"),
            'delivery_city': _("Ciudad de entrega"),
            'delivery_postal_code': _("Código postal de entrega"),
            'occasion': _("Ocasión"),
            'delivery_date': _("Fecha de entrega"),
            'delivery_time': _("Hora de entrega"),
            'budget': _("Presupuesto"),
            'message': _("Mensaje para la tarjeta"),
            'special_instructions': _("Instrucciones especiales"),
        }

    def save(self, commit=True):
        # Get the instance but don't save it to DB yet (commit=False)
        instance = super().save(commit=False)

        # Prepare the data for the 'products' JSONField
        products_data = {
            'include_flowers': self.cleaned_data.get('include_flowers', False),
            'include_chocolates': self.cleaned_data.get('include_chocolates', False),
            'include_plushies': self.cleaned_data.get('include_plushies', False),
            'other_items': self.cleaned_data.get('other_items', '').strip(),
        }

        # Assign the dictionary (which will be serialized to JSON) to the instance's field
        instance.products = products_data # Django handles JSON serialization

        # Save the instance to the database if commit is True
        if commit:
            instance.save()
        return instance


# Replace the old ContactForm with a ModelForm for ContactMessage
class ContactMessageForm(forms.ModelForm):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'message'] # Fields to include in the form
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': _('Tu nombre completo')}),
            'email': forms.EmailInput(attrs={'placeholder': _('tu@correo.com')}),
            'message': forms.Textarea(attrs={'placeholder': _('Escribe tu mensaje aquí...')}), # Removed rows attribute
        }
        labels = {
            'name': _('Nombre'),
            'email': _('Correo Electrónico'),
            'message': _('Mensaje'),
        }

class ProfileForm(forms.ModelForm):
    # Fields needed for registration and profile editing
    # Mark choices for translation
    OCCASION_CHOICES = [
        ('cumpleanos', _('Cumpleaños')),
        ('aniversarios', _('Aniversarios')),
        ('bodas', _('Bodas')),
        ('condolencias', _('Condolencias')),
    ]
    preferences = forms.MultipleChoiceField(
        choices=OCCASION_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label=_("Ocasiones de interés (opcional)")
    )

    class Meta:
        model = Profile
        # Ensure all profile fields collected at registration are here
        fields = ['phone', 'country', 'city', 'neighborhood', 'address', 'postal_code', 'preferences', 'newsletter']
        widgets = { # Add widgets for consistency if needed
            'phone': forms.TextInput(attrs={'placeholder': _('Tu número de teléfono')}),
            'country': forms.TextInput(),
            'city': forms.TextInput(),
            'neighborhood': forms.TextInput(),
            'address': forms.TextInput(),
            'postal_code': forms.TextInput(),
            'newsletter': forms.CheckboxInput(),
        }
        labels = { # Add labels for clarity
            'phone': _("Teléfono"),
            'country': _("País"),
            'city': _("Ciudad"),
            'neighborhood': _("Barrio"),
            'address': _("Dirección de Entrega"),
            'postal_code': _("Código Postal"),
            'newsletter': _("Deseo recibir ofertas y novedades por correo electrónico"),
        }

# --- Product Management Form ---
class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        # Include fields needed for creation/editing via the frontend management tool
        fields = ['name', 'category', 'description', 'price', 'stock', 'available', 'image_url']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'description': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'stock': forms.NumberInput(attrs={'class': 'form-control'}),
            'available': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'image_url': forms.URLInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'name': _("Nombre del Producto"),
            'category': _("Categoría"),
            'description': _("Descripción"),
            'price': _("Precio (COP)"),
            'stock': _("Cantidad en Stock"),
            'available': _("Disponible para la venta"),
            'image_url': _("URL de Imagen"),
        }
        # Add help text or error messages if needed
        error_messages = {
            'name': {
                'required': _("El nombre del producto es obligatorio."),
            },
            'category': {
                'required': _("Debe seleccionar una categoría."),
            },
             'price': {
                'required': _("El precio es obligatorio."),
                'invalid': _("Ingrese un número válido para el precio."),
            },
             'stock': {
                'required': _("El stock es obligatorio."),
                 'invalid': _("Ingrese un número entero válido para el stock."),
            },
        }


# Basic Checkout Form - Add fields as needed for your checkout process
class CheckoutForm(forms.Form):
    # Example fields - match these with fields used in checkout_confirm view
    first_name = forms.CharField(max_length=100, required=True, label="Nombre")
    last_name = forms.CharField(max_length=100, required=True, label="Apellido")
    email = forms.EmailField(required=True, label="Correo Electrónico")
    phone = forms.CharField(max_length=20, required=False, label="Teléfono")
    address = forms.CharField(max_length=255, required=True, label="Dirección")
    city = forms.CharField(max_length=50, required=True, label="Ciudad")
    postal_code = forms.CharField(max_length=20, required=False, label="Código Postal")
    # Add payment fields if handling basic payment info (use cautiously)
    # e.g., card_number = forms.CharField(...)


# Custom Registration Form
class CustomUserCreationForm(UserCreationForm):
    # Add fields from the User model that aren't in UserCreationForm by default
    # Explicitly define widgets and use _() for labels and placeholders
    first_name = forms.CharField(
        max_length=30, required=True, label=_("Nombre"),
        widget=forms.TextInput(attrs={'placeholder': _('Tu nombre')})
    )
    last_name = forms.CharField(
        max_length=150, required=True, label=_("Apellidos"),
        widget=forms.TextInput(attrs={'placeholder': _('Tus apellidos')})
    )
    email = forms.EmailField(
        required=True, label=_("Correo Electrónico"),
        widget=forms.EmailInput(attrs={'placeholder': _('tu@correo.com')})
    )

    # REMOVE Profile fields from here - they will be handled by ProfileForm
    # phone = ...
    # country = ...
    # city = ...
    # neighborhood = ...
    # address = ...
    # postal_code = ...
    # preferences = ...
    # newsletter = ...

    # Add terms field here as it's related to User acceptance, not Profile data
    terms = forms.BooleanField(
        required=True,
        label=_("Acepto los términos y condiciones y la política de privacidad*"),
        error_messages={'required': _('Debes aceptar los términos y condiciones.')} # Add specific error message
    )


    class Meta(UserCreationForm.Meta):
        model = User
        # Define fields for User model ONLY
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email',) # Includes username, password1, password2

    # Remove the complex save method override - Profile saving will be handled in the view
    # def save(self, commit=True):
    #     ... (removed) ...

# Minimal Login Form for Debugging
class MinimalLoginForm(forms.Form):
    username = forms.CharField(max_length=150, required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)

# Formulario para edición de perfil combinado (User + Profile)
class UserProfileForm(forms.Form):
    first_name = forms.CharField(
        max_length=30, 
        required=True, 
        label=_("Nombre"),
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Tu nombre')})
    )
    last_name = forms.CharField(
        max_length=150, 
        required=True, 
        label=_("Apellidos"),
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Tus apellidos')})
    )
    email = forms.EmailField(
        required=True, 
        label=_("Correo Electrónico"),
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': _('tu@correo.com')})
    )
    username = forms.CharField(
        max_length=150, 
        required=True, 
        label=_("Nombre de Usuario"),
        widget=forms.TextInput(attrs={'class': 'form-control', 'readonly': 'readonly'})
    )
    
    # Campos del perfil
    phone = forms.CharField(
        max_length=20, 
        required=False, 
        label=_("Teléfono"),
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': _('Tu número de teléfono')})
    )
    country = forms.CharField(
        max_length=50, 
        required=False, 
        label=_("País"),
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    city = forms.CharField(
        max_length=50, 
        required=False, 
        label=_("Ciudad"),
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    neighborhood = forms.CharField(
        max_length=100, 
        required=False, 
        label=_("Barrio"),
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    address = forms.CharField(
        max_length=255, 
        required=False, 
        label=_("Dirección de Entrega"),
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    postal_code = forms.CharField(
        max_length=20, 
        required=False, 
        label=_("Código Postal"),
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    
    OCCASION_CHOICES = [
        ('cumpleanos', _('Cumpleaños')),
        ('aniversarios', _('Aniversarios')),
        ('bodas', _('Bodas')),
        ('condolencias', _('Condolencias')),
    ]
    preferences = forms.MultipleChoiceField(
        choices=OCCASION_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label=_("Ocasiones de interés (opcional)")
    )
    newsletter = forms.BooleanField(
        required=False,
        label=_("Deseo recibir ofertas y novedades por correo electrónico"),
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Si estamos editando un usuario existente, hacer el username de solo lectura
        if self.user and self.user.pk:
            self.fields['username'].widget.attrs['readonly'] = True
            
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            # Verificar que el email no exista para otro usuario
            if User.objects.filter(email=email).exclude(pk=self.user.pk).exists():
                raise forms.ValidationError(_("Este correo electrónico ya está registrado."))
        return email
    
    def clean_username(self):
        username = self.cleaned_data.get('username')
        # Si el campo es de solo lectura, devolvemos el valor del usuario actual
        if self.user and self.user.pk:
            return self.user.username
        
        # Si estamos permitiendo cambiar el username, verificamos que no exista
        if User.objects.filter(username=username).exclude(pk=self.user.pk if self.user else None).exists():
            raise forms.ValidationError(_("Este nombre de usuario ya está en uso."))
        return username
    
    def save(self):
        """Guarda los datos en los modelos User y Profile."""
        if not self.user:
            return None
        
        # Actualizamos el modelo User
        self.user.first_name = self.cleaned_data['first_name']
        self.user.last_name = self.cleaned_data['last_name']
        self.user.email = self.cleaned_data['email']
        self.user.save()
        
        # Actualizamos o creamos el Profile
        profile, created = Profile.objects.get_or_create(user=self.user)
        profile.phone = self.cleaned_data['phone']
        profile.country = self.cleaned_data['country']
        profile.city = self.cleaned_data['city']
        profile.neighborhood = self.cleaned_data['neighborhood']
        profile.address = self.cleaned_data['address']
        profile.postal_code = self.cleaned_data['postal_code']
        profile.preferences = self.cleaned_data['preferences']
        profile.newsletter = self.cleaned_data['newsletter']
        profile.save()
        
        return self.user

#Formulario de comentarios
class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'rows': 4, 
                'placeholder': 'Escribe tu comentario aquí...',
                'class': 'form-control'
            }),
        }
        labels = {
            'content': 'Comentario'
        }