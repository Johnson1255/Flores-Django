from django import forms
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
# Import gettext_lazy for translations in forms/models
from django.utils.translation import gettext_lazy as _
# Import the new ContactMessage model
from .models import SpecialOrder, Profile, ContactMessage

class SpecialOrderForm(forms.ModelForm):
    class Meta:
        model = SpecialOrder
        # Include fields relevant to the form, exclude user and status initially
        exclude = ['user', 'status', 'created_at', 'updated_at']
        # Add widgets if needed for styling or date pickers, etc.
        widgets = {
            # Add Bootstrap classes for proper styling and alignment
            'occasion': forms.Select(attrs={'class': 'form-select'}), # Changed to Select to use model choices
            'budget': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}), # Changed to NumberInput for DecimalField
            'delivery_date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'delivery_time': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Mañana, Tarde, 14:00-16:00'}), # Added placeholder from image
            'message': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            'special_instructions': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            # Add widgets for other fields if needed, e.g., recipient fields
            'recipient_name': forms.TextInput(attrs={'class': 'form-control'}),
            'recipient_phone': forms.TextInput(attrs={'class': 'form-control'}),
            'delivery_address': forms.TextInput(attrs={'class': 'form-control'}),
            'delivery_city': forms.TextInput(attrs={'class': 'form-control'}),
            'delivery_postal_code': forms.TextInput(attrs={'class': 'form-control'}),
            # Widgets for product inclusion options (adjust if using different field types)
            'flower_types': forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'}), # Example, adjust class if needed
            'flower_colors': forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'}), # Example
            'chocolate_types': forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'}), # Example
            'plushie_type': forms.RadioSelect(attrs={'class': 'form-check-input'}), # Example
            'other_gifts': forms.Textarea(attrs={'rows': 2, 'class': 'form-control'}), # Example
        }

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
