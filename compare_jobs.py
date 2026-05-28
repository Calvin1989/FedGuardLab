import argparse

from fedguardlab.reporting.comparison import generate_comparison_report


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a FedGuardLab comparison report from multiple job IDs."
    )

    parser.add_argument(
        "job_ids",
        nargs="+",
        help="Job IDs to compare.",
    )

    parser.add_argument(
        "--title",
        default="Robust Aggregation Comparison",
        help="Comparison report title.",
    )

    args = parser.parse_args()

    output_path = generate_comparison_report(
        job_ids=args.job_ids,
        title=args.title,
    )

    print(f"Comparison report generated: {output_path}")


if __name__ == "__main__":
    main()
