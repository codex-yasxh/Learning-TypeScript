import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

console.log("Calorie Tracker");

// ============================================================
// TYPES
// ============================================================

type Size = "small" | "medium" | "large";

type Unit = "g" | "kg" | "ml" | "l" | "piece" | "packet";

type Command = "add" | "today" | "delete" | "goal" | "progress";

interface NewFoodEntry {
  food: Food;
  amount: number;
  unit: Unit;
  size?: Size;
}

interface FoodEntry extends NewFoodEntry {
  id: string;
  createdAt: string;
}

// means:

// FoodEntry

//    │

//    └── food ───────→ Food

// So an entry doesn't duplicate the nutritional definition.
// It references the food being consumed.

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

interface DailyGoal {
  calories: number;
  protein?: number;
}

// ============================================================
// REPOSITORIES
// ============================================================

interface FoodRepository {
  save(entry: FoodEntry): Promise<void>;
  findAll(): Promise<FoodEntry[]>;
  findById(id: string): Promise<FoodEntry | undefined>;
  delete(id: string): Promise<void>;
}

interface GoalRepository {
  get(): Promise<DailyGoal | undefined>;
  save(goal: DailyGoal): Promise<void>;
}

class JsonFoodRepository implements FoodRepository {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async findAll(): Promise<FoodEntry[]> {
    try {
      const data = await readFile(this.filePath, "utf-8");

      const entries: FoodEntry[] = JSON.parse(data);

      return entries;
    } catch (e) {
      if (e instanceof Error) {
        if ("code" in e && e.code === "ENOENT") {
          return [];
        }

        throw new Error(`Error reading entries: ${e.message}`);
      }

      throw e;
    }
  }

  async save(entry: FoodEntry): Promise<void> {
    const existingData = await this.findAll();

    existingData.push(entry);

    const entryContent = JSON.stringify(existingData, null, 2);

    await writeFile(this.filePath, entryContent, "utf-8");
  }

  async findById(id: string): Promise<FoodEntry | undefined> {
    const entries = await this.findAll();

    return entries.find((entry) => entry.id === id); // .find() -> operation we use to locate any particular index in an array
  }

  async delete(id: string): Promise<void> {
    const entries = await this.findAll();

    const remainingEntries = entries.filter((entry) => entry.id !== id);

    if (remainingEntries.length === entries.length) {
      throw new Error(`Food entry not found: ${id}`);
    }

    const entryContent = JSON.stringify(remainingEntries, null, 2);

    await writeFile(this.filePath, entryContent, "utf-8");
  }
}

class JsonGoalRepository implements GoalRepository {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async get(): Promise<DailyGoal | undefined> {
    try {
      const data = await readFile(this.filePath, "utf-8");

      const goal: DailyGoal = JSON.parse(data);

      return goal;
    } catch (e) {
      if (e instanceof Error) {
        if ("code" in e && e.code === "ENOENT") {
          return undefined;
        }

        throw new Error(`Error reading goal: ${e.message}`);
      }

      throw e;
    }
  }

  async save(goal: DailyGoal): Promise<void> {
    const goalContent = JSON.stringify(goal, null, 2);

    await writeFile(this.filePath, goalContent, "utf-8");
  }
}

// ============================================================
// WHY INTERFACE NOT CLASS
// ============================================================

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

// And this is exactly why your instinct to put the nutrition reference into the Food model was correct.
// The calculation function doesn't need a second Food parameter because it can follow:

// foodEntry.food

// and access both nutritionBasis and servingOptions.

// ============================================================
// NUTRITION CALCULATIONS
// ============================================================

function getAmountInNutritionBasis(foodEntry: NewFoodEntry): number {
  let weight: number;

  if (foodEntry.unit === foodEntry.food.nutritionBasis.unit) {
    weight = foodEntry.amount;
  } else if (foodEntry.food.servingOptions && foodEntry.unit === "piece") {
    weight = foodEntry.amount * foodEntry.food.servingOptions.amount;
  } else {
    throw new Error("Cannot convert food entry to nutrition basis");

    // If we don't have any entry of that food,
    // make sure we are going to add that kcals of that manually.
  }

  return weight;
}

function calculateCalories(foodEntry: NewFoodEntry): number {
  // no need to pass both interfaces,
  // coz FoodEntry already have the FOOD

  const amount = getAmountInNutritionBasis(foodEntry);

  return (
    (amount / foodEntry.food.nutritionBasis.amount) *
    foodEntry.food.nutrition.calories
  );
}

