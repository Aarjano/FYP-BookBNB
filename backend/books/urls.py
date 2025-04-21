from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import BookViewSet, BookRentalViewSet, BookReviewViewSet, BookPurchaseViewSet, PaymentMethodViewSet, get_user_details

# Create a router for the main endpoints
router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')
router.register(r'rentals', BookRentalViewSet, basename='rental')
router.register(r'reviews', BookReviewViewSet, basename='review')
router.register(r'purchases', BookPurchaseViewSet, basename='purchase')
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-method')

urlpatterns = [
    path('', include(router.urls)),
    path('users/<int:user_id>/', get_user_details, name='get_user_details'),
] 