"""Start the local research demo API used by apps/web /demo.

  python scripts/serve_demo_api.py
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from airton.ml.demo_api import main

if __name__ == "__main__":
    main()
