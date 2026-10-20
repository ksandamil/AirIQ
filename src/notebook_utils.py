from pathlib import Path
import sys

def find_project_root(start=None):
    start = Path(start or Path.cwd()).resolve()
    for candidate in [start, *start.parents]:
        if (candidate / "src" / "project_config.py").is_file():
            return candidate
    raise FileNotFoundError(
        "Project root not found. Run the notebook inside the project folder."
    )

PROJECT_ROOT = find_project_root()
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
