"""Render the dated master Markdown report to a reviewable, linked PDF.

Optional dependency: pip install -e '.[reports]'. This supports the deliberately
small Markdown subset used by the report; it never executes source code blocks.
Review rendered pages after every content or layout change.
"""
from html import escape
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'reports/airton-project-report-2026-10-04.md'
TARGET = ROOT / 'output/pdf/airton-project-report-2026-10-04.pdf'
BLUE = colors.HexColor('#143F61')
TEAL = colors.HexColor('#007D7F')
INK = colors.HexColor('#263645')
MUTED = colors.HexColor('#607282')
WIDTH = A4[0] - 38 * mm


def inline(text):
    """Escape text first; only explicit links and emphasis create PDF markup."""
    saved = []

    def link(match):
        label, target = match.groups()
        if target.startswith(('https://', 'http://')):
            rendered = f'<a href="{escape(target, quote=True)}" color="#007D7F">{escape(label)}</a>'
        else:
            rendered = f'{escape(label)} <font color="#607282">({escape(target)})</font>'
        saved.append(rendered)
        return f'@@LINK{len(saved)-1}@@'

    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, text)
    text = escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', text)
    for index, value in enumerate(saved):
        text = text.replace(f'@@LINK{index}@@', value)
    return text


def styles():
    result = getSampleStyleSheet()
    result.add(ParagraphStyle('ReportTitle', fontName='Helvetica-Bold', fontSize=31,
                             leading=36, textColor=BLUE, spaceAfter=15))
    result.add(ParagraphStyle('Section', fontName='Helvetica-Bold', fontSize=17,
                             leading=22, textColor=BLUE, spaceAfter=14,
                             keepWithNext=True))
    result.add(ParagraphStyle('Copy', fontName='Helvetica', fontSize=9.7,
                             leading=14.2, textColor=INK, spaceAfter=10,
                             alignment=TA_LEFT))
    result.add(ParagraphStyle('Cell', parent=result['Copy'], fontSize=8.3,
                             leading=11.5, spaceAfter=0, splitLongWords=True))
    result.add(ParagraphStyle('CellHead', parent=result['Cell'],
                             fontName='Helvetica-Bold', textColor=colors.white))
    result.add(ParagraphStyle('BulletCopy', parent=result['Copy'], fontSize=9.2,
                             leading=13.2, leftIndent=10, firstLineIndent=-8))
    return result


def table(rows, sheet):
    count = len(rows[0])
    if any(len(row) != count for row in rows):
        raise ValueError('Malformed Markdown table')
    ratios = {2: [0.34, 0.66], 3: [0.25, 0.29, 0.46],
              4: [0.37, 0.21, 0.21, 0.21]}.get(count, [1/count] * count)
    cells = [[Paragraph(inline(value), sheet['CellHead'] if row_index == 0 else sheet['Cell'])
              for value in row] for row_index, row in enumerate(rows)]
    block = Table(cells, colWidths=[WIDTH * ratio for ratio in ratios],
                  repeatRows=1, hAlign='LEFT')
    block.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BLUE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F0F5F7'), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, 0), 1, TEAL),
        ('LINEBELOW', (0, 1), (-1, -1), 0.3, colors.HexColor('#D7E1E7')),
    ]))
    return block


def parse(source, sheet):
    lines = source.splitlines()
    story, index = [], 0
    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue
        if line == '---':
            story.append(PageBreak())
        elif line.startswith('# '):
            story.append(Spacer(1, 20 * mm))
            story.append(Paragraph(inline(line[2:]), sheet['ReportTitle']))
        elif line.startswith('## '):
            story.append(Paragraph(inline(line[3:]), sheet['Section']))
        elif line.startswith('|'):
            rows = []
            while index < len(lines) and lines[index].strip().startswith('|'):
                row = [part.strip() for part in lines[index].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', part) for part in row):
                    rows.append(row)
                index += 1
            story.extend([table(rows, sheet), Spacer(1, 10)])
            continue
        elif line.startswith('- '):
            story.append(Paragraph('- ' + inline(line[2:]), sheet['BulletCopy']))
        else:
            paragraph = [line]
            while index + 1 < len(lines) and lines[index + 1].strip() and not lines[index + 1].lstrip().startswith(('#', '|', '- ')) and lines[index + 1].strip() != '---':
                index += 1
                paragraph.append(lines[index].strip())
            story.append(Paragraph(inline(' '.join(paragraph)), sheet['Copy']))
        index += 1
    return story


def decorate(canvas, document):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(TEAL)
    canvas.rect(19 * mm, height - 15 * mm, width - 38 * mm, 1.1 * mm, fill=1, stroke=0)
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(BLUE)
    canvas.drawString(19 * mm, height - 21 * mm, 'AIRTON  /  PROJECT EVIDENCE BASELINE')
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 19 * mm, height - 21 * mm, '04 OCT 2026  |  v0.2.0')
    canvas.setStrokeColor(colors.HexColor('#D7E1E7'))
    canvas.line(19 * mm, 17 * mm, width - 19 * mm, 17 * mm)
    canvas.setFont('Helvetica', 7.3)
    canvas.drawString(19 * mm, 12 * mm, 'Working review document - not a clinical or manufacturing release')
    canvas.drawRightString(width - 19 * mm, 12 * mm, f'{document.page}')
    canvas.restoreState()


def main():
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(str(TARGET), pagesize=A4,
        rightMargin=19 * mm, leftMargin=19 * mm,
        topMargin=29 * mm, bottomMargin=24 * mm,
        title='AirTon - project specification, progress and evidence, 4 October 2026',
        author='AirTon project repository', subject='Home IOP monitoring working baseline')
    document.build(parse(SOURCE.read_text(encoding='utf-8'), styles()),
                   onFirstPage=decorate, onLaterPages=decorate)
    print(f'Generated {TARGET.relative_to(ROOT)}; render and review before archiving.')


if __name__ == '__main__':
    main()
