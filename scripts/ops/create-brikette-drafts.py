#!/usr/bin/env python3
"""
Brikette draft creation fallback CLI.

Creates branded Gmail drafts directly via Gmail REST API, bypassing the MCP
server when needed. It also supports dry-run mode to queue draft payloads to a
local JSONL file so work is not lost.

Examples:
  python3 scripts/ops/create-brikette-drafts.py --input scripts/ops/brikette-drafts.example.json
  python3 scripts/ops/create-brikette-drafts.py --input /tmp/drafts.json --dry-run

Input schema (array or {"drafts":[...]}):
  {
    "emailId": "gmail-message-id-optional",
    "to": "guest@example.com",
    "subject": "RE: ...",
    "recipientName": "Guest name (optional)",
    "bodyPlain": "Plain-text email body"
  }
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError as error:
    print(
        "ERROR: missing dependency 'requests'. Install with: pip install requests",
        file=sys.stderr,
    )
    raise SystemExit(1) from error

GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def default_token_path() -> Path:
    return repo_root() / "packages" / "mcp-server" / "token.json"


def default_queue_path() -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return repo_root() / "data" / "email-fallback-queue" / f"draft-queue-{timestamp}.jsonl"


HOSTEL_URL = "http://www.hostel-positano.com"
INSTAGRAM_URL = "https://www.instagram.com/brikettepositano/"
TIKTOK_URL = "https://www.tiktok.com/tag/hostelbrikettepositano"
TERMS_URL = "https://docs.google.com/document/d/1d1nZUJfYQ22eOAqwL2C49BQbDRAAVAQaEZ9n-SGPKd4/edit?usp=sharing"

IMG = {
    "cristiana_avif": "https://drive.google.com/uc?export=view&id=1Feprulv2wdfEPdLSvt4gNbqBuwQV-2pE",
    "cristiana_png": "https://drive.google.com/uc?export=view&id=1rui6txmiCVQyjHjeeIy2mhBkVy8SUWoT",
    "peter_avif": "https://drive.google.com/uc?export=view&id=1DaBrFp7xGwS7TKa9HJJ775hPPrNNHNb6",
    "peter_png": "https://drive.google.com/uc?export=view&id=1I5JmosQCGJaZ8IhelaIMHGoRajdggRAv",
    "icon_avif": "https://drive.google.com/uc?export=view&id=1GRga7agHHKy8e_qaGdMIDi8k9GvEyAaM",
    "icon_png": "https://drive.google.com/uc?export=view&id=10tnNnRPv_Pkyd8Dpi0ZmA7wQuJbqyMxs",
    "ig_avif": "https://drive.google.com/uc?export=view&id=1fzjT7Y37yxnGfHlPHy0raFjRulbD4FL-",
    "ig_png": "https://drive.google.com/uc?export=view&id=162ppeYFiCYJHi0r7kWvMlTDoF55EW2nL",
    "tt_avif": "https://drive.google.com/uc?export=view&id=1n7n3drroYmhBW4NK92Gc_yT0Jc1m1tNH",
    "tt_png": "https://drive.google.com/uc?export=view&id=1UPQrHmjzT9eueAWBunLVy27oo6YJFzsu",
}

C = {
    "header": "#ffc107",
    "main": "#fff3cd",
    "signature": "#ffeeba",
    "footer": "#fff3cd",
    "text": "#856404",
    "white": "#ffffff",
    "link": "#000000",
}


@dataclass
class DraftInput:
    to: str
    subject: str
    recipient_name: str
    body_plain: str
    email_id: str | None


@dataclass
class DraftResult:
    index: int
    to: str
    subject: str
    status: str
    mode: str
    draft_id: str | None
    error: str | None
    source_email_id: str | None
    body_plain: str
    body_html: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Create Brikette branded Gmail drafts from a JSON input payload, "
            "or queue rendered drafts locally with --dry-run."
        )
    )
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Path to JSON file containing draft payloads.",
    )
    parser.add_argument(
        "--token-path",
        type=Path,
        default=default_token_path(),
        help="Path to Gmail OAuth token JSON (default: packages/mcp-server/token.json).",
    )
    parser.add_argument(
        "--queue-file",
        type=Path,
        default=default_queue_path(),
        help="Path for JSONL output artifact.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not call Gmail API; only render branded drafts and write queue file.",
    )
    return parser.parse_args()


def load_input(path: Path) -> list[DraftInput]:
    if not path.exists():
        raise ValueError(f"Input file not found: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"Input is not valid JSON: {error}") from error

    records = payload.get("drafts") if isinstance(payload, dict) else payload
    if not isinstance(records, list):
        raise ValueError("Input must be a JSON array or an object with a 'drafts' array")

    drafts: list[DraftInput] = []
    for index, item in enumerate(records, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Draft #{index}: expected object, got {type(item).__name__}")

        to = normalize_text(item.get("to"))
        subject = normalize_text(item.get("subject"))
        recipient_name = normalize_text(item.get("recipientName") or item.get("name"))
        body_plain = normalize_text(item.get("bodyPlain") or item.get("body"))
        email_id = normalize_text(item.get("emailId")) or None

        missing: list[str] = []
        if not to:
            missing.append("to")
        if not subject:
            missing.append("subject")
        if not body_plain:
            missing.append("bodyPlain")
        if missing:
            raise ValueError(f"Draft #{index}: missing required field(s): {', '.join(missing)}")

        drafts.append(
            DraftInput(
                to=to,
                subject=subject,
                recipient_name=recipient_name,
                body_plain=body_plain,
                email_id=email_id,
            )
        )

    if not drafts:
        raise ValueError("Input contains no drafts")

    return drafts


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        return str(value).strip()
    return value.strip()


def load_token(path: Path) -> dict[str, str]:
    if not path.exists():
        raise ValueError(f"Token file not found: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"Token file is not valid JSON: {error}") from error

    required_keys = ("client_id", "client_secret", "refresh_token")
    missing = [key for key in required_keys if not normalize_text(payload.get(key))]
    if missing:
        raise ValueError(f"Token file missing required key(s): {', '.join(missing)}")

    return {
        "client_id": payload["client_id"],
        "client_secret": payload["client_secret"],
        "refresh_token": payload["refresh_token"],
    }


def refresh_access_token(token_payload: dict[str, str]) -> str:
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": token_payload["client_id"],
            "client_secret": token_payload["client_secret"],
            "refresh_token": token_payload["refresh_token"],
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    response.raise_for_status()

    data = response.json()
    access_token = normalize_text(data.get("access_token"))
    if not access_token:
        raise RuntimeError("OAuth token response did not include access_token")

    return access_token


def get_thread_info(headers: dict[str, str], email_id: str) -> tuple[str | None, str | None, str | None]:
    response = requests.get(
        f"{GMAIL_API}/messages/{email_id}",
        params={
            "format": "metadata",
            "metadataHeaders": ["Message-ID", "References"],
        },
        headers=headers,
        timeout=30,
    )
    response.raise_for_status()

    data = response.json()
    envelope_headers = data.get("payload", {}).get("headers", [])
    message_id = next(
        (
            header.get("value")
            for header in envelope_headers
            if normalize_text(header.get("name")).lower() == "message-id"
        ),
        None,
    )
    references = next(
        (
            header.get("value")
            for header in envelope_headers
            if normalize_text(header.get("name")).lower() == "references"
        ),
        None,
    )
    thread_id = data.get("threadId")
    return thread_id, message_id, references


def create_gmail_draft(
    headers: dict[str, str],
    to: str,
    subject: str,
    body_plain: str,
    body_html: str,
    thread_id: str | None,
    in_reply_to: str | None,
    references: str | None,
) -> str:
    message = MIMEMultipart("alternative")
    message["To"] = to
    message["Subject"] = subject
    if in_reply_to:
        message["In-Reply-To"] = in_reply_to
        message["References"] = f"{references} {in_reply_to}".strip() if references else in_reply_to

    message.attach(MIMEText(body_plain, "plain", "utf-8"))
    message.attach(MIMEText(body_html, "html", "utf-8"))

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode().rstrip("=")
    payload: dict[str, Any] = {
        "message": {
            "raw": raw,
        }
    }
    if thread_id:
        payload["message"]["threadId"] = thread_id

    response = requests.post(
        f"{GMAIL_API}/drafts",
        json=payload,
        headers={**headers, "Content-Type": "application/json"},
        timeout=30,
    )
    response.raise_for_status()

    draft_id = normalize_text(response.json().get("id"))
    if not draft_id:
        raise RuntimeError("Gmail API did not return draft id")

    return draft_id


def pic(avif: str, png: str, alt: str, style: str) -> str:
    return (
        f'<picture><source srcset="{avif}" type="image/avif">'
        f'<source srcset="{png}" type="image/png">'
        f'<img src="{png}" alt="{alt}" style="{style}" border="0"></picture>'
    )


def body_to_html(text: str) -> str:
    paragraphs = [paragraph.strip() for paragraph in text.split("\n\n") if paragraph.strip()]
    return "\n".join(
        f'<p style="margin: 0 0 15px 0;">{paragraph.replace(chr(10), "<br>")}</p>'
        for paragraph in paragraphs
    )


def generate_html(recipient_name: str, body_text: str, subject: str) -> str:
    body = body_text.strip()
    greeting_match = re.match(r"^(Dear\s+[^,\n]+,)\s*", body, re.IGNORECASE)

    if greeting_match:
        greeting = greeting_match.group(1)
        if re.match(r"^Dear\s+Guest,?$", greeting, re.IGNORECASE) and recipient_name:
            greeting = f"Dear {recipient_name},"
        body = body[greeting_match.end() :].strip()
    else:
        greeting = f"Dear {recipient_name}," if recipient_name else "Dear Guest,"

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
          <a href="{HOSTEL_URL}" style="text-decoration:none;">{pic(IMG['icon_avif'], IMG['icon_png'], 'Hostel Icon', 'width:50px;height:auto;display:block;')}</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="background-color:{C['main']};color:{C['text']};padding:20px 30px 30px 30px;font-family:Arial,sans-serif;">
      <p style="margin:0 0 15px 0;font-size:15px;line-height:1.5;">{greeting}</p>
      <div style="font-size:15px;line-height:1.5;">{body_html}</div>
    </td></tr>
    <tr><td style="background-color:{C['signature']};padding:20px 30px 30px 30px;font-family:Arial,sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td align="center" style="width:50%;">{pic(IMG['cristiana_avif'], IMG['cristiana_png'], "Cristiana's Signature", 'width:200px;height:auto;')}</td>
        <td align="center" style="width:50%;">{pic(IMG['peter_avif'], IMG['peter_png'], "Peter's Signature", 'width:200px;height:auto;')}</td>
      </tr></table>
    </td></tr>
    <tr><td style="background-color:{C['footer']};padding:30px;font-family:Arial,sans-serif;color:{C['link']};">
      <p style="margin:0 0 10px 0;font-size:13px;">Book directly for exclusive benefits. <a href="{TERMS_URL}" style="color:{C['link']};text-decoration:underline;">Terms and conditions</a> apply.</p>
      <p style="margin:20px 0 10px 0;text-align:center;font-weight:bold;">Find out More about Us</p>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td align="center" style="width:33%;"><a href="{INSTAGRAM_URL}" style="text-decoration:none;color:{C['link']};">{pic(IMG['ig_avif'], IMG['ig_png'], 'Instagram', 'width:50px;height:auto;display:block;margin:0 auto 8px auto;')}<div style="font-weight:bold;font-size:12px;">Instagram</div></a></td>
        <td align="center" style="width:33%;"><a href="{HOSTEL_URL}" style="text-decoration:none;color:{C['link']};">{pic(IMG['icon_avif'], IMG['icon_png'], "Hostel's Website", 'width:50px;height:auto;display:block;margin:0 auto 8px auto;')}<div style="font-weight:bold;font-size:12px;">Hostel's Website</div></a></td>
        <td align="center" style="width:33%;"><a href="{TIKTOK_URL}" style="text-decoration:none;color:{C['link']};">{pic(IMG['tt_avif'], IMG['tt_png'], 'TikTok', 'width:50px;height:auto;display:block;margin:0 auto 8px auto;')}<div style="font-weight:bold;font-size:12px;">TikTok</div></a></td>
      </tr></table>
    </td></tr>
  </table>
</td></tr></table>
</body></html>"""


