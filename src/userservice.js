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
      const resp = await fetch(`YOUR_ORDER_VERIFY_API?orderId=${orderId}`);
      const data = await resp.json();
      return data.includes(orderId);
    }
  }
  