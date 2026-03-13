#!/usr/bin/env python3
"""Extract Formular 01 (SINTEZA) and Formular 02 (DETALIAT) data from Anexa_3 markdown files.

Outputs a comprehensive JSON with all sections, titles, and article-level items
with CB and CA values for all 7 columns (2024-2029 + growth%).
"""

import os
import re
import json
import sys


def split_concatenated_numbers(token):
    """Split a token that may contain concatenated Romanian-format numbers."""
    pattern = r'-?\d{1,3}(?:\.\d{3})*(?:,\d+)?'
    matches = re.findall(pattern, token)
    if ''.join(matches) == token:
        return matches
    return [token]


def parse_romanian_number(s):
    """Convert Romanian-format number string to integer. '12.169.298' -> 12169298"""
    s = s.strip().replace('.', '')
    try:
        return int(s)
    except ValueError:
        return None


def parse_number_line(line):
    """Parse all numbers from a line, handling concatenation.
    Returns list of (value_int, is_percentage) tuples.
    """
    results = []
    for token in line.split():
        for part in split_concatenated_numbers(token):
            if ',' in part:
                results.append((None, True))
            else:
                val = parse_romanian_number(part)
                if val is not None:
                    results.append((val, False))
    return results


def extract_values_7col(line_text, is_ca=False):
    """Extract 7-column values: [2024, 2025, 2026, growth%, 2027, 2028, 2029].

    Returns array of 6 numeric values [2024, 2025, 2026, 2027, 2028, 2029].
    CA lines often miss 2024 value.
    Uses the growth percentage (comma-containing token) as anchor for column 2026.
    """
    parsed = parse_number_line(line_text)

    # Find percentage position (growth rate anchor)
    pct_idx = None
    for i, (v, is_pct) in enumerate(parsed):
        if is_pct:
            pct_idx = i
            break

    # We want: [r2024, p2025, p2026, e2027, e2028, e2029]
    result = [None, None, None, None, None, None]

    if pct_idx is not None:
        # 2026 is right before percentage, then 2025 before that, 2024 before that
        # After percentage: 2027, 2028, 2029
        before = [v for v, p in parsed[:pct_idx] if not p and v is not None]
        after = [v for v, p in parsed[pct_idx+1:] if not p and v is not None]

        if is_ca:
            # CA often has 2024 missing
            if len(before) >= 1:
                result[2] = before[-1]  # 2026
            if len(before) >= 2:
                result[1] = before[-2]  # 2025
            if len(before) >= 3:
                result[0] = before[-3]  # 2024
        else:
            # CB has all 3 before pct
            if len(before) >= 1:
                result[2] = before[-1]  # 2026
            if len(before) >= 2:
                result[1] = before[-2]  # 2025
            if len(before) >= 3:
                result[0] = before[-3]  # 2024

        if len(after) >= 1:
            result[3] = after[0]  # 2027
        if len(after) >= 2:
            result[4] = after[1]  # 2028
        if len(after) >= 3:
            result[5] = after[2]  # 2029
    else:
        # No percentage found — try positional assignment
        nums = [v for v, p in parsed if not p and v is not None]
        if is_ca:
            # CA without pct: assign from right
            if len(nums) >= 1:
                result[2] = nums[0]
            if len(nums) >= 2:
                result[1] = nums[0]
                result[2] = nums[1]
            if len(nums) >= 4:
                result[3] = nums[-3] if len(nums) >= 5 else nums[-2] if len(nums) >= 3 else None
        else:
            # CB without pct: up to 6 values positionally
            for i, v in enumerate(nums[:6]):
                result[i] = v

    return result


def extract_name_from_header(lines):
    """Extract institution name from SINTEZA header."""
    for i, line in enumerate(lines):
        if line.strip() == 'SINTEZA':
            parts = []
            for j in range(i - 1, max(i - 5, 0), -1):
                name = lines[j].strip()
                if name and not name.startswith('---') and not name.startswith('pag'):
                    parts.append(name)
                else:
                    break
            if parts:
                parts.reverse()
                return ' '.join(parts)
    return None


def make_id(name):
    """Create a slug ID from institution name."""
    s = name.lower()
    s = re.sub(r'[^\w\s]', '', s)
    s = re.sub(r'\s+', '_', s.strip())
    return s


