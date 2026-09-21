const DEFAULT_LIMIT = 1;

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

function getBaseUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

async function runQueue(env, cron) {
  const baseUrl = getBaseUrl(env.MANGA_HARVEST_URL);
  const secret = env.CRON_SECRET;

  if (!baseUrl) {
    throw new Error("MANGA_HARVEST_URL is not configured");
  }

  if (!secret) {
    throw new Error("CRON_SECRET is not configured");
  }

  const configuredLimit = Number(env.UPDATE_LIMIT || DEFAULT_LIMIT);
  const limit = Math.min(Math.max(Number.isFinite(configuredLimit) ? configuredLimit : DEFAULT_LIMIT, 1), 2);
  const endpoint =
    `${baseUrl}/api/v1/cron/update?limit=${encodeURIComponent(limit)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
      "User-Agent": "MangaHarvest-Cloudflare-Worker/1.0",
    },
  });

  const body = await response.text();

  console.log(
    JSON.stringify({
      cron,
      endpoint,
      status: response.status,
      body: body.slice(0, 4000),
    })
  );

  if (!response.ok) {
    throw new Error(
      `MangaHarvest queue returned HTTP ${response.status}: ${body.slice(0, 500)}`
    );
  }

  return {
    status: response.status,
    body,
  };
}

export default {
  async scheduled(controller, env) {
    const cron = controller.cron;

    try {
      console.log(JSON.stringify({
        event: "cron_start",
        cron,
        scheduledTime: controller.scheduledTime,
      }));

      await runQueue(env, cron);

      console.log(JSON.stringify({
        event: "cron_success",
        cron,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      console.error(JSON.stringify({
        event: "cron_error",
        cron,
        scheduledTime: controller.scheduledTime,
        error: message,
        stack,
      }));

      throw error;
    }
  },

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        service: "MangaHarvest Queue Worker",
        status: "ok",
        scheduler: "cloudflare-cron",
      });
    }

    return json({ error: "Not Found" }, 404);
  },
};
