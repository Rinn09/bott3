const fs = require("fs");
const path = require("path");
const Logger = require("../utils/logger");

const jobTasks = new Map(); // Map<taskId, taskModule>

function loadTasks() {
  const tasksPath = path.join(__dirname, "..", "job_tasks"); // Đường dẫn tới thư mục chứa các file task
  if (!fs.existsSync(tasksPath)) {
    Logger.warn(
      `[TaskHandler] Directory not found: ${tasksPath}. No tasks will be loaded.`,
    );
    return;
  }
  const taskFiles = fs
    .readdirSync(tasksPath)
    .filter((file) => file.endsWith(".js"));

  jobTasks.clear(); // Xóa các task cũ trước khi load lại (nếu có reload)

  for (const file of taskFiles) {
    try {
      const filePath = path.join(tasksPath, file);
      delete require.cache[require.resolve(filePath)]; // Xóa cache để reload
      const taskModule = require(filePath);

      if (
        taskModule &&
        typeof taskModule.executeTask === "function" &&
        taskModule.taskId &&
        taskModule.jobName
      ) {
        jobTasks.set(taskModule.taskId.toLowerCase(), taskModule); // Lưu task module, key là taskId chữ thường
        Logger.info(
          `[TaskHandler] Loaded task: ${taskModule.taskId} for job ${taskModule.jobName}`,
        );
      } else {
        Logger.warn(
          `[TaskHandler] Task file ${file} is missing taskId, jobName, or executeTask function.`,
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

async function executeMainJobTask(
  interaction,
  user,
  jobDefinition,
  taskDefinitionToExecute,
) {
  // user: Document User đã fetch
  // jobDefinition: Document MainJob của nghề user đang làm
  // taskDefinitionToExecute: Object task cụ thể từ jobDefinition.tasks mà user muốn thực hiện

  const handler = jobTasks.get(taskDefinitionToExecute.taskId.toLowerCase());

  if (handler) {
    // Kiểm tra nghề yêu cầu của task handler có khớp với nghề của người dùng không
    if (jobDefinition.name.toLowerCase() !== handler.jobName.toLowerCase()) {
      Logger.warn(
        `[TaskHandler] Task ${handler.taskId} is for job ${handler.jobName}, but user ${user.userId} has job ${jobDefinition.name}. This might be a configuration mismatch.`,
      );
      // Bạn có thể quyết định trả lỗi ở đây hoặc vẫn cho chạy nếu taskID khớp
      // return interaction.editReply({ content: `❌ Nhiệm vụ này không thuộc về nghề hiện tại của bạn.`});
    }
    try {
      await handler.executeTask(
        interaction,
        user,
        jobDefinition,
        taskDefinitionToExecute,
      );
    } catch (taskError) {
      Logger.error(
        `[TaskHandler] Error executing task ${taskDefinitionToExecute.taskId} for user ${user.userId}: ${taskError.message}`,
        { stack: taskError.stack },
      );
      await interaction
        .editReply({
          content: `❌ Đã xảy ra lỗi khi thực hiện nhiệm vụ: ${taskDefinitionToExecute.name}.`,
        })
        .catch(() => {});
    }
  } else {
    Logger.warn(
      `[TaskHandler] No handler found for task ID: ${taskDefinitionToExecute.taskId}`,
    );
    await interaction
      .editReply({
        content: `❌ Không tìm thấy hoặc chưa hỗ trợ xử lý cho nhiệm vụ: \`${taskDefinitionToExecute.name}\`. Vui lòng báo admin.`,
      })
      .catch(() => {});
  }
}

module.exports = {
  loadTasks,
  executeMainJobTask,
  getTaskHandler: (taskId) => jobTasks.get(taskId.toLowerCase()), // Thêm hàm này nếu cần truy cập trực tiếp task module
};
