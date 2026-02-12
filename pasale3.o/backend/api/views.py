from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.mail import send_mail
import random
from .models import Customer, ForgetPasswordOTP, Party, Product, Supplier, UserProfile, Expense, Billing, BillingItem, example
from .serializers import ProductSerializer, PartySerializer, CustomerSerializer, SupplierSerializer, ExpenseSerializer, BillingSerializer, BillingItemSerializer, exampleSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from .tasks import send_otp_email

# OTP Expiry Time (5 minutes)
OTP_EXPIRY_TIME = timedelta(minutes=5)

# Inactivity period after which a party is considered inactive (e.g., 90 days)
PARTY_INACTIVITY_PERIOD = timedelta(days=90)

# -----------------------------
# Signup View
# -----------------------------


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email', '').lower()
        password = request.data.get('password')
        phone_no = request.data.get('phone_no')
        business_name = request.data.get('business_name')

        # Create the user
        user = User.objects.create_user(
            username=username, email=email, password=password)
        user.save()

        # Generate OTP
        otp = str(random.randint(100000, 999999))

        # Create the user profile with OTP and timestamp
        user_profile = UserProfile.objects.create(
            user=user,
            phone_no=phone_no,
            business_name=business_name,
            otp=otp,
            otp_created_at=timezone.now(),
            is_verify=False
        )

        # Send OTP to the user's email
        send_otp_email.delay(email, otp)

        return Response({'message': 'User created successfully. Please verify the OTP sent to your email.'},
                        status=status.HTTP_201_CREATED)


