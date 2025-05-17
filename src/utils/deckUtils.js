// src/utils/deckUtils.js
const Emojis = require("../models/emojis"); // Giả sử bạn đã sửa emojis.js để export Emojis trực tiếp

const SUIT_KEYS = ["SPADES", "CLUBS", "DIAMONDS", "HEARTS"]; // Key dùng để lặp và là key trong Emojis.suits
const RANK_KEYS_FOR_DECK_CREATION = [
  "ace",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "jack",
  "queen",
  "king",
]; // Key dùng để lặp và là key trong Emojis.suits.SUIT

const SUIT_NAMES = {
  SPADES: "Bích",
  CLUBS: "Tép",
  DIAMONDS: "Rô",
  HEARTS: "Cơ",
};
const RANK_NAMES_MAP = {
  // Đổi tên để tránh nhầm với key của emoji, dùng để hiển thị tên
  ace: "Át",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  jack: "J",
  queen: "Q",
  king: "K",
};

class Card {
  constructor(suitKey, rankKey) {
    this.suitKey = suitKey; // 'SPADES'
    this.rankKey = rankKey; // 'ace', 'two', ... (viết thường)
    this.suitName = SUIT_NAMES[suitKey];
    this.rankName = RANK_NAMES_MAP[rankKey];

    // Đảm bảo Emojis và các cấp con được load đúng
    if (!Emojis || !Emojis.suits || !Emojis.cardMeta) {
      Logger.error(
        "[DeckUtils] Emojis object or its properties are not loaded correctly!",
      );
      // Gán giá trị mặc định hoặc throw lỗi nếu Emojis không load được
      this.emoji = `${this.rankName}${this.suitName.charAt(0)}`;
      this.faceDownEmoji = "❓";
    } else {
      const emojiSuitKey = suitKey.toLowerCase(); // 'spades'
      const emojiRankKey = rankKey.toLowerCase(); // 'ace'
      this.emoji =
        Emojis.suits[emojiSuitKey]?.[emojiRankKey] ||
        `${this.rankName}${Emojis.suits[emojiSuitKey]?.suit || this.suitName.charAt(0)}`;
      this.faceDownEmoji = Emojis.cardMeta.faceDown;
    }

    // Giá trị cho Bài Cào
    if (["jack", "queen", "king", "ten"].includes(rankKey))
      this.baiCaoValue = 0;
    else if (rankKey === "ace") this.baiCaoValue = 1;
    else this.baiCaoValue = parseInt(RANK_NAMES_MAP[rankKey]); // Chính xác

    // Giá trị cho Xì Dách (Blackjack)
    if (["king", "queen", "jack", "ten"].includes(rankKey))
      this.blackjackValue = 10;
    else if (rankKey === "ace") this.blackjackValue = 11;
    else this.blackjackValue = parseInt(RANK_NAMES_MAP[rankKey]); // CHÍNH XÁC: Lấy giá trị số từ RANK_NAMES_MAP
  }

  isAce() {
    return this.rankKey === "ace";
  }

  isTenPointCard() {
    return ["ten", "jack", "queen", "king"].includes(this.rankKey);
  }

  getEmoji() {
    return this.emoji;
  }
  toString() {
    return `${this.rankName} ${this.suitName}`;
  }
}

function createDeck() {
  const deck = [];
  for (const suitKey of SUIT_KEYS) {
    for (const rankKey of RANK_KEYS_FOR_DECK_CREATION) {
      deck.push(new Card(suitKey, rankKey));
    }
  }
  return deck;
}

function createDeck() {
  const deck = [];
  for (const suitKey of SUIT_KEYS) {
    // SPADES, CLUBS...
    for (const rankKey of RANK_KEYS_FOR_DECK_CREATION) {
      // ace, two...
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
  if (deck.length < numberOfCards) return [];
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
};
