# Phasmatic

A powerful TypeScript state machine library designed specifically for gaming applications, with a focus on slots and tabletop games.

[![License](https://img.shields.io/npm/l/phasmatic.svg)](https://github.com/scmooky/phasmatic/blob/main/LICENSE)

## Overview

Phasmatic is a state machine library that excels at modeling complex game flows and business logic. It uses a phase-based approach with type-safe transitions and context management, making it ideal for games with complex state and transition rules.

Key features:

- **Decorator-based phase registration** for clean, maintainable code
- **Flowchart generation** for visualizing state machine flows
- **Type-safe transitions** with strict return type enforcement
- **Context-agnostic design** - works with any object as your state store
- **Comprehensive test coverage** with Jest

## Why Phasmatic for Game Development?

Game development, especially for slots and tabletop games, requires managing complex state transitions, animations, and game logic. Phasmatic provides a structured way to organize this complexity while maintaining full type safety and explicit state flows.

## Installation

### From npm (coming soon)

```bash
npm install phasmatic
# or
yarn add phasmatic
# or
pnpm add phasmatic
```

### From GitHub

You can install Phasmatic directly from GitHub:

```bash
npm install github:schmooky/phasmatic
# or
yarn add github:schmooky/phasmatic
# or
pnpm add github:schmooky/phasmatic
```

## Basic Usage

```typescript
import { PhaseMachine, Phase } from "phasmatic";

// Define your game phases
type GamePhase = "idle" | "spinning" | "evaluating" | "paying" | "idle";

// Your game context/store can be any object
class SlotMachineContext {
  credits: number = 1000;
  currentBet: number = 10;
  spinResult: string[][] = [];
  winAmount: number = 0;
}

// Create your phase machine with decorator-based phase registration
class SlotMachine extends PhaseMachine<GamePhase, SlotMachineContext> {
  constructor() {
    super("idle", new SlotMachineContext());
  }

  @Phase("idle")
  async idle(): Promise<"spinning"> {
    // Logic for idle state
    console.log(`Current credits: ${this.context.credits}`);
    return "spinning";
  }

  @Phase("spinning")
  async spinning(): Promise<"evaluating"> {
    // Simulate spin
    console.log("Spinning reels...");
    this.context.spinResult = [
      ["A", "B", "C"],
      ["D", "E", "F"],
      ["G", "H", "I"],
    ];
    return "evaluating";
  }

  @Phase("evaluating")
  async evaluating(): Promise<"paying" | "idle"> {
    // Check for wins
    console.log("Evaluating result...");
    const hasWin = Math.random() > 0.5;

    if (hasWin) {
      this.context.winAmount = this.context.currentBet * 5;
      return "paying";
    }

    return "idle";
  }

  @Phase("paying")
  async paying(): Promise<"idle"> {
    // Pay winnings
    console.log(`Paying out ${this.context.winAmount} credits`);
    this.context.credits += this.context.winAmount;
    this.context.winAmount = 0;
    return "idle";
  }
}

// Usage
async function playGame() {
  const slotMachine = new SlotMachine();

  // Start the machine
  await slotMachine.start();

  // Execute specific phase transitions
  await slotMachine.transition("spinning");
}

playGame();
```

## Running Examples

The repository includes several examples to help you get started. After cloning the repository:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the examples using the provided npm scripts:

   ```bash
   # Run the slot machine example
   npm run dev:slot

   # Run the blackjack game example
   npm run dev:card
   ```

These examples showcase different features of Phasmatic and provide reference implementations for common game patterns.

## Advanced Features

### Event Handlers

Register event handlers to react to phase transitions:

```typescript
const slotMachine = new SlotMachine();

// Handle phase entry
slotMachine.onPhaseEnter("spinning", (context) => {
  console.log("Starting spin animation...");
});

// Handle phase exit
slotMachine.onPhaseExit("spinning", (context) => {
  console.log("Spin animation complete");
});

// Handle transitions
slotMachine.onPhaseTransition((from, to, context) => {
  console.log(`Transitioning from ${from} to ${to}`);
});
```

### Skippable Phases

Define phases that can be skipped in certain conditions:

```typescript
@Phase('animation', { skippable: true })
async animation(): Promise<'nextPhase'> {
  // Animation code here
  return 'nextPhase';
}

// Skip animations when needed
slotMachine.skipActivated = true;
```

### Flowchart Generation

Generate a flowchart of your state machine to visualize the flow:

```typescript
import { generateFlowchart } from "phasmatic";

const flowchart = generateFlowchart(SlotMachine);
console.log(flowchart); // Mermaid markdown syntax for visualization
```

## Why Phasmatic over Redux Sagas or Effector for Game Logic?

### 1. Domain-Specific and Intuitive

Game state management, particularly for slots and tabletop games, follows a natural phase-based flow that aligns perfectly with state machines. Unlike general-purpose state management libraries, Phasmatic is designed specifically for modeling this type of application flow.

### 2. Visualization and Documentation

The ability to generate visual flowcharts of your game phases provides:

- Clear communication with game designers and stakeholders
- Self-documenting code that maps directly to game design documents
- Easier debugging of complex game flows

### 3. Type Safety Without Boilerplate

Phasmatic enforces type safety throughout the state machine:

- Phase transitions are strictly typed
- Return types are restricted to valid phase names
- No action creators, reducers, and action type constants to maintain

## License

MIT
