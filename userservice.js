export class UserService {
    // 生成卡密存 D1
    static async generateCode(fileKey, env) {
      const code = Math.random().toString(36).slice(2,10).toUpperCase();
      const expireAt = Date.now() + 30*60*1000; // 30 分钟
      await env.DB.put(code, JSON.stringify({ fileKey, expireAt }), { expirationTtl: 1800 });
      return code;
    }
  
    static async verifyCode(code, env) {
      const entryStr = await env.DB.get(code);
      if (!entryStr) return null;
      const entry = JSON.parse(entryStr);
      if (Date.now() > entry.expireAt) {
        await env.DB.delete(code);
        return null;
      }
      await env.DB.delete(code); // 用一次即删除
      return entry.fileKey;
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
  