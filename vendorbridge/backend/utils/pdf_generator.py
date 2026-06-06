import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER


def generate_invoice_pdf(invoice, po, vendor, quotation_items):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    # Title style
    title_style = ParagraphStyle('InvoiceTitle', parent=styles['Title'],
                                  fontSize=24, textColor=colors.HexColor('#1e40af'))
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Spacer(1, 5*mm))

    # Invoice info
    info_style = ParagraphStyle('Info', parent=styles['Normal'], fontSize=10)
    elements.append(Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}", info_style))
    elements.append(Paragraph(f"<b>Date:</b> {invoice.generated_at.strftime('%Y-%m-%d')}", info_style))
    elements.append(Paragraph(f"<b>PO Reference:</b> {po.po_number}", info_style))
    elements.append(Spacer(1, 8*mm))

    # Bill To
    elements.append(Paragraph("<b>Bill To:</b>", styles['Heading3']))
    elements.append(Paragraph(f"{vendor.company_name}", styles['Normal']))
    if vendor.contact_person:
        elements.append(Paragraph(f"Contact: {vendor.contact_person}", styles['Normal']))
    if vendor.address:
        elements.append(Paragraph(f"{vendor.address}", styles['Normal']))
    if vendor.gst_number:
        elements.append(Paragraph(f"GST: {vendor.gst_number}", styles['Normal']))
    elements.append(Spacer(1, 8*mm))

    # Line items table
    table_data = [["#", "Product/Service", "Qty", "Unit", "Unit Price", "Total"]]
    for idx, item in enumerate(quotation_items, 1):
        product_name = item.rfq_item.product_name if item.rfq_item else "N/A"
        unit = item.rfq_item.unit if item.rfq_item else ""
        table_data.append([
            str(idx),
            product_name,
            str(float(item.quantity)),
            unit or "",
            f"Rs {float(item.unit_price):,.2f}",
            f"Rs {float(item.total_price):,.2f}" if item.total_price else "",
        ])

    col_widths = [25, 180, 50, 50, 80, 80]
    table = Table(table_data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 10*mm))

    # Summary
    summary_data = [
        ["Subtotal:", f"Rs {float(invoice.subtotal):,.2f}"],
        [f"GST ({float(invoice.tax_rate)}%):", f"Rs {float(invoice.tax_amount):,.2f}"],
        ["", ""],
        ["TOTAL:", f"Rs {float(invoice.total):,.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[150, 120])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, colors.black),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 15*mm))

    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'],
                                   alignment=TA_CENTER, fontSize=9,
                                   textColor=colors.grey)
    elements.append(Paragraph("Thank you for your business", footer_style))
    elements.append(Paragraph("Payment due within 30 days", footer_style))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
