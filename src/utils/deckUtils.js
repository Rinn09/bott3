const { Emojis } = require("../models/emojis");

const SUIT_NAMES = {
  SPADES: "Bích",
  CLUBS: "Chuồn",
  DIAMONDS: "Rô",
  HEARTS: "Cơ",
};
const RANK_NAMES = {
  A: "Át",
  2: "Hai",
  3: "Ba",
  4: "Bốn",
  5: "Năm",
  6: "Sáu",
  7: "Bảy",
  8: "Tám",
  9: "Chín",
  10: "Mười",
  J: "J",
  Q: "Q",
  K: "K",
};
const RANK_ORDER_STANDARD = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
]; // Cho so sánh trong 1 số game

class Card {
  constructor(suitKey, rankKey) {
    const emojiRankMap = {
      A: "ace",
      2: "two",
      3: "three",
      4: "four",
      5: "five",
      6: "six",
      7: "seven",
      8: "eight",
      9: "nine",
      10: "ten",
      J: "jack",
      Q: "queen",
      K: "king",
    };
    const emojiRankKey = emojiRankMap[rankKey];
    this.suitKey = suitKey; // 'SPADES', 'CLUBS', 'DIAMONDS', 'HEARTS'
    this.rankKey = rankKey; // 'A', '2', ..., 'K'
    this.suitName = SUIT_NAMES[suitKey];
    this.rankName = RANK_NAMES[rankKey];
    this.emoji =
      Emojis.suits[suitKey.toLowerCase()]?.[emojiRankKey] ||
      `${this.rankName} ${Emojis.suits[suitKey.toLowerCase()]?.suit || this.suitName.charAt(0)}`;

    // Giá trị cho Bài Cào
    if (["J", "Q", "K", "10"].includes(rankKey)) this.baiCaoValue = 0;
    else if (rankKey === "A") this.baiCaoValue = 1;
    else this.baiCaoValue = parseInt(rankKey);

    // Giá trị cho Xì Dách (Blackjack)
    if (["K", "Q", "J", "10"].includes(rankKey)) this.blackjackValue = 10;
    else if (rankKey === "A")
      this.blackjackValue = 11; // A có thể là 1 hoặc 11
    else this.blackjackValue = parseInt(rankKey);
  }

  toString() {
    return `${this.rankName} ${this.suitName}`;
  }

  getEmoji() {
    return this.emoji;
  }
}

function createDeck() {
  const deck = [];
  for (const suitKey of Object.keys(SUIT_NAMES)) {
    for (const rankKey of Object.keys(RANK_NAMES)) {
      deck.push(new Card(suitKey, rankKey));
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function dealCards(deck, numberOfCards) {
  const hand = [];
  if (deck.length < numberOfCards) {
    // console.warn("Không đủ bài trong bộ để chia!"); // Hoặc throw error
    return []; // Trả về mảng rỗng nếu không đủ bài
  }
  for (let i = 0; i < numberOfCards; i++) {
    hand.push(deck.pop());
  }
  return hand;
}

function formatHandEmojis(hand, showAll = true, revealCount = 0) {
  if (!hand || hand.length === 0) return "Không có bài";
  return hand
    .map((card, index) => {
      if (showAll || index < revealCount) {
        return card.getEmoji();
      }
      return card.faceDownEmoji;
    })
    .join(" ");
}

module.exports = {
  Card,
  createDeck,
  shuffleDeck,
  dealCards,
  formatHandEmojis,
  SUIT_NAMES,
  RANK_NAMES,
  RANK_ORDER_STANDARD,
};
