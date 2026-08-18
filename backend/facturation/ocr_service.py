import os
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation

import requests


class OCRConfigurationError(Exception):
    pass


class OCRProcessingError(Exception):
    pass


def _get_ocr_settings():
    return {
        "endpoint": os.getenv("OCR_SPACE_ENDPOINT", "https://api.ocr.space/parse/image"),
        "api_key": os.getenv("OCR_SPACE_API_KEY", "").strip(),
        "language": os.getenv("OCR_SPACE_LANGUAGE", "fre"),
        "timeout_seconds": int(os.getenv("OCR_TIMEOUT_SECONDS", "45")),
    }


def _clean_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _clean_multiline_text(value):
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in str(value or "").splitlines()]
    return "\n".join(line for line in lines if line)


def _first_match(patterns, text, flags=re.IGNORECASE):
    for pattern in patterns:
        match = re.search(pattern, text, flags)
        if match:
            for group in match.groups():
                if group:
                    return _clean_text(group)
    return ""


def _to_decimal(value):
    if value in (None, ""):
        return None

    raw = str(value).strip()
    raw = raw.replace("\xa0", "").replace(" ", "")
    raw = re.sub(r"[^0-9,.\-]", "", raw)

    if not raw:
        return None

    if "," in raw and "." in raw:
        if raw.rfind(",") > raw.rfind("."):
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", "")
    elif raw.count(",") == 1 and raw.count(".") == 0:
        raw = raw.replace(",", ".")
    elif raw.count(".") > 1:
        raw = raw.replace(".", "")

    try:
        return Decimal(raw)
    except InvalidOperation:
        return None


def _normalize_date(value):
    if not value:
        return ""

    cleaned = _clean_text(value).replace(".", "/").replace("-", "/")
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y/%m/%d"):
        try:
            return datetime.strptime(cleaned, fmt).date().isoformat()
        except ValueError:
            continue
    return ""


def _extract_decimal_from_patterns(text, patterns):
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            amount = _to_decimal(match.group(1))
            if amount is not None:
                return amount
    return None


def _extract_labeled_line(text, labels):
    if not text:
        return ""

    label_pattern = "|".join(re.escape(label) for label in labels)
    for line in _clean_multiline_text(text).splitlines():
        match = re.search(rf"(?:{label_pattern})\s*[:\-]?\s*(.+)$", line, re.IGNORECASE)
        if match:
            return _clean_text(match.group(1))
    return ""


def _extract_currency(text):
    upper = text.upper()
    aliases = {
        "EUR": "EUR",
        "€": "EUR",
        "USD": "USD",
        "$": "USD",
        "TND": "TND",
        "DT": "TND",
    }
    for token, normalized in aliases.items():
        if token in upper:
            return normalized
    return "EUR"


