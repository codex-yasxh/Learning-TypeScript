
// Learnings in the last.
console.log("Calorie Tracker");

type Size = "small" | "medium" | "large";
type Unit = "g" | "kg" | "ml" | "l" | "piece" | "packet";

interface FoodEntry {
    food : Food,
    amount: number,
    unit: Unit,
    size? : Size
}

// means:

// FoodEntry
//    │
//    └── food ───────→ Food

// So an entry doesn't duplicate the nutritional definition. It references the food being consumed.

interface Food {
    name : string,
    nutrition : {
        calories : number,
        protein : number
    },
    nutritionBasis : {
        amount: number,
        unit: Unit
    },
    servingOptions?: {  //optional 
        name: string,
        amount: number,
        unit: Unit
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

function calculateCalories(foodEntry : FoodEntry) : number { // no need to pass both interfaces, coz Foodentry already have the FOOD

    const amount = getAmountInNutritionBasis(foodEntry);

    return (
        amount / foodEntry.food.nutritionBasis.amount * foodEntry.food.nutrition.calories
    );
}

function getAmountInNutritionBasis(foodEntry: FoodEntry): number {
    let weight: number;

    if (foodEntry.unit === foodEntry.food.nutritionBasis.unit) {
        weight = foodEntry.amount;
    } else if (foodEntry.food.servingOptions) {
        weight =
            foodEntry.amount *
            foodEntry.food.servingOptions.amount;
    } else {
        throw new Error("Cannot convert food entry to nutrition basis");
        // If we don't have any entry of that food, make sure we are going to add that kcals of that manually. 
    }

    return weight;
}

const entries: FoodEntry[] = [];

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

// 2. Create a FoodEntry
const entry: FoodEntry = {
    food: egg,
    amount: 3,
    unit: "piece",
};

entries.push(entry);

// 3. Calculate calories
const calories = calculateCalories(entry);

// 4. Print result
console.log(`Added: ${entry.amount} ${entry.unit} ${entry.food.name}`);
console.log(`Calories: ${calories} kcal`);



console.log(entries)

class FoodTracker {
    private entries: FoodEntry[] = [];
    private calorieGoal: number;

    constructor(calorieGoal: number) {
        this.calorieGoal = calorieGoal;
    }

    add(entry: FoodEntry): void {
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

const tracker = new FoodTracker();

tracker.add(entry);
// console.log(tracker.entries); // should NOT work
console.log(tracker.getToday());
console.log(`Total calories: ${tracker.getTotalCalories()} kcal`);

// Reading CLI inputs 
console.log(process.argv); // remember all it's values are underlying strings so we'd need parsing and validation.

// console.log(process.argv[2]); // this is helpful coz to read what we passed in the command as an argument

const command = process.argv[2];
if (command !== "add") {
    throw new Error(`Unknown command: ${command}`);
} else{
    console.log(command);
}
const food = process.argv[3];
const amount = Number(process.argv[4]);
const unit = process.argv[5];


console.log(food);
console.log(amount);
console.log(typeof amount);
console.log(unit);

