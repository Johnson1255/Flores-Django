from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth.models import User
from .models import SpecialOrder, Profile

class SpecialOrderForm(forms.ModelForm):
    class Meta:
        model = SpecialOrder
        # Include fields relevant to the form, exclude user and status initially
        exclude = ['user', 'status', 'created_at', 'updated_at']
        # Add widgets if needed for styling or date pickers, etc.
        widgets = {
            'delivery_date': forms.DateInput(attrs={'type': 'date'}),
            'message': forms.Textarea(attrs={'rows': 3}),
            'special_instructions': forms.Textarea(attrs={'rows': 3}),
            # Add widgets for JSON fields if you want specific inputs
            # 'products': forms.Textarea(attrs={'rows': 3}),
        }

class ContactForm(forms.Form):
    name = forms.CharField(max_length=100, required=True, label="Nombre")
    email = forms.EmailField(required=True, label="Correo Electrónico")
    subject = forms.CharField(max_length=150, required=True, label="Asunto")
    message = forms.CharField(widget=forms.Textarea, required=True, label="Mensaje")

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
    # Explicitly define widgets
    first_name = forms.CharField(
        max_length=30, required=True, label="Nombre",
        widget=forms.TextInput(attrs={'placeholder': 'Tu nombre'}) # Example placeholder
    )
    last_name = forms.CharField(
        max_length=150, required=True, label="Apellidos",
        widget=forms.TextInput(attrs={'placeholder': 'Tus apellidos'})
    )
    email = forms.EmailField(
        required=True, label="Correo Electrónico",
        widget=forms.EmailInput(attrs={'placeholder': 'tu@correo.com'})
    )

    # Add fields from the Profile model with explicit widgets
    phone = forms.CharField(
        max_length=20, required=True, label="Teléfono",
        widget=forms.TextInput(attrs={'placeholder': 'Tu número de teléfono'})
    )
    country = forms.CharField(max_length=50, required=True, label="País")
    city = forms.CharField(max_length=50, required=True, label="Ciudad")
    neighborhood = forms.CharField(max_length=100, required=True, label="Barrio")
    address = forms.CharField(max_length=255, required=True, label="Dirección de Entrega")
    postal_code = forms.CharField(max_length=20, required=True, label="Código Postal")

    # For preferences (JSONField storing a list), use MultipleChoiceField with checkboxes
    OCCASION_CHOICES = [
        ('cumpleanos', 'Cumpleaños'),
        ('aniversarios', 'Aniversarios'),
        ('bodas', 'Bodas'),
        ('condolencias', 'Condolencias'),
    ]
    preferences = forms.MultipleChoiceField(
        choices=OCCASION_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Ocasiones de interés (opcional)"
    )

    newsletter = forms.BooleanField(required=False, label="Deseo recibir ofertas y novedades por correo electrónico")
    terms = forms.BooleanField(required=True, label="Acepto los términos y condiciones y la política de privacidad*")

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
