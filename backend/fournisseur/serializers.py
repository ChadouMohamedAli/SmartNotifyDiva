from rest_framework import serializers
from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    family = serializers.CharField(source="famille", read_only=True)

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "registre_commerce",
            "identifiant_fiscal",
            "famille",
            "family",
            "secteur",
            "anciennete",
            "contact_name",
            "email",
            "phone",
            "address",
            "city",
            "country",
            "prix_unitaire",
            "conditions_paiement",
            "remise",
            "zone_couverture",
            "minimum_commande",
            "delai_livraison",
            "certifications",
            "garantie_sav",
            "references_clients",
            "capacite_production",
            "delivery_time",
            "vat",
            "payment_method",
            "is_active",
            "note_globale",
            "commentaires",
            "created_at",
            "updated_at",
        ]

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            data = data.copy()

        family_value = data.get("family")
        famille_value = data.get("famille")
        secteur_value = data.get("secteur")

        if family_value and not famille_value:
            data["famille"] = family_value

        if famille_value and not secteur_value:
            data["secteur"] = famille_value

        if secteur_value and not famille_value:
            data["famille"] = secteur_value

        return super().to_internal_value(data)
