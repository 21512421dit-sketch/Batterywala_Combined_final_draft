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
  const completionStatus = document.createElement('p');
  completionStatus.className = 'engine-enquiry-completion';
  completionStatus.setAttribute('role', 'status');
  completionStatus.setAttribute('aria-live', 'polite');
  completionStatus.hidden = true;
  enquiryLayout?.append(completionStatus);

  const openEnquiry = type => {
    completionStatus.hidden = true;
    const isService = type === 'service';
    const dialogTitle = document.getElementById('enquiryDialogTitle');
    const dialogEyebrow = dialog.querySelector('.engine-dialog-header .eyebrow');
    if (dialogTitle) dialogTitle.textContent = isService ? 'Vehicle D-Carb Form' : 'New Machine Enquiry Form';
    if (dialogEyebrow) dialogEyebrow.textContent = isService ? 'D-Carb service' : 'Business enquiry';
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

  // Replace the generic quotation route with two explicit customer journeys.
  const navLinks = document.getElementById('navLinks');
  navLinks?.querySelector('a[href="#enquiry"]')?.remove();
  navLinks?.insertAdjacentHTML('beforeend', `
    <a class="engine-menu-enquiry engine-enquiry-launch" href="#enquiry" data-enquiry-type="service">D-Carb Now</a>
    <a class="engine-menu-enquiry engine-enquiry-launch" href="#enquiry" data-enquiry-type="machine">Business Enquiry</a>`);

  const heroActions = document.querySelector('.hero .hero-actions');
  if (heroActions) {
    heroActions.classList.add('engine-hero-actions');
    heroActions.innerHTML = `
      <a class="engine-hero-action service engine-enquiry-launch" href="#enquiry" data-enquiry-type="service">D-Carb Now</a>
      <a class="engine-hero-action business engine-enquiry-launch" href="#enquiry" data-enquiry-type="machine">Business Enquiry</a>
      <a href="#process" class="btn-ghost"><span class="play" aria-hidden="true">&#9654;</span> See how it works</a>`;
  }

  const enquiryTypeSelector = form.querySelector('input[name="enquiryType"]')?.closest('fieldset');
  if (enquiryTypeSelector) enquiryTypeSelector.hidden = true;
  const servicePanelTitle = document.querySelector('#serviceFields h3');
  const machinePanelTitle = document.querySelector('#machineFields h3');
  if (servicePanelTitle) servicePanelTitle.textContent = 'Vehicle D-Carb Form';
  if (machinePanelTitle) machinePanelTitle.textContent = 'New Machine Enquiry Form';

  document.querySelectorAll('.engine-enquiry-launch').forEach(button =>
    button.addEventListener('click', event => {
      event.preventDefault();
      navLinks?.classList.remove('open');
      openEnquiry(button.dataset.enquiryType);
    })
  );

  const floatingActions = document.createElement('nav');
  floatingActions.className = 'engine-floating-actions';
  floatingActions.setAttribute('aria-label', 'Quick enquiry actions');
  floatingActions.innerHTML = `
    <a class="engine-floating-action service" href="#enquiry" data-enquiry-type="service" aria-label="Open Vehicle D-Carb Form">
      <span>D-Carb Now</span>
    </a>
    <a class="engine-floating-action machine" href="#enquiry" data-enquiry-type="machine" aria-label="Open New Machine Enquiry Form">
      <span>Business Enquiry</span>
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
    <span>I agree to Engine D-Carb and Care4Earth Enterprises storing my submitted details to prepare and manage my enquiry, and to receive transactional quotation and appointment updates on WhatsApp. I can request correction or deletion using the contact details on this website.</span>`;
  submit.before(consent);

  form.addEventListener('submit', async event => {
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
      const enquiryType = payload.enquiryType;
      if (enquiryType === 'machine') {
        const deliveries = result.whatsapp_delivery || [];
        const customerSent = deliveries.some(item => item.recipient === 'customer' && item.status === 'accepted');
        const adminSent = deliveries.some(item => item.recipient === 'admin' && item.status === 'accepted');
        completionStatus.textContent = customerSent && adminSent
          ? 'WhatsApp message sent to admin.'
          : 'Enquiry saved, but the WhatsApp message could not be sent.';
        completionStatus.classList.toggle('warning', !(customerSent && adminSent));
      } else {
        const deliveries = result.whatsapp_delivery || [];
        const customerSent = deliveries.some(item => item.recipient === 'customer' && item.status === 'accepted');
        const centreSent = deliveries.some(item => item.recipient.startsWith('centre:') && item.status === 'accepted');
        const adminSent = deliveries.some(item => item.recipient === 'admin' && item.status === 'accepted');
        completionStatus.textContent = customerSent && centreSent && adminSent
          ? 'WhatsApp message sent to admin and service centre head.'
          : 'Enquiry saved, but the WhatsApp message could not be sent.';
        completionStatus.classList.toggle('warning', !(customerSent && centreSent && adminSent));
      }
      error.classList.remove('visible');
      completionStatus.hidden = false;
      form.reset();
      dialog.close();
      enquirySection?.scrollIntoView({behavior: 'smooth', block: 'start'});
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
