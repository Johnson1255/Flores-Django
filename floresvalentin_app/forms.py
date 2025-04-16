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
    # You might want to customize which fields are editable
    class Meta:
        model = Profile
        fields = ['phone', 'country', 'city', 'neighborhood', 'address', 'postal_code', 'preferences', 'newsletter']

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

    # Add fields from the Profile model with explicit widgets and use _()
    phone = forms.CharField(
        max_length=20, required=True, label=_("Teléfono"),
        widget=forms.TextInput(attrs={'placeholder': _('Tu número de teléfono')})
    )
    country = forms.CharField(max_length=50, required=True, label=_("País"))
    city = forms.CharField(max_length=50, required=True, label=_("Ciudad"))
    neighborhood = forms.CharField(max_length=100, required=True, label=_("Barrio"))
    address = forms.CharField(max_length=255, required=True, label=_("Dirección de Entrega"))
    postal_code = forms.CharField(max_length=20, required=True, label=_("Código Postal"))

    # For preferences (JSONField storing a list), use MultipleChoiceField with checkboxes
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

    newsletter = forms.BooleanField(required=False, label=_("Deseo recibir ofertas y novedades por correo electrónico"))
    terms = forms.BooleanField(required=True, label=_("Acepto los términos y condiciones y la política de privacidad*"))

    class Meta(UserCreationForm.Meta):
        model = User
        # Fields from UserCreationForm + added User fields
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email',)

    def save(self, commit=True):
        user = super().save(commit=False) # Save User instance but don't commit yet
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.email = self.cleaned_data["email"]
        # Note: UserCreationForm sets username based on email if not provided,
        # or you might want username = email explicitly if your model requires it.

        if commit:
            user.save() # Save the User instance
            # Profile is created automatically by the signal in models.py
            profile = user.profile # Access the related profile
            profile.phone = self.cleaned_data["phone"]
            profile.country = self.cleaned_data["country"]
            profile.city = self.cleaned_data["city"]
            profile.neighborhood = self.cleaned_data["neighborhood"]
            profile.address = self.cleaned_data["address"]
            profile.postal_code = self.cleaned_data["postal_code"]
            profile.preferences = self.cleaned_data["preferences"] # This will be a list
            profile.newsletter = self.cleaned_data["newsletter"]
            profile.save() # Save the Profile instance
        return user

# Minimal Login Form for Debugging
class MinimalLoginForm(forms.Form):
    username = forms.CharField(max_length=150, required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)
