import sys
from pathlib import Path

pdf = Path(sys.argv[1])
out = Path(sys.argv[2])
try:
    from pypdf import PdfReader
except ImportError:
    print("Instale: pip install pypdf", file=sys.stderr)
    sys.exit(1)

text = "\n".join((p.extract_text() or "") for p in PdfReader(str(pdf)).pages)
out.write_text(text, encoding="utf-8")
print(len(text))
