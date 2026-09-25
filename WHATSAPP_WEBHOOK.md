# WhatsApp delivery-status testing

1. Add `WHATSAPP_APP_SECRET` privately in `.env` from the sending Meta app's App settings → Basic → App secret. It is not the access token or registration PIN.
2. Restart the Flask server after changing `.env`.
3. Start `ngrok http 8000`. This temporarily exposes the local website, including its protected admin login. Keep it running only while testing.
4. Every time ngrok assigns a new hostname, update the Engine D-Carb WABA's subscribed-app callback override to `https://YOUR-NGROK-HOST/api/whatsapp/webhook` with the private `WHATSAPP_VERIFY_TOKEN` from `.env`. The existing WABA subscription override takes precedence over the app's default callback URL. Verify the new URL before sending a test message. When moving to Hostinger, replace this temporary override with the permanent HTTPS webhook URL.
5. Subscribe to the `messages` webhook field and enable Subscribe webhooks for the Care4Earth Enterprises WhatsApp Business Account containing +91 9607069191. If Meta warns that the app is unpublished, complete its publishing requirements for production callbacks.
6. Submit a fresh consented enquiry. API acceptance is not proof of delivery. Signed callbacks update the stored status to sent, delivered, read, or failed.
7. Refresh admin → View details to inspect each recipient's status/error. Admin-only `/admin/whatsapp-deliveries.json` shows the latest 50 tracked messages.

Changing ngrok cannot fix a Meta template rejection. Error `#132001` means the selected template name or language is unavailable for the sending WABA. Confirm that the exact template is approved in `en_IN`, and check the number of body placeholders before retrying. A send API response with a message ID means **accepted**, not delivered; wait for a signed `delivered` or `read` webhook status.

## Required enquiry templates

Create and approve these `en_IN` utility templates in Meta for machine enquiries. The variable order must match the application:

- `engine_dcarb_machine_enquiry_confirmation`: `{{1}}` representative name, `{{2}}` company/address.
- `engine_dcarb_admin_machine_lead`: `{{1}}` complete machine-enquiry customer and business details.

Service admin notifications reuse the approved centre template by default, with `{{1}}` customer name, `{{2}}` phone, `{{3}}` vehicle/details, `{{4}}` indicative cost, and `{{5}}` selected centre/address/centre-head details plus the India submission date/time. A separate template with that same variable order can be set through `WHATSAPP_ADMIN_TEMPLATE`. Machine template names can be overridden with `WHATSAPP_MACHINE_CUSTOMER_TEMPLATE` and `WHATSAPP_MACHINE_ADMIN_TEMPLATE`. The portal's **D-Carb admin** setting controls the admin destination; it is initially `+91 9067671513`. `ENGINE_DCARB_ADMIN_WHATSAPP_NUMBER` remains a first-run fallback.

Only delivery-status data is retained; incoming chat bodies are ignored. Callbacks must have valid Meta HMAC signatures and match the configured sender Phone Number ID. Older/out-of-order events cannot downgrade delivered/read status. Old requests may not receive historical callbacks; do not automatically resend them.

Use a stable HTTPS webhook URL for production; a temporary tunnel stops receiving events when closed. Never commit `.env`, tokens, PINs, or app secrets.
