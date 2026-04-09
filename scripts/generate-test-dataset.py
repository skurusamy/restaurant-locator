import json
import random
import uuid
from pathlib import Path

NUM_RECORDS = 1000
FIXED_X = 50
FIXED_Y = 50
OUTPUT_FILE = Path(__file__).resolve().parent.parent / "data" / "same_coordinates_1000.json"

TYPES = ["Restaurant", "Cafe", "Bar", "Fast Food"]
IMAGE_BASE_URL = "https://picsum.photos/200/200?random="


def generate_restaurants():
    restaurants = []

    for index in range(NUM_RECORDS):
        restaurants.append(
            {
                "id": str(uuid.uuid4()),
                "name": f"Test Restaurant {index + 1}",
                "type": random.choice(TYPES),
                "image": f"{IMAGE_BASE_URL}{index + 1}",
                "coordinates": f"x={FIXED_X},y={FIXED_Y}",
                "radius": random.randint(1, 100),
                "opening-hours": "10:00AM-8:00PM",
            }
        )

    return restaurants


def main():
    data = generate_restaurants()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file_handle:
        json.dump(data, file_handle, indent=2)

    print(f"Generated {NUM_RECORDS} records in {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
