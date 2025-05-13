const { Collection, ChannelType, PermissionsBitField } = require("discord.js"); // Thêm ChannelType và PermissionsBitField
const GuildConfig = require("../models/GuildConfig");
const botConfig = require("../config/botConfig");
const Logger = require("../utils/logger");

const prefixCache = new Map();

const commandAliases = {
  // Key: Tên lệnh cha (ví dụ: 'gacha')
  // Value: một object, trong đó:
  //   - defaultSubcommand: (Tùy chọn) Subcommand mặc định nếu người dùng chỉ gõ alias lệnh cha.
  //   - aliases: Mảng các alias cho lệnh cha.
  //   - subcommands: (Tùy chọn) Object chứa alias cho các subcommand.
  //     - Key: Tên subcommand gốc.
  //     - Value: Mảng các alias cho subcommand đó.

  gacha: {
    defaultSubcommand: "roll", // Ví dụ: !ga sẽ tương đương /gacha roll
    aliases: ["ga", "r"],
    subcommands: {
      roll: ["r"],
      garage: ["gara"], // /gacha garage -> !ga kho
      warehouse: ["kho"], // /gacha warehouse -> !ga wh
      // Thêm alias cho các subcommand khác của /gacha nếu chúng đơn giản
    },
  },
  money: {
    defaultSubcommand: "balance", // Ví dụ: !money -> /money balance (của chính họ)
    aliases: ["so_du", "sd", "tien"],
    subcommands: {
      balance: ["bal", "check"], // !money bal, !money bal @user
      daily: ["dl", "claimdaily"],
      work: ["wk", "lamviec"],
      top: ["toprich", "bangxephangtien", "bxh"],
      // 'pay <user> <amount>' - 2 options, có thể hỗ trợ
      pay: ["give", "send"],
      // 'bank deposit <amount>', 'bank withdraw <amount>' - bank là group, phức tạp hơn
    },
  },
  level: {
    defaultSubcommand: "view", // !level -> /level view (của chính họ)
    aliases: ["lvl", "rank", "xp"],
    subcommands: {
      view: ["v"], // !level v, !level v @user
      rank: ["toplvl", "bangxephangcap"],
      rewards: ["reward", "bonuslevel"],
    },
  },
  sidejob: {
    defaultSubcommand: "current", // !job -> /sidejob current
    aliases: ["job", "vieclamphu"],
    subcommands: {
      list: ["ls", "alljobs"],
      current: ["myjob", "statusjob"],
      claim: ["salary", "nhanluong"],
      resign: ["quitjob", "nghiviec"],
      // 'apply <job_name>' - 1 option, có thể hỗ trợ
      apply: ["xin"],
    },
  },
  mainjob: {
    defaultSubcommand: "view",
    aliases: ["mj", "nghechinh", "career"],
    subcommands: {
      view: ["info"],
      list: ["ls"],
      quit: ["nghi"],
      rewards: ["bonus"],
      // 'select' -> có select menu, khó cho prefix
      // 'task <task_action>' -> 1 option, có thể hỗ trợ
      task: ["do", "lam"],
    },
  },
  market: {
    defaultSubcommand: "view",
    aliases: ["cho", "trade"],
    subcommands: {
      view: ["v"], // /market view [page] [type_filter] - 2 options, có thể hỗ trợ nếu đơn giản
      search: ["find", "tim"], // /market search <query> [page] - 2 options
      mylistings: ["myitems", "dangban"], // /market mylistings [page] - 1 option
      history: ["hist", "log"], // /market history [page] - 1 option
    },
  },
  "shop-bot": {
    // Đổi tên từ shop để không trùng alias với market
    defaultSubcommand: "view",
    aliases: ["store", "cuahang"],
    subcommands: {
      view: ["v"], // Lệnh gốc là /shop, giờ là /shop-bot view
      inventory: ["inv", "tuido"],
      // buy/sell/use có 2 options, cân nhắc
    },
  },
  utility: {
    aliases: ["util", "tienich"],
    subcommands: {
      ping: ["p"],
      avatar: ["av"], // /utility avatar [user] - 1 option
      "user-info": ["ui", "whois"], // /utility user-info [user] - 1 option
      "server-info": ["si", "server"],
      // 'help [command]' - 1 option, có thể hỗ trợ
      help: ["h", "trogiup"],
      // 'search <query>' - 1 option, có thể hỗ trợ
      search: ["gg", "find"],
    },
  },
  // Các lệnh admin thường phức tạp và nhiều option, có thể không cần alias prefix
  // hoặc chỉ alias cho các action đơn giản nhất.
  moderation: {
    aliases: ["mod"],
    subcommands: {
      clear: ["cl", "purge"], // /moderation clear <amount> - 1 option
      listbans: ["bans"],
    },
  },
  // ... các lệnh cha khác ...
};