# -----------------------------
# Verify Signup OTP View
# -----------------------------
class VerifySignupOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp_provided = request.data.get('otp', '').strip()

        try:
            user = User.objects.get(email=email.lower())
            user_profile = user.profile
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check OTP expiry
        if not user_profile.otp or not user_profile.otp_created_at:
            return Response({'error': 'No OTP found'}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > user_profile.otp_created_at + OTP_EXPIRY_TIME:
            return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        if str(user_profile.otp) == str(otp_provided):
            user_profile.is_verify = True
            user_profile.otp = None
            user_profile.otp_created_at = None
            user_profile.save()
            return Response({'message': 'Signup OTP verified successfully!'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Login View
# -----------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
            if not user.check_password(password):
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Generate OTP
        otp = str(random.randint(100000, 999999))

        # Save OTP in user profile with timestamp
        user_profile = user.profile
        user_profile.otp = otp
        user_profile.otp_created_at = timezone.now()
        user_profile.save()

        # Send OTP to the user's email
        send_otp_email.delay(email, otp)
        return Response({'message': 'OTP sent to your email. Please verify to proceed.'},
                        status=status.HTTP_200_OK)


# -----------------------------
# Verify Login OTP View
# -----------------------------
class VerifyLoginOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp_provided = request.data.get('otp', '').strip()

        try:
            user = User.objects.get(email=email)
            user_profile = user.profile
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check OTP expiry
        if not user_profile.otp or not user_profile.otp_created_at:
            return Response({'error': 'No OTP found'}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > user_profile.otp_created_at + OTP_EXPIRY_TIME:
            return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        if str(user_profile.otp) == str(otp_provided):
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Clear OTP after successful verification
            user_profile.otp = None
            user_profile.otp_created_at = None
            user_profile.save()

            return Response({
                'message': 'Login OTP verified successfully!',
                'refresh': str(refresh),
                'access': access_token
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Product API View
# -----------------------------
class ApiProductView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        paginator = PageNumberPagination()
        paginator.page_size = 10
        products = Product.objects.filter(user=request.user)
        result_page = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs):
        product_data = request.data.copy()
        product_data['user'] = request.user.id

        if Product.objects.filter(user=request.user, product_name=product_data['product_name']).exists():
            return Response({'error': 'You already have a product with this name.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProductSerializer(data=product_data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Product created successfully!',
                             'product': serializer.data}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, *args, **kwargs):
        # Get the product ID from the query parameters
        product_id = request.query_params.get('id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convert product_id to an integer
            product_id = int(product_id)

            # Ensure the product exists and belongs to the authenticated user
            product = Product.objects.get(id=product_id, user=request.user)
        except ValueError:
            return Response({'error': 'Invalid Product ID'}, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found or you do not have permission to edit it.'}, status=status.HTTP_404_NOT_FOUND)

        # Update the product with the provided data
        # Use partial=True for partial updates
        serializer = ProductSerializer(
            product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Product updated successfully!',
                             'product': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        # Get the product ID from the query parameters
        product_id = request.query_params.get('id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Ensure the product belongs to the user
            product = Product.objects.get(id=product_id, user=request.user)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found or you do not have permission to delete it.'}, status=status.HTTP_404_NOT_FOUND)

        product.delete()
        return Response({'message': 'Product deleted successfully!'}, status=status.HTTP_200_OK)


class ApiPartyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        party_id = request.query_params.get('id')
        category_type = request.query_params.get('category_type')

        if party_id:
            try:
                party = Party.objects.get(id=party_id)
                serializer = PartySerializer(party)
                # Include related customer/supplier data
                response_data = serializer.data
                if hasattr(party, 'Customer'):
                    response_data['customer'] = CustomerSerializer(
                        party.Customer).data
                elif hasattr(party, 'Supplier'):
                    response_data['supplier'] = SupplierSerializer(
                        party.Supplier).data
                return Response(response_data, status=status.HTTP_200_OK)
            except Party.DoesNotExist:
                return Response({'error': 'Party not found'}, status=status.HTTP_404_NOT_FOUND)

        # Filter by category type if provided
        if category_type:
            parties = Party.objects.filter(Category_type=category_type)
        else:
            parties = Party.objects.all()

        paginator = PageNumberPagination()
        paginator.page_size = 10
        result_page = paginator.paginate_queryset(parties, request)
        serializer = PartySerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs):
        data = request.data
        category = data.get('Category_type')

        # Validate category type
        if category not in ['Customer', 'Supplier']:
            return Response({"error": "Invalid Category. Must be 'Customer' or 'Supplier'"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Check if Customer already exists
        if category == 'Customer':
            name = data.get('name')
            email = data.get('email')
            phone_no = data.get('phone_no')
            customer_code = data.get('Customer_code')

            # Build filter conditions for duplicate check
            existing_customer = None

            # Check by email if provided
            if email:
                existing_customer = Customer.objects.filter(
                    email=email).first()
                if existing_customer:
                    return Response({
                        'error': 'A customer with this email already exists.',
                        'existing_customer': CustomerSerializer(existing_customer).data
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Check by phone number if provided
            if phone_no:
                existing_customer = Customer.objects.filter(
                    phone_no=phone_no).first()
                if existing_customer:
                    return Response({
                        'error': 'A customer with this phone number already exists.',
                        'existing_customer': CustomerSerializer(existing_customer).data
                    }, status=status.HTTP_400_BAD_REQUEST)

            if customer_code:
                existing_customer = Customer.objects.filter(
                    Customer_code=customer_code).first()
                if existing_customer:
                    return Response({
                        'error': 'A customer with this Customer code already exists.',
                        'existing_customer': CustomerSerializer(existing_customer).data
                    }, status=status.HTTP_400_BAD_REQUEST)

        # Check if Supplier already exists
        elif category == 'Supplier':
            name = data.get('name')
            code = data.get('code')

            # Check by code (unique identifier for supplier)
            if code:
                existing_supplier = Supplier.objects.filter(code=code).first()
                if existing_supplier:
                    return Response({
                        'error': 'A supplier with this code already exists.',
                        'existing_supplier': SupplierSerializer(existing_supplier).data
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Check by name
            if name:
                existing_supplier = Supplier.objects.filter(
                    name=name).first()
                if existing_supplier:
                    return Response({
                        'error': 'A supplier with this name already exists.',
                        'existing_supplier': SupplierSerializer(existing_supplier).data
                    }, status=status.HTTP_400_BAD_REQUEST)

        # Open an atomic transaction
        with transaction.atomic():
            # Create the Party object first
            party = Party.objects.create(
                Category_type=category,
                is_active=data.get('is_active', True)
            )

            # Branching Logic based on the Category
            if category == 'Customer':
                customer = Customer.objects.create(
                    party=party,
                    name=data.get('name'),
                    Customer_code=data.get('Customer_code'),
                    email=data.get('email'),
                    phone_no=data.get('phone_no'),
                    address=data.get('address'),
                    open_balance=data.get('open_balance', 0.0),
                    credit_limmit=data.get('credit_limmit', 0.0),
                    preferred_payment_method=data.get(
                        'preferred_payment_method'),
                    loyalty_points=data.get('loyalty_points', 0),
                    referred_by=data.get('referred_by'),
                    notes=data.get('notes', ''),
                )
                serializer = PartySerializer(party)
                return Response({
                    'message': 'Customer created successfully!',
                    'party': serializer.data,
                    'customer': CustomerSerializer(customer).data
                }, status=status.HTTP_201_CREATED)

            elif category == 'Supplier':
                supplier = Supplier.objects.create(
                    party=party,
                    name=data.get('name'),
                    code=data.get('code'),
                )
                serializer = PartySerializer(party)
                return Response({
                    'message': 'Supplier created successfully!',
                    'party': serializer.data,
                    'supplier': SupplierSerializer(supplier).data
                }, status=status.HTTP_201_CREATED)

    def put(self, request, *args, **kwargs):
        party_id = request.query_params.get('id')
        if not party_id:
            return Response({'error': 'Party ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            party = Party.objects.get(id=party_id)
        except Party.DoesNotExist:
            return Response({'error': 'Party not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        # Update related customer or supplier
        if party.Category_type == 'Customer' and hasattr(party, 'Customer'):
            customer = party.Customer
            customer.name = data.get('name', customer.name)
            customer.email = data.get('email', customer.email)
            customer.phone_no = data.get('phone_no', customer.phone_no)
            customer.address = data.get('address', customer.address)
            customer.Customer_code = data.get(
                'Customer_code', customer.Customer_code)
            customer.open_balance = data.get(
                'open_balance', customer.open_balance)
            customer.credit_limmit = data.get(
                'credit_limmit', customer.credit_limmit)
            customer.preferred_payment_method = data.get(
                'preferred_payment_method', customer.preferred_payment_method)
            customer.loyalty_points = data.get(
                'loyalty_points', customer.loyalty_points)
            customer.referred_by = data.get(
                'referred_by', customer.referred_by)
            customer.notes = data.get('notes', customer.notes)
            customer.save()

            return Response({
                'message': 'Customer updated successfully!',
                'party': PartySerializer(party).data,
                'customer': CustomerSerializer(customer).data
            }, status=status.HTTP_200_OK)

        elif party.Category_type == 'Supplier' and hasattr(party, 'Supplier'):
            supplier = party.Supplier
            supplier.name = data.get('name', supplier.name)
            supplier.code = data.get('code', supplier.code)
            supplier.save()

            return Response({
                'message': 'Supplier updated successfully!',
                'party': PartySerializer(party).data,
                'supplier': SupplierSerializer(supplier).data
            }, status=status.HTTP_200_OK)
        if party.is_updated_at:
            time_since_last_update = timezone.now() - party.is_updated_at
            if time_since_last_update > PARTY_INACTIVITY_PERIOD:
                party.is_active = False

        party.save()
        return Response({'error': 'No related customer or supplier found'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        party_id = request.query_params.get('id')
        if not party_id:
            return Response({'error': 'Party ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            party = Party.objects.get(id=party_id)
        except Party.DoesNotExist:
            return Response({'error': 'Party not found'}, status=status.HTTP_404_NOT_FOUND)

        party.delete()
        return Response({'message': 'Party deleted successfully!'}, status=status.HTTP_200_OK)


class ApiExpenseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        paginator = PageNumberPagination()
        paginator.page_size = 10
        expenses = Expense.objects.filter(user=request.user)
        result_page = paginator.paginate_queryset(expenses, request)
        serializer = ExpenseSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, *args, **kwargs):
        expense_data = request.data.copy()
        expense_data['user'] = request.user.id

        serializer = ExpenseSerializer(data=expense_data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Expense created successfully!',
                             'expense': serializer.data}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, *args, **kwargs):
        expense_id = request.query_params.get('id')
        if not expense_id:
            return Response({'error': 'Expense ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            expense_id = int(expense_id)
            expense = Expense.objects.get(id=expense_id, user=request.user)
        except ValueError:
            return Response({'error': 'Invalid Expense ID'}, status=status.HTTP_400_BAD_REQUEST)
        except Expense.DoesNotExist:
            return Response({'error': 'Expense not found or you do not have permission to edit it.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExpenseSerializer(
            expense, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Expense updated successfully!',
                             'expense': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        expense_id = request.query_params.get('id')
        if not expense_id:
            return Response({'error': 'Expense ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            expense = Expense.objects.get(id=expense_id, user=request.user)
        except Expense.DoesNotExist:
            return Response({'error': 'Expense not found or you do not have permission to delete it.'}, status=status.HTTP_404_NOT_FOUND)

        expense.delete()
        return Response({'message': 'Expense deleted successfully!'}, status=status.HTTP_200_OK)


class ApiBillingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        paginator = PageNumberPagination()
        paginator.page_size = 10
        billings = Billing.objects.filter(user=request.user)
        result_page = paginator.paginate_queryset(billings, request)
        serializer = BillingSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request, *args, **kwargs):
        billing_data = request.data.copy()
        billing_data['user'] = request.user.id
        try:
            with transaction.atomic():
                serializer = BillingSerializer(data=billing_data)
                if serializer.is_valid():
                    billing = serializer.save()

                    # If there are billing items, create them
                    items_data = request.data.pop('items', [])
                    if not items_data:
                        return Response({'error': 'At least one billing item is required.'},
                                         status=status.HTTP_400_BAD_REQUEST)
                    for item_data in items_data:
                        item_data['billing'] = billing.id
                        item_serializer = BillingItemSerializer(data=item_data)
                        if item_serializer.is_valid():
                            item_serializer.save()
                        else:
                            return Response(item_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                    return Response({'message': 'Billing created successfully!',
                                     'billing': BillingSerializer(billing).data}, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except ValueError as ve:
            return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request, *args, **kwargs):
        billing_id = request.query_params.get('id')
        if not billing_id:
            return Response({'error': 'Billing ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            billing_id = int(billing_id)
            billing = Billing.objects.get(id=billing_id, user=request.user)
        except ValueError:
            return Response({'error': 'Invalid Billing ID'}, status=status.HTTP_400_BAD_REQUEST)
        except Billing.DoesNotExist:
            return Response({'error': 'Billing not found or you do not have permission to edit it.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BillingSerializer(
            billing, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Billing updated successfully!',
                             'billing': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, *args, **kwargs):
        billing_id = request.query_params.get('id')
        if not billing_id:
            return Response({'error': 'Billing ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            billing = Billing.objects.get(id=billing_id, user=request.user)
        except Billing.DoesNotExist:
            return Response({'error': 'Billing not found or you do not have permission to delete it.'}, status=status.HTTP_404_NOT_FOUND)

        billing.delete()
        return Response({'message': 'Billing deleted successfully!'}, status=status.HTTP_200_OK)
    

class ForgetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Generate OTP
        otp = str(random.randint(100000, 999999))

        # Create ForgetPasswordOTP entry
        forget_password_otp = ForgetPasswordOTP.objects.create(
            user=user,
            otp=otp,
            otp_created_at=timezone.now(),
            is_verify=False
        )

        # Send OTP to the user's email
        send_otp_email.delay(email, otp)

        return Response({'message': 'OTP sent to your email. Please verify to reset your password.'},
                        status=status.HTTP_200_OK)
    
class VerifyForgetPasswordOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp_provided = request.data.get('otp', '').strip()

        try:
            user = User.objects.get(email=email)
            forget_password_otp = ForgetPasswordOTP.objects.filter(user=user).latest('otp_created_at')
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except ForgetPasswordOTP.DoesNotExist:
            return Response({'error': 'No OTP found for this user'}, status=status.HTTP_400_BAD_REQUEST)

        # Check OTP expiry
        if not forget_password_otp.otp or not forget_password_otp.otp_created_at:
            return Response({'error': 'No OTP found'}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > forget_password_otp.otp_created_at + OTP_EXPIRY_TIME:
            return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        if str(forget_password_otp.otp) == str(otp_provided):
            forget_password_otp.is_verify = True
            forget_password_otp.save()
            return Response({'message': 'Forget Password OTP verified successfully!'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        new_password = request.data.get('new_password')
 
        try:
            user = User.objects.get(email=email)
            forget_password_otp = ForgetPasswordOTP.objects.filter(user=user).latest('otp_created_at')
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except ForgetPasswordOTP.DoesNotExist:
            return Response({'error': 'No OTP found for this user'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if OTP was verified
        if forget_password_otp.is_verify==False:
            return Response({'error': 'OTP not verified'}, status=status.HTTP_400_BAD_REQUEST)

        # Reset the password
        user.set_password(new_password)
        user.save()  

        # Optionally, delete the OTP entry after successful password reset
        forget_password_otp.delete()

        return Response({'message': 'Password reset successfully!'}, status=status.HTTP_200_OK)
    




