import argparse
import shutil
from pathlib import Path

REPORTS_DIR = Path("reports")
JOBS_DIR = REPORTS_DIR / "jobs"
COMPARISONS_DIR = REPORTS_DIR / "comparisons"


def remove_children(path: Path) -> int:
    if not path.exists():
        return 0

    count = 0

    for item in path.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
            count += 1
        else:
            item.unlink()
            count += 1

    return count


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clean generated FedGuardLab report artifacts."
    )

    parser.add_argument(
        "--jobs",
        action="store_true",
        help="Clean reports/jobs.",
    )

    parser.add_argument(
        "--comparisons",
        action="store_true",
        help="Clean reports/comparisons.",
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="Clean all generated reports.",
    )

    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip confirmation.",
    )

    args = parser.parse_args()

    clean_jobs = args.jobs or args.all
    clean_comparisons = args.comparisons or args.all

    if not clean_jobs and not clean_comparisons:
        print("Nothing selected. Use --jobs, --comparisons, or --all.")
        return

    targets = []

    if clean_jobs:
        targets.append(JOBS_DIR)

    if clean_comparisons:
        targets.append(COMPARISONS_DIR)

    print("The following generated report directories will be cleaned:")

    for target in targets:
        print(f"- {target}")

    if not args.yes:
        answer = input("Continue? [y/N]: ").strip().lower()

        if answer not in {"y", "yes"}:
            print("Cancelled.")
            return

    total_removed = 0

    for target in targets:
        removed = remove_children(target)
        total_removed += removed
        target.mkdir(parents=True, exist_ok=True)
        print(f"Cleaned {target}: removed {removed} item(s).")

    print(f"Done. Total removed: {total_removed} item(s).")


if __name__ == "__main__":
    main()
