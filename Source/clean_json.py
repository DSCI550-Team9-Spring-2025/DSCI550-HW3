# Converts NaN files to null in JSON in react/public/jsons/
import json
import math

for i in range(1, 51):

    with open(f"react-ui/public/jsons/subset_{i}.json") as f:
        data = json.load(f)

    # Convert NaNs to None
    for row in data:
        for k, v in row.items():
            if isinstance(v, float) and math.isnan(v):
                row[k] = None

    with open(f"react-ui/public/jsons/subset_{i}.json", "w") as f:
        json.dump(data, f, indent=2)

print("success")