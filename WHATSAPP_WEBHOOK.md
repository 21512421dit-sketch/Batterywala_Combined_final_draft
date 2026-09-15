# WhatsApp delivery-status testing

1. Add `WHATSAPP_APP_SECRET` privately in `.env` from the sending Meta app's App settings → Basic → App secret. It is not the access token or registration PIN.
2. Restart the Flask server after changing `.env`.
3. Start `ngrok http 8000`. This temporarily exposes the local website, including its protected admin login. Keep it running only while testing.
4. In Meta app → WhatsApp use case → Production setup → Configure Webhooks, set Callback URL to `https://YOUR-NGROK-HOST/api/whatsapp/webhook`. Copy the private `WHATSAPP_VERIFY_TOKEN` value from `.env` into Verify token. Verify and save.
5. Subscribe to the `messages` webhook field and enable Subscribe webhooks for the Care4Earth Enterprises WhatsApp Business Account containing +91 9607576029. If Meta warns that the app is unpublished, complete its publishing requirements for production callbacks.
6. Submit a fresh consented enquiry. API acceptance is not proof of delivery. Signed callbacks update the stored status to sent, delivered, read, or failed.
7. Refresh admin → View details to inspect each recipient's status/error. Admin-only `/admin/whatsapp-deliveries.json` shows the latest 50 tracked messages.

Only delivery-status data is retained; incoming chat bodies are ignored. Callbacks must have valid Meta HMAC signatures and match the configured sender Phone Number ID. Older/out-of-order events cannot downgrade delivered/read status. Old requests may not receive historical callbacks; do not automatically resend them.

Use a stable HTTPS webhook URL for production; a temporary tunnel stops receiving events when closed. Never commit `.env`, tokens, PINs, or app secrets.
