(() => {
  'use strict';
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  const enquirySection = document.getElementById('enquiry');
  const enquiryLayout = enquirySection?.querySelector('.enquiry-layout');
  const enquiryCard = enquirySection?.querySelector('.enquiry-card');
  const enquiryHeading = enquirySection?.querySelector('.section-head h2');
  const enquiryCopy = enquirySection?.querySelector('.section-head p');
  const quoteResult = document.getElementById('quoteResult');

  // Keep the long form out of the page flow until the visitor chooses a path.
  const dialog = document.createElement('dialog');
  dialog.id = 'enquiryDialog';
  dialog.className = 'engine-enquiry-dialog';
  dialog.setAttribute('aria-labelledby', 'enquiryDialogTitle');
  const dialogFrame = document.createElement('div');
  dialogFrame.className = 'engine-dialog-frame';
  dialogFrame.innerHTML = `<header class="engine-dialog-header">
    <div><span class="eyebrow">Engine D-Carb enquiry</span><h2 id="enquiryDialogTitle" tabindex="-1">Tell us what you need.</h2></div>
    <button class="engine-dialog-close" type="button" aria-label="Close enquiry form">&times;</button>
  </header>`;
  if (enquiryCard) dialogFrame.append(enquiryCard);
  dialog.append(dialogFrame);
  document.body.append(dialog);

  if (enquiryHeading) enquiryHeading.textContent = 'Choose your enquiry. We’ll take it from there.';
  if (enquiryCopy) enquiryCopy.textContent = 'Select an option to open a short, guided form for a service estimate or machine quotation.';
  if (enquiryLayout) {
    enquiryLayout.innerHTML = `<div class="engine-enquiry-choices">
      <button type="button" class="engine-enquiry-launch" data-enquiry-type="service">
        <span class="engine-choice-number">01</span><span><strong>Vehicle Servicing</strong><small>Share your vehicle details and choose a nearby service centre.</small></span><i aria-hidden="true">&rarr;</i>
      </button>
      <button type="button" class="engine-enquiry-launch" data-enquiry-type="machine">
        <span class="engine-choice-number">02</span><span><strong>New Machine Enquiry</strong><small>Tell us about your workshop and find the right configuration.</small></span><i aria-hidden="true">&rarr;</i>
      </button>
    </div>`;
  }

  const openEnquiry = type => {
    const radio = form.querySelector(`input[name="enquiryType"][value="${type}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', {bubbles: true}));
    }
    if (form.hidden) {
      form.hidden = false;
      quoteResult?.classList.remove('visible');
    }
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => document.getElementById('enquiryDialogTitle')?.focus({preventScroll: true}));
  };
  document.querySelectorAll('.engine-enquiry-launch').forEach(button =>
    button.addEventListener('click', () => openEnquiry(button.dataset.enquiryType))
  );

  const floatingActions = document.createElement('nav');
  floatingActions.className = 'engine-floating-actions';
  floatingActions.setAttribute('aria-label', 'Quick enquiry actions');
  floatingActions.innerHTML = `
    <a class="engine-floating-action service" href="#enquiry" data-enquiry-type="service" aria-label="Open vehicle servicing enquiry" title="Vehicle servicing enquiry">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5.5a5.4 5.4 0 0 1-7.2 5.1L6.2 18.2a2.1 2.1 0 1 1-3-3l7.6-7.6A5.4 5.4 0 0 1 18.5 3l-3.1 3.1 2.5 2.5L21 5.5Z"/><path d="m14.5 14.5 5.3 5.3"/></svg>
      <span class="engine-floating-tooltip">Vehicle servicing</span>
    </a>
    <a class="engine-floating-action machine" href="#enquiry" data-enquiry-type="machine" aria-label="Open new machine enquiry" title="New machine enquiry">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9h10v11M7 9V5h7v4M14 13h6v7M7 13h2m-2 3h2m8-1h1"/><path d="M2 20h20"/></svg>
      <span class="engine-floating-tooltip">New machine enquiry</span>
    </a>`;
  document.body.append(floatingActions);
  floatingActions.querySelectorAll('.engine-floating-action').forEach(action => {
    action.addEventListener('click', event => {
      event.preventDefault();
      enquirySection?.scrollIntoView({behavior: 'smooth', block: 'start'});
      openEnquiry(action.dataset.enquiryType);
    });
  });
  dialog.querySelector('.engine-dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  // The later presentation-derived blocks repeated information already covered by
  // the hero, technology and process sections. Keep only the strongest evidence.
  document.getElementById('chemical-free')?.remove();
  document.getElementById('simple-process')?.remove();
  document.querySelector('#connected-system .system-secondary')?.remove();
  document.querySelectorAll('#technology .feature').forEach((feature, index) => {
    if (index > 5) feature.remove();
  });

  const submit = form.querySelector('.enquiry-submit, button[type="submit"]');
  const emailQuote = form.elements.emailQuote;
  const serviceEmail = form.elements.serviceEmail;
  const emailChoice = emailQuote?.closest('.engine-email-choice');
  const serviceEmailField = serviceEmail?.closest('.field');
  const emailChoiceTitle = emailQuote?.closest('label')?.querySelector('strong');
  const emailChoiceHelp = emailQuote?.closest('label')?.querySelector('small');
  if (emailChoiceTitle) emailChoiceTitle.textContent = 'Email my machine enquiry';
  if (emailChoiceHelp) emailChoiceHelp.textContent = 'Choose this to email your enquiry and notify Engine D-Carb.';
  serviceEmailField?.classList.add('engine-service-email');
  // Pricing is sent in the prepared WhatsApp message, not exposed in the form.
  document.querySelector('#serviceFields .price-preview')?.remove();
  const serviceGrid = document.querySelector('#serviceFields .form-grid');
  const serviceDetails = document.getElementById('serviceDetails')?.closest('.field');
  const locationInputs = [form.elements.area, form.elements.serviceCity, form.elements.servicePin].filter(Boolean);
  const locationFields = locationInputs.map(input => input.closest('.field')).filter(Boolean);
  locationFields.forEach(field => {
    field.classList.add('engine-location-field');
    field.hidden = true;
  });
  const centreField = document.createElement('div');
  centreField.className = 'field full engine-centre-field';
  centreField.innerHTML = `<label for="selectedCentre">Nearest service centre <span>*</span></label>
    <select id="selectedCentre" name="selectedCentre" required disabled>
      <option value="">Loading service centres…</option>
    </select>
    <small class="engine-centre-help">Select the centre most convenient for your visit.</small>`;
  serviceGrid?.insertBefore(centreField, serviceDetails || null);
  const centreSelect = centreField.querySelector('select');
  let centres = [];

  const syncCentreState = () => {
    const isService = form.elements.enquiryType?.value === 'service';
    centreSelect.disabled = !isService || !centres.length;
    centreSelect.required = isService;
    submit.disabled = isService && !centres.length;
    if (serviceEmailField) serviceEmailField.hidden = true;
    if (serviceEmail) {
      serviceEmail.disabled = true;
      serviceEmail.required = false;
    }
    if (emailChoice) emailChoice.hidden = isService;
    if (emailQuote) {
      emailQuote.disabled = isService;
      if (isService) emailQuote.checked = false;
    }
    const needsLocation = isService && centreSelect.value === 'other';
    locationFields.forEach(field => { field.hidden = !needsLocation; });
    locationInputs.forEach(input => {
      input.disabled = !needsLocation;
      input.required = needsLocation;
    });
  };
  form.querySelectorAll('input[name="enquiryType"]').forEach(input => input.addEventListener('change', syncCentreState));
  emailQuote?.addEventListener('change', syncCentreState);
  centreSelect.addEventListener('change', () => {
    syncCentreState();
  });
  syncCentreState();
  fetch('/api/engine-d-carb/centres', {headers:{'Accept':'application/json'}})
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load service centres.')))
    .then(data => {
      centres = data.centres || [];
      centreSelect.replaceChildren(new Option('Select your nearest centre', ''));
      centres.forEach(centre => centreSelect.add(new Option(centre.name, centre.key)));
      centreSelect.add(new Option('Others', 'other'));
      syncCentreState();
    })
    .catch(failure => {
      centreSelect.replaceChildren(new Option('Service centres unavailable', ''));
      syncCentreState();
    });
  const consent = document.createElement('label');
  consent.className = 'engine-consent';
  consent.innerHTML = `<input type="checkbox" name="consent" value="true" required>
    <span>I consent to Engine D-Carb and Care4Earth Enterprises storing the details I submit for 24 months to prepare and manage my quotation and analyze service demand. My information will not be sold or used for promotional marketing. I can request correction or deletion using the contact details on this website.</span>`;
  submit.before(consent);

  const buildWhatsAppEnquiry = (payload, result) => {
    const lines = ['Hello Engine D-Carb team, I submitted an enquiry through your website.'];
    if (payload.enquiryType === 'service') {
      lines.push(
        '',
        `Name: ${payload.customerName}`,
        `Phone: ${payload.servicePhone}`,
        `Vehicle: ${payload.vehicleType} — ${payload.vehicleBrand} ${payload.vehicleModel}`,
        `Registration year: ${payload.passingYear}`,
        `Fuel: ${payload.fuelType}`,
        `Engine capacity: ${payload.engineCc} CC`,
        `Kilometres driven: ${new Intl.NumberFormat('en-IN').format(Number(payload.kilometres))} km`,
        `Preferred centre: ${result.centre.name}`,
        `Centre/location: ${result.centre.address}`,
        result.indicative_cost
          ? `Indicative estimate: ${new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0}).format(result.indicative_cost)}`
          : '',
        payload.serviceDetails ? `Additional details: ${payload.serviceDetails}` : '',
        '',
        'Please contact me to confirm the final quotation and appointment.'
      );
    } else {
      lines.push(
        '',
        'Enquiry type: New Engine D-Carb machine',
        `Representative: ${payload.representativeName}`,
        `Phone: ${payload.machinePhone}`,
        `Email: ${payload.machineEmail}`,
        `Company/address: ${payload.companyAddress}`,
        `Business and experience: ${payload.businessDetails}`,
        `Location: ${payload.machineCity} — ${payload.machinePin}`,
        payload.machineDetails ? `Additional details: ${payload.machineDetails}` : '',
        '',
        'Please contact me with a suitable machine configuration and quotation.'
      );
    }
    return lines.filter(Boolean).join('\n');
  };

  form.addEventListener('submit', async event => {
    if (form.dataset.backendSaved === 'true') {
      delete form.dataset.backendSaved;
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const error = document.getElementById('enquiryError');
    if (!form.reportValidity()) {
      error.textContent = 'Complete the required fields and accept the data-storage consent.';
      error.classList.add('visible');
      return;
    }
    const payload = Object.fromEntries(new FormData(form));
    payload.consent = payload.consent === 'true';
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    const originalLabel = submit.textContent;
    submit.textContent = 'Saving enquiry…';
    try {
      const response = await fetch('/api/engine-d-carb/quotations', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1'},
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save the enquiry.');
      form.dataset.backendSaved = 'true';
      form.requestSubmit();
      const enquiryType = payload.enquiryType;
      const whatsappMessage = buildWhatsAppEnquiry(payload, result);
      const title = document.getElementById('quoteTitle');
      const greeting = document.getElementById('quoteGreeting');
      if (enquiryType === 'machine') {
        title.textContent = `Thank you, ${payload.representativeName}. Your machine enquiry has been received.`;
        greeting.textContent = 'Your enquiry is saved. You can also send the same details through WhatsApp using the button below.';
      } else {
        title.textContent = `Thank you, ${payload.customerName}. Your vehicle service enquiry has been received.`;
        greeting.textContent = `Your vehicle details are ready for ${result.centre.name}. You can send the enquiry through WhatsApp for the service team to review.`;
      }
      const actions = document.querySelector('#quoteResult .quote-actions');
      const whatsapp = document.getElementById('quoteWhatsApp');
      whatsapp.href = `https://wa.me/917727005151?text=${encodeURIComponent(whatsappMessage)}`;
      whatsapp.target = '_blank';
      whatsapp.rel = 'noopener';
      whatsapp.removeAttribute('aria-disabled');
      whatsapp.textContent = 'Send enquiry on WhatsApp';
      document.getElementById('engineMessagePreview')?.remove();
      if (payload.emailQuote === 'true') {
        const delivery = result.email_delivery || [];
        const delivered = delivery.length === 2 && delivery.every(item => item.status === 'sent');
        greeting.textContent += delivered
          ? ' The quotation was emailed to you and a copy was sent to Engine D-Carb.'
          : ' Your enquiry was saved, but email delivery could not be completed. Please contact Engine D-Carb if you do not receive it.';
        const manualEmail = document.getElementById('quoteEmail');
        if (manualEmail) manualEmail.hidden = true;
      }
      form.hidden = true;
      document.getElementById('quoteResult')?.focus({preventScroll: true});
    } catch (failure) {
      error.textContent = failure.message;
      error.classList.add('visible');
      error.focus?.();
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.textContent = originalLabel;
      syncCentreState();
    }
  }, true);
})();
