"""Reconcile historical budget arithmetic; this does not forecast real sales."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def scenarios(config):
    price, cost = config["unit_price"], config["unit_cogs"]
    contribution = price - cost
    if contribution <= 0:
        raise ValueError("Scenario requires positive per-unit contribution")
    annual_other = 12 * config["monthly_consulting_revenue"]
    result = {"state": config["state"], "currency": config["currency"],
              "source_monthly_units_sum": sum(config["monthly_units_in_source"]),
              "contribution_per_unit": contribution,
              "hardware_gross_margin": contribution / price,
              "hardware_only_break_even_units": math.ceil(config["annual_fixed_costs"] / contribution),
              "scenarios": []}
    for name, units in [("source_stated_total", config["stated_annual_units"]),
                        ("source_monthly_row_sum", sum(config["monthly_units_in_source"]))]:
        result["scenarios"].append({"name": name, "units": units,
            "hardware_revenue": units * price, "hardware_cogs": units * cost,
            "hardware_contribution": units * contribution,
            "hardware_result_before_excluded_costs": units * contribution - config["annual_fixed_costs"],
            "consulting_revenue_without_cost_estimate": annual_other,
            "total_revenue_if_consulting_delivered": units * price + annual_other})
    return result


def main():
    config = json.loads((ROOT / "business/financial-assumptions.json").read_text(encoding="utf-8"))
    target = ROOT / "business/financial-scenarios.json"
    target.write_text(json.dumps(scenarios(config), indent=2) + "\n", encoding="utf-8", newline="\n")
    print("Reconciled planning scenarios written to business/financial-scenarios.json")


if __name__ == "__main__":
    main()
