# Calorie Tracker CLI

A simple command-line calorie and protein tracker built with **TypeScript**.

This project is being built from scratch to turn TypeScript knowledge into practical software development experience — including CLI design, data modelling, file persistence, business logic, error handling, and testing.

## Features

The planned CLI will support:

* Add food entries
* View today's food intake
* Delete food entries
* Set daily calorie and protein goals
* View daily progress
* Persist data locally using JSON
* Validate user input
* Handle errors gracefully

## Example

```bash
calorie add --food "2 eggs" --calories 140 --protein 12
```

```bash
calorie add --food "Banana" --calories 105 --protein 1
```

```bash
calorie today
```

```bash
calorie goal --calories 2500 --protein 100
```

```bash
calorie progress
```

## Tech Stack

* TypeScript
* Node.js
* npm
* JSON for local persistence

Testing and additional tooling will be introduced as the project evolves.

## Project Structure

The project will evolve incrementally.

The initial structure is intentionally minimal:

```text
calorie-tracker/
│
├── src/
│   └── index.ts
│
├── data/
├── package.json
├── tsconfig.json
└── README.md
```

As the application grows, responsibilities will be separated into appropriate modules.

## Architecture

The eventual application will follow a structure roughly like:

```text
CLI
 │
 ▼
Service Layer
 │
 ▼
Repository
 │
 ▼
JSON Storage
```

This architecture will be introduced gradually rather than created upfront.

## Development Philosophy

The project is intentionally being built **without following a step-by-step tutorial**.

The development process is:

```text
Understand the problem
        ↓
Design a solution
        ↓
Implement a small piece
        ↓
Run it
        ↓
Observe the result
        ↓
Refactor
        ↓
Repeat
```

TypeScript features are introduced when the project creates a genuine reason to use them.

That includes:

* Types and interfaces
* Union and literal types
* Classes and objects
* Access modifiers
* Optional properties
* Getters and setters
* Static members
* Abstract classes
* Generics
* Modules
* Async/await
* Error handling

The goal is not to use every TypeScript feature.

The goal is to understand **when and why** a feature is useful.

## Status

🚧 **In Development**

The project is being built incrementally, starting with the basic CLI and gradually adding persistence, business logic, validation, and testing.

## Planned Commands

```text
calorie add
calorie today
calorie delete
calorie goal
calorie progress
```

The command interface may change as the project develops.

## Learning Objective

By completing this project, the target is to move from:

> "I know TypeScript syntax."

to:

> "I can use TypeScript to design and build a working application."

---

Built with TypeScript, one problem at a time.