def extract_invoice_fields(raw_text):
    text = raw_text or ""
    normalized_text = _clean_text(text)

    invoice_number = _first_match([
        r"(?:facture|invoice)\s*(?:n[°oº]|number|num[eé]ro)?\s*[:\-]?\s*([A-Z0-9\-\/]+)",
        r"\b(?:n[°oº]|num[eé]ro)\s*facture\s*[:\-]?\s*([A-Z0-9\-\/]+)",
    ], normalized_text)
    purchase_order_number = _first_match([
        r"(?:bon de commande|commande achat|purchase order|PO)\s*(?:n[°oº]|number|num[eé]ro)?\s*[:\-]?\s*([A-Z0-9\-\/]+)",
    ], normalized_text)
    invoice_date = _normalize_date(_first_match([
        r"(?:date\s*(?:de)?\s*facture|invoice\s*date)\s*[:\-]?\s*(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4})",
    ], normalized_text))
    due_date = _normalize_date(_first_match([
        r"(?:date\s*d['’]?[ée]ch[ée]ance|[ée]ch[ée]ance|due\s*date)\s*[:\-]?\s*(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4})",
    ], normalized_text))
    customer_email = _first_match([
        r"\b([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})\b",
    ], normalized_text)
    customer_phone = _first_match([
        r"((?:\+?\d[\d .\-]{7,}\d))",
    ], normalized_text)
    supplier_name = _extract_labeled_line(text, ["Fournisseur", "Supplier", "Vendor"])
    customer_name = supplier_name or _extract_labeled_line(text, ["Client", "Customer", "Bill To"])
    category_label = _extract_labeled_line(text, ["Categorie", "Catégorie", "Category", "Famille", "Secteur"])
    supplier_departure_date = _normalize_date(
        _extract_labeled_line(
            text,
            ["Depart fournisseur", "Départ fournisseur", "Date depart", "Date départ", "Shipping date", "Expedition", "Expédition"],
        )
    )

    subtotal = _extract_decimal_from_patterns(normalized_text, [
        r"(?:sous[\s\-]?total|subtotal|total\s*ht)\s*[:\-]?\s*([0-9\s.,]+)",
    ])
    tax_amount = _extract_decimal_from_patterns(normalized_text, [
        r"(?:tva|vat|tax(?:es)?)\s*[:\-]?\s*([0-9\s.,]+)",
    ])
    total_amount = _extract_decimal_from_patterns(normalized_text, [
        r"(?:total\s*ttc|montant\s*total|total\s*due|net\s*[àa]\s*payer|amount\s*due|grand\s*total)\s*[:\-]?\s*([0-9\s.,]+)",
    ])
    tax_rate = _extract_decimal_from_patterns(normalized_text, [
        r"(?:tva|vat|tax)\s*(?:rate|taux)?\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*%",
    ])

    if subtotal is None and total_amount is not None and tax_amount is not None:
        subtotal = total_amount - tax_amount

    return {
        "invoice_number": invoice_number,
        "purchase_order_number": purchase_order_number,
        "customer_name": customer_name,
        "supplier_name": supplier_name,
        "category_label": category_label,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "customer_address": "",
        "currency": _extract_currency(normalized_text),
        "invoice_date": invoice_date,
        "due_date": due_date,
        "supplier_departure_date": supplier_departure_date,
        "subtotal": float(subtotal) if subtotal is not None else 0,
        "tax_rate": float(tax_rate) if tax_rate is not None else 20,
        "tax_amount": float(tax_amount) if tax_amount is not None else 0,
        "total_amount": float(total_amount) if total_amount is not None else 0,
        "discount": 0,
        "notes": "",
        "raw_text": text,
    }


def scan_invoice_file(uploaded_file):
    ocr_settings = _get_ocr_settings()

    if not ocr_settings["api_key"]:
        raise OCRConfigurationError("OCR_SPACE_API_KEY is missing")

    response = requests.post(
        ocr_settings["endpoint"],
        headers={"apikey": ocr_settings["api_key"]},
        data={
            "language": ocr_settings["language"],
            "isOverlayRequired": "false",
            "OCREngine": "2",
            "scale": "true",
            "isTable": "true",
        },
        files={
            "file": (
                uploaded_file.name,
                uploaded_file.read(),
                getattr(uploaded_file, "content_type", "application/octet-stream"),
            )
        },
        timeout=ocr_settings["timeout_seconds"],
    )
    response.raise_for_status()

    payload = response.json()
    if payload.get("IsErroredOnProcessing"):
        message = payload.get("ErrorMessage") or payload.get("ErrorDetails") or "OCR processing failed"
        if isinstance(message, list):
            message = " ".join(str(part) for part in message)
        raise OCRProcessingError(_clean_text(message))

    parsed_results = payload.get("ParsedResults") or []
    raw_text = "\n".join(
        _clean_multiline_text(result.get("ParsedText"))
        for result in parsed_results
        if result.get("ParsedText")
    ).strip()

    if not raw_text:
        raise OCRProcessingError("No text detected in the uploaded document")

    extracted = extract_invoice_fields(raw_text)
    extracted["notes"] = "Préremplie par OCR. Vérifiez les montants et dates avant validation."

    return {
        "provider": "ocr_space",
        "raw_text": raw_text,
        "extracted_data": extracted,
        "ocr_payload": payload,
    }
