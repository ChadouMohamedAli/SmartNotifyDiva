from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import uuid


class CustomUser(AbstractUser):
    """
    Modèle utilisateur personnalisé avec champs supplémentaires
    Architecture modulaire: chaque utilisateur appartient à UN module avec UN rôle
    """
    # Rôles avec permissions spécifiques
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrateur'),           # Nedia - accès à tout
        ('responsable_stock', 'Responsable Stock'),        # Gère stock, catégories, entrepôts, fournisseurs
        ('responsable_appro', 'Responsable Approvisionnement'), # Gère les fournisseurs et les commandes d'achat
        ('responsable_production', 'Responsable Production'), # Gère production uniquement
        ('responsable_facturation', 'Responsable Facturation'), # Gère facturation
        ('responsable_commandes', 'Responsable Commandes'),     # Gère commandes
        ('agent_stock', 'Agent Stock'),                    # Consultation stock uniquement
        ('agent_production', 'Agent Production'),          # Consultation production uniquement
        ('employe', 'Employé'),                           # Accès minimal
    ]
    email = models.EmailField(
        _('email address'),
        unique=True,
        error_messages={
            'unique': _("Un utilisateur avec cet email existe déjà."),
        }
    )
    
    # Champs de rôle
    is_primary_admin = models.BooleanField(
        _('primary admin status'),
        default=False,
        help_text=_('Désigne si cet utilisateur est l\'administrateur principal.')
    )
    
    # Champs supplémentaires
    phone_number = models.CharField(
        _('phone number'),
        max_length=20,
        blank=True,
        null=True
    )

    telegram_user_id = models.CharField(
        _('telegram user id'),
        max_length=32,
        blank=True,
        null=True,
        unique=True
    )

    telegram_username = models.CharField(
        _('telegram username'),
        max_length=150,
        blank=True,
        null=True
    )

    telegram_chat_id = models.CharField(
        _('telegram chat id'),
        max_length=32,
        blank=True,
        null=True
    )

    role = models.CharField(
        _('role'),
        max_length=30,
        choices=ROLE_CHOICES,
        default='employe'
    )

    is_email_verified = models.BooleanField(
        _('email verified'),
        default=False,
        help_text=_('Indique si l email a ete verifie via code OTP.')
    )

    two_factor_enabled = models.BooleanField(
        _('two factor enabled'),
        default=True,
        help_text=_('Active la verification OTP par email a la connexion.')
    )

    company = models.CharField(
        _('company'),
        max_length=100,
        blank=True,
        null=True
    )
    
    authorized_pages = models.JSONField(
        _('authorized pages'),
        default=list,
        blank=True,
        help_text=_('Les pages auxquelles cet utilisateur a accès')
    )
    profile_picture = models.ImageField(
        _('profile picture'),
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )
    
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )
    
    # Email comme identifiant de connexion
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        """Retourne le nom complet de l'utilisateur"""
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def is_admin(self):
        """Vérifie si l'utilisateur est admin"""
        return self.is_superuser or self.is_staff or self.is_primary_admin
    
    @property
    def is_super_admin(self):
        """Vérifie si c'est le super admin (accès à tout)"""
        return self.role == 'super_admin' or self.is_primary_admin or self.is_superuser
    
    @property
    def is_responsable(self):
        """Vérifie si c'est un responsable (tous types)"""
        return self.role in [
            'responsable_stock',
            'responsable_appro',
            'responsable_production',
            'responsable_facturation',
            'responsable_commandes',
        ]
    
    def get_accessible_modules(self):
        """Retourne la liste des modules accessibles selon le rôle"""
        role_modules = {
            'super_admin': ['stock', 'production', 'facturation', 'orders', 'all'],
            'responsable_stock': ['stock', 'categories', 'fournisseurs', 'entrepots'],
            'responsable_appro': ['orders', 'fournisseurs'],
            'responsable_production': ['production'],
            'responsable_facturation': ['facturation'],
            'responsable_commandes': ['orders', 'stock'],
            'agent_stock': ['stock'],
            'agent_production': ['production'],
            'employe': [],
        }
        return role_modules.get(self.role, [])
    
    def save(self, *args, **kwargs):
        # Auto-populate authorized_pages based on role - SEULEMENT si c'est la création (pas de pk)
        if not self.pk and not self.authorized_pages:  # Only on creation if not already set
            pages_by_role = {
                'super_admin': ['dashboard', 'alertes', 'notifications', 'stock', 'stock-movements', 'orders', 'categories', 'fournisseurs', 'entrepots', 'facturation', 'matiere-premiere', 'ordre-production', 'produit-fini', 'modules', 'admin', 'Employes', 'history', 'profile', 'settings', 'deconnexion'],
                'responsable_stock': ['dashboard', 'alertes', 'notifications', 'stock', 'categories', 'stock-movements', 'fournisseurs', 'entrepots', 'facturation', 'history', 'profile', 'settings', 'deconnexion'],
                'responsable_appro': ['dashboard', 'alertes', 'notifications', 'stock', 'fournisseurs', 'orders', 'facturation', 'history', 'profile', 'settings', 'deconnexion'],
                'responsable_production': ['dashboard', 'matiere-premiere', 'ordre-production', 'produit-fini', 'alertes', 'notifications', 'history', 'profile', 'settings', 'deconnexion'],
                'responsable_facturation': ['dashboard', 'facturation', 'orders', 'alertes', 'notifications', 'history', 'profile', 'settings', 'deconnexion'],
                'responsable_commandes': ['dashboard', 'orders', 'stock', 'stock-movements', 'alertes', 'notifications', 'history', 'profile', 'settings', 'deconnexion'],
                'agent_stock': ['dashboard', 'stock', 'stock-movements', 'notifications', 'profile', 'settings', 'deconnexion'],
                'agent_production': ['dashboard', 'matiere-premiere', 'ordre-production', 'produit-fini', 'notifications', 'profile', 'settings', 'deconnexion'],
                'employe': ['dashboard', 'notifications', 'profile', 'settings', 'deconnexion'],
            }
            self.authorized_pages = pages_by_role.get(self.role, ['dashboard', 'notifications', 'profile', 'settings', 'deconnexion'])
            print(f"[MODEL SAVE] Creating new user with role {self.role}, auto-populated pages: {self.authorized_pages}")
        elif self.pk:
            print(f"[MODEL SAVE] Updating existing user {self.id}, keeping authorized_pages: {self.authorized_pages}")

        # Le premier utilisateur créé devient automatiquement superuser
        if not CustomUser.objects.exists():
            self.is_superuser = True
            self.is_staff = True
            self.is_primary_admin = True
        super().save(*args, **kwargs)


class TelegramAuthSession(models.Model):
    """One-time auth code for Telegram bot login flow."""
    code = models.CharField(max_length=20, unique=True, db_index=True)
    otp = models.CharField(max_length=6, null=True, blank=True)   # 6-digit code sent by bot to user
    telegram_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'accounts'

    def __str__(self):
        return f"TelegramAuthSession({self.code})"


class EmailOTPChallenge(models.Model):
    """Challenge OTP email pour verification d'inscription et 2FA de connexion."""

    PURPOSE_REGISTER = 'register'
    PURPOSE_LOGIN = 'login'
    PURPOSE_CHOICES = [
        (PURPOSE_REGISTER, 'Inscription'),
        (PURPOSE_LOGIN, 'Connexion'),
    ]

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='email_otp_challenges'
    )
    challenge_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    otp_code = models.CharField(max_length=6)
    channel = models.CharField(max_length=20, default='email', choices=[('email', 'Email'), ('telegram', 'Telegram')])
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    is_consumed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'accounts'
        ordering = ['-created_at']

    def __str__(self):
        return f"EmailOTPChallenge({self.user.email}, {self.purpose})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