function calculateProtein(foodEntry: NewFoodEntry): number {
  const amount = getAmountInNutritionBasis(foodEntry);

  return (
    (amount / foodEntry.food.nutritionBasis.amount) *
    foodEntry.food.nutrition.protein
  );
}

// ============================================================
// FOOD TRACKER
// ============================================================

class FoodTracker {
  private entries: FoodEntry[] = [];

  private calorieGoal: number;

  constructor(calorieGoal: number, entries: FoodEntry[]) {
    this.calorieGoal = calorieGoal;
    this.entries = entries;
  }

  // public add(entry: FoodEntry): void {
  //   this.entries.push(entry);
  // }

  public add(entry: NewFoodEntry): FoodEntry {
    const newEntry: FoodEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.entries.push(newEntry);

    return newEntry;
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

  public getTotalProtein(): number {
    let total = 0;

    for (const entry of this.entries) {
      const protein = calculateProtein(entry);

      total += protein;
    }

    return total;
  }
}

// ============================================================
// FOOD SERVICE
// ============================================================

// FoodService is responsible for coordinating
// the business/application operations.

// CLI should not directly coordinate FoodTracker + Repository.

// Instead:

// CLI
//   ↓
// FoodService
//   ↓
// FoodTracker + FoodRepository + GoalRepository

class FoodService {
  private foodRepository: FoodRepository;

  private goalRepository: GoalRepository;

  constructor(foodRepository: FoodRepository, goalRepository: GoalRepository) {
    this.foodRepository = foodRepository;

    this.goalRepository = goalRepository;
  }

  private async createTracker(): Promise<FoodTracker> {
    const entries = await this.foodRepository.findAll();

    const goal = await this.goalRepository.get();

    const calorieGoal = goal?.calories ?? 0;

    return new FoodTracker(calorieGoal, entries);
  }

  public async addFood(entry: NewFoodEntry): Promise<{
    entry: FoodEntry;
    calories: number;
    protein: number;
  }> {
    const tracker = await this.createTracker();

    const newEntry = tracker.add(entry);

    const calories = calculateCalories(newEntry);

    const protein = calculateProtein(newEntry);

    await this.foodRepository.save(newEntry);

    return {
      entry: newEntry,
      calories,
      protein,
    };
  }

  public async deleteFood(id: string): Promise<void> {
    await this.foodRepository.delete(id);
  }

  public async getToday(): Promise<FoodEntry[]> {
    const entries = await this.foodRepository.findAll();

    const today = new Date().toISOString().split("T")[0];

    return entries.filter((entry) => {
      if (!entry.createdAt) {
        return false;
      }

      return entry.createdAt.split("T")[0] === today;
    });
  }

  public async calculateTodayCalories(): Promise<number> {
    const today = await this.getToday();

    let total = 0;

    for (const entry of today) {
      total += calculateCalories(entry);
    }

    return total;
  }

  public async calculateTodayProtein(): Promise<number> {
    const today = await this.getToday();

    let total = 0;

    for (const entry of today) {
      total += calculateProtein(entry);
    }

    return total;
  }

  public async getTodaySummary() {
    const today = await this.getToday();

    const foods = today.map((entry) => ({
      id: entry.id,
      name: entry.food.name,
      amount: entry.amount,
      unit: entry.unit,
      calories: calculateCalories(entry),
      protein: calculateProtein(entry),
    }));

    const calories = foods.reduce((total, food) => total + food.calories, 0);

    const protein = foods.reduce((total, food) => total + food.protein, 0);

    return {
      foods,
      calories,
      protein,
    };
  }

  public async setGoal(goal: DailyGoal): Promise<void> {
    await this.goalRepository.save(goal);
  }

  public async getGoal(): Promise<DailyGoal | undefined> {
    return this.goalRepository.get();
  }

