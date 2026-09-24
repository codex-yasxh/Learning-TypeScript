# Calorie Tracker — TypeScript CLI

A small but real command-line application for tracking daily food intake.

The goal is **not** to build a fancy calorie app.

The goal is to take TypeScript knowledge learned from a tutorial and turn it into the ability to design, reason about, and build a working program from scratch.

---

# 0. Project Goal

We are building:

```text
calorie-tracker
```

A CLI application that allows a user to:

- Add food entries
- View today's food
- Delete an entry
- Set daily calorie/protein goals
- See daily progress
- Store data permanently in a JSON file

Example:

```bash
calorie add --food "2 eggs" --calories 140 --protein 12

calorie add --food "Rice" --calories 250 --protein 5

calorie today

calorie progress

calorie delete 3
```

The application should eventually look conceptually like:

```text
User
 │
 ▼
CLI
 │
 ▼
Application / Service Layer
 │
 ▼
Repository
 │
 ▼
JSON File
```

We will **not** blindly copy this architecture.

We will understand why each layer exists before creating it.

---

# 1. Ground Rules

## Rule 1 — No tutorial copying

You may search documentation when necessary.

You may ask me questions.

You may use TypeScript/Node documentation.

But don't search:

> "TypeScript calorie tracker GitHub"

and copy someone else's architecture.

---

## Rule 2 — We build incrementally

Every phase follows:

```text
Understand
   ↓
Think
   ↓
Design
   ↓
Implement
   ↓
Run
   ↓
Observe
   ↓
Improve
```

We do not jump from:

```text
"I know classes"
```

to:

```text
"Let's build a 15-file architecture."
```

That's fake progress.

---

## Rule 3 — No premature abstraction

If three lines of code solve the problem, three lines are fine.

We introduce:

- classes
- interfaces
- generics
- repositories
- services
- abstractions

only when the problem gives us a reason.

---

# 2. Final Feature Set

The finished application should support:

## Food entries

```bash
calorie add --food "2 eggs" --calories 140 --protein 12
```

Each entry contains:

```text
id
food
calories
protein
quantity
timestamp
```

Some fields may be optional.

---

## View today's food

```bash
calorie today
```

Example:

```text
Today's Calories

Breakfast
2 eggs              140 kcal    12g protein
Banana              105 kcal     1g protein

Lunch
Rice                250 kcal     5g protein

------------------------------------------
Total               495 kcal    18g protein
```

---

## Delete food

```bash
calorie delete 3
```

---

## Daily goal

```bash
calorie goal --calories 2500 --protein 100
```

---

## Progress

```bash
calorie progress
```

Example:

```text
Calories
████████░░░░░░░░  1250 / 2500

Protein
██████░░░░░░░░░░  62 / 100 g
```

---

# 3. Phase 1 — Project Setup ✅

## Objective

Create the smallest possible TypeScript project.

We will understand:

- Node.js
- npm
- TypeScript
- `package.json`
- `tsconfig.json`
- source directory
- compiled output

Target structure:

```text
calorie-tracker/
│
├── src/
│   └── index.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

At this stage:

```bash
npm run dev
```

should simply execute the application.

The first output can literally be:

```text
Calorie Tracker
```

### Concepts learned

- TypeScript compilation
- `tsc`
- TypeScript configuration
- npm scripts
- source vs compiled code

### Mastery check

Before moving on, understand:

```text
.ts
 ↓
TypeScript compiler
 ↓
JavaScript
 ↓
Node.js
```

### Learning

-

---

# 4. Phase 2 — Understand the Domain ✅

Before writing classes, we define what an **expense** would be in an expense tracker.

But here we're tracking food.

Ask:

> What exactly is a food entry?

For example:

```text
2 eggs
140 calories
12g protein
```

Represent that concept using a TypeScript type/interface.

Possible shape:

```text
FoodEntry
```

We will decide the exact fields together.

### Concepts learned

- Types
- Interfaces
- Primitive types
- Optional properties
- Arrays
- Type inference

### Important exercise

Do NOT immediately create a class.

First answer:

> If I had to represent one food entry using plain JavaScript data, what would it look like?

Then we'll convert that reasoning into TypeScript.

---

# 5. Phase 3 — Build the First Feature

Feature:

```bash
calorie add
```

Initially, forget about files.

Forget about repositories.

Forget about architecture.

Just make this work:

```text
User input
    ↓
Create FoodEntry
    ↓
Store it in memory
    ↓
