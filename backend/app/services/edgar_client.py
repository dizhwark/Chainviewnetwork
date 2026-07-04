"""Client for pulling 13F-HR institutional holdings data from SEC EDGAR.

SEC requires a descriptive User-Agent header (name + contact) on all
automated requests; see https://www.sec.gov/os/webmaster-faq#developers.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from xml.etree import ElementTree as ET

import httpx

from app.config import get_settings

settings = get_settings()

SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"
COMPANY_SEARCH_URL = "https://www.sec.gov/cgi-bin/browse-edgar"
ARCHIVES_BASE = "https://www.sec.gov/Archives/edgar/data"

_NAMESPACE_RE = re.compile(r"\{.*?\}")


def _strip_ns(tag: str) -> str:
    return _NAMESPACE_RE.sub("", tag)


def _client() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": settings.sec_user_agent, "Accept-Encoding": "gzip, deflate"},
        timeout=settings.http_timeout_seconds,
    )


@dataclass
class InstitutionMatch:
    cik: str
    name: str


@dataclass
class FilingSummary:
    accession_number: str
    form_type: str
    filing_date: date
    period_of_report: date


@dataclass
class HoldingRow:
    name_of_issuer: str
    cusip: str
    ticker: str | None
    value_usd: float
    shares: float


def search_institutions(name: str, limit: int = 10) -> list[InstitutionMatch]:
    """Search EDGAR's company search for 13F filers matching a name."""
    params = {
        "action": "getcompany",
        "company": name,
        "type": "13F-HR",
        "dateb": "",
        "owner": "include",
        "count": str(limit),
        "output": "atom",
    }
    with _client() as client:
        resp = client.get(COMPANY_SEARCH_URL, params=params)
        resp.raise_for_status()
    root = ET.fromstring(resp.content)
    matches: list[InstitutionMatch] = []
    for entry in root:
        if _strip_ns(entry.tag) != "entry":
            continue
        title = None
        cik = None
        for child in entry:
            tag = _strip_ns(child.tag)
            if tag == "title":
                title = child.text
            elif tag == "cik":
                cik = child.text
        if title and cik:
            matches.append(InstitutionMatch(cik=cik.zfill(10), name=title))
    return matches[:limit]


def normalize_cik(cik: str) -> str:
    return cik.strip().zfill(10)


def get_recent_13f_filings(cik: str, limit: int = 8) -> list[FilingSummary]:
    """Pull the most recent 13F-HR filings for a CIK from the submissions API."""
    cik = normalize_cik(cik)
    with _client() as client:
        resp = client.get(SUBMISSIONS_URL.format(cik=cik))
        resp.raise_for_status()
        data = resp.json()

    recent = data.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    accession_numbers = recent.get("accessionNumber", [])
    filing_dates = recent.get("filingDate", [])
    report_dates = recent.get("reportDate", [])

    filings: list[FilingSummary] = []
    for form, accn, fdate, rdate in zip(forms, accession_numbers, filing_dates, report_dates):
        if form not in ("13F-HR", "13F-HR/A"):
            continue
        filings.append(
            FilingSummary(
                accession_number=accn,
                form_type=form,
                filing_date=datetime.strptime(fdate, "%Y-%m-%d").date(),
                period_of_report=datetime.strptime(rdate, "%Y-%m-%d").date() if rdate else datetime.strptime(fdate, "%Y-%m-%d").date(),
            )
        )
        if len(filings) >= limit:
            break
    return filings


def _filing_index_url(cik: str, accession_number: str) -> str:
    accn_nodash = accession_number.replace("-", "")
    cik_int = str(int(cik))
    return f"{ARCHIVES_BASE}/{cik_int}/{accn_nodash}/"


def _find_infotable_document(client: httpx.Client, cik: str, accession_number: str) -> str:
    """Locate the XML information-table document within a filing's index."""
    accn_nodash = accession_number.replace("-", "")
    cik_int = str(int(cik))
    index_json_url = f"{ARCHIVES_BASE}/{cik_int}/{accn_nodash}/index.json"
    resp = client.get(index_json_url)
    resp.raise_for_status()
    items = resp.json().get("directory", {}).get("item", [])
    candidates = [item["name"] for item in items if item["name"].lower().endswith(".xml")]
    info_candidates = [n for n in candidates if "info" in n.lower() or "table" in n.lower()]
    chosen = info_candidates[0] if info_candidates else (candidates[-1] if candidates else None)
    if not chosen:
        raise ValueError(f"No XML info table found for accession {accession_number}")
    return f"{ARCHIVES_BASE}/{cik_int}/{accn_nodash}/{chosen}"


def get_holdings_for_filing(cik: str, accession_number: str) -> list[HoldingRow]:
    """Fetch and parse the information table (Form 13F holdings) for a given filing."""
    cik = normalize_cik(cik)
    with _client() as client:
        doc_url = _find_infotable_document(client, cik, accession_number)
        resp = client.get(doc_url)
        resp.raise_for_status()
    root = ET.fromstring(resp.content)

    holdings: list[HoldingRow] = []
    for info_table in root:
        if _strip_ns(info_table.tag) != "infoTable":
            continue
        fields: dict[str, str] = {}
        for child in info_table:
            tag = _strip_ns(child.tag)
            if tag == "shrsOrPrnAmt":
                for sub in child:
                    fields[_strip_ns(sub.tag)] = sub.text or ""
            else:
                fields[tag] = child.text or ""

        try:
            value_usd = float(fields.get("value", "0")) * 1000.0  # reported in thousands of USD
            shares = float(fields.get("sshPrnamt", "0"))
        except ValueError:
            continue

        holdings.append(
            HoldingRow(
                name_of_issuer=fields.get("nameOfIssuer", "UNKNOWN"),
                cusip=fields.get("cusip", ""),
                ticker=None,
                value_usd=value_usd,
                shares=shares,
            )
        )
    return holdings
