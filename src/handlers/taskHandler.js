const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Logger = require("../utils/logger");
const User = require("../models/User");
const ShopItem = require("../models/ShopItem");

const jobTasks = new Map();

function loadTasks() {
  const tasksPath = path.join(__dirname, "..", "job_tasks");
  if (!fs.existsSync(tasksPath)) {
    Logger.warn(
      `[TaskHandler] Directory not found: ${tasksPath}. No tasks will be loaded.`,
    );
    return;
  }
  const taskFiles = fs
    .readdirSync(tasksPath)
    .filter((file) => file.endsWith(".js"));

  jobTasks.clear();

  for (const file of taskFiles) {
    try {
      const filePath = path.join(tasksPath, file);
      delete require.cache[require.resolve(filePath)];
      const taskModule = require(filePath);

      if (
        taskModule &&
        taskModule.taskId && // Chỉ cần taskId và jobName khi load
        taskModule.jobName &&
        (typeof taskModule.executeTask === "function" ||
          typeof taskModule.completeTask === "function") // Cần ít nhất 1 trong 2
      ) {
        jobTasks.set(taskModule.taskId.toLowerCase(), taskModule);
        Logger.info(
          `[TaskHandler] Loaded task: ${taskModule.taskId} for job ${taskModule.jobName}`,
        );
      } else {
        Logger.warn(
          `[TaskHandler] Task file ${file} is missing required properties (taskId, jobName, executeTask/completeTask).`,
        );
      }
    } catch (error) {
      Logger.error(
        `[TaskHandler] Error loading task ${file}: ${error.message}`,
        { stack: error.stack },
      );
    }
  }
  Logger.info(`[TaskHandler] Total ${jobTasks.size} job tasks loaded.`);
}

function formatDuration(ms) {
  if (ms <= 0) return "Ngay bây giờ";
  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / (1000 * 60)) % 60);
  let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  let days = Math.floor(ms / (1000 * 60 * 60 * 24));

  let str = "";
  if (days > 0) str += `${days} ngày `;
  if (hours > 0) str += `${hours} giờ `;
  if (minutes > 0) str += `${minutes} phút `;
  if (seconds > 0 || str === "") str += `${seconds} giây`; // Hiển thị giây nếu chỉ có giây
  return str.trim() || "Ngay lập tức";
}

