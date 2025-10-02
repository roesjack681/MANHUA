export class UserService {
    // 生成卡密存 D1
    static async generateCode(fileKey, env) {
      const code = Math.random().toString(36).slice(2,10).toUpperCase();
      const expireAt = Date.now() + 30*60*1000; // 30 分钟
      
      await env.DB.prepare(
        "INSERT INTO codes (code, fileKey, expireAt) VALUES (?, ?, ?)"
      ).bind(code, fileKey, expireAt).run();
      
      return code;
    }
  
    static async verifyCode(code, env) {
      const result = await env.DB.prepare(
        "SELECT fileKey, expireAt FROM codes WHERE code = ?"
      ).bind(code).first();
      
      if (!result) return null;
      
      if (Date.now() > result.expireAt) {
        await env.DB.prepare("DELETE FROM codes WHERE code = ?").bind(code).run();
        return null;
      }
      
      await env.DB.prepare("DELETE FROM codes WHERE code = ?").bind(code).run(); // 用一次即删除
      return result.fileKey;
    }
  
    static async listComics(env) {
      const list = await env.MY_BUCKET.list({ limit: 1000 });
      return list.objects.map(o => o.key).filter(k => k.endsWith(".zip"));
    }
  
    static async checkOrder(orderId, env) {
      // TODO: 替换成真实的订单验证接口
      // const resp = await fetch(`https://your-real-api.com/verify?orderId=${orderId}`);
      // const data = await resp.json();
      // return data.success === true;
      
      // 模拟接口：永远返回 true
      console.log(`验证订单: ${orderId}`);
      return true;
    }

    // 保存用户待支付订单
    static async savePendingOrder(chatId, fileKey, env) {
      await env.DB.prepare(
        "INSERT OR REPLACE INTO pending_orders (chatId, fileKey, createdAt) VALUES (?, ?, ?)"
      ).bind(chatId.toString(), fileKey, Date.now()).run();
    }

    // 获取用户待支付订单
    static async getPendingOrder(chatId, env) {
      const result = await env.DB.prepare(
        "SELECT fileKey FROM pending_orders WHERE chatId = ?"
      ).bind(chatId.toString()).first();
      return result?.fileKey || null;
    }

    // 清除用户待支付订单
    static async clearPendingOrder(chatId, env) {
      await env.DB.prepare(
        "DELETE FROM pending_orders WHERE chatId = ?"
      ).bind(chatId.toString()).run();
    }
  }
  