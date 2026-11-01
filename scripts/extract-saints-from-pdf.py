"""Extrai texto do calendário de santos (PDF) para stdout."""
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf  # type: ignore

default = Path(__file__).resolve().parent.parent / "src/data/calendario_santos_catolicos_amostra.pdf"
pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default
if not pdf_path.is_file():
    print(f"Arquivo não encontrado: {pdf_path}", file=sys.stderr)
    sys.exit(1)

doc = pymupdf.open(pdf_path)
text = "\n".join(page.get_text() for page in doc)
sys.stdout.write(text)