// Hàm helper để parse arguments, có hỗ trợ dấu ngoặc kép
function parseArguments(inputString) {
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const results = [];
  let match;
  while ((match = regex.exec(inputString)) !== null) {
    if (match[1]) results.push(match[1]);
    else if (match[2]) results.push(match[2]);
    else results.push(match[0]);
  }
  return results;
}

module.exports = (client) => {
  client.prefixCache = prefixCache;

  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    let prefix = prefixCache.get(message.guild.id);
    if (!prefix) {
      try {
        const config = await GuildConfig.findOne({ guildId: message.guild.id });
        prefix = config?.prefix || botConfig.prefix || "!";
        prefixCache.set(message.guild.id, prefix);
      } catch (err) {
        Logger.error(
          `Error fetching prefix for guild ${message.guild.id}: ${err.message}`,
        );
        prefix = botConfig.prefix || "!";
      }
    }

    if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;

    const rawArgsString = message.content.slice(prefix.length).trim();
    const args = parseArguments(rawArgsString);
    const commandAliasInput = args.shift()?.toLowerCase();

    if (!commandAliasInput) return;

    let targetCommandName = null;
    let targetSubcommandName = null;
    let commandArgs = [...args]; // Arguments còn lại sau khi xác định lệnh và subcommand

    // Tìm lệnh cha và subcommand dựa trên alias
    for (const cmdName in commandAliases) {
      const cmdConfig = commandAliases[cmdName];
      if (cmdConfig.aliases.includes(commandAliasInput)) {
        // Người dùng gõ alias của lệnh cha
        targetCommandName = cmdName;
        targetSubcommandName = cmdConfig.defaultSubcommand || null; // Lấy subcommand mặc định nếu có
        // Nếu argument tiếp theo là alias của subcommand, ghi đè subcommand mặc định
        if (args.length > 0 && cmdConfig.subcommands) {
          for (const subName in cmdConfig.subcommands) {
            if (
              cmdConfig.subcommands[subName].includes(args[0].toLowerCase())
            ) {
              targetSubcommandName = subName;
              commandArgs.shift(); // Xóa alias subcommand khỏi args
              break;
            }
          }
        }
        break;
      } else if (cmdConfig.subcommands) {
        // Kiểm tra xem người dùng có gõ trực tiếp alias subcommand không
        for (const subName in cmdConfig.subcommands) {
          if (cmdConfig.subcommands[subName].includes(commandAliasInput)) {
            targetCommandName = cmdName;
            targetSubcommandName = subName;
            // commandArgs đã đúng vì commandAliasInput là alias của sub rồi
            break;
          }
        }
        if (targetCommandName) break;
      }
    }

    // Nếu không tìm thấy qua alias, thử tìm trực tiếp lệnh cha
    if (!targetCommandName) {
      const directCommand = client.commands.get(commandAliasInput);
      if (directCommand) {
        targetCommandName = directCommand.data.name;
        // Nếu có arg tiếp theo, thử xem nó có phải subcommand không
        if (args.length > 0) {
          const potentialSub = directCommand.data.options?.find(
            (opt) =>
              (opt.type === 1 || opt.type === 2) && // Subcommand or SubcommandGroup
              opt.name === args[0].toLowerCase(),
          );
          if (potentialSub) {
            if (potentialSub.type === 1) {
              // Subcommand
              targetSubcommandName = args.shift().toLowerCase();
            } else if (potentialSub.type === 2 && args.length > 1) {
              // SubcommandGroup
              const groupSchema = potentialSub;
              const potentialSubInGroup = groupSchema.options?.find(
                (opt) => opt.type === 1 && opt.name === args[1].toLowerCase(),
              );
              if (potentialSubInGroup) {
                // Prefix handler này sẽ không hỗ trợ subcommand group qua prefix vì quá phức tạp
                // Chỉ lấy lệnh cha và subcommand đầu tiên (nếu có)
                // targetSubcommandName = args.shift().toLowerCase(); // Lấy group làm "subcommand"
                // Hoặc báo lỗi không hỗ trợ
                message
                  .reply(
                    `❌ Lệnh prefix cho subcommand group (\`${groupSchema.name}\`) chưa được hỗ trợ đầy đủ. Vui lòng dùng Slash Command.`,
                  )
                  .catch((e) => Logger.error("Error replying:", e));
                return;
              }
            }
          }
        }
        commandArgs = [...args]; // Args còn lại
      }
    }

    if (!targetCommandName) {
      // Logger.warn(`[Prefix Handler] Command or alias "${commandAliasInput}" not found.`);
      return;
    }

    const command = client.commands.get(targetCommandName);
    if (!command || !command.data || !command.execute) {
      Logger.warn(
        `[Prefix Handler] Command object for "${targetCommandName}" is invalid or not found.`,
      );
      return;
    }

    // Lấy schema của subcommand hoặc lệnh cha (nếu không có subcommand)
    let optionsSchema = [];
    let actualSubcommandNameForSchema = targetSubcommandName;

    if (targetSubcommandName) {
      const subOpt = command.data.options?.find(
        (opt) => opt.name === targetSubcommandName && opt.type === 1,
      );
      if (subOpt) {
        optionsSchema = subOpt.options || [];
      } else {
        // Có thể targetSubcommandName là tên của một group, trường hợp này tạm thời bỏ qua cho prefix đơn giản
        // Hoặc là defaultSubcommand của lệnh cha không có option
        const mainCmdOpt = command.data.options?.find(
          (opt) => opt.name === targetSubcommandName && opt.type > 2,
        );
        if (
          mainCmdOpt &&
          command.data.options?.filter((o) => o.type === 1 || o.type === 2)
            .length === 0
        ) {
          // Lệnh cha không có subcommands, targetSubcommandName thực ra là lệnh cha, và args[0] là option đầu tiên
          optionsSchema =
            command.data.options?.filter((opt) => opt.type >= 3) || [];
          commandArgs.unshift(targetSubcommandName); // Đưa "subcommand" (thực ra là arg đầu) trở lại args
          actualSubcommandNameForSchema = null; // Không có subcommand thực sự
          targetSubcommandName = null;
        } else {
          // Logger.warn(`[Prefix Handler] Subcommand schema for "${targetSubcommandName}" not found in command "${targetCommandName}".`);
        }
      }
    } else {
      // Không có subcommand, lấy options của lệnh cha
      optionsSchema =
        command.data.options?.filter((opt) => opt.type >= 3) || []; // Chỉ lấy value options
    }

    // Giới hạn hỗ trợ 0-2 options cho prefix command
    if (
      optionsSchema.filter((opt) => opt.required).length > 2 ||
      commandArgs.length > 2
    ) {
      if (
        commandAliasInput !== command.data.name ||
        (targetSubcommandName &&
          targetSubcommandName !==
            commandAliases[targetCommandName]?.defaultSubcommand) ||
        commandArgs.length > 0
      ) {
        // Chỉ báo lỗi nếu người dùng cố tình dùng nhiều hơn là chỉ gõ alias
        message
          .reply(
            `💡 Lệnh \`${prefix}${commandAliasInput}${targetSubcommandName ? " " + targetSubcommandName : ""}\` với nhiều tùy chọn phức tạp nên được sử dụng qua Slash Command (\`/${targetCommandName}${targetSubcommandName ? " " + targetSubcommandName : ""}\`) để có trải nghiệm tốt nhất.`,
          )
          .catch((e) => Logger.error("Error replying:", e));
        return;
      }
    }

    const parsedOptions = new Map();
    const valueOptionsSchema = optionsSchema.filter((opt) => opt.type >= 3); // Chỉ parse value options

    for (let i = 0; i < valueOptionsSchema.length; i++) {
      const optionSchema = valueOptionsSchema[i];
      if (i < commandArgs.length) {
        // Chỉ parse nếu có đủ argument
        let value = commandArgs[i];
        try {
          switch (optionSchema.type) {
            case 3: // STRING
              parsedOptions.set(optionSchema.name, String(value));
              break;
            case 4: // INTEGER
              const intVal = parseInt(value);
              if (isNaN(intVal))
                throw new Error(`Giá trị số nguyên không hợp lệ.`);
              parsedOptions.set(optionSchema.name, intVal);
              break;
            case 6: // USER
              const userIdMatch = value.match(/^<@!?(\d+)>$/);
              const userIdToParse = userIdMatch ? userIdMatch[1] : value;
              // Fetching user can be slow, try cache first
              let member = message.guild.members.cache.get(userIdToParse);
              if (!member && /^\d+$/.test(userIdToParse)) {
                // if it's an ID and not in cache, try fetching
                member = await message.guild.members
                  .fetch(userIdToParse)
                  .catch(() => null);
              }
              if (!member) {
                // If still not found
                // Cố gắng tìm theo username (đơn giản, có thể không chính xác)
                member = message.guild.members.cache.find(
                  (m) =>
                    m.user.username.toLowerCase() === value.toLowerCase() ||
                    m.user.tag.toLowerCase() === value.toLowerCase() ||
                    m.displayName.toLowerCase() === value.toLowerCase(),
                );
              }
              if (!member)
                throw new Error(`Không tìm thấy người dùng: \`${value}\`.`);
              parsedOptions.set(optionSchema.name, member.user);
              parsedOptions.set(`_member_${optionSchema.name}`, member);
              break;
            // Thêm các case khác nếu cần (BOOLEAN, NUMBER, CHANNEL, ROLE) cho các lệnh đơn giản
            default: // Mặc định là string cho các kiểu khác chưa hỗ trợ
              parsedOptions.set(optionSchema.name, String(value));
          }
        } catch (parseError) {
          message
            .reply(
              `❌ Lỗi khi xử lý tùy chọn \`${optionSchema.name}\`: ${parseError.message}`,
            )
            .catch((e) => Logger.error("Error replying parse error:", e));
          return;
        }
      } else if (optionSchema.required) {
        message
          .reply(`❌ Thiếu tùy chọn bắt buộc: \`${optionSchema.name}\`.`)
          .catch((e) => Logger.error("Error replying missing option:", e));
        return;
      }
    }

    const fakeInteraction = {
      guild: message.guild,
      channel: message.channel,
      user: message.author,
      member: message.member,
      client: client,
      applicationId: client.user.id,
      commandName: command.data.name,
      deferred: false,
      replied: false,
      ephemeral: false,
      options: {
        getSubcommandGroup: () => null, // Đơn giản hóa, không hỗ trợ group qua prefix kiểu này
        getSubcommand: () => targetSubcommandName, // Subcommand đã được xác định
        getString: (name) => parsedOptions.get(name) ?? null,
        getInteger: (name) => parsedOptions.get(name) ?? null,
        getUser: (name) => parsedOptions.get(name) ?? null,
        getMember: (name) =>
          parsedOptions.get(`_member_${name}`) ??
          (parsedOptions.get(name)
            ? message.guild.members.cache.get(parsedOptions.get(name).id)
            : null),
        // Các getter khác có thể trả về null hoặc throw error nếu không được parse
        getBoolean: (name) => parsedOptions.get(name) ?? null,
        getChannel: (name) => parsedOptions.get(name) ?? null,
        getRole: (name) => parsedOptions.get(name) ?? null,
        getMentionable: (name) => parsedOptions.get(name) ?? null,
        getNumber: (name) => parsedOptions.get(name) ?? null,
        _hoistedOptions: Array.from(parsedOptions.entries()).map(
          ([name, value]) => ({
            name,
            value,
            type: valueOptionsSchema.find((o) => o.name === name)?.type,
          }),
        ),
      },
      async reply(options) {
        /* ... như cũ ... */
        if (this.replied || this.deferred) return this.followUp(options);
        this.replied = true;
        return message.reply(options);
      },
      async editReply(options) {
        /* ... như cũ ... */
        if (this._deferredMessage) {
          this.replied = true;
          return this._deferredMessage.edit(options);
        }
        if (!this.replied) return this.reply(options);
        Logger.warn(
          "[Prefix Handler] editReply called without a prior deferReply or a stored deferred message. Attempting to send a new message.",
        );
        return message.channel.send(options);
      },
      async deferReply(options = {}) {
        /* ... như cũ ... */
        if (this.deferred || this.replied) return;
        this.deferred = true;
        // this._deferredMessage = await message.channel.send("Đang xử lý..."); // Có thể bỏ nếu không muốn spam
        return Promise.resolve();
      },
      async followUp(options) {
        /* ... như cũ ... */
        return message.channel.send(options);
      },
    };

    try {
      Logger.info(
        `[Prefix Command] Executing: ${prefix}${commandAliasInput} (Cmd: ${targetCommandName}, Sub: ${targetSubcommandName || "none"}) with args: [${commandArgs.join(", ")}] by ${message.author.tag}`,
      );
      await command.execute(fakeInteraction, client);
    } catch (error) {
      Logger.error(
        `[Prefix Command Error] Executing ${targetCommandName}${targetSubcommandName ? ` ${targetSubcommandName}` : ""}: ${error.message}`,
        { stack: error.stack },
      );
      if (fakeInteraction._deferredMessage && !fakeInteraction.replied) {
        await fakeInteraction._deferredMessage
          .edit({
            content: "❌ Đã xảy ra lỗi khi thực thi lệnh này bằng prefix.",
          })
          .catch(() => {});
      } else if (!fakeInteraction.replied && !fakeInteraction.deferred) {
        await message
          .reply({
            content: "❌ Đã xảy ra lỗi khi thực thi lệnh này bằng prefix.",
          })
          .catch(() => {});
      }
    }
  });
};
