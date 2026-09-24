import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { stringify } from "node:querystring";
console.log("Calorie Tracker");

type Size = "small" | "medium" | "large";

type Unit = "g" | "kg" | "ml" | "l" | "piece" | "packet";

interface FoodEntry {
  food: Food;

  amount: number;

  unit: Unit;

  size?: Size;
}

// means:

// FoodEntry

//    │

//    └── food ───────→ Food

// So an entry doesn't duplicate the nutritional definition. It references the food being consumed.

interface Food {
  name: string;

  nutrition: {
    calories: number;

    protein: number;
  };

  nutritionBasis: {
    amount: number;

    unit: Unit;
  };

  servingOptions?: {
    //optional

    name: string;

    amount: number;

    unit: Unit;
  };
}

// Why Interface not class

// This is essentially saying:

// "A Food must have this shape."

// It doesn't say:

// "A Food is an object that has behavior."

// That's the distinction.

// Your Food is currently data.

// Food

//  ├── name

//  ├── nutrition

//  ├── nutritionBasis

//  └── servingOptions

// There are no meaningful operations attached to it.

// A class becomes interesting when the object has behavior/state management.

//--------------------------------------------------------

// FoodEntry

// nutritionBasis

// "The nutrition numbers I'm storing are for how much?"

// 100g → 147 kcal

// servingOptions

// "If the user gives me a different way of measuring this food, how do I convert it?"

// 1 egg → 60g

// That's why we needed both.

// And this is exactly why your instinct to put the nutrition reference into the Food model was correct. The calculation function doesn't need a second Food parameter because it can follow:

// foodEntry.food

// and access both nutritionBasis and servingOptions.

function calculateCalories(foodEntry: FoodEntry): number {
  // no need to pass both interfaces, coz Foodentry already have the FOOD

  const amount = getAmountInNutritionBasis(foodEntry);

  return (
    (amount / foodEntry.food.nutritionBasis.amount) *
    foodEntry.food.nutrition.calories
  );
}

function getAmountInNutritionBasis(foodEntry: FoodEntry): number {
  let weight: number;

  if (foodEntry.unit === foodEntry.food.nutritionBasis.unit) {
    weight = foodEntry.amount;
  } else if (foodEntry.food.servingOptions) {
    weight = foodEntry.amount * foodEntry.food.servingOptions.amount;
  } else {
    throw new Error("Cannot convert food entry to nutrition basis");

    // If we don't have any entry of that food, make sure we are going to add that kcals of that manually.
  }

  return weight;
}

// 1. Create a Food

const egg: Food = {
  name: "Egg",

  nutrition: {
    calories: 147,

    protein: 13.3,
  },

  nutritionBasis: {
    amount: 100,

    unit: "g",
  },

  servingOptions: {
    name: "1 egg",

    amount: 60,

    unit: "g",
  },
};

//---------------------------------------------------------------------------------------------------------------------

class FoodTracker {
  private entries: FoodEntry[] = [];

  private calorieGoal: number;

  constructor(calorieGoal: number) {
    this.calorieGoal = calorieGoal;
  }

  public add(entry: FoodEntry): void {
    this.entries.push(entry);
  }

  public getToday(): FoodEntry[] {
    return this.entries;
  }

  public getTotalCalories(): number {
    let total = 0;

    for (const entry of this.entries) {
      // calculate this entry's calories

      const calories = calculateCalories(entry);

      // add them to total

      total += calories;
    }

    return total;
  }
}

// Reading CLI inputs

// console.log(process.argv); // remember all it's values are underlying strings so we'd need parsing and validation.

// console.log(process.argv[2]); // this is helpful coz to read what we passed in the command as an argument

try {
  const command = process.argv[2];
  const foodName = process.argv[3];

  const amountInput = process.argv[4];

  const unitInput = process.argv[5];

  // if (command !== "add") {
  //   throw new Error(`Unknown command: ${command}`);
  // }
  if (!foodName || !amountInput || !unitInput) {
    throw new Error("Usage: add <food> <amount> <unit>");
  }

  const amount = Number(amountInput);

  if (Number.isNaN(amount)) {
    throw new Error("Amount must be a valid number");
  }
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const validUnits = ["g", "kg", "ml", "l", "piece", "packet"];

  if (!validUnits.includes(unitInput)) {
    throw new Error("Units must be appropriate");
  }

  // const foods: Food[] = [egg]; earlier we did this. 
  const foods = await readFoodData();

  const selectedFood = foods.find(
    (food) => food.name.toLowerCase() === foodName.toLowerCase(),
  );

  if (!selectedFood) {
    throw new Error(`Food not found: ${foodName}`);
  }

  // 2. Create a FoodEntry

  const entry: FoodEntry = {
    food: selectedFood,

    amount: amount,

    unit: unitInput as Unit,
  };

  // 3. Calculate calories

  const calories = calculateCalories(entry);

  // 4. Print result

  console.log(`Added: ${entry.amount} ${entry.unit} ${entry.food.name}`);

  console.log(`Calories: ${calories} kcal`);

  const tracker = new FoodTracker(2500);

  tracker.add(entry);

  console.log(tracker.getToday());

  console.log(`Total calories: ${tracker.getTotalCalories()} kcal`);
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}

// phase 5 progress/flow - check file phase5.tldr

// -----------------------------------------------------------------------------------------------
// Phase 6 : Persistence
//added on top : import { readFile } from 'node:fs/promises';
// import { writeFile } from 'node:fs/promises';

async function readFoodData(): Promise<Food[]> {
  try {
    const data = await readFile("src/data/foods.json", "utf-8");
    const foods: Food[] = JSON.parse(data);
    return foods;
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error reading food data:", e.message);
    }
    return [];
  }
}

async function saveFoodData(foods: Food[]): Promise<void> {
    try {
        const foodContent = JSON.stringify(foods, null, 2); // .stringify(foods, null, 2) makes it human-readable and 2 means indentation of two spaces.

        await writeFile(
            "src/data/foods.json",
            foodContent,
            "utf-8"
        );
    } catch (e) {
        if (e instanceof Error) {
            console.error("Error saving food data:", e.message);
        }
    }
}
// We have proven:

// foods.json
//    ↓
// readFile()
//    ↓
// JSON.parse()
//    ↓
// Food[]

// But there's one important Phase 6 requirement still missing: writing.

// Right now we can:

// READ : JSON → Food[]

// We need to learn the reverse:=> "WRITE"

//also, now Now your persistence loop is genuinely:

//               READ
// foods.json ───────────→ Food[]
//                           │
//                           │ modify
//                           ↓
//                          Food[]
//                           │
//                           │ JSON.stringify()
//                           ↓
//                        JSON text
//                           │
//                           │ writeFile()
//                           ↓
//                       foods.json
//               WRITE
//-----------------------------------------------------------------------------------------

async function readEntries(): Promise<FoodEntry[]> {
    // read entries.json
    // JSON.parse()
    // return FoodEntry[]
}

async function saveEntries(entries: FoodEntry[]): Promise<void> {
    // JSON.stringify()
    // write entries.json
}

