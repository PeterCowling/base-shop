#!/usr/bin/env python3
"""
Brikette email draft fallback tool.

Creates branded Gmail drafts directly via Gmail REST API, bypassing the MCP
pipeline. Use when the MCP server is unavailable (e.g. in a continued/compacted
Claude Code session).

Usage:
  python3 scripts/ops/create-brikette-drafts.py

Prerequisites:
  - pip install requests
  - packages/mcp-server/token.json must exist with a valid refresh_token

To add or edit emails, update the DRAFTS list near the bottom of this file.
"""

import json
import base64
import re
import sys
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ─── Load credentials ──────────────────────────────────────────────────────────
with open('/Users/petercowling/base-shop/packages/mcp-server/token.json') as f:
    creds = json.load(f)

# ─── Refresh access token ──────────────────────────────────────────────────────
resp = requests.post('https://oauth2.googleapis.com/token', data={
    'client_id': creds['client_id'],
    'client_secret': creds['client_secret'],
    'refresh_token': creds['refresh_token'],
    'grant_type': 'refresh_token',
})
resp.raise_for_status()
access_token = resp.json()['access_token']
auth_headers = {'Authorization': f'Bearer {access_token}'}
print(f"✓ Got access token (expires in {resp.json().get('expires_in', '?')}s)")

# ─── Gmail API helpers ─────────────────────────────────────────────────────────
GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

def get_thread_info(email_id):
    r = requests.get(f'{GMAIL_API}/messages/{email_id}', params={
        'format': 'metadata',
        'metadataHeaders': ['Message-ID', 'References'],
    }, headers=auth_headers)
    r.raise_for_status()
    data = r.json()
    headers = data.get('payload', {}).get('headers', [])
    msg_id = next((h['value'] for h in headers if h['name'].lower() == 'message-id'), None)
    refs = next((h['value'] for h in headers if h['name'].lower() == 'references'), None)
    thread_id = data.get('threadId')
    return thread_id, msg_id, refs

def create_gmail_draft(to, subject, body_plain, body_html, thread_id, in_reply_to=None, references=None):
    msg = MIMEMultipart('alternative')
    msg['To'] = to
    msg['Subject'] = subject
    if in_reply_to:
        msg['In-Reply-To'] = in_reply_to
        msg['References'] = f'{references} {in_reply_to}'.strip() if references else in_reply_to

    msg.attach(MIMEText(body_plain, 'plain', 'utf-8'))
    msg.attach(MIMEText(body_html, 'html', 'utf-8'))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode().rstrip('=')

    r = requests.post(f'{GMAIL_API}/drafts', json={
        'message': {'raw': raw, 'threadId': thread_id}
    }, headers={**auth_headers, 'Content-Type': 'application/json'})
    r.raise_for_status()
    return r.json()

# ─── Branded HTML template (mirrors email-template.ts generateEmailHtml) ───────
HOSTEL_URL    = 'http://www.hostel-positano.com'
INSTAGRAM_URL = 'https://www.instagram.com/brikettepositano/'
TIKTOK_URL    = 'https://www.tiktok.com/tag/hostelbrikettepositano'
TERMS_URL     = 'https://docs.google.com/document/d/1d1nZUJfYQ22eOAqwL2C49BQbDRAAVAQaEZ9n-SGPKd4/edit?usp=sharing'

IMG = {
    'cristiana_avif': 'https://drive.google.com/uc?export=view&id=1Feprulv2wdfEPdLSvt4gNbqBuwQV-2pE',
    'cristiana_png':  'https://drive.google.com/uc?export=view&id=1rui6txmiCVQyjHjeeIy2mhBkVy8SUWoT',
    'peter_avif':     'https://drive.google.com/uc?export=view&id=1DaBrFp7xGwS7TKa9HJJ775hPPrNNHNb6',
    'peter_png':      'https://drive.google.com/uc?export=view&id=1I5JmosQCGJaZ8IhelaIMHGoRajdggRAv',
    'icon_avif':      'https://drive.google.com/uc?export=view&id=1GRga7agHHKy8e_qaGdMIDi8k9GvEyAaM',
    'icon_png':       'https://drive.google.com/uc?export=view&id=10tnNnRPv_Pkyd8Dpi0ZmA7wQuJbqyMxs',
    'ig_avif':        'https://drive.google.com/uc?export=view&id=1fzjT7Y37yxnGfHlPHy0raFjRulbD4FL-',
    'ig_png':         'https://drive.google.com/uc?export=view&id=162ppeYFiCYJHi0r7kWvMlTDoF55EW2nL',
    'tt_avif':        'https://drive.google.com/uc?export=view&id=1n7n3drroYmhBW4NK92Gc_yT0Jc1m1tNH',
    'tt_png':         'https://drive.google.com/uc?export=view&id=1UPQrHmjzT9eueAWBunLVy27oo6YJFzsu',
}

