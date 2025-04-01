from django.shortcuts import render
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Book, BookRental, BookReview,BookPurchase
from .serializers import BookSerializer, BookRentalSerializer, BookReviewSerializer,BookPurchaseSerializer
from mongoengine.queryset.visitor import Q
from rest_framework.filters import SearchFilter, OrderingFilter
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner_id == request.user.id  # Compare as integers

class MongoModelViewSet(viewsets.ViewSet):
    """
    Base viewset for MongoDB models.
    """
    serializer_class = None
    document_class = None
    
    def get_queryset(self):
        return self.document_class.objects.all()

    def get_object(self):
        try:
            pk = self.kwargs.get('pk')
            if not pk or pk == 'undefined':
                raise ValidationError("Invalid ID provided")
            return self.document_class.objects.get(_id=pk)  # Use _id for MongoDB
        except (self.document_class.DoesNotExist, ValidationError) as e:
            raise ValidationError(str(e))

    def list(self, request):
        try:
            queryset = self.get_queryset()
            serializer = self.serializer_class(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in list view: {str(e)}")
            return Response(
                {"error": "Failed to retrieve items"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if not serializer.is_valid():
            # Log the errors for debugging
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        try:
            instance = self.get_object()
            serializer = self.serializer_class(instance)
            return Response(serializer.data)
        except ValidationError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error in retrieve view: {str(e)}")
            return Response(
                {"error": "Failed to retrieve item"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, pk=None):
        try:
            instance = self.get_object()
            serializer = self.serializer_class(instance, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error in update view: {str(e)}")
            return Response(
                {"error": "Failed to update item"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, pk=None):
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error in destroy view: {str(e)}")
            return Response(
                {"error": "Failed to delete item"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save()

class BookViewSet(MongoModelViewSet):
    serializer_class = BookSerializer
    document_class = Book
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'author', 'description', 'category', 'tags']
    ordering_fields = ['title', 'publication_year', 'price_per_day', 'price','rating', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def perform_create(self, serializer):
        try:
            serializer.validated_data['owner_id'] = self.request.user.id  # Ensure owner_id is an integer
            serializer.save()
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}")
            raise ValidationError("Failed to create book")

    @action(detail=False, methods=['get'])
    def my_books(self, request):
        try:
            queryset = self.get_queryset().filter(owner_id=request.user.id)  # Ensure owner_id is an integer
            serializer = self.serializer_class(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in my_books: {str(e)}")
            return Response(
                {"error": "Failed to retrieve your books"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def available(self, request):
        try:
            logger.debug("Fetching available books for user: %s", request.user.id)
            queryset = self.get_queryset().filter(
                available_for_rent=True,
                available_for_purchase=True,
                owner_id__ne=request.user.id  # Compare as integers
            )
            logger.debug("Available books count: %d", queryset.count())
            serializer = self.serializer_class(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in available books: {str(e)}")
            return Response(
                {"error": "Failed to retrieve available books"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def request_rental(self, request, pk=None):
        try:
            logger.debug("Request data: %s", request.data)
            book = self.get_object()
            if not book.available_for_rent:
                return Response(
                    {"error": "This book is not available for rent."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if book.owner_id == request.user.id:
                return Response(
                    {"error": "You cannot rent your own book."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for existing rental requests from this user for this book
            existing_rentals = BookRental.objects.filter(
                book=str(book._id),
                renter_id=request.user.id,
                status__in=['PENDING', 'ACTIVE']
            )
            
            if existing_rentals.count() > 0:
                return Response(
                    {"error": "You already have a pending or active rental request for this book."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            rental_duration = int(request.data.get('rental_duration', 14))
            total_price = book.price_per_day * rental_duration
            
            rental_data = {
                'book_id': str(book._id),
                'renter_id': request.user.id,
                'rental_start_date': timezone.now(),
                'rental_end_date': timezone.now() + timedelta(days=rental_duration),
                'status': 'PENDING',
                'total_price': total_price
            }
            
            rental_serializer = BookRentalSerializer(data=rental_data)
            if rental_serializer.is_valid():
                rental_serializer.save()
                return Response(rental_serializer.data, status=status.HTTP_201_CREATED)
            logger.error("Validation errors: %s", rental_serializer.errors)
            return Response(rental_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error in request_rental: {str(e)}")
            return Response(
                {"error": "Failed to create rental request. Please try again later."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def request_purchase(self, request, pk=None):
        try:
            logger.debug("Request data: %s", request.data)
            book = self.get_object()
            if not book.available_for_purchase:
                return Response(
                    {"error": "This book is not available for purchase."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if book.owner_id == request.user.id:
                return Response(
                    {"error": "You cannot purchase your own book."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for existing purchase requests from this user for this book
            existing_purchases = BookPurchase.objects.filter(
                book=str(book._id),
                buyer_id=request.user.id,
                status__in=['PENDING', 'COMPLETED']
            )
            
            if existing_purchases.count() > 0:
                return Response(
                    {"error": "You already have a pending or completed purchase request for this book."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            purchase_data = {
                'book_id': str(book._id),
                'buyer_id': request.user.id,
                'purchase_date': timezone.now(),
                'status': 'PENDING',
                'price': book.price
            }
            
            purchase_serializer = BookPurchaseSerializer(data=purchase_data)
            if purchase_serializer.is_valid():
                purchase_serializer.save()
                return Response(purchase_serializer.data, status=status.HTTP_201_CREATED)
            logger.error("Validation errors: %s", purchase_serializer.errors)
            return Response(purchase_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error in request_purchase: {str(e)}")
            return Response(
                {"error": "Failed to create purchase request. Please try again later."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BookRentalViewSet(MongoModelViewSet):
    serializer_class = BookRentalSerializer
    document_class = BookRental
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.request.user.id
        
        # Get rentals where user is the renter
        renter_rentals = self.document_class.objects.filter(renter_id=user_id)
        
        # For owner rentals, we need a two-step process
        # Step 1: Get all books owned by the user
        owned_books = Book.objects.filter(owner_id=user_id)
        owned_book_ids = [book._id for book in owned_books]
        
        # Step 2: Get rentals for those books
        owner_rentals = self.document_class.objects.filter(book__in=owned_book_ids)
        
        # Combine the two querysets
        try:
            # Try union if supported
            return renter_rentals | owner_rentals
        except Exception:
            # Alternative: Get all rental IDs and fetch them in a new query
            renter_ids = [str(rental.rental_id) for rental in renter_rentals]  # Use rental_id
            owner_ids = [str(rental.rental_id) for rental in owner_rentals]   # Use rental_id
            all_ids = list(set(renter_ids + owner_ids))  # Remove duplicates
            return self.document_class.objects.filter(rental_id__in=all_ids)  # Use rental_id

    @action(detail=True, methods=['post'])
    def approve_rental(self, request, pk=None):
        try:
            rental = self.get_object()

            if rental.book.owner_id != request.user.id:
                return Response({'error': 'Only the book owner can approve rentals'},
                                status=status.HTTP_403_FORBIDDEN)

            if rental.status != 'PENDING':
                return Response({'error': 'This rental cannot be approved'},
                                status=status.HTTP_400_BAD_REQUEST)

            # Update the rental status
            rental.status = 'ACTIVE'
            rental.owner_approval = True
            rental.save()

            # Update the book's availability
            book = rental.book
            book.available_for_rent = False
            book.available_for_purchase = False
            book.save()

            # Reject all other pending rentals for this book
            other_pending_rentals = BookRental.objects.filter(
                book=str(book._id),
                status='PENDING',
                _id__ne=rental._id  # Exclude the current rental
            )
            
            for pending_rental in other_pending_rentals:
                pending_rental.status = 'REJECTED'
                pending_rental.owner_approval = False
                pending_rental.save()
                
            # Also reject any pending purchase requests for this book
            pending_purchases = BookPurchase.objects.filter(
                book=str(book._id),
                status='PENDING'
            )
            
            for pending_purchase in pending_purchases:
                pending_purchase.status = 'REJECTED'
                pending_purchase.owner_approval = False
                pending_purchase.save()

            serializer = self.serializer_class(rental)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error in approve_rental: {str(e)}")
            return Response({"error": "Failed to approve rental"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reject_rental(self, request, pk=None):
        try:
            rental = self.get_object()

            if rental.book.owner_id != request.user.id:
                return Response({'error': 'Only the book owner can reject rentals'},
                                status=status.HTTP_403_FORBIDDEN)

            if rental.status != 'PENDING':
                return Response({'error': 'This rental cannot be rejected'},
                                status=status.HTTP_400_BAD_REQUEST)

            rental.status = 'REJECTED'
            rental.owner_approval = False
            rental.save()

            serializer = self.serializer_class(rental)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error in reject_rental: {str(e)}")
            return Response({"error": "Failed to reject rental"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        try:
            rental = self.get_object()
            
            if rental.status != 'ACTIVE':
                return Response(
                    {'error': 'This rental cannot be returned'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if rental.renter_id != request.user.id:  # Compare as integers
                return Response(
                    {'error': 'Only the renter can return the book'},
                    status=status.HTTP_403_FORBIDDEN
                )

            rental.return_date = timezone.now()
            rental.status = 'RETURNED'
            rental.save()

            # Update book availability
            book = rental.book  # ✅ Fix: Directly access the ReferenceField
            book.available_for_rent = True
            book.available_for_purchase = True
            book.save()

            serializer = self.serializer_class(rental)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in return_book: {str(e)}")
            return Response(
                {"error": "Failed to return book"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def my_rentals(self, request):
        try:
            rentals = self.get_queryset().filter(renter_id=request.user.id)  # Compare as integers
            serializer = self.serializer_class(rentals, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in my_rentals: {str(e)}")
            return Response(
                {"error": "Failed to retrieve your rentals"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def rental_requests(self, request):
        try:
            # Step 1: Retrieve the books owned by the user
            owned_books = Book.objects.filter(owner_id=request.user.id)
            
            # Convert book _id values to ObjectId if they're not already
            from bson import ObjectId
            owned_book_ids = []
            for book in owned_books:
                if isinstance(book._id, ObjectId):
                    owned_book_ids.append(book._id)
                else:
                    try:
                        owned_book_ids.append(ObjectId(book._id))
                    except:
                        owned_book_ids.append(book._id)  # Keep as is if conversion fails
            
            logger.debug("Owned book IDs: %s", owned_book_ids)

            # Step 2: Filter rentals based on the owned book IDs
            rentals = BookRental.objects.filter(
                book__in=owned_book_ids,
                status='PENDING'
            )

            print("Pending rentals: %s", rentals)

            # Step 3: Group rentals by book and include all rental details
            rental_data = {}
            for rental in rentals:
                book_id = str(rental.book._id)  # Use book's _id
                if book_id not in rental_data:
                    rental_data[book_id] = {
                        'book_id': book_id,
                        'rentals': []
                    }
                rental_data[book_id]['rentals'].append({
                    'rental_id': str(rental._id),  # Include rental_id
                    'renter_id': rental.renter_id,  # Include renter_id
                    'status': rental.status,  # Include status
                    'rental_start_date': rental.rental_start_date,
                    'rental_end_date': rental.rental_end_date,
                    'total_price': rental.total_price
                })

            logger.debug("Rental data: %s", rental_data)
            print("Rental data: %s", list(rental_data.values()))        

            return Response(list(rental_data.values()))
        except Exception as e:
            logger.error(f"Error in rental_requests: {str(e)}")
            return Response(
                {"error": "Failed to retrieve rental requests"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        try:
            active_rentals = self.get_queryset().filter(status='ACTIVE', renter_id=request.user.id)
            serializer = self.serializer_class(active_rentals, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in active rentals: {str(e)}")
            return Response(
                {"error": "Failed to retrieve active rentals"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        try:
            overdue_rentals = self.get_queryset().filter(
                status='ACTIVE',
                return_date__lt=timezone.now()
            )
            serializer = self.serializer_class(overdue_rentals, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in overdue rentals: {str(e)}")
            return Response(
                {"error": "Failed to retrieve overdue rentals"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class BookReviewViewSet(MongoModelViewSet):
    serializer_class = BookReviewSerializer
    document_class = BookReview
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Retrieve reviews for the current user or filter by book_id."""
        user_id = self.request.user.id
        queryset = self.document_class.objects

        # Filter by book_id if provided
        book_id = self.request.query_params.get("book_id")
        if book_id:
            book = Book.objects.get(_id=book_id)  # Fetch the Book document
            queryset = queryset.filter(book=book)  # Filter by the book reference

        return queryset

    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Returns reviews of the authenticated user."""
        try:
            reviews = self.get_queryset()
            serializer = self.serializer_class(reviews, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in my_reviews: {str(e)}")
            return Response(
                {"error": "Failed to retrieve your reviews"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BookPurchaseViewSet(MongoModelViewSet):
    serializer_class = BookPurchaseSerializer
    document_class = BookPurchase
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.request.user.id

        # Purchases made by the user
        buyer_purchases = self.document_class.objects.filter(buyer_id=user_id)

        # Books sold by the user
        owned_books = Book.objects.filter(owner_id=user_id)
        owned_book_ids = [book._id for book in owned_books]
        seller_purchases = self.document_class.objects.filter(book__in=owned_book_ids)

        try:
            return buyer_purchases | seller_purchases
        except Exception:
            all_ids = list(set([str(purchase.purchase_id) for purchase in buyer_purchases] +
                               [str(purchase.purchase_id) for purchase in seller_purchases]))
            return self.document_class.objects.filter(purchase_id__in=all_ids)


    @action(detail=True, methods=['post'])
    def approve_purchase(self, request, pk=None):
        try:
            purchase = self.get_object()
            if purchase.book.owner_id != request.user.id:
                return Response({'error': 'Only the book owner can approve purchases'},
                                status=status.HTTP_403_FORBIDDEN)

            if purchase.status != 'PENDING':
                return Response({'error': 'This purchase cannot be approved'},
                                status=status.HTTP_400_BAD_REQUEST)

            purchase.status = 'COMPLETED'
            purchase.owner_approval = True
            purchase.save()

            # Mark book as sold
            book = purchase.book
            book.available_for_purchase = False
            book.available_for_rent = False
            book.save()
            
            # Reject all other pending purchase requests for this book
            other_pending_purchases = BookPurchase.objects.filter(
                book=str(book._id),
                status='PENDING',
                _id__ne=purchase._id  # Exclude the current purchase
            )
            
            for pending_purchase in other_pending_purchases:
                pending_purchase.status = 'REJECTED'
                pending_purchase.owner_approval = False
                pending_purchase.save()
                
            # Also reject any pending rental requests for this book
            pending_rentals = BookRental.objects.filter(
                book=str(book._id),
                status='PENDING'
            )
            
            for pending_rental in pending_rentals:
                pending_rental.status = 'REJECTED'
                pending_rental.owner_approval = False
                pending_rental.save()

            serializer = self.serializer_class(purchase)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in approve_purchase: {str(e)}")
            return Response({'error': 'Failed to approve purchase'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reject_purchase(self, request, pk=None):
        try:
            purchase = self.get_object()
            if purchase.book.owner_id != request.user.id:
                return Response({'error': 'Only the book owner can reject purchases'},
                                status=status.HTTP_403_FORBIDDEN)

            if purchase.status != 'PENDING':
                return Response({'error': 'This purchase cannot be rejected'},
                                status=status.HTTP_400_BAD_REQUEST)

            purchase.status = 'REJECTED'
            purchase.owner_approval = False
            purchase.save()

            serializer = self.serializer_class(purchase)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in reject_purchase: {str(e)}")
            return Response({'error': 'Failed to reject purchase'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def my_purchases(self, request):
        try:
            purchases = self.get_queryset().filter(buyer_id=request.user.id)
            serializer = self.serializer_class(purchases, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in my_purchases: {str(e)}")
            return Response({'error': 'Failed to retrieve your purchases'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def purchase_requests(self, request):
        try:
            owned_books = Book.objects.filter(owner_id=request.user.id)
            owned_book_ids = [book._id for book in owned_books]
            pending_purchases = BookPurchase.objects.filter(book__in=owned_book_ids, status='PENDING')

            purchase_data = {}
            for purchase in pending_purchases:
                book_id = str(purchase.book._id)
                if book_id not in purchase_data:
                    purchase_data[book_id] = {'book_id': book_id, 'purchases': []}
                purchase_data[book_id]['purchases'].append({
                    'purchase_id': str(purchase._id),
                    'buyer_id': purchase.buyer_id,
                    'status': purchase.status,
                    'price': purchase.price
                })

            return Response(list(purchase_data.values()))
        except Exception as e:
            logger.error(f"Error in purchase_requests: {str(e)}")
            return Response({'error': 'Failed to retrieve purchase requests'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
