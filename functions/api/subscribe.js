// Cloudflare Pages Function
// Route: POST /api/subscribe
// This proxies the signup to Beehiiv so the public Beehiiv API key/publication
// ID never has to live in client-side JS. Set the two secrets below in the
// Cloudflare Pages dashboard under Settings -> Environment variables:
//   BEEHIIV_API_KEY          (server-side secret)
//   BEEHIIV_PUBLICATION_ID   (e.g. pub_xxxxxxxx)

export async function onRequestPost(context) {
  const { request, env } = context;

  let email;
  try {
    const body = await request.json();
    email = body?.email;
  } catch {
    return jsonResponse({ message: 'Invalid request body.' }, 400);
  }

  if (!email || typeof email !== 'string') {
    return jsonResponse({ message: 'Please enter a valid email address.' }, 400);
  }

  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
    return jsonResponse(
      { message: 'Subscribe endpoint is not configured yet.' },
      500
    );
  }

  const beehiivRes = await fetch(
    `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
      },
      body: JSON.stringify({ email, reactivate_existing: false }),
    }
  );

  const data = await beehiivRes.json().catch(() => ({}));

  if (!beehiivRes.ok) {
    return jsonResponse(data, beehiivRes.status);
  }

  return jsonResponse(data, 200);
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
