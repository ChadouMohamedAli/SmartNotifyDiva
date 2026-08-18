from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour afficher les informations utilisateur"""
    full_name = serializers.ReadOnlyField()
    is_admin = serializers.ReadOnlyField()
    is_super_admin = serializers.ReadOnlyField()
    is_responsable = serializers.ReadOnlyField()
    accessible_modules = serializers.SerializerMethodField()
    
    def get_accessible_modules(self, obj):
        return obj.get_accessible_modules()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'phone_number', 'telegram_username', 'telegram_chat_id', 'role', 'company', 'profile_picture',
            'authorized_pages', 'is_active', 'is_staff', 'is_superuser', 'is_primary_admin',
            'is_email_verified', 'two_factor_enabled',
            'is_admin', 'is_super_admin', 'is_responsable', 'accessible_modules',
            'date_joined', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'created_at', 'updated_at'
        ]


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription des utilisateurs"""
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            message="Un utilisateur avec cet email existe déjà."
        )]
    )
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label="Confirm Password"
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password2',
            'first_name', 'last_name', 'phone_number', 'company', 'role'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        return attrs
    
    def create(self, validated_data):
        # Retirer password2 car non nécessaire pour la création
        validated_data.pop('password2')

        # Créer l'utilisateur INACTIF par défaut (en attente de vérification)
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            company=validated_data.get('company', ''),
            role=validated_data.get('role', 'employe'),
            is_active=False  # Important: compte inactif jusqu'à approbation admin
        )

        return user


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil utilisateur"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'username',
            'phone_number', 'telegram_username', 'telegram_chat_id', 'company', 'profile_picture',
            'two_factor_enabled'
        ]
    
    def validate_username(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà utilisé."
            )
        return value


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour que les admins créent des utilisateurs"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'first_name', 'last_name',
            'phone_number', 'company', 'role', 'authorized_pages', 'is_active', 'is_staff',
            'is_superuser', 'is_primary_admin'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour que les admins modifient des utilisateurs"""
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'phone_number', 'company', 'role', 'authorized_pages', 'is_active', 'is_staff',
            'is_superuser', 'is_primary_admin'
        ]
        # Tous les champs optionnels pour les PATCH requests
        extra_kwargs = {
            'email': {'required': False},
            'username': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone_number': {'required': False},
            'company': {'required': False},
            'role': {'required': False},
            'authorized_pages': {'required': False},
            'is_active': {'required': False},
            'is_staff': {'required': False},
            'is_superuser': {'required': False},
            'is_primary_admin': {'required': False},
        }
    
    def validate_email(self, value):
        if not value:  # Skip si vide
            return value
        user_id = self.instance.id if self.instance else None
        if User.objects.exclude(pk=user_id).filter(email=value).exists():
            raise serializers.ValidationError(
                "Un utilisateur avec cet email existe déjà."
            )
        return value
    
    def validate_role(self, value):
        if not value:  # Skip si vide
            return value
        # Vérifier que le rôle est valide
        valid_roles = [role[0] for role in User.ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"« {value} » n'est pas un choix valide. Choix valides: {', '.join(valid_roles)}"
            )
        return value
    
    def update(self, instance, validated_data):
        """Mettre à jour l'utilisateur avec logging"""
        print(f"[ADMIN UPDATE] Updating user {instance.id} with data: {validated_data}")
        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour changer le mot de passe"""
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Les nouveaux mots de passe ne correspondent pas."
            })
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer pour demander la réinitialisation du mot de passe"""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer pour confirmer la réinitialisation du mot de passe"""
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Les nouveaux mots de passe ne correspondent pas."
            })
        return attrs