C = {
    'header': '#ffc107', 'main': '#fff3cd', 'signature': '#ffeeba',
    'footer': '#fff3cd', 'text': '#856404', 'white': '#ffffff', 'link': '#000000',
}

def pic(avif, png, alt, style):
    return (f'<picture><source srcset="{avif}" type="image/avif">'
            f'<source srcset="{png}" type="image/png">'
            f'<img src="{png}" alt="{alt}" style="{style}" border="0"></picture>')

def body_to_html(text):
    paras = [p.strip() for p in text.split('\n\n') if p.strip()]
    return '\n'.join(f'<p style="margin: 0 0 15px 0;">{p.replace(chr(10), "<br>")}</p>' for p in paras)

def generate_html(recipient_name, body_text, subject='Hostel Brikette'):
    body = body_text.strip()
    m = re.match(r'^(Dear\s+[^,\n]+,)\s*', body, re.IGNORECASE)
    if m:
        greeting = m.group(1)
        if re.match(r'^Dear\s+Guest,?$', greeting, re.IGNORECASE) and recipient_name:
            greeting = f'Dear {recipient_name},'
        body = body[m.end():].strip()
    else:
        greeting = f'Dear {recipient_name},' if recipient_name else 'Dear Guest,'

    body_html = body_to_html(body)

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>{subject}</title></head>
<body style="margin:0;padding:0;background-color:{C['white']};">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:{C['white']};">
<tr><td align="center">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;">
    <tr><td style="background-color:{C['header']};padding:30px 25px 0 25px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td align="left" style="font-family:Arial,sans-serif;color:{C['white']};">
          <p style="margin:0;font-size:24px;font-weight:bold;">Hostel Bri&#8203;kett&#101;</p>
          <p style="margin:0;font-size:20px;font-weight:bold;">Positano</p>
        </td>
        <td align="right" style="width:80px;">
          <a href="{HOSTEL_URL}" style="text-decoration:none;">{pic(IMG['icon_avif'],IMG['icon_png'],'Hostel Icon','width:50px;height:auto;display:block;')}</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="background-color:{C['main']};color:{C['text']};padding:20px 30px 30px 30px;font-family:Arial,sans-serif;">
      <p style="margin:0 0 15px 0;font-size:15px;line-height:1.5;">{greeting}</p>
      <div style="font-size:15px;line-height:1.5;">{body_html}</div>
    </td></tr>
    <tr><td style="background-color:{C['signature']};padding:20px 30px 30px 30px;font-family:Arial,sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td align="center" style="width:50%;">{pic(IMG['cristiana_avif'],IMG['cristiana_png'],"Cristiana's Signature",'width:200px;height:auto;')}</td>
        <td align="center" style="width:50%;">{pic(IMG['peter_avif'],IMG['peter_png'],"Peter's Signature",'width:200px;height:auto;')}</td>
      </tr></table>
    </td></tr>
    <tr><td style="background-color:{C['footer']};padding:30px;font-family:Arial,sans-serif;color:{C['link']};">
      <p style="margin:0 0 10px 0;font-size:13px;">Book directly for exclusive benefits. <a href="{TERMS_URL}" style="color:{C['link']};text-decoration:underline;">Terms and conditions</a> apply.</p>
      <p style="margin:20px 0 10px 0;text-align:center;font-weight:bold;">Find out More about Us</p>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td align="center" style="width:33%;"><a href="{INSTAGRAM_URL}" style="text-decoration:none;color:{C['link']};">{pic(IMG['ig_avif'],IMG['ig_png'],'Instagram','width:50px;height:auto;display:block;margin:0 auto 8px auto;')}<div style="font-weight:bold;font-size:12px;">Instagram</div></a></td>
        <td align="center" style="width:33%;"><a href="{HOSTEL_URL}" style="text-decoration:none;color:{C['link']};">{pic(IMG['icon_avif'],IMG['icon_png'],"Hostel's Website",'width:50px;height:auto;display:block;margin:0 auto 8px auto;')}<div style="font-weight:bold;font-size:12px;">Hostel's Website</div></a></td>
        <td align="center" style="width:33%;"><a href="{TIKTOK_URL}" style="text-decoration:none;color:{C['link']};">{pic(IMG['tt_avif'],IMG['tt_png'],'TikTok','width:50px;height:auto;display:block;margin:0 auto 8px auto;')}<div style="font-weight:bold;font-size:12px;">TikTok</div></a></td>
      </tr></table>
    </td></tr>
  </table>
