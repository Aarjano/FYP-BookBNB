from rest_framework import serializers
from .models import Book, BookRental, BookReview, BookPurchase
from users.serializers import UserProfileSerializer

class UserSerializer(serializers.Serializer):
    id = serializers.CharField()
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()

class BookSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id', read_only=True)  # Maps to MongoDB's _id field
    book_id = serializers.IntegerField( read_only=True)  # Custom integer ID
    title = serializers.CharField(max_length=200, required=True)
    author = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(allow_blank=True, required=False)
    isbn = serializers.CharField(max_length=13, required=True)
    cover_image = serializers.URLField(allow_blank=True, required=False)
    publication_year = serializers.IntegerField(allow_null=True, required=False)
    owner_id = serializers.IntegerField(read_only=True)  # Set owner_id as read-only
    available_for_rent = serializers.BooleanField(default=True)
    available_for_purchase = serializers.BooleanField(default=True)
    price_per_day = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)  # Price set from book
    category = serializers.CharField(max_length=100, allow_blank=True, required=False)
    language = serializers.CharField(max_length=50, default='English', required=False)
    condition = serializers.CharField(max_length=50, default='GOOD', required=False)
    tags = serializers.ListField(child=serializers.CharField(), default=list, required=False)
    location = serializers.DictField(default=dict, required=False)
    rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    total_ratings = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        # Ensure owner_id is set from the request context
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['owner_id'] = request.user.id
        else:
            raise serializers.ValidationError("Owner ID could not be determined.")
        
        # Generate a unique book_id if not provided
        if 'book_id' not in validated_data or validated_data['book_id'] is None:
            max_book = Book.objects.order_by('-book_id').first()
            validated_data['book_id'] = (max_book.book_id + 1) if max_book else 1
        
        return Book(**validated_data).save()

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class BookRentalSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id', read_only=True)  # Maps to MongoDB's _id field
    rental_id = serializers.IntegerField(read_only=True)  # Custom integer ID for rental
    book = BookSerializer(read_only=True)
    book_id = serializers.CharField(write_only=True)  # Reference to Book's _id
    renter_id = serializers.IntegerField(required=True)  # Changed to IntegerField
    rental_start_date = serializers.DateTimeField()
    rental_end_date = serializers.DateTimeField()
    actual_return_date = serializers.DateTimeField(allow_null=True, required=False)
    status = serializers.CharField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    owner_approval = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def validate(self, data):
        if data['rental_start_date'] >= data['rental_end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data

    def create(self, validated_data):
        book_id = validated_data.pop('book_id')
        try:
            book = Book.objects.get(_id=book_id)  # Use _id to query the Book
            if not book.available_for_rent:
                raise serializers.ValidationError("This book is not available for rent")
            validated_data['book'] = book
            validated_data['status'] = 'PENDING'
            
            # Generate a unique rental_id if not provided
            if 'rental_id' not in validated_data or validated_data['rental_id'] is None:
                max_rental = BookRental.objects.order_by('-rental_id').first()
                validated_data['rental_id'] = (max_rental.rental_id + 1) if max_rental else 1
            
            return BookRental.objects.create(**validated_data)
        except Book.DoesNotExist:
            raise serializers.ValidationError("Invalid book_id")

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
class BookReviewSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id', read_only=True)  # MongoDB _id
    review_id = serializers.IntegerField(read_only=True)  # Auto-generated integer ID
    book = BookSerializer(read_only=True)  # Serializer for the referenced Book
    book_id = serializers.CharField(write_only=True)  # Required when creating review
    reviewer_id = serializers.IntegerField(required=True)  # User ID
    rating = serializers.IntegerField(min_value=1, max_value=5)  # Consistent type
    review_text = serializers.CharField(allow_blank=True, required=False)
    helpful_votes = serializers.IntegerField(read_only=True, default=0)
    reported = serializers.BooleanField(read_only=True, default=False)
    review_metadata = serializers.DictField(read_only=True, default=dict)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        """Creates a new review and updates book rating."""
        book_id = validated_data.pop('book_id')

        # Ensure book exists
        try:
            book = Book.objects.get(_id=book_id)
        except Book.DoesNotExist:
            raise serializers.ValidationError({"book_id": "Invalid book ID"})

        # Assign book to validated data
        validated_data['book'] = book

        # Auto-generate review_id
        max_review = BookReview.objects.order_by('-review_id').first()
        validated_data['review_id'] = (max_review.review_id + 1) if max_review else 1

        # Create the review
        review = BookReview.objects.create(**validated_data)

        # Update book rating
        book_reviews = BookReview.objects.filter(book=book)
        total_ratings = book_reviews.count()
        avg_rating = sum(r.rating for r in book_reviews) / total_ratings if total_ratings > 0 else 0
        book.rating = round(avg_rating, 2)
        book.total_ratings = total_ratings
        book.save()

        return review

    def update(self, instance, validated_data):
        """Updates review data."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    

class BookPurchaseSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id', read_only=True)  # Maps to MongoDB's _id field
    purchase_id = serializers.IntegerField(read_only=True)  # Unique purchase ID
    book = BookSerializer(read_only=True)  # Returns full book details
    book_id = serializers.CharField(write_only=True)  # Reference to Book's _id
    buyer_id = serializers.IntegerField(required=True)  # Buyer user ID
    status = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)  # Price set from book
    owner_approval = serializers.BooleanField(read_only=True)
    payment_status = serializers.ChoiceField(choices=['PENDING', 'COMPLETED', 'FAILED'], default='PENDING')
    payment_details = serializers.DictField(required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        """Creates a new book purchase entry."""
        book_id = validated_data.pop('book_id')
        try:
            book = Book.objects.get(_id=book_id)  # Fetch book by _id
            
            # Ensure the book is available for purchase
            if not book.available_for_purchase:
                raise serializers.ValidationError({"book_id": "This book is not available for purchase"})

            validated_data['book'] = book
            validated_data['price'] = book.price  # Set price from book
            validated_data['owner_approval'] = False
            validated_data['payment_status'] = 'PENDING'

            # Generate a unique purchase_id if not provided
            max_purchase = BookPurchase.objects.order_by('-purchase_id').first()
            validated_data['purchase_id'] = (max_purchase.purchase_id + 1) if max_purchase else 1

            return BookPurchase.objects.create(**validated_data)
        except Book.DoesNotExist:
            raise serializers.ValidationError({"book_id": "Invalid book_id"})

    def update(self, instance, validated_data):
        """Updates an existing purchase entry."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
