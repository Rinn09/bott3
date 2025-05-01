require('dotenv').config();
const mongoose = require('mongoose');
const GuildConfig = require('./src/models/GuildConfig');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const config = await GuildConfig.find();
    console.log('[CONFIG]', config);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
