import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
console.log("Calorie Tracker");
class JsonFoodRepository {
    filePath;
    constructor(filePath) {
        this.filePath = filePath;
    }
    async findAll() {
        const data = await readFile(this.filePath, "utf-8");
        const entries = JSON.parse(data);
        return entries;
    }
    async save(entry) {
        const existingData = await this.findAll();
        existingData.push(entry);
        const entryContent = JSON.stringify(existingData, null, 2);
        await writeFile(this.filePath, entryContent, "utf-8");
    }
    async findById(id) {
        const entries = await this.findAll();
        return entries.find((entry) => entry.id === id); // .find() -> operation we use to locate any particular index in an array
    }
    async delete(id) {
        const entries = await this.findAll();
        const remainingEntries = entries.filter((entry) => entry.id !== id);
        const entryContent = JSON.stringify(remainingEntries, null, 2);
        await writeFile(this.filePath, entryContent, "utf-8");
    }
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
function calculateCalories(foodEntry) {
    // no need to pass both interfaces, coz Foodentry already have the FOOD
    const amount = getAmountInNutritionBasis(foodEntry);
    return ((amount / foodEntry.food.nutritionBasis.amount) *
        foodEntry.food.nutrition.calories);
}
function getAmountInNutritionBasis(foodEntry) {
    let weight;
    if (foodEntry.unit === foodEntry.food.nutritionBasis.unit) {
        weight = foodEntry.amount;
    }
    else if (foodEntry.food.servingOptions) {
        weight = foodEntry.amount * foodEntry.food.servingOptions.amount;
    }
    else {
        throw new Error("Cannot convert food entry to nutrition basis");
        // If we don't have any entry of that food, make sure we are going to add that kcals of that manually.
    }
    return weight;
}
// 1. Create a Food
const egg = {
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
    entries = [];
    calorieGoal;
    constructor(calorieGoal, entries) {
        this.calorieGoal = calorieGoal;
        this.entries = entries;
    }
    // public add(entry: FoodEntry): void {
    //   this.entries.push(entry);
    // }
    add(entry) {
        const newEntry = {
            ...entry,
            id: randomUUID(),
        };
        this.entries.push(newEntry);
        return newEntry;
    }
    getToday() {
        return this.entries;
    }
    getTotalCalories() {
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
//-------------------------------------------------- PHASE 7 ----------------------------------------------------------------
// Repository is responsible for talking to the actual storage.
// FoodTracker doesn't need to know whether the data is coming from JSON,
// SQLite, a database, etc.
const repository = new JsonFoodRepository("src/data/entries.json");
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
    if (command !== "add") {
        throw new Error(`Unknown command: ${command}`);
    }
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
    // console.log(foods);
    const selectedFood = foods.find((food) => food.name.toLowerCase() === foodName.toLowerCase());
    if (!selectedFood) {
        throw new Error(`Food not found: ${foodName}`);
    }
    // 2. Create a FoodEntry
    const entry = {
        food: selectedFood,
        amount: amount,
        unit: unitInput,
    };
    // 3. Calculate calories
    const calories = calculateCalories(entry);
    // 4. Print result
    console.log(`Added: ${entry.amount} ${entry.unit} ${entry.food.name}`);
    console.log(`Calories: ${calories} kcal`);
    // Read existing entries through the repository
    const entries = await repository.findAll();
    const tracker = new FoodTracker(2500, entries);
    // console.log(tracker.getToday());
    // FoodTracker creates the ID and stores the new entry in memory
    const newEntry = tracker.add(entry);
    // Repository persists the newly created entry
    await repository.save(newEntry);
    console.log(`Total calories: ${tracker.getTotalCalories()} kcal`);
}
catch (e) {
    if (e instanceof Error) {
        console.error(e.message);
    }
}
// phase 5 progress/flow - check file phase5.tldr
// -----------------------------------------------------------------------------------------------
// Phase 6 : Persistence
//added on top : import { readFile } from 'node:fs/promises';
// import { writeFile } from 'node:fs/promises';
async function readFoodData() {
    try {
        const data = await readFile("src/data/foods.json", "utf-8");
        const foods = JSON.parse(data);
        return foods;
    }
    catch (e) {
        if (e instanceof Error) {
            console.error("Error reading food data:", e.message);
        }
        return [];
    }
}
async function saveFoodData(foods) {
    try {
        const foodContent = JSON.stringify(foods, null, 2); // .stringify(foods, null, 2) makes it human-readable and 2 means indentation of two spaces.
        await writeFile("src/data/foods.json", foodContent, "utf-8");
    }
    catch (e) {
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
async function readEntries() {
    // read entries.json
    // JSON.parse()
    // return FoodEntry[]
    try {
        const data = await readFile("src/data/entries.json", "utf-8");
        const entries = JSON.parse(data);
        return entries;
    }
    catch (e) {
        if (e instanceof Error) {
            console.error("Error reading entries data:", e.message);
        }
        return []; // issue !! fix it later.
    }
}
async function saveEntries(entries) {
    // JSON.stringify()
    // write entries.json
    try {
        const entryContent = JSON.stringify(entries, null, 2);
        await writeFile("src/data/entries.json", entryContent, "utf-8");
    }
    catch (e) {
        if (e instanceof Error) {
            console.error("Error saving entries data:", e.message);
        }
    }
}
// one learning : we are using operations in our program for reading n writing so to our constructor read the info which is a sync operation
// so we are using Load before constructor and also async IIFE is best.
//# sourceMappingURL=index.js.map