Print it
```

Example:

```text
Added:

2 eggs
140 kcal
12g protein
```

### Concepts learned

- Functions
- Parameters
- Return types
- Object creation
- Arrays
- Mutability

---

# 6. Phase 4 — Introduce Classes

Now we have a problem.

Our application is starting to accumulate logic.

Instead of throwing everything into `index.ts`, we ask:

> Who should be responsible for managing food entries?

This is where classes become useful.

We introduce something like:

```text
FoodTracker
```

It might eventually be responsible for:

```text
add()             ✅
getToday()        ✅
getTotalCalories() ✅
remove()
getTotalProtein()
```

But we won't blindly create all of these.

We'll add them as the application demands them.

### Concepts learned

- Classes
- Objects
- Constructors
- Access modifiers
- `public`
- `private`
- `readonly`

---

# 7. Phase 5 — Make the CLI Real

Until now, we can hard-code values.

That's useless.

Now the actual command line becomes the interface.

Example:

```bash
calorie add --food "Banana" --calories 105 --protein 1
```

The program must:

```text
Read arguments
     ↓
Understand command
     ↓
Extract values
     ↓
Validate values
     ↓
Call application logic
```

### Concepts learned

- `process.argv`
- Parsing
- Command handling
- String manipulation
- Validation
- Error handling

### Important principle

The CLI should eventually become just an interface.

It should NOT contain all of our business logic.

---

# 8. Phase 6 — Persistence

Current problem:

```text
Run program
   ↓
Add food
   ↓
Close program
   ↓
Everything disappears
```

Obviously unacceptable.

We need persistence.

Start with:

```text
expenses.json
```

Actually:

```text
data/
└── foods.json
```

Now:

```text
Application
    ↓
Read JSON
    ↓
Modify data
    ↓