</td></tr></table>
</body></html>"""

# ─── Email content for each draft ──────────────────────────────────────────────
DRAFTS = [
    {
        'emailId': '19c65dbb4a9f26f3',
        'to':      'daniel.a.schmidt@gmx.de',
        'subject': 'RE: Your Hostel Brikette Reservation',
        'name':    'Daniel',
        'body':    (
            "Dear Daniel,\n\n"
            "Thank you for following up.\n\n"
            "Please rest assured that your booking for 13th April (ref: MA4BJ9) is confirmed, "
            "pending payment. We will attempt to process the card payment shortly and will send "
            "you confirmation as soon as it has been successful.\n\n"
            "If you have any questions in the meantime, please do not hesitate to get in touch.\n\n"
            "We look forward to welcoming you to Hostel Brikette, Positano.\n\n"
            "Warm regards,\nPeter & Cristiana\nHostel Brikette, Positano"
        ),
    },
    {
        'emailId': '19c639382878942c',
        'to':      '5979135118-tbax.crnb.wzzm.vynw@guest.booking.com',
        'subject': 'RE: We received this message from ADRIANA TESTA',
        'name':    'Adriana',
        'body':    (
            "Querida Adriana,\n\n"
            "¡Gracias por tu mensaje!\n\n"
            "Hemos tomado nota de tu preferencia por una cama de abajo. Haremos todo lo posible "
            "para asignarte una cama baja para tu estancia del 5 al 8 de mayo "
            "(reserva: 5979135118).\n\n"
            "Esperamos verte pronto en el Hostal Brikette, Positano.\n\n"
            "Un saludo,\nPeter & Cristiana\nHostel Brikette, Positano"
        ),
    },
    {
        'emailId': '19c5771039b22fce',
        'to':      'hayden04.roberts@hotmail.co.uk',
        'subject': 'RE: Jobs at the Hostel',
        'name':    'Hayden',
        'body':    (
            "Dear Hayden,\n\n"
            "Thank you for reaching out — we are glad to hear you are interested in working "
            "at Hostel Brikette!\n\n"
            "We do occasionally take on staff, typically for the main season (April through October). "
            "If you would like to be considered, please send us a brief introduction about yourself "
            "— your background, any relevant experience (hospitality, travel, languages), and when "
            "you would be available to start.\n\n"
            "We will keep your details on file and be in touch if a suitable opportunity arises.\n\n"
            "Warm regards,\nPeter & Cristiana\nHostel Brikette, Positano"
        ),
    },
    {
        'emailId': '19c493c29db698eb',
        'to':      'info@leomilla.com',
        'subject': 'RE: Richiesta gruppo',
        'name':    'Agnes',
        'body':    (
            "Cara Agnes,\n\n"
            "Grazie per la rettifica!\n\n"
            "Abbiamo aggiornato la vostra richiesta con le date corrette: "
            "check-in 11 marzo, check-out 13 marzo (2 notti).\n\n"
            "Verificheremo la disponibilità per il vostro gruppo "
            "(11 studenti + 3 accompagnatori) e vi risponderemo al più presto "
            "con le opzioni disponibili.\n\n"
            "Cordiali saluti,\nPeter & Cristiana\nHostel Brikette, Positano"
        ),
    },
    {
        'emailId': '19c39f6180fd5e53',
        'to':      'alexinac@icloud.com',
        'subject': 'RE: Your Hostel Brikette Reservation',
        'name':    'Alexina',
        'body':    (
            "Dear Alexina,\n\n"
            "Great news — your room is fully pre-paid (booking ref: 7763-574302348), "
            "so there is nothing more to pay for accommodation when you arrive on 15th May.\n\n"
            "However, there are two small items payable in cash on arrival:\n\n"
            "City tax: €2.50 per person per night = €22.50 total (3 guests × 3 nights)\n"
            "Key card deposit: €10 per key card\n\n"
            "Other than these small cash items, you are all set! We look forward to "
            "welcoming you and your group.\n\n"
            "Warm regards,\nPeter & Cristiana\nHostel Brikette, Positano"
        ),
    },
]

# ─── Create drafts ─────────────────────────────────────────────────────────────
results = []
for d in DRAFTS:
    print(f"\n→ {d['name']} ({d['to'][:40]})")
    try:
        thread_id, msg_id, refs = get_thread_info(d['emailId'])
        body_html = generate_html(d['name'], d['body'], d['subject'])
        result = create_gmail_draft(
            to=d['to'],
            subject=d['subject'],
            body_plain=d['body'],
            body_html=body_html,
            thread_id=thread_id,
            in_reply_to=msg_id,
            references=refs,
        )
        draft_id = result.get('id', '?')
        print(f"  ✓ Draft created: {draft_id}")
        results.append({'name': d['name'], 'draftId': draft_id, 'status': '✓'})
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        results.append({'name': d['name'], 'draftId': None, 'status': f'✗ {e}'})

print("\n\n══════════ Summary ══════════")
for r in results:
    print(f"  {r['status']}  {r['name']:10s}  {r['draftId'] or 'FAILED'}")
