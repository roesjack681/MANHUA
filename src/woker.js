import { BotService } from "./botservice.js";
import { UserService } from "./userservice.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/webhook" && request.method === "POST") {
      const update = await request.json();
      try {
        await BotService.handleMessage(update, env);
      } catch(e) {
        console.error("handleMessage error:", e);
      }
      return new Response("ok");
    } 

    // 下载验证接口
    if (url.pathname === "/verify" && request.method === "POST") {
      const { code } = await request.json();
      if (!code) return new Response(JSON.stringify({ success: false, reason: "缺少卡密" }), { status: 400, headers: { "Content-Type": "application/json" }});

      const fileKey = await UserService.verifyCode(code, env);
      if (!fileKey) return new Response(JSON.stringify({ success: false, reason: "卡密无效或过期" }), { status: 403, headers: { "Content-Type": "application/json" }});

      const obj = await env.MY_BUCKET.get(fileKey);
      if (!obj) return new Response(JSON.stringify({ success: false, reason: "文件不存在" }), { status: 404, headers: { "Content-Type": "application/json" }});

      return new Response(obj.body, {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType || "application/zip",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileKey)}"`
        }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