def find_formular_01_range(lines):
    """Find the line range of Formular 01 (SINTEZA).

    Starts at the first "5000 TOTAL GENERAL" line.
    Ends when we hit "Anexa nr. 3 / XX / 02" (Formular 02) or end of file.
    """
    start_idx = None
    for i, line in enumerate(lines):
        if re.match(r'^5000\s+TOTAL GENERAL', line.strip()):
            start_idx = i
            break

    if start_idx is None:
        return None

    # Find the formular number from nearest page header before or after start
    # Look for "Anexa nr. 3 / XX / 01" pattern
    end_idx = len(lines)
    for i in range(start_idx + 1, len(lines)):
        stripped = lines[i].strip()
        # End when we hit Formular 02 page header
        if re.search(r'Anexa nr\.\s*3\s*/\s*\d+\s*/\s*02', stripped):
            end_idx = i
            break

    return (start_idx, end_idx)


def is_section_code(code_str):
    """Check if a 4-digit code is a real budget section (not a year or page artifact)."""
    code = int(code_str)
    # Exclude years (2014-2035) and page numbers
    if 2014 <= code <= 2035:
        return False
    return True


TITLE_LABELS = {
    '01': 'CHELTUIELI CURENTE',
    '10': 'CHELTUIELI DE PERSONAL',
    '20': 'BUNURI SI SERVICII',
    '30': 'DOBANZI',
    '40': 'SUBVENTII',
    '50': 'FONDURI DE REZERVA',
    '51': 'TRANSFERURI INTRE UNITATI',
    '55': 'ALTE TRANSFERURI',
    '56': 'PROIECTE CU FINANTARE DIN FEN POSTADERARE',
    '57': 'ASISTENTA SOCIALA',
    '58': 'PROIECTE CU FINANTARE DIN FEN 2014-2020',
    '59': 'ALTE CHELTUIELI',
    '60': 'PROIECTE CU FINANTARE DIN PNRR NERAMBURSABIL',
    '61': 'PROIECTE CU FINANTARE DIN PNRR IMPRUMUT',
    '65': 'CHELTUIELI AFERENTE PROGRAMELOR',
    '70': 'CHELTUIELI DE CAPITAL',
    '71': 'ACTIVE NEFINANCIARE',
    '72': 'ACTIVE FINANCIARE',
    '79': 'OPERATIUNI FINANCIARE',
    '80': 'IMPRUMUTURI',
    '81': 'RAMBURSARI DE CREDITE',
    '84': 'PLATI EFECTUATE IN ANII PRECEDENTI',
    '85': 'PLATI EFECTUATE IN ANII PRECEDENTI',
}


def parse_formular_01(lines, start_idx, end_idx):
    """Parse the full Formular 01 section into structured data.

    Returns list of sections, each with titles.
    """
    sections = []
    current_section = None
    current_title = None

    i = start_idx
    while i < end_idx:
        stripped = lines[i].strip()

        # Skip page headers, empty lines, column headers
        if (stripped.startswith('---') or
            stripped.startswith('pag.') or
            'Anexa nr.' in stripped or
            stripped.startswith('Capi-') or
            stripped.startswith('tol ') or
            stripped.startswith('A ') and stripped.endswith('7') or
            not stripped):
            i += 1
            continue

        # Check for 4-digit section code (e.g., "5000 TOTAL GENERAL")
        m_section = re.match(r'^(\d{4})\s+(.+)', stripped)
        if m_section and is_section_code(m_section.group(1)):
            code = m_section.group(1)
            label = m_section.group(2).strip()

            # Save previous section
            if current_section:
                if current_title:
                    current_section['titles'].append(current_title)
                    current_title = None
                sections.append(current_section)

            current_section = {
                'code': code,
                'label': label,
                'cb': [None]*6,
                'ca': [None]*6,
                'titles': [],
            }
            current_title = None
            i += 1
            continue

        # Check for 2-digit title code (e.g., "10 TITLUL I CHELTUIELI DE PERSONAL")
        # Also match non-TITLUL entries like "01 CHELTUIELI CURENTE", "70 CHELTUIELI DE CAPITAL",
        # "79 OPERATIUNI FINANCIARE", "84 PLATI EFECTUATE..."
        m_title = re.match(r'^(\d{2})\s+(?:TITLUL\s+[IVXLCDM]+\s+)?(.+)', stripped)
        if m_title and current_section:
            code = m_title.group(1)

            # Filter out noise — only known title codes
            if code in TITLE_LABELS:
                label = TITLE_LABELS[code]
                if current_title:
                    current_section['titles'].append(current_title)
                current_title = {
                    'code': code,
                    'label': label,
                    'cb': [None]*6,
                    'ca': [None]*6,
                }
                i += 1
                continue

        # Check for CA line
        if stripped.startswith('I.Credite de angajament') or stripped.startswith('I. Credite de angajament'):
            vals = extract_values_7col(stripped, is_ca=True)
            target = current_title if current_title else current_section
            if target:
                target['ca'] = vals
            i += 1
            continue

        # Check for CB line
        if stripped.startswith('II.Credite bugetare') or stripped.startswith('II. Credite bugetare'):
            vals = extract_values_7col(stripped, is_ca=False)
            target = current_title if current_title else current_section
            if target:
                target['cb'] = vals
            i += 1
            continue

        i += 1

    # Don't forget last section/title
    if current_section:
        if current_title:
            current_section['titles'].append(current_title)
        sections.append(current_section)

    return sections


