from django.db import migrations

def update_existing_roles(apps, schema_editor):
    """
    Mettre à jour les rôles existants vers les nouveaux rôles
    Les admins et les utilisateurs staff/superuser gardent leurs permissions
    Les utilisateurs 'user' deviennent 'employe'
    """
    CustomUser = apps.get_model('accounts', 'CustomUser')
    
    # Convert old roles to new roles if they exist
    for user in CustomUser.objects.all():
        # Si c'est un admin/staff/superuser, on le laisse tel quel
        # Sinon, on met le rôle par défaut s'il n'en a pas
        if not user.role or user.role in ['admin', 'user']:
            user.role = 'employe'
            user.save()

def reverse_update_roles(apps, schema_editor):
    """Revert role changes - just set to empty"""
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_update_role_choices'),
    ]

    operations = [
        migrations.RunPython(update_existing_roles, reverse_update_roles),
    ]
