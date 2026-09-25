"""Export the current Engine D-Carb page for temporary static hosting.

The full Flask app remains the source of truth. This export keeps its current
visuals but uses a WhatsApp handoff until a Python backend is deployed.
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app import create_app

OUTPUT = ROOT / "deploy" / "engine-dcarb-latest"
TEMP_DOMAIN = "snow-lobster-479932.hostingersite.com"
os.environ["ENGINE_DCARB_DOMAIN"] = TEMP_DOMAIN


def get_page(client, path):
    response = client.get(path, base_url=f"https://{TEMP_DOMAIN}")
    if response.status_code != 200:
        raise RuntimeError(f"{path} returned {response.status_code}")
    return response.get_data(as_text=True)


app = create_app()
with app.test_client() as client:
    page = get_page(client, "/engine-d-carb")
    centres_response = client.get("/api/engine-d-carb/centres")
    if centres_response.status_code != 200:
        raise RuntimeError("Could not export the current service centre list")
    centres = centres_response.get_json()
    legal_pages = {
        name: get_page(client, f"/engine-d-carb/{name}")
        for name in ("privacy-policy", "terms-and-conditions")
    }

# The server's data-storage language is not true for a static export.
page = page.replace(
    "Your information is stored for 24 months only after you accept the consent notice and submit.",
    "Your details stay in this browser until you choose to send them through WhatsApp.",
)
page = page.replace(
    "Submitting stores this request only after consent, then prepares the summary on this device.",
    "Submitting prepares a WhatsApp message. Nothing is stored on this website.",
)
page = page.replace(
    "Submitting saves the consented enquiry so our team can follow up.",
    "Submitting opens WhatsApp with your enquiry. Press Send there to contact the team.",
)
page = page.replace(
    "Thank you. Your enquiry has been received.",
    "Your enquiry is ready to send on WhatsApp.",
)
page = page.replace(
    "Your machine enquiry has been received.",
    "Your machine enquiry is ready to send on WhatsApp.",
).replace(
    "Your vehicle service enquiry has been received.",
    "Your vehicle service enquiry is ready to send on WhatsApp.",
)

source_js = (ROOT / "app" / "static" / "engine-integration.js").read_text(encoding="utf-8")
source_js = source_js.replace(
    "fetch('/api/engine-d-carb/centres',", "fetch('/static/engine-centres.json',"
)
source_js = source_js.replace(
    "I agree to Engine D-Carb and Care4Earth Enterprises storing my submitted details to prepare and manage my enquiry, and to receive transactional quotation and appointment updates on WhatsApp. I can request correction or deletion using the contact details on this website.",
    "I agree to share these details with Engine D-Carb through WhatsApp when I press Send there. This preview website does not store my enquiry.",
)
submit_start = source_js.index("  form.addEventListener('submit', async event => {")
submit_end = source_js.index("  }, true);", submit_start) + len("  }, true);")
static_submit = """  form.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const error = document.getElementById('enquiryError');
    if (!form.reportValidity()) {
      error.textContent = 'Complete the required fields and accept the WhatsApp handoff.';
      error.classList.add('visible');
      return;
    }
    const payload = new FormData(form);
    const kind = payload.get('enquiryType') === 'machine' ? 'Machine enquiry' : 'Service enquiry';
    const details = [...payload.entries()]
      .filter(([key, value]) => value && !['consent', 'emailQuote', 'enquiryType'].includes(key))
      .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase())}: ${value}`);
    const message = [`Engine D-Carb ${kind}`, '', ...details, '', 'Please contact me about this enquiry.'].join('\\n');
    const url = `https://wa.me/919607069191?text=${encodeURIComponent(message)}`;
    window.location.href = url;
    error.classList.remove('visible');
    completionStatus.textContent = 'WhatsApp opened. Press Send there to deliver your enquiry.';
    completionStatus.classList.remove('warning');
    completionStatus.hidden = false;
    dialog.close();
    enquirySection?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }, true);"""
source_js = source_js[:submit_start] + static_submit + source_js[submit_end:]

OUTPUT.mkdir(parents=True, exist_ok=True)
(OUTPUT / "index.html").write_text(page, encoding="utf-8")
for name, content in legal_pages.items():
    path = OUTPUT / "engine-d-carb" / name / "index.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

static = OUTPUT / "static"
static.mkdir(exist_ok=True)
shutil.copytree(ROOT / "app" / "static" / "engine-assets", static / "engine-assets", dirs_exist_ok=True)
for name in ("engine-integration.css", "engine-legal.css", "engine-legal.js"):
    shutil.copy2(ROOT / "app" / "static" / name, static / name)
(static / "engine-integration.js").write_text(source_js, encoding="utf-8")
(static / "engine-centres.json").write_text(json.dumps(centres, ensure_ascii=False), encoding="utf-8")

paths = re.findall(r'(?:src|href)="(/static/[^"?]+)', page)
missing = [path for path in paths if not (OUTPUT / path.lstrip("/")).is_file()]
if missing:
    raise RuntimeError(f"Missing referenced static files: {sorted(set(missing))}")

archive = ROOT / "deploy" / "engine-dcarb-latest-upload.zip"
if archive.exists():
    archive.unlink()
shutil.make_archive(str(archive.with_suffix("")), "zip", OUTPUT)
print(f"Exported current Engine D-Carb page to {archive}")
print(f"Included {len(centres.get('centres', []))} service centres and {len(paths)} asset references")