# "Parte" grouping codes in F02 — these don't map to real F01 sections
PARTE_CODES = {'5001', '5100', '5000', '6500', '6800', '7000', '8000', '9900'}


def find_formular_02_range(lines):
    """Find the line range of Formular 02 (DETALIAT).

    Start: first line matching 'Anexa nr. 3 / XX / 02 Pag. 1'
    End: first line matching formular 03+ or formular 11+ (Health goes 02→11 directly)
    """
    start_idx = None
    for i, line in enumerate(lines):
        if re.search(r'Anexa nr\.\s*3\s*/\s*\d+\s*/\s*02\s+Pag\.\s*1\b', line.strip()):
            start_idx = i
            break

    if start_idx is None:
        return None

    # Find end: next formular that isn't 01 or 02
    end_idx = len(lines)
    for i in range(start_idx + 1, len(lines)):
        stripped = lines[i].strip()
        m = re.search(r'Anexa nr\.\s*3\s*/\s*\d+\s*/\s*(\d+)\s+Pag', stripped)
        if m:
            formular_num = int(m.group(1))
            if formular_num >= 3:
                end_idx = i
                break

    # If no 03+ found, look for formular 11+
    if end_idx == len(lines):
        for i in range(start_idx + 1, len(lines)):
            stripped = lines[i].strip()
            m = re.search(r'Anexa nr\.\s*3\s*/\s*\d+\s*/\s*(\d+)\s+Pag', stripped)
            if m:
                formular_num = int(m.group(1))
                if formular_num not in (1, 2) and formular_num >= 11:
                    end_idx = i
                    break

    return (start_idx, end_idx)


def is_skip_line_f02(stripped):
    """Check if a line should be skipped in F02 parsing."""
    return (stripped.startswith('---') or
            stripped.startswith('pag.') or
            'Anexa nr.' in stripped or
            stripped.startswith('Capi-') or
            stripped.startswith('tol ') or
            (stripped.startswith('A ') and stripped.endswith('7')) or
            stripped.startswith('Denumire indicator') or
            not stripped)


