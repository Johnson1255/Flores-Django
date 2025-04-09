"""
URL configuration for flores_django project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
"""
URL configuration for flores_django project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# Import views from the app
from floresvalentin_app import views as app_views
# Import built-in LogoutView
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Custom login/register URLs
    # Maps GET and POST requests for '/login/' to our custom view
    path('login/', app_views.login_register_view, name='login'),
    # Maps POST requests for '/register/' to our custom registration view
    path('register/', app_views.register, name='register'),
    # Uses Django's built-in LogoutView, redirecting to index after logout
    path('logout/', LogoutView.as_view(next_page='floresvalentin_app:index'), name='logout'),

    # Include other auth URLs (password reset, etc.) from django.contrib.auth.urls if needed.
    # This line provides URLs like /accounts/password_reset/, etc.
    # It's included *after* our custom 'login/' so ours takes precedence if there were overlap.
    # The default 'accounts/login/' from this include won't be used because we defined 'login/' above.
    path('accounts/', include('django.contrib.auth.urls')),

    # Include app-specific URLs (ensure this doesn't conflict with above)
    path('', include('floresvalentin_app.urls')), # Includes index, catalog, cart, etc.
]

# Configuración para servir archivos multimedia en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Add static files serving for development if not already handled
    # urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) # Only if needed and configured
