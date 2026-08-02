const ACCOUNT_API_ORIGIN =
  "https://xuanheng-bazi-d5gr07h3m2afa3edd-1318965414.ap-shanghai.app.tcloudbase.com";

export default async function onRequest({ request }) {
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
