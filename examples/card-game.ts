// Import directly from source files
import { PhaseMachine, Phase } from '../src/index.js';

// Define all possible game phases
type BlackjackPhase = 
  | 'setup' 
  | 'playerBet'
  | 'initialDeal'
  | 'checkBlackjack'
  | 'playerTurn' 
  | 'dealerTurn' 
  | 'settlement'
  | 'gameEnd';

// Define a card type
interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number; // 1-13 (Ace = 1, Jack = 11, Queen = 12, King = 13)
  hidden: boolean;
}

// Define participant (player/dealer) state
interface Participant {
  hand: Card[];
  score: number;
  hasBlackjack: boolean;
  busted: boolean;
}

// Define the context structure
interface BlackjackContext {
  player: Participant;
  dealer: Participant;
  deck: Card[];
  bet: number;
  playerBalance: number;
  currentRound: number;
  maxRounds: number;
  gameMessage: string;
}

class BlackjackGame extends PhaseMachine<BlackjackPhase, BlackjackContext> {
  constructor() {
    // Initialize with 'setup' phase and starting context
    super('setup', {
      player: { hand: [], score: 0, hasBlackjack: false, busted: false },
      dealer: { hand: [], score: 0, hasBlackjack: false, busted: false },
      deck: [],
      bet: 0,
      playerBalance: 1000,
      currentRound: 0,
      maxRounds: 5,
      gameMessage: 'Welcome to Blackjack!'
    });
    
    // Set up event handlers for logging
    this.onPhaseTransition((from, to, context) => {
      console.log(`Transition: ${from} -> ${to}`);
      console.log(`Round ${context.currentRound}/${context.maxRounds}`);
      console.log(`Player balance: $${context.playerBalance}, Current bet: $${context.bet}`);
    });
  }
  
  @Phase('setup')
  async setup(): Promise<'playerBet' | 'gameEnd'> {
    console.log('Setting up a new round of Blackjack...');
    
    // Reset hands and states
    this.context.player = { hand: [], score: 0, hasBlackjack: false, busted: false };
    this.context.dealer = { hand: [], score: 0, hasBlackjack: false, busted: false };
    this.context.bet = 0;
    
    // Create and shuffle a new deck
    this.context.deck = this.createDeck();
    this.shuffleDeck();
    
    // Increment round
    this.context.currentRound++;
    
    // Check if we've reached max rounds or player is out of money
    if (this.context.currentRound > this.context.maxRounds || this.context.playerBalance <= 0) {
      return 'gameEnd';
    }
    
    this.context.gameMessage = `Round ${this.context.currentRound} - Place your bet`;
    return 'playerBet';
  }

  @Phase('playerBet')
  async playerBet(): Promise<'initialDeal'> {
    console.log('Player placing bet...');
    
    // Simulate player betting a fixed amount or random amount
    const betOptions = [10, 25, 50, 100];
    const betIndex = Math.floor(Math.random() * betOptions.length);
    const betAmount = Math.min(betOptions[betIndex], this.context.playerBalance);
    
    this.context.bet = betAmount;
    this.context.playerBalance -= betAmount;
    
    console.log(`Player bets $${betAmount}`);
    this.context.gameMessage = `Bet placed: $${betAmount}`;
    
    return 'initialDeal';
  }
  
  @Phase('initialDeal')
  async initialDeal(): Promise<'checkBlackjack'> {
    console.log('Dealing initial cards...');
    
    // Deal first card to player (face up)
    this.dealCard(this.context.player, false);
    
    // Deal first card to dealer (face up)
    this.dealCard(this.context.dealer, false);
    
    // Deal second card to player (face up)
    this.dealCard(this.context.player, false);
    
    // Deal second card to dealer (face down)
    this.dealCard(this.context.dealer, true);
    
    // Calculate initial scores
    this.calculateScore(this.context.player);
    this.calculateScore(this.context.dealer);
    
    // Display current hands
    this.displayHands();
    
    return 'checkBlackjack';
  }
  
