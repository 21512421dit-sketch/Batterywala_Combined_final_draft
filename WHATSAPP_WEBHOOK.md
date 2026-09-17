# WhatsApp delivery-status testing

1. Add `WHATSAPP_APP_SECRET` privately in `.env` from the sending Meta app's App settings → Basic → App secret. It is not the access token or registration PIN.
2. Restart the Flask server after changing `.env`.
3. Start `ngrok http 8000`. This temporarily exposes the local website, including its protected admin login. Keep it running only while testing.
4. In Meta app → WhatsApp use case → Production setup → Configure Webhooks, set Callback URL to `https://YOUR-NGROK-HOST/api/whatsapp/webhook`. Copy the private `WHATSAPP_VERIFY_TOKEN` value from `.env` into Verify token. Verify and save.
5. Subscribe to the `messages` webhook field and enable Subscribe webhooks for the Care4Earth Enterprises WhatsApp Business Account containing +91 9607576029. If Meta warns that the app is unpublished, complete its publishing requirements for production callbacks.
6. Submit a fresh consented enquiry. API acceptance is not proof of delivery. Signed callbacks update the stored status to sent, delivered, read, or failed.
7. Refresh admin → View details to inspect each recipient's status/error. Admin-only `/admin/whatsapp-deliveries.json` shows the latest 50 tracked messages.

## Required enquiry templates

Create and approve these `en_IN` utility templates in Meta for machine enquiries. The variable order must match the application:

- `engine_dcarb_machine_enquiry_confirmation`: `{{1}}` representative name, `{{2}}` company/address.
- `engine_dcarb_admin_machine_lead`: `{{1}}` complete machine-enquiry customer and business details.

Service admin notifications reuse the approved centre template by default, with `{{1}}` customer name, `{{2}}` phone, `{{3}}` vehicle/details, `{{4}}` indicative cost, and `{{5}}` selected centre/address/centre-head details. A separate template with that same variable order can be set through `WHATSAPP_ADMIN_TEMPLATE`. Machine template names can be overridden with `WHATSAPP_MACHINE_CUSTOMER_TEMPLATE` and `WHATSAPP_MACHINE_ADMIN_TEMPLATE`. The admin destination defaults to `+91 9067671513` and can be overridden with `ENGINE_DCARB_ADMIN_WHATSAPP_NUMBER`.

Only delivery-status data is retained; incoming chat bodies are ignored. Callbacks must have valid Meta HMAC signatures and match the configured sender Phone Number ID. Older/out-of-order events cannot downgrade delivered/read status. Old requests may not receive historical callbacks; do not automatically resend them.

Use a stable HTTPS webhook URL for production; a temporary tunnel stops receiving events when closed. Never commit `.env`, tokens, PINs, or app secrets.
