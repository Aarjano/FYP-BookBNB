from mongoengine import Document, StringField, IntField, DecimalField, BooleanField, DateTimeField, ReferenceField, ListField, DictField, URLField, ObjectIdField
from django.utils import timezone
import uuid
from bson import ObjectId
from django.db import models
from django.contrib.auth.models import User

class Book(Document):
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    book_id = IntField(required=True, unique=True)
    title = StringField(required=True, max_length=200)
    author = StringField(required=True, max_length=200)
    description = StringField()
    isbn = StringField(required=True, max_length=13, unique=True)
    cover_image = URLField()
    publication_year = IntField()
    owner_id = IntField(required=True)  # Reference to Django User model
    available_for_rent = BooleanField(default=True)
    available_for_purchase = BooleanField(default=True)

    price_per_day = DecimalField(precision=2, min_value=0)
    price = DecimalField(precision=2, min_value=0)  # Added price for purchase

    category = StringField(max_length=100)
    language = StringField(max_length=50, default='English')
    condition = StringField(max_length=50, default='GOOD')
    tags = ListField(StringField(max_length=50))
    location = DictField()
    rating = DecimalField(precision=2, default=0.0)
    total_ratings = IntField(default=0)
    
    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)

    meta = {
        'collection': 'books',
        'indexes': [
            'title',
            'isbn',
            'category',
            'available_for_rent',
            'owner_id'
        ]
    }

    def __str__(self):
        return f"{self.title} by {self.author}"

class BookRental(Document):
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    rental_id = IntField(required=True, unique=True)
    book = ReferenceField(Book, required=True)
    renter_id = IntField(required=True)  # Reference to Django User model
    rental_start_date = DateTimeField(required=True)
    rental_end_date = DateTimeField(required=True)
    return_date = DateTimeField()
    status = StringField(default='PENDING')
    total_price = DecimalField(precision=2)
    owner_approval = BooleanField(default=False)
    
    rental_notes = StringField()
    condition_at_checkout = DictField()
    condition_at_return = DictField()
    extension_requests = ListField(DictField())
    payment_status = StringField(default='PENDING')
    payment_details = DictField()
    communication_history = ListField(DictField())
    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)

    meta = {
        'collection': 'book_rentals',
        'indexes': [
            'book',
            'renter_id',
            'status',
            'rental_start_date',
            'rental_end_date'
        ]
    }

    def __str__(self):
        return f"Rental of {self.book.title} by user {self.renter_id}"

class BookReview(Document):
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    review_id = IntField(required=True, unique=True)
    book = ReferenceField(Book, required=True)
    reviewer_id = IntField(required=True)  # Reference to Django User model
    rating = IntField(min_value=1, max_value=5)
    review_text = StringField()
    helpful_votes = IntField(default=0)
    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)
    reported = BooleanField(default=False)
    review_metadata = DictField()

    meta = {
        'collection': 'book_reviews',
        'indexes': [
            'book',
            'reviewer_id',
            'rating',
            'created_at'
        ]
    }

    def __str__(self):
        return f"Review for {self.book.title} by user {self.reviewer_id}"


class UserProfile(Document):
    _id = StringField(primary_key=True, default=lambda: str(ObjectId()))
    user_id = IntField(required=True, unique=True)
    username = StringField(required=True, unique=True)
    email = StringField(required=True, unique=True)
    first_name = StringField(default='')
    last_name = StringField(default='')
    location = DictField(default=dict)  # Store location data (city, state, coordinates)
    rating = DecimalField(precision=2, default=0.0)
    total_ratings = IntField(default=0)
    joined_date = DateTimeField(default=timezone.now)

    meta = {
        'collection': 'user_profiles',
        'indexes': [
            'user_id',
            'username',
            'email',
            'rating'
        ]
    }

    def __str__(self):
        return f"{self.username}'s profile"
    

class BookPurchase(Document):
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    purchase_id = IntField(required=True, unique=True)
    book = ReferenceField(Book, required=True)
    buyer_id = IntField(required=True)  # Reference to Django User model
    price = DecimalField(precision=2, required=True, min_value=0)
    status = StringField(default='PENDING')
    owner_approval = BooleanField(default=False)
    payment_status = StringField(default='PENDING', choices=['PENDING', 'COMPLETED', 'FAILED'])
    payment_details = DictField()
    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)

    meta = {
        'collection': 'book_purchases',
        'indexes': [
            'book',
            'buyer_id',
            'payment_status'
        ]
    }

    def __str__(self):
        return f"Purchase of {self.book.title} by user {self.buyer_id}"

class PaymentMethod(models.Model):
    PAYMENT_CHOICES = [
        ('esewa', 'eSewa'),
        ('khalti', 'Khalti'),
        ('imepay', 'IME Pay'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='payment_method')
    method = models.CharField(max_length=10, choices=PAYMENT_CHOICES)
    mobile_number = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_method_display()}"

    class Meta:
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'