  @Phase('checkBlackjack')
  async checkBlackjack(): Promise<'playerTurn' | 'dealerTurn' | 'settlement'> {
    console.log('Checking for Blackjack...');
    
    // Check if player has blackjack
    if (this.context.player.score === 21) {
      this.context.player.hasBlackjack = true;
      console.log('Player has Blackjack!');
      this.context.gameMessage = 'Blackjack! You have 21.';
      
      // Reveal dealer's hidden card
      this.revealDealerCards();
      
      // Check if dealer also has blackjack
      if (this.context.dealer.score === 21) {
        this.context.dealer.hasBlackjack = true;
        console.log('Dealer also has Blackjack!');
        this.context.gameMessage = 'Push! Both have Blackjack.';
        return 'settlement';
      }
      
      return 'settlement';
    }
    
    // Check if dealer has an Ace showing
    const dealerVisibleCard = this.context.dealer.hand[0];
    if (this.getCardValue(dealerVisibleCard) === 1) {
      console.log('Dealer shows an Ace. Insurance option would be offered here.');
      // In a real game, we'd offer insurance, but we'll skip it for simplicity
    }
    
    return 'playerTurn';
  }
  
  @Phase('playerTurn')
  async playerTurn(): Promise<'dealerTurn' | 'settlement'> {
    console.log('Player turn...');
    
    // Simulate player decisions: hit or stand
    let playerDecision = '';
    
    // Basic strategy: hit until 17 or higher
    while (this.context.player.score < 17) {
      playerDecision = 'hit';
      console.log(`Player decides to ${playerDecision}`);
      
      if (playerDecision === 'hit') {
        this.dealCard(this.context.player, false);
        this.calculateScore(this.context.player);
        this.displayHands();
        
        // Check if player busted
        if (this.context.player.score > 21) {
          this.context.player.busted = true;
          console.log('Player busts!');
          this.context.gameMessage = `Bust! Your hand totals ${this.context.player.score}`;
          return 'settlement';
        }
      } else {
        // If decision is stand, break the loop
        break;
      }
    }
    
    console.log('Player stands');
    this.context.gameMessage = `You stand with ${this.context.player.score}`;
    
    return 'dealerTurn';
  }
  
  @Phase('dealerTurn', { skippable: true })
  async dealerTurn(): Promise<'settlement'> {
    console.log('Dealer turn...');
    
    // Reveal dealer's hidden card
    this.revealDealerCards();
    
    // Dealer must hit on 16 or less and stand on 17 or more
    while (this.context.dealer.score < 17) {
      console.log('Dealer hits');
      this.dealCard(this.context.dealer, false);
      this.calculateScore(this.context.dealer);
      this.displayHands();
      
      // Check if dealer busted
      if (this.context.dealer.score > 21) {
        this.context.dealer.busted = true;
        console.log('Dealer busts!');
        this.context.gameMessage = `Dealer busts with ${this.context.dealer.score}!`;
        break;
      }
    }
    
    if (!this.context.dealer.busted) {
      console.log(`Dealer stands with ${this.context.dealer.score}`);
      this.context.gameMessage = `Dealer stands with ${this.context.dealer.score}`;
    }
    
    return 'settlement';
  }
  
  @Phase('settlement')
  async settlement(): Promise<'setup'> {
    console.log('Settling bets...');
    
    // Calculate winnings
    let winnings = 0;
    
    // Handle different outcomes
    if (this.context.player.hasBlackjack) {
      if (this.context.dealer.hasBlackjack) {
        // Both have blackjack - push
        winnings = this.context.bet;
        this.context.gameMessage = 'Push! Both have Blackjack.';
      } else {
        // Player has blackjack, dealer doesn't - pays 3:2
        winnings = this.context.bet + Math.floor(this.context.bet * 1.5);
        this.context.gameMessage = 'Blackjack pays 3:2!';
      }
    } else if (this.context.player.busted) {
      // Player busted - lose bet
      winnings = 0;
      this.context.gameMessage = 'You busted. Better luck next time!';
    } else if (this.context.dealer.busted) {
      // Dealer busted - player wins
      winnings = this.context.bet * 2;
      this.context.gameMessage = 'Dealer busted! You win!';
    } else {
      // Compare scores
      if (this.context.player.score > this.context.dealer.score) {
        // Player wins
        winnings = this.context.bet * 2;
        this.context.gameMessage = `You win with ${this.context.player.score} against dealer's ${this.context.dealer.score}!`;
      } else if (this.context.player.score < this.context.dealer.score) {
        // Dealer wins
        winnings = 0;
        this.context.gameMessage = `Dealer wins with ${this.context.dealer.score} against your ${this.context.player.score}.`;
      } else {
        // Push - tied scores
        winnings = this.context.bet;
        this.context.gameMessage = `Push! Both have ${this.context.player.score}.`;
      }
    }
    
    // Update player balance
    this.context.playerBalance += winnings;
    
    console.log(`Settlement: ${this.context.gameMessage}`);
    console.log(`Player receives $${winnings}, new balance: $${this.context.playerBalance}`);
    
    // Short pause before next round
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'setup';
  }
  
