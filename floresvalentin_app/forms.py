from django import forms
from django.contrib.auth.forms import UserChangeForm
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