def parse_formular_02(lines, start_idx, end_idx):
    """Parse F02 range into {(f01_section_code, title_code): [items]}.

    F02 has the same structure as F01 but with article/paragraph detail within each title.
    4-digit codes are section boundaries, 2-digit codes in TITLE_LABELS are title boundaries,
    other 2-digit codes within a title are items to extract.
    """
    items_by_key = {}  # (section_code, title_code) -> [items]

    current_section_code = None  # 4-digit code, mapped to F01 (last digit -> 0)
    current_title_code = None
    current_item = None
    in_parte = False  # Skip "parte" grouping sections

    i = start_idx
    while i < end_idx:
        stripped = lines[i].strip()

        if is_skip_line_f02(stripped):
            i += 1
            continue

        # Check for 4-digit section code
        m_section = re.match(r'^(\d{4})\s+(.+)', stripped)
        if m_section and is_section_code(m_section.group(1)):
            code = m_section.group(1)

            # Flush current item
            if current_item and current_section_code and current_title_code:
                key = (current_section_code, current_title_code)
                items_by_key.setdefault(key, []).append(current_item)
                current_item = None

            # Check if this is a "parte" grouping code (e.g., 5001, 5100, 6500)
            if code in PARTE_CODES:
                in_parte = True
                current_section_code = None
                current_title_code = None
                i += 1
                continue

            # Map F02 section code to F01: replace last digit with 0
            # e.g., 6601 -> 6600, 5601 -> 5600
            f01_code = code[:3] + '0'
            current_section_code = f01_code
            current_title_code = None
            in_parte = False
            i += 1
            continue

        # Check for CA line
        if stripped.startswith('I.Credite de angajament') or stripped.startswith('I. Credite de angajament'):
            vals = extract_values_7col(stripped, is_ca=True)
            if current_item:
                current_item['ca'] = vals
            i += 1
            continue

        # Check for CB line
        if stripped.startswith('II.Credite bugetare') or stripped.startswith('II. Credite bugetare'):
            vals = extract_values_7col(stripped, is_ca=False)
            if current_item:
                current_item['cb'] = vals
            i += 1
            continue

        # Check for 2-digit code line
        m_code = re.match(r'^(\d{2})\s+(.*)', stripped)
        if m_code and current_section_code:
            code = m_code.group(1)
            rest = m_code.group(2).strip()

            # Title boundary: code in TITLE_LABELS AND text is all-caps or starts with TITLUL
            # This distinguishes title "01 CHELTUIELI CURENTE" from article "01 Transferuri curente"
            is_title = (code in TITLE_LABELS and
                        (rest == rest.upper() or rest.startswith('TITLUL')))
            if is_title:
                # Title boundary — flush current item, start new title context
                if current_item and current_title_code:
                    key = (current_section_code, current_title_code)
                    items_by_key.setdefault(key, []).append(current_item)
                    current_item = None

                current_title_code = code
                i += 1
                continue

            # This is an item (article/paragraph) within the current title
            if current_title_code:
                # Flush previous item
                if current_item:
                    key = (current_section_code, current_title_code)
                    items_by_key.setdefault(key, []).append(current_item)

                # Start accumulating label (may span multiple lines)
                label_parts = [rest] if rest else []

                # Look ahead for continuation lines (not a code, not CB/CA, not empty)
                j = i + 1
                while j < end_idx:
                    next_stripped = lines[j].strip()
                    if (not next_stripped or
                        is_skip_line_f02(next_stripped) or
                        next_stripped.startswith('I.Credite') or
                        next_stripped.startswith('II.Credite') or
                        next_stripped.startswith('I. Credite') or
                        next_stripped.startswith('II. Credite') or
                        re.match(r'^\d{2}\s', next_stripped) or
                        re.match(r'^\d{4}\s', next_stripped)):
                        break
                    label_parts.append(next_stripped)
                    j += 1

                label = ' '.join(label_parts).strip()
                # Clean up label: remove "TITLUL" prefix artifacts
                label = re.sub(r'^TITLUL\s+[IVXLCDM]+\s+', '', label)

                current_item = {
                    'code': code,
                    'label': label,
                    'cb': [None]*6,
                    'ca': [None]*6,
                }
                i = j
                continue

        i += 1

    # Flush last item
    if current_item and current_section_code and current_title_code:
        key = (current_section_code, current_title_code)
        items_by_key.setdefault(key, []).append(current_item)

    return items_by_key


def filter_items(items):
    """Filter items: keep only non-zero CB 2026, remove subtotal groupings."""
    # First filter: non-zero CB 2026
    items = [it for it in items if it['cb'][2] is not None and it['cb'][2] != 0]

    if len(items) <= 1:
        return items

    # Remove grouping headers: if item's CB 2026 equals sum of next items' CB 2026
    filtered = []
    for idx, item in enumerate(items):
        val = item['cb'][2]
        if val is None:
            filtered.append(item)
            continue

        # Sum following items until we either exceed val or run out
        following_sum = 0
        found_match = False
        for j in range(idx + 1, len(items)):
            next_val = items[j]['cb'][2]
            if next_val is None:
                continue
            following_sum += next_val
            if following_sum == val:
                found_match = True
                break
            if following_sum > val:
                break

        if found_match and idx + 1 < len(items):
            # This is a subtotal — skip it
            continue
        filtered.append(item)

    return filtered


def merge_formular_02_into_01(institution, f02_items):
    """Merge F02 article items into the F01 title structure."""
    total_items = 0
    for section in institution['sections']:
        for title in section['titles']:
            key = (section['code'], title['code'])
            items = f02_items.get(key, [])
            if items:
                items = filter_items(items)
                if items:
                    title['items'] = items
                    total_items += len(items)
    return total_items