Write JSON
```

### Concepts learned

- Node.js filesystem APIs
- `fs`
- JSON
- Serialization
- Deserialization
- `async/await`
- Promises
- Error handling

This is where TypeScript starts interacting with the real world.

---

Phase 7 — Repository

Now we notice something:

Our tracker shouldn't care where the data is stored.

It should only care about:

save
get
delete

So we introduce a repository.

Conceptually:

FoodRepository

save()
findAll()
findById()
delete()

The current implementation can use JSON.

FoodRepository
       ↓
JSON file

Later, we could theoretically replace it with:

FoodRepository
       ↓
SQLite

without rewriting the entire application.

Concepts learned
Interfaces
Abstraction
Dependency separation
Why repositories exist

This is where OOP stops being:

"I know what a class is"

and starts becoming:

"I understand why objects and abstractions exist."

## Phase 8 — Service Layer

Now another problem appears.

Suppose we want:

calorie progress

Calculating progress requires:

Today's food
+
Daily goal
=

Progress

Where should this logic live?

Not inside the CLI.

Not inside the JSON repository.

This leads us to a service layer.

Conceptually:

FoodService

Responsibilities might include:

addFood()
deleteFood()
getToday()
calculateCalories()
calculateProtein()
getProgress()

Architecture becomes:

CLI
 │
 ▼
FoodService
 │
 ▼
FoodRepository
 │
 ▼
JSON
Concepts learned
Separation of concerns
Business logic
Dependency injection
Composition

## Phase 9 — Goals

Now add:

calorie goal --calories 2500 --protein 100

We need another domain concept:

DailyGoal

Questions we will solve:

Where should goals be stored?
Should there be one goal or multiple?
What happens if no goal exists?
Should protein be optional?
How do we update an existing goal?
Concepts learned
Optional properties
Null/undefined handling
More complex domain modelling
Updating persisted state

## Phase 10 — Today's Summary

Implement:

calorie today

The application should:

Load food entries.
Determine today's date.
Filter today's entries.
Group/display them.
Calculate totals.
Format the result.

Example:

TODAY
────────────────────────────

2 Eggs              140 kcal
Banana              105 kcal
Rice                250 kcal
Dal                 180 kcal

────────────────────────────
Total               675 kcal
Protein              25 g
Concepts learned
Array methods
filter
map
reduce
Date handling
Data transformation

This phase is especially important.

You should be able to look at raw data:

[
  {...},
  {...},
  {...}
]

and reason about how to transform it into:

{
    calories: 675,
    protein: 25
}
## Phase 11 — TypeScript Features On Purpose

Now we deliberately revisit features from your tutorial.

Instead of randomly creating examples like:

class Person {
}

we ask:

Does this project actually benefit from this TypeScript feature?

Potential concepts:

Union types

For commands:

"add"
"delete"
"today"
"progress"
"goal"
Literal types

Represent valid categories/commands safely.

Enums

Only if an enum actually improves the model.

We don't use enums just because TypeScript has enums.

Getters/setters

Use them where controlled access to state makes sense.

Static members

Use them only where shared/class-level behavior actually makes sense.

Abstract classes

We will deliberately evaluate whether one is justified.

If it isn't:

we don't use it.

Knowing when NOT to use a feature is part of knowing the feature.

Generics

Eventually we'll encounter a situation where the same structure operates over different types.

That's when we introduce generics.

Not before.

## Phase 12 — Validation & Error Handling

Now intentionally break the application.

Try:

calorie add --food "" --calories -500

Try:

calorie delete 99999

Try:

calorie goal --calories abc

Try:

calorie progress

when no goal exists.

The application should fail gracefully.

Not:

TypeError: Cannot read properties of undefined...

but something useful:

Error: Calories must be greater than 0.
Concepts learned
Defensive programming
Runtime validation
try/catch
Error classes
User-facing errors
15. Phase 13 — Refactoring

Only after the application works do we clean it up.

Potential final structure:

src/
│
├── cli/
│   ├── commands/
│   └── parser.ts
│
├── domain/
│   ├── FoodEntry.ts
│   └── DailyGoal.ts
│
├── services/
│   └── FoodService.ts
│
├── repositories/
│   ├── FoodRepository.ts
│   └── JsonFoodRepository.ts
│
├── utils/
│   └── ...
│
└── index.ts

But this is a target, not a starting point.

If the project only needs six files, we'll use six files.

Architecture is a tool, not a religion.

 1. Phase 14 — Testing

Now we test actual behavior.

Important cases:

Add food
Delete food
Calculate calories
Calculate protein
Filter today's food
Set goal
Calculate progress
Invalid input
Missing data

Start with the important business logic.

We don't need 900 tests for a CLI that has 6 features.

Concepts learned
Unit testing
Test cases
Edge cases
Testable architecture
17. Phase 15 — Final Product

The final CLI should support:

calorie add
calorie today
calorie delete
calorie goal
calorie progress

And persist data.

The user should never need to open the source code to use it.

 1. Final Architecture

Only after completing the previous phases should we have something approximately like:

                  USER
                    │
                    ▼
               COMMAND LINE
                    │
                    ▼
              Command Parser
                    │
                    ▼
              Food Service
               /         \
              /           \
             ▼             ▼
    Food Repository    Goal Repository
             │             │
             ▼             ▼
        JSON Storage    JSON Storage

The important part isn't memorizing this diagram.

You should be able to explain:

Why does each component exist?

 1. What You Will Actually Learn

By the end, you should have used TypeScript in the context of an actual program rather than isolated tutorial examples.

You will encounter:

Types
Interfaces
Union Types
Literal Types
Optional Properties
Classes
Objects
Constructors
Access Modifiers
Readonly
Getters
Setters
Static Members
Abstract Classes
Generics
Functions
Modules
Arrays
Array Methods
Promises
Async/Await
Error Handling
File System
JSON
CLI Arguments
Validation
Architecture
Dependency Injection
Repositories
Services
Testing

But the order matters.

We learn each concept because the project creates a problem that needs it.

 1. Our Development Loop

For every feature, we follow this loop:

1. What are we trying to build?
          ↓
2. What data do we need?
          ↓
3. What problem do we have?
          ↓
4. What are our possible solutions?
          ↓
5. Choose the simplest reasonable solution.
          ↓
6. Write a small amount of code.
          ↓
7. Run it.
          ↓
8. Observe what happened.
          ↓
9. Explain why it happened.
          ↓
10. Improve.

We will intentionally avoid dumping 100 lines of code on you.

 1. Definition of Done

The project is complete when a fresh user can do:

npm install

npm run build

npm link

calorie add --food "2 eggs" --calories 140 --protein 12

calorie add --food "Rice" --calories 250 --protein 5

calorie today

calorie goal --calories 2500 --protein 100

calorie progress

calorie delete 1

and everything works correctly.

 1. The Starting Point

We begin with Phase 1 only.

Do not create:

services/
repositories/
models/
interfaces/
utils/

yet.

Start stupidly simple:

calorie-tracker/
└── src/
    └── index.ts

Get the program running.

Then we build from there.

One problem at a time.