def serialize_result(result: DraftResult) -> dict[str, Any]:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "index": result.index,
        "mode": result.mode,
        "status": result.status,
        "error": result.error,
        "sourceEmailId": result.source_email_id,
        "gmailDraftId": result.draft_id,
        "to": result.to,
        "subject": result.subject,
        "bodyPlain": result.body_plain,
        "bodyHtml": result.body_html,
    }


def write_queue_file(queue_file: Path, results: list[DraftResult]) -> None:
    queue_file.parent.mkdir(parents=True, exist_ok=True)
    with queue_file.open("w", encoding="utf-8") as handle:
        for result in results:
            handle.write(json.dumps(serialize_result(result), ensure_ascii=False))
            handle.write("\n")


def process_drafts(args: argparse.Namespace) -> int:
    drafts = load_input(args.input)

    headers: dict[str, str] | None = None
    mode = "dry-run" if args.dry_run else "gmail-create"

    if not args.dry_run:
        token_payload = load_token(args.token_path)
        access_token = refresh_access_token(token_payload)
        headers = {"Authorization": f"Bearer {access_token}"}

    results: list[DraftResult] = []

    for index, draft in enumerate(drafts, start=1):
        print(f"[{index}/{len(drafts)}] {draft.to} :: {draft.subject}")

        body_html = generate_html(draft.recipient_name, draft.body_plain, draft.subject)
        draft_id: str | None = None
        status = "ok"
        error_message: str | None = None

        if not args.dry_run:
            assert headers is not None
            thread_id: str | None = None
            in_reply_to: str | None = None
            references: str | None = None

            try:
                if draft.email_id:
                    thread_id, in_reply_to, references = get_thread_info(headers, draft.email_id)

                draft_id = create_gmail_draft(
                    headers=headers,
                    to=draft.to,
                    subject=draft.subject,
                    body_plain=draft.body_plain,
                    body_html=body_html,
                    thread_id=thread_id,
                    in_reply_to=in_reply_to,
                    references=references,
                )
                print(f"  created Gmail draft: {draft_id}")
            except Exception as error:  # pylint: disable=broad-except
                status = "error"
                error_message = str(error)
                print(f"  ERROR: {error_message}", file=sys.stderr)
        else:
            print("  queued (dry-run)")

        results.append(
            DraftResult(
                index=index,
                to=draft.to,
                subject=draft.subject,
                status=status,
                mode=mode,
                draft_id=draft_id,
                error=error_message,
                source_email_id=draft.email_id,
                body_plain=draft.body_plain,
                body_html=body_html,
            )
        )

    write_queue_file(args.queue_file, results)

    ok_count = sum(1 for result in results if result.status == "ok")
    error_count = len(results) - ok_count

    print("\nSummary")
    print(f"  mode: {mode}")
    print(f"  total: {len(results)}")
    print(f"  ok: {ok_count}")
    print(f"  errors: {error_count}")
    print(f"  queue file: {args.queue_file}")

    return 1 if error_count > 0 and not args.dry_run else 0


def main() -> int:
    args = parse_args()
    try:
        return process_drafts(args)
    except Exception as error:  # pylint: disable=broad-except
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