  public async getProgress() {
    const goal = await this.goalRepository.get();

    if (!goal) {
      throw new Error(
        "No daily goal has been set. Use: calorie goal --calories <number> --protein <number>",
      );
    }

    const calories = await this.calculateTodayCalories();

    const protein = await this.calculateTodayProtein();

    return {
      calories,
      protein,
      calorieGoal: goal.calories,
      proteinGoal: goal.protein,
      remainingCalories: Math.max(goal.calories - calories, 0),
      remainingProtein:
        goal.protein === undefined
          ? undefined
          : Math.max(goal.protein - protein, 0),
      caloriePercentage: (calories / goal.calories) * 100,
      proteinPercentage:
        goal.protein === undefined ? undefined : (protein / goal.protein) * 100,
    };
  }
}

// ============================================================
// PHASE 6 : FOOD DATA
// ============================================================

// foods.json
//    ↓
// readFile()
//    ↓
// JSON.parse()
//    ↓
// Food[]

async function readFoodData(): Promise<Food[]> {
  try {
    const data = await readFile("src/data/foods.json", "utf-8");

    const foods: Food[] = JSON.parse(data);

    return foods;
  } catch (e) {
    if (e instanceof Error) {
      if ("code" in e && e.code === "ENOENT") {
        return [];
      }

      throw new Error(`Error reading food data: ${e.message}`);
    }

    throw e;
  }
}

async function saveFoodData(foods: Food[]): Promise<void> {
  try {
    const foodContent = JSON.stringify(foods, null, 2); // .stringify(foods, null, 2) makes it human-readable and 2 means indentation of two spaces.

    await writeFile("src/data/foods.json", foodContent, "utf-8");
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

// ============================================================
// PHASE 7 - REPOSITORY
// ============================================================

// Repository is responsible for talking to the actual storage.

// FoodTracker doesn't need to know whether the data is coming from JSON,
// SQLite, a database, etc.

// ============================================================
// REPOSITORY SETUP
// ============================================================

const foodRepository = new JsonFoodRepository("src/data/entries.json");

const goalRepository = new JsonGoalRepository("src/data/goal.json");

// Create the service by injecting the repositories.

// FoodService does not create JsonFoodRepository itself.

// It only knows about FoodRepository.

const foodService = new FoodService(foodRepository, goalRepository);

// ============================================================
// CLI HELPERS
// ============================================================

function getOption(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);

  if (index === -1 || index + 1 >= args.length) {
    return undefined;
  }

  return args[index + 1];
}

function requireOption(args: string[], option: string): string {
  const value = getOption(args, option);

  if (!value) {
    throw new Error(`Missing ${option}`);
  }

  return value;
}

function parsePositiveNumber(value: string, fieldName: string): number {
  const number = Number(value);

  if (Number.isNaN(number)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  if (number <= 0) {
    throw new Error(`${fieldName} must be greater than 0.`);
  }

  return number;
}

function isValidUnit(value: string): value is Unit {
  const validUnits: Unit[] = ["g", "kg", "ml", "l", "piece", "packet"];

  return validUnits.includes(value as Unit);
}

function printHelp(): void {
  console.log(`
Calorie Tracker

Commands:

  calorie add --food <food> --amount <number> --unit <unit>

  calorie today

  calorie delete <id>

  calorie goal --calories <number> --protein <number>

  calorie progress

Examples:

  calorie add --food Egg --amount 2 --unit piece

  calorie add --food Banana --amount 1 --unit piece

  calorie today

  calorie goal --calories 2500 --protein 100

  calorie progress

  calorie delete <id>
`);
}

// ============================================================
// CLI
// ============================================================

// console.log(process.argv); // remember all its values are underlying strings so we'd need parsing and validation.

// console.log(process.argv[2]); // this is helpful coz to read what we passed in the command as an argument

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const command = args[0] as Command | undefined;

  if (!command) {
    printHelp();
    return;
  }

  // ==========================================================
  // ADD
  // ==========================================================

  if (command === "add") {
    const foodName = requireOption(args, "--food");

    const amountInput = requireOption(args, "--amount");

    const unitInput = requireOption(args, "--unit");

    const amount = parsePositiveNumber(amountInput, "Amount");

    if (!isValidUnit(unitInput)) {
      throw new Error(
        "Units must be appropriate: g, kg, ml, l, piece, packet.",
      );
    }

    // const foods: Food[] = [egg]; earlier we did this.

    const foods = await readFoodData();

    const selectedFood = foods.find(
      (food) => food.name.toLowerCase() === foodName.toLowerCase(),
    );

    if (!selectedFood) {
      throw new Error(`Food not found: ${foodName}`);
    }

    // Create a FoodEntry

    const entry: NewFoodEntry = {
      food: selectedFood,

      amount,

      unit: unitInput,
    };

    // Add food through FoodService

    const result = await foodService.addFood(entry);

    // Print result

    console.log(
      `Added: ${result.entry.amount} ${result.entry.unit} ${result.entry.food.name}`,
    );

    console.log(`Calories: ${result.calories.toFixed(1)} kcal`);

    console.log(`Protein: ${result.protein.toFixed(1)} g`);

    console.log(
      `Total calories today: ${(
        await foodService.calculateTodayCalories()
      ).toFixed(1)} kcal`,
    );

    return;
  }

  // ==========================================================
  // TODAY
  // ==========================================================

  if (command === "today") {
    const summary = await foodService.getTodaySummary();

    console.log("");
    console.log("TODAY");
    console.log("────────────────────────────");

    if (summary.foods.length === 0) {
      console.log("No food entries today.");
    } else {
      for (const food of summary.foods) {
        console.log(
          `${food.amount} ${food.unit} ${food.name} — ${food.calories.toFixed(1)} kcal — ${food.protein.toFixed(1)} g protein`,
        );
      }
    }

    console.log("────────────────────────────");

    console.log(`Total calories: ${summary.calories.toFixed(1)} kcal`);

    console.log(`Protein: ${summary.protein.toFixed(1)} g`);

    return;
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  if (command === "delete") {
    const id = args[1];

    if (!id) {
      throw new Error("Usage: calorie delete <id>");
    }

    const entry = await foodRepository.findById(id);

    if (!entry) {
      throw new Error(`Food entry not found: ${id}`);
    }

    await foodService.deleteFood(id);

    console.log(`Deleted: ${entry.food.name}`);

    return;
  }

  // ==========================================================
  // GOAL
  // ==========================================================

  if (command === "goal") {
    const caloriesInput = requireOption(args, "--calories");

    const calories = parsePositiveNumber(caloriesInput, "Calories");

    const proteinInput = getOption(args, "--protein");

    let protein: number | undefined;

    if (proteinInput !== undefined) {
      protein = parsePositiveNumber(proteinInput, "Protein");
    }

    const goal: DailyGoal = {
      calories,
      ...(protein !== undefined && { protein }),
    };

    await foodService.setGoal(goal);

    console.log(`Daily calorie goal: ${calories} kcal`);

    if (protein !== undefined) {
      console.log(`Daily protein goal: ${protein} g`);
    }

    return;
  }

  // ==========================================================
  // PROGRESS
  // ==========================================================

  if (command === "progress") {
    const progress = await foodService.getProgress();

    console.log("");
    console.log("TODAY'S PROGRESS");
    console.log("────────────────────────────");

    console.log(
      `Calories: ${progress.calories.toFixed(1)} / ${progress.calorieGoal} kcal`,
    );

    console.log(`Remaining: ${progress.remainingCalories.toFixed(1)} kcal`);

    console.log(`Progress: ${progress.caloriePercentage.toFixed(1)}%`);

    if (progress.proteinGoal !== undefined) {
      console.log(
        `Protein: ${progress.protein.toFixed(1)} / ${progress.proteinGoal} g`,
      );

      console.log(`Remaining: ${progress.remainingProtein!.toFixed(1)} g`);

      console.log(`Progress: ${progress.proteinPercentage!.toFixed(1)}%`);
    } else {
      console.log(`Protein: ${progress.protein.toFixed(1)} g`);

      console.log("Protein goal: not set");
    }

    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

// ============================================================
// RUN APPLICATION
// ============================================================

try {
  await main();
} catch (e) {
  if (e instanceof Error) {
    console.error(`Error: ${e.message}`);
  } else {
    console.error("An unknown error occurred.");
  }
}

// ============================================================
// OLD PHASE 6 FUNCTIONS
// ============================================================

// These are kept here because they were part of the learning
// process for persistence.

// async function readEntries(): Promise<FoodEntry[]> {
//   // read entries.json
//   // JSON.parse()
//   // return FoodEntry[]

//   try {
//     const data = await readFile(
//       "src/data/entries.json",
//       "utf-8",
//     );

//     const entries: FoodEntry[] =
//       JSON.parse(data);

//     return entries;
//   } catch (e) {
//     if (e instanceof Error) {
//       console.error(
//         "Error reading entries data:",
//         e.message,
//       );
//     }

//     return []; // issue !! fix it later.
//   }
// }

// async function saveEntries(
//   entries: FoodEntry[],
// ): Promise<void> {
//   // JSON.stringify()
//   // write entries.json

//   try {
//     const entryContent =
//       JSON.stringify(
//         entries,
//         null,
//         2,
//       );

//     await writeFile(
//       "src/data/entries.json",
//       entryContent,
//       "utf-8",
//     );
//   } catch (e) {
//     if (e instanceof Error) {
//       console.error(
//         "Error saving entries data:",
//         e.message,
//       );
//     }
//   }
// }

// one learning : we are using operations in our program for reading n writing so to our constructor read the info which is a sync operation
// so we are using Load before constructor and also async IIFE is best.
