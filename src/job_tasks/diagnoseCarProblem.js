const { EmbedBuilder, inlineCode } = require("discord.js");
const CarModel = require("../models/CarModel");
const ShopItem = require("../models/ShopItem");
const Logger = require("../utils/logger");
const { getRandomInt } = require("../utils/gameUtils");
const { handleJobLevelUp } = require("../utils/jobUtil");

module.exports = {
  taskId: "diagnosecarproblem",
  jobName: "thợ sửa xe", // Phải khớp với tên nghề trong MainJobModel
  async executeTask(interaction, user, jobDefinition, taskDefinition) {
    // jobDefinition là data của nghề "thợ sửa xe"
    // taskDefinition là data của task "diagnosecarproblem"

    // --- Kiểm tra các điều kiện đầu vào của task (ví dụ: người dùng có xe nào cần chẩn đoán không) ---
    // Điều này có thể được xử lý ở lệnh /mainjob task trước khi gọi executeTask,
    // hoặc bạn có thể thêm một bước chọn xe ở đây.

    // Giả sử người dùng đã chọn một carInstanceId qua một option của lệnh hoặc một select menu trước đó
    // Hoặc, chúng ta có thể hiện select menu ở đây để người dùng chọn xe.
    // Ví dụ đơn giản: Chọn xe đầu tiên trong garage cần sửa nhẹ (durability < 80 && status === 'ready')

    let carToDiagnoseInstanceId = null; // Sẽ lấy từ tương tác hoặc logic chọn xe

    // === BƯỚC 1: HIỂN THỊ SELECT MENU CHỌN XE (NẾU CHƯA CÓ XE ĐƯỢC CHỌN TRƯỚC) ===
    // Trong thực tế, lệnh /mainjob task diagnosecarproblem có thể có option để người dùng nhập ID xe
    // Hoặc bạn có thể làm một hệ thống select menu như lệnh /gacha garage.
    // Ví dụ này sẽ đơn giản hóa bằng cách giả định người dùng phải cung cấp car_id
    // hoặc chúng ta chọn một xe ngẫu nhiên (không khuyến khích cho task thực tế)

    // Để minh họa, chúng ta sẽ yêu cầu người dùng chọn xe nếu chưa có thông tin
    // Tuy nhiên, do cấu trúc hiện tại của taskHandler không hỗ trợ tương tác chờ ở đây,
    // logic chọn xe phức tạp nên được đặt ở lệnh /mainjob task.
    // Ở đây, chúng ta sẽ giả định `interaction.options.getString('target_car_id')` (ví dụ)
    // đã cung cấp ID xe. Nếu không, task sẽ báo lỗi.

    // TODO: Cần một cách để người dùng chỉ định xe nào sẽ được chẩn đoán.
    // Cách 1: Thêm option vào lệnh /mainjob task task_action:diagnosecarproblem target_car_id:XYZ
    // Cách 2: Nếu không có target_car_id, hiện select menu. (Cách này phức tạp hơn khi tích hợp vào taskHandler)

    // GIẢ SỬ: Hiện tại, chúng ta sẽ lấy xe đầu tiên trong garage có durability < 90 và status là 'ready'
    // Đây chỉ là giải pháp tạm thời cho ví dụ này.
    const candidateCars = user.garage.cars.filter(
      (car) => car.durability < 90 && car.status === "ready",
    );
    if (candidateCars.length === 0) {
      await interaction.editReply({
        content:
          "ℹ️ Không có xe nào trong garage của bạn cần chẩn đoán (độ bền < 90% và sẵn sàng).",
      });
      return;
    }
    // Chọn xe đầu tiên trong danh sách ứng viên
    carToDiagnoseInstanceId = candidateCars[0]._id.toString();
    const carInstance = user.garage.cars.id(carToDiagnoseInstanceId);
    const carModel = await CarModel.findOne({
      modelId: carInstance.carModelId,
    }).lean();

    if (!carInstance || !carModel) {
      await interaction.editReply({
        content: "❌ Không tìm thấy thông tin xe để chẩn đoán.",
      });
      return;
    }

    // --- Logic chính của task ---
    const possibleProblems = [
      {
        name: "Bugi hỏng",
        severity: "Nhẹ",
        repairCostEst: getRandomInt(500, 2000),
        partsNeeded: ["spark_plug_common"],
        reportItemId: "diagnostic_report_sparkplug",
      },
      {
        name: "Lọc gió cần thay",
        severity: "Nhẹ",
        repairCostEst: getRandomInt(300, 1500),
        partsNeeded: ["air_filter_common"],
        reportItemId: "diagnostic_report_airfilter",
      },
      {
        name: "Dầu máy quá cũ",
        severity: "Trung bình",
        repairCostEst: getRandomInt(1000, 5000),
        partsNeeded: ["engine_oil_standard", "oil_filter_common"],
        reportItemId: "diagnostic_report_oilchange",
      },
      {
        name: "Hệ thống phanh mòn",
        severity: "Nặng",
        repairCostEst: getRandomInt(5000, 15000),
        partsNeeded: ["brake_pads_standard", "brake_fluid_dot4"],
        reportItemId: "diagnostic_report_brakes",
      },
      {
        name: "Ắc quy yếu",
        severity: "Trung bình",
        repairCostEst: getRandomInt(2000, 7000),
        partsNeeded: ["battery_standard"],
        reportItemId: "diagnostic_report_battery",
      },
    ];

    const foundProblem =
      possibleProblems[getRandomInt(0, possibleProblems.length - 1)];

    // Thưởng XP và Reputation (lấy từ taskDefinition)
    const jobXpReward = taskDefinition.reward?.jobXp || 0;
    const jobReputationReward = taskDefinition.reward?.jobReputation || 0;

    user.mainJob.xp = (user.mainJob.xp || 0) + jobXpReward;
    user.mainJob.reputation =
      (user.mainJob.reputation || 0) + jobReputationReward;

    let outputItemMessage = "";
    // Tạo item "Báo cáo chẩn đoán" (nếu có trong taskDefinition.outputItems)
    const diagnosticReportOutput = taskDefinition.outputItems?.find((item) =>
      item.itemId.startsWith("diagnostic_report_"),
    );
    if (
      diagnosticReportOutput &&
      Math.random() < (diagnosticReportOutput.chance || 1)
    ) {
      // Đổi itemId của output thành itemId cụ thể của lỗi tìm thấy
      const specificReportItemId = foundProblem.reportItemId;
      const reportItemDef = await ShopItem.findOne({
        itemId: specificReportItemId,
      }).lean();

      if (reportItemDef) {
        const currentReportQty = user.inventory.get(specificReportItemId) || 0;
        user.inventory.set(
          specificReportItemId,
          currentReportQty + diagnosticReportOutput.quantity,
        );
        user.markModified("inventory");
        outputItemMessage = `\n📄 Bạn nhận được: **${diagnosticReportOutput.quantity} ${reportItemDef.name}** (chứa thông tin về lỗi **${foundProblem.name}**).`;
      } else {
        Logger.warn(
          `[Task/diagnoseCarProblem] ShopItem definition for ${specificReportItemId} not found.`,
        );
        outputItemMessage =
          "\n⚠️ Không thể tạo báo cáo chẩn đoán chi tiết do thiếu định nghĩa vật phẩm.";
      }
    }

    const leveledUp = await handleJobLevelUp(user); // Giả sử hàm này chỉ xử lý level up nghề, không save user
    // user.save() sẽ được gọi ở taskHandler sau khi task này resolve

    const embed = new EmbedBuilder()
      .setTitle(`🛠️ ${taskDefinition.name} - Xe ${carModel.name}`)
      .setColor("#FFD700") // Gold
      .setDescription(
        `Bạn đã kiểm tra chiếc **${carModel.name}** (ID: ${inlineCode(carToDiagnoseInstanceId.slice(-6))}).`,
      )
      .addFields(
        {
          name: "Kết quả chẩn đoán",
          value: `Phát hiện lỗi: **${foundProblem.name}** (Mức độ: ${foundProblem.severity})`,
        },
        {
          name: "Ước tính chi phí sửa",
          value: `${foundProblem.repairCostEst.toLocaleString()} VNĐ`,
        },
        {
          name: "Phụ tùng có thể cần",
          value:
            foundProblem.partsNeeded.map((p) => `\`${p}\``).join(", ") ||
            "Không rõ",
        },
        {
          name: "Phần thưởng nhiệm vụ",
          value: `+${jobXpReward} XP Nghề, +${jobReputationReward} Danh tiếng.`,
        },
      )
      .setFooter({ text: `Yêu cầu bởi: ${interaction.user.tag}` })
      .setTimestamp();

    if (outputItemMessage) {
      embed.addFields({
        name: "Vật phẩm nhận được",
        value: outputItemMessage.trim(),
      });
    }

    if (leveledUp && leveledUp.leveledUp) {
      embed.addFields({
        name: "🎉 Thăng Cấp Nghề!",
        value: `Chúc mừng! Bạn đã đạt cấp **${user.mainJob.level}** cho nghề **${jobDefinition.displayName}**!`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
    Logger.info(
      `[Task/${this.taskId}] User ${user.userId} diagnosed car ${carToDiagnoseInstanceId}. Problem: ${foundProblem.name}. XP: +${jobXpReward}, Rep: +${jobReputationReward}`,
    );
  },
};
