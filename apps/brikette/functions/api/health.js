function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Allow: "GET, HEAD",
    },
  });
}

export function onRequestGet() {
  return jsonResponse({
    ok: true,
  });
}

export function onRequestHead() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Allow: "GET, HEAD",
    },
  });
}