async function executeMainJobTask(
  interaction,
  user,
  jobDefinition,
  taskDefinitionToExecute,
  additionalArgs = {},
) {
  const handler = jobTasks.get(taskDefinitionToExecute.taskId.toLowerCase());

  if (!handler || typeof handler.executeTask !== "function") {
    // Kiểm tra executeTask
    Logger.warn(
      `[TaskHandler] No executeTask handler found for task ID: ${taskDefinitionToExecute.taskId}`,
    );
    await interaction
      .editReply({
        content: `❌ Không tìm thấy hoặc chưa hỗ trợ xử lý bắt đầu cho nhiệm vụ: \`${taskDefinitionToExecute.name}\`. Vui lòng báo admin.`,
      })
      .catch(() => {});
    return;
  }

  if (jobDefinition.name.toLowerCase() !== handler.jobName.toLowerCase()) {
    Logger.warn(
      `[TaskHandler] Task ${handler.taskId} is for job ${handler.jobName}, but user ${user.userId} has job ${jobDefinition.displayName}. Mismatch.`,
    );
    await interaction
      .editReply({
        content: `❌ Nhiệm vụ này không thuộc về nghề hiện tại của bạn.`,
      })
      .catch(() => {});
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = Date.now();
    const lastUsedTimestamp =
      user.mainJob.taskCooldowns?.get(taskDefinitionToExecute.taskId) || 0;
    if (now - lastUsedTimestamp < (taskDefinitionToExecute.cooldownMs || 0)) {
      const remaining =
        (taskDefinitionToExecute.cooldownMs || 0) - (now - lastUsedTimestamp);
      await interaction
        .editReply({
          content: `⏳ Bạn cần chờ ${formatDuration(remaining)} nữa để thực hiện lại nhiệm vụ **${taskDefinitionToExecute.name}**.`,
        })
        .catch(() => {});
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (
      (user.mainJob.level || 1) <
      (taskDefinitionToExecute.requiredJobLevel || 1)
    ) {
      await interaction
        .editReply({
          content: `❌ Bạn cần đạt cấp độ nghề **${taskDefinitionToExecute.requiredJobLevel || 1}** để thực hiện nhiệm vụ này. (Cấp hiện tại: ${user.mainJob.level || 1})`,
        })
        .catch(() => {});
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (
      taskDefinitionToExecute.requiredSpecialization &&
      user.mainJob.specialization !==
        taskDefinitionToExecute.requiredSpecialization
    ) {
      const specDef = jobDefinition.specializations.find(
        (s) => s.specId === taskDefinitionToExecute.requiredSpecialization,
      );
      await interaction
        .editReply({
          content: `❌ Nhiệm vụ này yêu cầu chuyên môn **${specDef ? specDef.name : taskDefinitionToExecute.requiredSpecialization}**.`,
        })
        .catch(() => {});
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (
      taskDefinitionToExecute.requiredItems &&
      taskDefinitionToExecute.requiredItems.length > 0
    ) {
      for (const reqItem of taskDefinitionToExecute.requiredItems) {
        const userItemQuantity = user.inventory.get(reqItem.itemId) || 0;
        if (userItemQuantity < reqItem.quantity) {
          const shopItem = await ShopItem.findOne({
            itemId: reqItem.itemId,
          }).lean();
          await interaction
            .editReply({
              content: `❌ Bạn không đủ vật phẩm! Cần **${reqItem.quantity} x ${shopItem ? shopItem.name : reqItem.itemId}**. Hiện có: ${userItemQuantity}.`,
            })
            .catch(() => {});
          await session.abortTransaction();
          session.endSession();
          return;
        }
        if (reqItem.consume) {
          user.inventory.set(
            reqItem.itemId,
            userItemQuantity - reqItem.quantity,
          );
          if (user.inventory.get(reqItem.itemId) <= 0) {
            user.inventory.delete(reqItem.itemId);
          }
        }
      }
      user.markModified("inventory");
    }

    if (
      taskDefinitionToExecute.type === "active_duration" ||
      taskDefinitionToExecute.type === "crafting"
    ) {
      if (user.mainJob.activeTask && user.mainJob.activeTask.taskId) {
        const runningTaskDef = jobDefinition.tasks.find(
          (t) => t.taskId === user.mainJob.activeTask.taskId,
        );
        await interaction
          .editReply({
            content: `⏳ Bạn đang thực hiện nhiệm vụ khác: **${runningTaskDef ? runningTaskDef.name : user.mainJob.activeTask.taskId}**. Hãy chờ hoàn thành hoặc dùng lệnh claim.`,
          })
          .catch(() => {});
        await session.abortTransaction();
        session.endSession();
        return;
      }
      user.mainJob.activeTask = {
        taskId: taskDefinitionToExecute.taskId,
        startTime: new Date(),
        durationMs: taskDefinitionToExecute.durationMs,
        arguments: additionalArgs, // Lưu các args bổ sung
      };
      user.mainJob.taskCooldowns.set(taskDefinitionToExecute.taskId, now);
      user.markModified("mainJob.activeTask");
      user.markModified("mainJob.taskCooldowns");
      await user.save({ session });
      await session.commitTransaction();
      session.endSession();
      // Gọi executeTask của module, nó sẽ chỉ gửi thông báo bắt đầu
      await handler.executeTask(
        interaction,
        user,
        jobDefinition,
        taskDefinitionToExecute,
        additionalArgs,
      );
    } else if (taskDefinitionToExecute.type === "active_immediate") {
      // Handler.executeTask sẽ tự save user trong session của nó nếu cần
      // Ta chỉ cần đảm bảo cooldown được đặt sau khi task thực sự thành công
      // executeTask của module nên trả về một cờ thành công/thất bại
      const taskResult = await handler.executeTask(
        interaction,
        user,
        jobDefinition,
        taskDefinitionToExecute,
        additionalArgs,
        session,
      );

      if (taskResult && taskResult.success) {
        // Giả sử executeTask trả về { success: true/false }
        user.mainJob.taskCooldowns.set(
          taskDefinitionToExecute.taskId,
          Date.now(),
        );
        user.markModified("mainJob.taskCooldowns");
        await user.save({ session }); // Lưu lại cooldown và các thay đổi từ task
        await session.commitTransaction();
      } else {
        // Nếu task thất bại (ví dụ, điều kiện trong task không được đáp ứng), rollback
        Logger.warn(
          `[TaskHandler] Immediate task ${taskDefinitionToExecute.taskId} reported failure for user ${user.userId}. Rolling back item consumption if any.`,
        );
        // Logic hoàn trả item nếu cần (phức tạp hơn, cần snapshot inventory trước khi trừ)
        // Hoặc đơn giản là không trừ item nếu task báo fail ngay từ đầu.
        await session.abortTransaction();
      }
      session.endSession();
    } else {
      await interaction
        .editReply({
          content: `❌ Loại nhiệm vụ "${taskDefinitionToExecute.type}" chưa được hỗ trợ.`,
        })
        .catch(() => {});
      await session.abortTransaction();
      session.endSession();
    }
  } catch (taskError) {
    Logger.error(
      `[TaskHandler/Execute] Error for task ${taskDefinitionToExecute.taskId}, user ${user.userId}: ${taskError.message}`,
      { stack: taskError.stack },
    );
    if (interaction.replied || interaction.deferred) {
      await interaction
        .editReply({
          content: `❌ Đã xảy ra lỗi khi thực hiện nhiệm vụ: ${taskDefinitionToExecute.name}. Lỗi: ${taskError.message}`,
        })
        .catch(() => {});
    } else {
      await interaction
        .reply({
          content: `❌ Đã xảy ra lỗi khi thực hiện nhiệm vụ: ${taskDefinitionToExecute.name}. Lỗi: ${taskError.message}`,
          ephemeral: true,
        })
        .catch(() => {});
    }
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
  }
}

async function completeActiveTask(interaction, userFromCommand, jobDefinition) {
  await interaction.deferReply({ ephemeral: false }); // Claim task có thể public

  const session = await mongoose.startSession(); // Bắt đầu session mới cho việc claim
  session.startTransaction();

  try {
    // Lấy lại user document trong session này để đảm bảo nhất quán
    const user = await User.findById(userFromCommand._id).session(session);
    if (!user) {
      throw new Error(
        "Không tìm thấy dữ liệu người dùng trong phiên làm việc.",
      );
    }

    if (!user.mainJob.activeTask || !user.mainJob.activeTask.taskId) {
      await interaction.editReply({
        content: "Bạn không có nhiệm vụ nào đang chờ hoàn thành.",
        ephemeral: true,
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const activeTaskData = user.mainJob.activeTask;
    const taskDefinition = jobDefinition.tasks.find(
      (t) => t.taskId === activeTaskData.taskId,
    );

    if (!taskDefinition) {
      Logger.error(
        `[TaskHandler/Claim] Active task definition not found for ${activeTaskData.taskId}`,
      );
      user.mainJob.activeTask = null;
      await user.save({ session });
      await session.commitTransaction();
      session.endSession();
      await interaction.editReply({
        content:
          "Lỗi: Không tìm thấy thông tin nhiệm vụ đang làm. Tác vụ đã được hủy.",
        ephemeral: true,
      });
      return;
    }

    const taskStartTime = new Date(activeTaskData.startTime).getTime();
    const taskDuration =
      activeTaskData.durationMs || taskDefinition.durationMs || 0;

    if (Date.now() < taskStartTime + taskDuration) {
      const timeLeft = taskStartTime + taskDuration - Date.now();
      await interaction.editReply({
        content: `⏳ Nhiệm vụ **${taskDefinition.name}** của bạn vẫn đang được thực hiện. Còn lại: ${formatDuration(timeLeft)}`,
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const handler = jobTasks.get(taskDefinition.taskId.toLowerCase());
    if (!handler || typeof handler.completeTask !== "function") {
      Logger.error(
        `[TaskHandler/Claim] No completeTask function found for handler ${taskDefinition.taskId}`,
      );
      user.mainJob.activeTask = null;
      await user.save({ session });
      await session.commitTransaction(); // Commit việc xóa activeTask lỗi
      session.endSession();
      await interaction.editReply({
        content: `Lỗi: Không thể hoàn thành nhiệm vụ **${taskDefinition.name}** do thiếu logic xử lý. Tác vụ đã được hủy.`,
      });
      return;
    }

    // Gọi hàm completeTask của module task, truyền session vào
    const result = await handler.completeTask(
      interaction,
      user,
      jobDefinition,
      taskDefinition,
      activeTaskData,
      session,
    );
    // Hàm completeTask trong module sẽ chịu trách nhiệm chính trong việc cập nhật user, trừ item, cộng thưởng và save user TRONG SESSION.

    if (result && result.success) {
      user.mainJob.activeTask = null; // Xóa task đã hoàn thành
      user.markModified("mainJob.activeTask");
      // Các thay đổi khác cho user (XP, item...) đã được xử lý trong handler.completeTask và save
      await user.save({ session }); // Lưu lại việc xóa activeTask

      await session.commitTransaction();
      // interaction đã được editReply bên trong handler.completeTask
      Logger.info(
        `[TaskHandler/Claim] User ${user.userId} successfully claimed task ${taskDefinition.taskId}. Message: ${result.message}`,
      );
    } else {
      // Nếu completeTask báo lỗi hoặc không thành công như mong đợi
      await session.abortTransaction();
      const errorMessage = result
        ? result.message
        : "Hoàn thành nhiệm vụ thất bại không rõ lý do.";
      await interaction
        .editReply({ content: `❌ ${errorMessage}` })
        .catch(() => {});
      Logger.warn(
        `[TaskHandler/Claim] User ${user.userId} failed to claim task ${taskDefinition.taskId}. Reason: ${errorMessage}`,
      );
    }
  } catch (error) {
    Logger.error(
      `[TaskHandler/Claim] Error for user ${userFromCommand.userId}: ${error.message}`,
      { stack: error.stack },
    );
    await interaction
      .editReply({
        content: `❌ Lỗi nghiêm trọng khi nhận nhiệm vụ: ${error.message}`,
      })
      .catch(() => {});
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
  } finally {
    session.endSession();
  }
}

module.exports = {
  loadTasks,
  executeMainJobTask,
  completeActiveTask,
  getTaskHandler: (taskId) => jobTasks.get(taskId.toLowerCase()),
};
