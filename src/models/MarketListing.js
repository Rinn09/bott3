const mongoose = require("mongoose");
const { Schema } = mongoose;

const marketListingSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  sellerId: { type: String, required: true, index: true },
  sellerUsername: { type: String, required: true },

  itemType: {
    type: String,
    required: true,
    enum: ["shop_item", "car_instance", "part_instance"],
  },
  itemId: {
    type: String,
    required: true,
    index: true,
  },
  itemName: { type: String, required: true, index: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },

  listedAt: { type: Date, default: Date.now, index: true },
  status: {
    type: String,
    enum: ["active", "sold", "cancelled", "expired"],
    default: "active",
    index: true,
  },
  itemSnapshot: { type: Schema.Types.Mixed, required: true },
});

marketListingSchema.index({ itemName: "text" });
marketListingSchema.index({ guildId: 1, status: 1, listedAt: -1 });
marketListingSchema.index({ guildId: 1, itemType: 1, status: 1 });

module.exports = mongoose.model("MarketListing", marketListingSchema);
