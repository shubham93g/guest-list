// One-off helper for onboarding the WhatsApp Cloud API phone number.
//
// Usage: npm run whatsapp-setup -- <command> [arg]
//
//   status               Show the number's verification/registration status
//   request-code [VOICE] Send a verification code to the number (SMS by default)
//   verify-code <code>   Submit the verification code received above
//   register             Register the number with the Cloud API (clears "Pending")
//   test <phone> [template] [lang] [param...]
//                        Send an approved template (default hello_world, en_US)
//                        to <phone> (country code + number, digits only, e.g.
//                        919876543210). Each param fills the next body
//                        variable ({{1}}, {{2}}, ...). hello_world only works
//                        from Meta's public test numbers — use your own
//                        template otherwise.
//   text <phone> <msg>   Send a free-form text. Only delivered if <phone> has
//                        messaged the business number in the last 24 hours.
//
// Requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID, plus
// WHATSAPP_PIN for `register` (see .env.example — all three live in
// .env.local, which is gitignored). The token is never printed.

const GRAPH_API = 'https://graph.facebook.com/v21.0';

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
if (!token || !phoneNumberId) {
  console.error('Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env.local');
  process.exit(1);
}

async function graph(method, path, body) {
  const res = await fetch(`${GRAPH_API}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) {
    process.exit(1);
  }
}

const [command, arg, ...rest] = process.argv.slice(2);

switch (command) {
  case 'status':
    await graph(
      'GET',
      `${phoneNumberId}?fields=display_phone_number,verified_name,status,code_verification_status,name_status,quality_rating,messaging_limit_tier`,
    );
    break;

  case 'request-code':
    await graph('POST', `${phoneNumberId}/request_code`, {
      code_method: arg === 'VOICE' ? 'VOICE' : 'SMS',
      language: 'en_US',
    });
    break;

  case 'verify-code':
    if (!arg) {
      console.error('Usage: npm run whatsapp-setup -- verify-code <code>');
      process.exit(1);
    }
    await graph('POST', `${phoneNumberId}/verify_code`, { code: arg });
    break;

  case 'register': {
    const pin = process.env.WHATSAPP_PIN;
    if (!pin || !/^\d{6}$/.test(pin)) {
      console.error('Set WHATSAPP_PIN (6 digits) in .env.local');
      process.exit(1);
    }
    await graph('POST', `${phoneNumberId}/register`, {
      messaging_product: 'whatsapp',
      pin,
    });
    break;
  }

  case 'test': {
    if (!arg || !/^\d+$/.test(arg)) {
      console.error('Usage: npm run whatsapp-setup -- test <phone, digits only> [template] [lang] [param...]');
      process.exit(1);
    }
    const [templateName = 'hello_world', languageCode = 'en_US', ...params] = rest;
    const template = { name: templateName, language: { code: languageCode } };
    if (params.length > 0) {
      template.components = [{
        type: 'body',
        parameters: params.map((text) => ({ type: 'text', text })),
      }];
    }
    await graph('POST', `${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: arg,
      type: 'template',
      template,
    });
    break;
  }

  case 'text':
    if (!arg || !/^\d+$/.test(arg) || rest.length === 0) {
      console.error('Usage: npm run whatsapp-setup -- text <phone, digits only> <message>');
      process.exit(1);
    }
    await graph('POST', `${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: arg,
      type: 'text',
      text: { body: rest.join(' ') },
    });
    break;

  default:
    console.error('Usage: npm run whatsapp-setup -- <status|request-code|verify-code|register|test|text> [arg]');
    process.exit(1);
}
