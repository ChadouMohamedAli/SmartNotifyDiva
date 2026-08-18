from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Permission pour vérifier que l'utilisateur est Super Admin
    """
    message = "Seul le Super Admin peut effectuer cette action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.role == 'super_admin')
        )


class CanApproveOrRejectPurchase(BasePermission):
    """
    Permission pour approuver/rejeter une commande d'achat
    Seul le Super Admin peut approuver
    """
    message = "Seul le Super Admin peut approuver une commande d'achat."

    def has_permission(self, request, view):
        if request.method == 'POST' and view.action in ['approve', 'reject']:
            return (
                request.user
                and request.user.is_authenticated
                and (request.user.is_superuser or request.user.role == 'super_admin')
            )
        return True