  @Phase('gameEnd')
  async gameEnd(): Promise<void> {
    console.log('Game over!');
    
    if (this.context.playerBalance <= 0) {
      this.context.gameMessage = 'Game over! You\'re out of chips.';
    } else {
      this.context.gameMessage = `Game over! Final balance: $${this.context.playerBalance}`;
    }
    
    console.log(this.context.gameMessage);
    
    // Terminal state - no more transitions
    return;
  }
  
  // Helper methods
  private createDeck(): Card[] {
    const suits: Array<Card['suit']> = ['hearts', 'diamonds', 'clubs', 'spades'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
      for (let value = 1; value <= 13; value++) {
        deck.push({ suit, value, hidden: false });
      }
    }
    
    return deck;
  }
  
  private shuffleDeck(): void {
    // Fisher-Yates shuffle
    for (let i = this.context.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.context.deck[i], this.context.deck[j]] = [this.context.deck[j], this.context.deck[i]];
    }
  }
  
  private dealCard(participant: Participant, hidden: boolean): void {
    if (this.context.deck.length === 0) {
      console.log('Reshuffling deck...');
      this.context.deck = this.createDeck();
      this.shuffleDeck();
    }
    
    const card = this.context.deck.pop()!;
    card.hidden = hidden;
    participant.hand.push(card);
  }
  
  private revealDealerCards(): void {
    for (const card of this.context.dealer.hand) {
      card.hidden = false;
    }
    this.calculateScore(this.context.dealer);
    console.log('Dealer reveals hidden card');
    this.displayHands();
  }
  
  private calculateScore(participant: Participant): void {
    let score = 0;
    let aces = 0;
    
    // First pass: count all cards except aces
    for (const card of participant.hand) {
      if (card.hidden) continue;
      
      const value = this.getCardValue(card);
      if (value === 1) {
        aces++;
      } else {
        score += value;
      }
    }
    
    // Second pass: add aces with optimal values
    for (let i = 0; i < aces; i++) {
      if (score + 11 <= 21) {
        score += 11;
      } else {
        score += 1;
      }
    }
    
    participant.score = score;
  }
  
  private getCardValue(card: Card): number {
    // Face cards (Jack, Queen, King) are worth 10
    if (card.value >= 11 && card.value <= 13) {
      return 10;
    }
    
    // Number cards are worth their value
    return card.value;
  }
  
  private getCardName(card: Card): string {
    if (card.hidden) return 'Hidden Card';
    
    const valueNames: Record<number, string> = {
      1: 'Ace',
      11: 'Jack',
      12: 'Queen',
      13: 'King'
    };
    
    const valueName = valueNames[card.value] || card.value.toString();
    return `${valueName} of ${card.suit}`;
  }
  
  private displayHands(): void {
    console.log('--- Current Hands ---');
    
    // Display player's hand
    console.log('Player:');
    for (const card of this.context.player.hand) {
      console.log(`  ${this.getCardName(card)}`);
    }
    console.log(`  Total: ${this.context.player.score}`);
    
    // Display dealer's hand
    console.log('Dealer:');
    for (const card of this.context.dealer.hand) {
      console.log(`  ${this.getCardName(card)}`);
    }
    
    // For dealer, only show score if all cards are revealed
    const allRevealed = this.context.dealer.hand.every(card => !card.hidden);
    if (allRevealed) {
      console.log(`  Total: ${this.context.dealer.score}`);
    } else {
      console.log('  Total: ?');
    }
    
    console.log('-------------------');
  }
}

// Example usage
async function runDemo() {
  const blackjackGame = new BlackjackGame();
  
  console.log('=== BLACKJACK DEMO ===');
  
  // Start the machine
  await blackjackGame.start();
  
  // Run until game ends
  while (blackjackGame.currentPhase !== 'gameEnd') {
    // Short delay between phases
    await new Promise(resolve => setTimeout(resolve, 500));
    await blackjackGame.transition(blackjackGame.currentPhase);
  }
  
  console.log('=== DEMO COMPLETE ===');
}

// Run the demo
runDemo().catch(console.error);