const ACCOUNT_API_ORIGIN = "https://xuanheng-bazi.duanmucijin504.chatgpt.site";

export default async function onRequest({ request, env }) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `${incomingUrl.pathname}${incomingUrl.search}`,
    ACCOUNT_API_ORIGIN,
  );
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("X-Forwarded-Host", incomingUrl.host);
  headers.set("X-Forwarded-Proto", incomingUrl.protocol.replace(":", ""));
  if (env?.ACCOUNT_API_BYPASS_TOKEN) {
    headers.set(
      "OAI-Sites-Authorization",
      `Bearer ${env.ACCOUNT_API_BYPASS_TOKEN}`,
    );
  }

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Cache-Control", "no-store");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error: {
          code: "account_upstream_unavailable",
          message: "账号服务暂时不可用。",
        },
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
