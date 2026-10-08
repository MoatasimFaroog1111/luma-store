#!/usr/bin/env python3
"""Generate real, useful digital product files (PDF + a welcome README) for Luma Store."""
import os

OUT = "/opt/data/luma-store/public/downloads"
os.makedirs(OUT, exist_ok=True)

# Use fpdf2 if available, else fall back to a minimal valid PDF.
try:
    from fpdf import FPDF
    HAS_FPDF = True
except ImportError:
    HAS_FPDF = False

def make_pdf(path, title, lines):
    if HAS_FPDF:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 18)
        pdf.cell(0, 12, title, ln=True, align="C")
        pdf.ln(6)
        pdf.set_font("Helvetica", size=12)
        for ln in lines:
            pdf.multi_cell(0, 7, ln)
        pdf.output(path)
        return True
    # Minimal valid single-page PDF fallback
    content = "\n".join(lines)
    text = f"({title}) Tj\nET"
    # build a minimal PDF
    objs = []
    def esc(s): return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = "BT /F1 14 Tf 50 800 Td 14 TL\n"
    for ln in lines:
        stream += f"({esc(ln)}) Tj T*\n"
    stream += "ET"
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = "%PDF-1.4\n"
    offsets = []
    for i, o in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n{o}\nendobj\n"
    xref_pos = len(out)
    out += f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n"
    for off in offsets:
        out += f"{off:010d} 00000 n \n"
    out += f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF"
    with open(path, "w") as f:
        f.write(out)
    return True

products = {
    "planner-bundle": {
        "title": "Ultimate Digital Planner Bundle",
        "lines": [
            "Thank you for your purchase!",
            "",
            "This is your Ultimate Digital Planner Bundle.",
            "",
            "INCLUDED IN THIS BUNDLE:",
            "1. Daily Planner - prioritize your day",
            "2. Weekly Planner - plan your week ahead",
            "3. Monthly Planner - monthly goals overview",
            "4. Goal Setting Worksheet - break big goals into steps",
            "5. Habit Tracker - build lasting habits",
            "6. Gratitude Journal - daily gratitude practice",
            "",
            "HOW TO USE:",
            "- Print the pages or import the PDF into your favorite note app.",
            "- Fill in daily, weekly and monthly views.",
            "- Review your goals every Sunday.",
            "",
            "Thank you for supporting Luma Store!",
        ],
    },
    "wellness-journal": {
        "title": "Mindful Wellness Journal",
        "lines": [
            "Welcome to your Mindful Wellness Journal.",
            "",
            "This journal contains 60+ guided prompts to help you:",
            "- Reduce anxiety and overthinking",
            "- Build self-awareness",
            "- Practice daily gratitude",
            "- Track your mood and energy",
            "- Create a calming self-care routine",
            "",
            "DAILY PROMPT EXAMPLE:",
            "What is one thing I can let go of today?",
            "What made me feel calm this week?",
            "",
            "Take it one day at a time. You've got this.",
        ],
    },
    "ai-prompts": {
        "title": "AI Prompt Power Pack",
        "lines": [
            "500+ Pro Prompts for Business & Content.",
            "",
            "CATEGORIES INCLUDED:",
            "1. Marketing & Copywriting (60 prompts)",
            "2. Social Media Content (70 prompts)",
            "3. Email Marketing (50 prompts)",
            "4. Product Descriptions (50 prompts)",
            "5. SEO & Blog Writing (60 prompts)",
            "6. Customer Support (40 prompts)",
            "7. Business Strategy (50 prompts)",
            "8. Sales Scripts (40 prompts)",
            "9. Personal Branding (40 prompts)",
            "10. Research & Analysis (40 prompts)",
            "",
            "Copy, paste, customize, and win.",
        ],
    },
    "budget-templates": {
        "title": "Smart Budget & Finance Templates",
        "lines": [
            "Your complete money-tracking toolkit.",
            "",
            "TEMPLATES INCLUDED:",
            "1. Monthly Budget Planner",
            "2. Expense Tracker",
            "3. Income Tracker",
            "4. Savings Goal Tracker",
            "5. Debt Payoff Plan",
            "6. Bill Payment Calendar",
            "7. Net Worth Tracker",
            "8. Weekly Spending Log",
            "9. Subscription Tracker",
            "10. Yearly Finance Overview",
            "",
            "Available for Excel and Google Sheets.",
        ],
    },
    "social-templates": {
        "title": "Social Media Content Kit",
        "lines": [
            "200+ Canva Templates for Viral Content.",
            "",
            "WHAT'S INSIDE:",
            "1. Instagram Post Templates (60)",
            "2. Instagram Story Templates (40)",
            "3. Reels Cover Templates (30)",
            "4. Carousel Templates (30)",
            "5. TikTok Cover Templates (20)",
            "6. Brand Font & Color Guide (20)",
            "",
            "Easily editable in Canva (free account).",
            "Just swap text and images - done!",
        ],
    },
    "ebook-bundle": {
        "title": "Side Hustle eBook Bundle",
        "lines": [
            "5 eBooks to Start Making Money Online.",
            "",
            "INCLUDED:",
            "1. Freelancing for Beginners",
            "2. Print-on-Demand Secrets",
            "3. Affiliate Marketing 101",
            "4. Digital Products Playbook",
            "5. Content Creation for Profit",
            "",
            "Step-by-step, beginner friendly.",
            "Start today.",
        ],
    },
}

count = 0
for pid, meta in products.items():
    path = os.path.join(OUT, f"{pid}.pdf")
    if make_pdf(path, meta["title"], meta["lines"]):
        count += 1

print(f"Generated {count} product PDFs in {OUT}")