def extract_institution_full(md_path):
    """Extract full Formular 01 data from one institution's markdown file."""
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = [l.rstrip('\n') for l in f.readlines()]

    name = extract_name_from_header(lines)
    if not name:
        name = os.path.basename(md_path).replace('.md', '').replace('_', ' ')

    formular_range = find_formular_01_range(lines)
    if formular_range is None:
        return None

    start_idx, end_idx = formular_range
    sections = parse_formular_01(lines, start_idx, end_idx)

    if not sections:
        return None

    institution = {
        'id': make_id(os.path.basename(md_path).replace('.md', '')),
        'name': name,
        'sections': sections,
    }

    # Extract Formular 02 (optional — article-level detail)
    f02_range = find_formular_02_range(lines)
    n_items = 0
    if f02_range:
        f02_start, f02_end = f02_range
        f02_items = parse_formular_02(lines, f02_start, f02_end)
        n_items = merge_formular_02_into_01(institution, f02_items)

    institution['_n_items'] = n_items
    return institution


def cross_validate(institutions, ministry_data_path):
    """Compare extracted 5000 TOTAL CB 2026 against existing ministry_data.json."""
    if not os.path.exists(ministry_data_path):
        print("⚠ Cannot cross-validate: ministry_data.json not found")
        return

    with open(ministry_data_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    existing_by_file = {}
    for inst in existing.get('institutions', []):
        fname = inst.get('filename', '')
        existing_by_file[fname] = inst.get('cb_2026')

    total_new = 0
    mismatches = 0
    for inst in institutions:
        # Try to match by filename
        fname = inst['id']
        cb_2026 = None
        for s in inst['sections']:
            if s['code'] == '5000':
                cb_2026 = s['cb'][2]  # index 2 = 2026
                break

        if cb_2026 is not None:
            total_new += cb_2026

        existing_val = existing_by_file.get(fname)
        if existing_val is not None and cb_2026 is not None:
            if existing_val != cb_2026:
                print(f"  ⚠ MISMATCH {fname}: existing={existing_val}, new={cb_2026}")
                mismatches += 1

    print(f"\n  Cross-validation: Total CB 2026 = {total_new:,.0f} mii lei = {total_new/1_000_000:.2f} mld lei")
    print(f"  Mismatches: {mismatches}")


def main():
    md_dir = os.path.join('anexe', 'markdown', 'Anexa_3')
    md_files = sorted(f for f in os.listdir(md_dir) if f.endswith('.md'))

    institutions = []
    errors = []

    for md_file in md_files:
        md_path = os.path.join(md_dir, md_file)
        try:
            data = extract_institution_full(md_path)
            if data is None:
                errors.append({'file': md_file, 'error': 'No Formular 01 found'})
                print(f"✗ {md_file}: No Formular 01 found")
                continue

            n_sections = len(data['sections'])
            cb_2026 = None
            for s in data['sections']:
                if s['code'] == '5000':
                    cb_2026 = s['cb'][2]
                    break

            n_items = data.pop('_n_items', 0)
            institutions.append(data)
            print(f"✓ {md_file}: {n_sections} sections, {n_items} items, CB2026={cb_2026}")

        except Exception as e:
            errors.append({'file': md_file, 'error': str(e)})
            print(f"✗ {md_file}: ERROR {e}")
            import traceback
            traceback.print_exc()

    # Output
    output = {
        'meta': {
            'description': 'Formular 01 (SINTEZA) + Formular 02 (DETALIAT) from Anexa 3 budget PDFs',
            'units': 'mii lei (thousands of lei)',
            'years': ['2024', '2025', '2026', '2027', '2028', '2029'],
            'source': 'Romania 2026 state budget proposal',
        },
        'institutions': institutions,
    }

    output_path = os.path.join('src', 'data', 'budget-detail.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"Extracted: {len(institutions)} institutions")
    print(f"Errors: {len(errors)}")
    for e in errors:
        print(f"  - {e['file']}: {e['error']}")
    print(f"Output: {output_path}")
    print(f"Size: {os.path.getsize(output_path) / 1024:.0f} KB")

    # Cross-validate
    cross_validate(institutions, 'ministry_data.json')


if __name__ == '__main__':
    main()
