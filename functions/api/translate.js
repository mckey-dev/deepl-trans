const LANG_CODE = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})?$/;

function apiBase(key) {
  return key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function clientKey(request) {
  const key = (request.headers.get("X-DeepL-Auth-Key") || "").trim();
  if (!key) return "";
  if (!/^[\x21-\x7E]{8,200}$/.test(key)) return null;
  return key;
}

export async function onRequestPost({ request, env }) {
  const provided = clientKey(request);
  if (provided === null) {
    return json({ message: "APIキーの形式が正しくありません。" }, 400);
  }
  const key = provided || String(env.DEEPL_API_KEY || "").trim();
  if (!key) {
    return json(
      { message: "APIキーが未設定です。右上の「APIキー」から入力してください。" },
      401,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: "リクエストの形式が正しくありません。" }, 400);
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return json({ text: "", detected_source_language: null });
  }
  if (text.length > 100000) {
    return json({ message: "テキストが長すぎます。" }, 400);
  }

  const target = String(body.target_lang || "").toUpperCase();
  if (!LANG_CODE.test(target)) {
    return json({ message: "訳文の言語が指定されていません。" }, 400);
  }

  const payload = { text: [text], target_lang: target };
  const source = body.source_lang ? String(body.source_lang).toUpperCase() : "";
  if (source) {
    if (!LANG_CODE.test(source)) {
      return json({ message: "原文の言語が正しくありません。" }, 400);
    }
    payload.source_lang = source;
  }

  let response;
  try {
    response = await fetch(`${apiBase(key)}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json({ message: "DeepL API に接続できませんでした。" }, 502);
  }

  if (!response.ok) {
    let message = "翻訳に失敗しました。";
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody.message === "string") {
        message = errorBody.message;
      }
    } catch {
      /* DeepL が本文を返さない場合はそのまま既定の文を使う */
    }
    if (response.status === 403) {
      message = "APIキーが無効か、このプランでは利用できません。";
    } else if (response.status === 456) {
      message = "DeepL API の利用上限に達しました。";
    } else if (response.status === 429) {
      message = "リクエストが多すぎます。しばらくしてからもう一度お試しください。";
    }
    return json({ message }, response.status);
  }

  const data = await response.json();
  const translation = data.translations && data.translations[0];
  if (!translation) {
    return json({ message: "翻訳結果を取得できませんでした。" }, 502);
  }

  return json({
    text: translation.text || "",
    detected_source_language: translation.detected_source_language || null,
  });
}
