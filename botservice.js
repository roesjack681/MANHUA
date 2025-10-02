import { UserService } from "./userservice.js";

export class BotService {
  static async handleMessage(update, env) {
    const chatId = update.message?.chat.id || update.callback_query?.message.chat.id;
    if (!chatId) return;
    const text = update.message?.text?.trim();
    const data = update.callback_query?.data;

    // /start
    if (text === "/start") {
      await this.sendMessage(chatId, "欢迎来到漫画社区🌟\n请选择服务：", [
        [{ text: "漫画列表📋", callback_data: "list" }],
        [{ text: "联系客服🧙‍♂️", url: "https://t.me/your_support" }]
      ]);
      return;
    }

    // 点击漫画列表
    if (data === "list") {
      const comics = await UserService.listComics(env);
      const buttons = comics.map(c => [{ text: c.replace(/\.[^/.]+$/, ""), callback_data: `comic:${c}` }]);
      await this.sendMessage(chatId, "请选择漫画购买：", buttons);
      return;
    }

    // 点击漫画
    if (data?.startsWith("comic:")) {
      const fileKey = data.split(":")[1];
      const code = await UserService.generateCode(fileKey, env);
      const payUrl = "https://free.picui.cn/free/2025/10/02/68ddfaafd340b.jpg"; // 你的支付二维码
      await this.sendMessage(chatId, `请扫码支付漫画《${fileKey}》：
支付完成后发送订单号验证
卡密: ${code}
二维码: ${payUrl}`);
      return;
    }

    // 用户发送订单号
    if (text && /^\d{16,20}$/.test(text)) {
      const success = await UserService.checkOrder(text, env);
      if (success) {
        await this.sendMessage(chatId, `订单 ${text} 支付成功，请使用卡密下载漫画。`);
      } else {
        await this.sendMessage(chatId, `订单 ${text} 未支付或验证失败，请检查后重试。`);
      }
      return;
    }

    await this.sendMessage(chatId, "发 /start 来查看菜单。");
  }

  static async sendMessage(chatId, text, inlineKeyboard) {
    const body = { chat_id: chatId, text, parse_mode: "Markdown" };
    if (inlineKeyboard) body.reply_markup = { inline_keyboard: inlineKeyboard };
    await fetch(`https://api.telegram.org/bot8486981471:AAGAbNIc9SVZkooQJUScep69_sabH9FRpHg/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }
}
