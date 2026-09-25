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
        <span class="engine-choice-number">01</span><span><strong>Engine D-Carb Form</strong><small>Share your vehicle details and choose a nearby service centre.</small></span><i aria-hidden="true">&rarr;</i>
      </button>
      <button type="button" class="engine-enquiry-launch" data-enquiry-type="machine">
        <span class="engine-choice-number">02</span><span><strong>Start a D-Carb Centre</strong><small>Tell us about your workshop and find the right configuration.</small></span><i aria-hidden="true">&rarr;</i>
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
    if (dialogTitle) dialogTitle.textContent = isService ? 'Engine D-Carb Form' : 'Start Your D-Carb Centre';
    if (dialogEyebrow) dialogEyebrow.textContent = isService ? 'D-Carb service' : 'Own a D-Carb centre';
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
    <details class="engine-nav-social">
      <summary>Follow Us</summary>
      <div class="engine-social-links" aria-label="Engine D-Carb social media">
        <a class="facebook" href="https://www.facebook.com/share/1H26RyN3ML/" target="_blank" rel="noopener noreferrer" aria-label="Follow Engine D-Carb on Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.19 8.44 9.94v-7.04H7.9v-2.9h2.54V9.84c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.24 0-1.63.77-1.63 1.56v1.92h2.77l-.44 2.9h-2.33V22C18.34 21.25 22 17.08 22 12.06Z"/></svg>
          <span>Facebook</span>
        </a>
        <a class="instagram" href="https://www.instagram.com/enginedcarb?stkn=MXdjeW5lMjJnNmxhbQ==" target="_blank" rel="noopener noreferrer" aria-label="Follow Engine D-Carb on Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.25"/><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>
          <span>Instagram</span>
        </a>
        <a class="linkedin" href="https://www.linkedin.com/company/engine-dcarb/" target="_blank" rel="noopener noreferrer" aria-label="Follow Engine D-Carb on LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="7.3" cy="8" r="1.25" fill="currentColor" stroke="none"/><path d="M6.2 10.5v7.1M10.3 17.6v-7.1m0 3.1c.7-2 4.8-2.3 4.8 1.1v2.9"/></svg>
          <span>LinkedIn</span>
        </a>
      </div>
    </details>
    <a class="engine-menu-enquiry engine-enquiry-trigger" href="#enquiry" data-enquiry-type="service">D-Carb Now</a>
    <a class="engine-menu-enquiry engine-enquiry-trigger" href="#enquiry" data-enquiry-type="machine">Start a D-Carb Centre</a>`);

  const socialMenu = navLinks?.querySelector('.engine-nav-social');
  const mobileNav = window.matchMedia('(max-width: 900px)');
  const syncSocialMenu = event => {
    if (socialMenu) socialMenu.open = event.matches;
  };
  syncSocialMenu(mobileNav);
  mobileNav.addEventListener?.('change', syncSocialMenu);

  const heroActions = document.querySelector('.hero .hero-actions');
  if (heroActions) {
    heroActions.classList.add('engine-hero-actions');
    heroActions.innerHTML = `
      <a class="engine-hero-action service engine-enquiry-trigger" href="#enquiry" data-enquiry-type="service">D-Carb Now</a>
      <a class="engine-hero-action business engine-enquiry-trigger" href="#enquiry" data-enquiry-type="machine">Start a D-Carb Centre</a>
      <a href="#process" class="btn-ghost"><span class="play" aria-hidden="true">&#9654;</span> See how it works</a>`;
  }

  // Keep Google feedback in the website, following BatteryWala's continuously rotating review pattern.
  const reviewsSection = document.createElement('section');
  reviewsSection.id = 'reviews';
  reviewsSection.className = 'engine-reviews section';
  reviewsSection.setAttribute('aria-labelledby', 'engineReviewsTitle');
  reviewsSection.innerHTML = `
    <div class="shell">
      <div class="engine-reviews-head">
        <div>
          <span class="eyebrow">Customer feedback</span>
          <h2 id="engineReviewsTitle">What customers say.</h2>
          <p>Recent public feedback for Engine D-Carb in Chhatrapati Sambhajinagar.</p>
        </div>
        <a class="engine-google-summary" href="https://www.google.com/search?q=Engine+D-Carb&ludocid=4383837332745470402#lrd=0x3bdba30b2ee3c44f:0x3cd684d3db63c1c2,3,,," target="_blank" rel="noopener noreferrer" aria-label="Write a Google review for Engine D-Carb">
          <span class="engine-google-mark" aria-hidden="true">G</span>
          <span><strong>5.0</strong><span class="engine-review-stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span><small>67 Google reviews</small></span>
        </a>
      </div>
      <div class="engine-review-slider">
        <button class="engine-review-arrow prev" type="button" aria-label="Previous customer review">&#8592;</button>
        <div class="engine-review-viewport">
          <div class="engine-review-track">
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">N</span><span><strong>Nilesh Sali</strong><small>Google review · 2 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Recently, I got the engine decarbonization of my 15-year-old Swift Dzire done from Care 4 Earth Enterprises.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">S</span><span><strong>Sultan Ali Kudchiwala</strong><small>Google review · 2 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Fantastic results after doing Engine D-Carb on my Kia Seltos. Substantial decrease in vibration and noise and increased refinement.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">V</span><span><strong>Vinod Patkule</strong><small>Google review · 5 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“D-Carbon service of my Kia Sonet has been completed successfully. The post-service difference is noticeable.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">R</span><span><strong>Ratnadeep Shejul</strong><small>Google review · 7 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“The difference is clearly noticeable. Pickup has improved, acceleration is faster, and mileage has increased.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">S</span><span><strong>Sushant Rautmare</strong><small>Google review · 3 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Vehicle noise is very smooth and there is no vibration while driving. Average also increased. Overall very happy with the service.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">P</span><span><strong>Prashant Gaikwad</strong><small>Google review · 5 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“A great experience driving after getting my engine decarbonized. I appreciate the honest suggestions and quick work.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">N</span><span><strong>Nitin Raut</strong><small>Google review · 2 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Professional service. Vibrations and temperature improved, and pickup has become a lot better. Recommend!”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">T</span><span><strong>Tiger motovloger</strong><small>Google review · 7 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Very happy to share my experience with my VW Tiguan 2.0 TDI. After D-Carb it is running very smoothly and efficiently.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">R</span><span><strong>RajDevdhePatil</strong><small>Google review · 2 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Excellent service, genuine process. The car was much smoother after the decarb. Five-out-of-five service.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">S</span><span><strong>Suraj Rathod</strong><small>Google review · 2 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Quality work, very effective. Seen a good amount of change in engine noise and smoothness. Recommend.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">G</span><span><strong>Geetanjali Deshpande</strong><small>Google review</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“Super good idea to save money and save the environment.”</blockquote></article>
            <article class="engine-review-card"><div class="engine-review-card-top"><span class="engine-review-avatar">P</span><span><strong>Prashant Jagtap</strong><small>Google review · 6 months ago</small></span></div><div class="engine-review-stars" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><blockquote>“The work was done perfectly with great attention to detail.”</blockquote></article>
          </div>
        </div>
        <button class="engine-review-arrow next" type="button" aria-label="Next customer review">&#8594;</button>
      </div>
      <div class="engine-review-dots" aria-label="Choose customer review"></div>
    </div>`;
  enquirySection?.before(reviewsSection);

  const reviewViewport = reviewsSection.querySelector('.engine-review-viewport');
  const reviewTrack = reviewsSection.querySelector('.engine-review-track');
  const reviewCards = [...reviewsSection.querySelectorAll('.engine-review-card')];
  const reviewDots = reviewsSection.querySelector('.engine-review-dots');
  const reviewPrev = reviewsSection.querySelector('.engine-review-arrow.prev');
  const reviewNext = reviewsSection.querySelector('.engine-review-arrow.next');
  let reviewIndex = 0;
  let reviewTimer;
  const reviewPerView = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 980 ? 2 : 3;
  const reviewMaxIndex = () => Math.max(0, reviewCards.length - reviewPerView());
  const renderReviews = () => {
    const perView = reviewPerView();
    const maxIndex = reviewMaxIndex();
    reviewIndex = Math.min(reviewIndex, maxIndex);
    reviewCards.forEach(card => { card.style.flexBasis = `calc(${100 / perView}% - ${(18 * (perView - 1)) / perView}px)`; });
    const gap = Number.parseFloat(window.getComputedStyle(reviewTrack).gap) || 18;
    const slideWidth = reviewCards[0].getBoundingClientRect().width + gap;
    reviewTrack.style.transform = `translateX(-${reviewIndex * slideWidth}px)`;
    reviewDots.replaceChildren();
    for (let index = 0; index <= maxIndex; index += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = index === reviewIndex ? 'active' : '';
      dot.setAttribute('aria-label', `Show review ${index + 1}`);
      dot.setAttribute('aria-current', index === reviewIndex ? 'true' : 'false');
      dot.addEventListener('click', () => { reviewIndex = index; renderReviews(); restartReviews(); });
      reviewDots.append(dot);
    }
  };
  const moveReviews = direction => {
    const maxIndex = reviewMaxIndex();
    reviewIndex = direction === 'next'
      ? (reviewIndex >= maxIndex ? 0 : reviewIndex + 1)
      : (reviewIndex <= 0 ? maxIndex : reviewIndex - 1);
    renderReviews();
  };
  const stopReviews = () => {
    if (reviewTimer) window.clearInterval(reviewTimer);
    reviewTimer = undefined;
  };
  const restartReviews = () => {
    stopReviews();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reviewTimer = window.setInterval(() => moveReviews('next'), 5200);
    }
  };
  reviewPrev.addEventListener('click', () => { moveReviews('prev'); restartReviews(); });
  reviewNext.addEventListener('click', () => { moveReviews('next'); restartReviews(); });
  reviewsSection.querySelector('.engine-review-slider').addEventListener('mouseenter', stopReviews);
  reviewsSection.querySelector('.engine-review-slider').addEventListener('mouseleave', restartReviews);
  reviewsSection.querySelector('.engine-review-slider').addEventListener('focusin', stopReviews);
  reviewsSection.querySelector('.engine-review-slider').addEventListener('focusout', restartReviews);
  window.addEventListener('resize', renderReviews, {passive: true});
  renderReviews();
  restartReviews();

  const enquiryTypeSelector = form.querySelector('input[name="enquiryType"]')?.closest('fieldset');
  if (enquiryTypeSelector) enquiryTypeSelector.hidden = true;
  const servicePanelTitle = document.querySelector('#serviceFields h3');
  const machinePanelTitle = document.querySelector('#machineFields h3');
  if (servicePanelTitle) servicePanelTitle.textContent = 'Engine D-Carb Form';
  if (machinePanelTitle) machinePanelTitle.textContent = 'Start Your Own D-Carb Centre';

  document.querySelectorAll('.engine-enquiry-launch, .engine-enquiry-trigger').forEach(button =>
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
    <a class="engine-floating-action service" href="#enquiry" data-enquiry-type="service" aria-label="Open Engine D-Carb Form">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5.5a5.4 5.4 0 0 1-7.2 5.1L7 17.4a2.1 2.1 0 1 1-3-3l6.8-6.8A5.4 5.4 0 0 1 16 1l-3.1 3.1 3 3L19 4a5.4 5.4 0 0 1 2 1.5Z"/><path d="m14.5 14.5 5.3 5.3"/></svg>
      <span class="engine-floating-tooltip">D-Carb Now</span>
    </a>
    <a class="engine-floating-action machine" href="#enquiry" data-enquiry-type="machine" aria-label="Open Start Your D-Carb Centre form">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9h10v11M7 9V5h7v4M14 13h6v7M7 13h2m-2 3h2m8-1h1"/><path d="M2 20h20"/></svg>
      <span class="engine-floating-tooltip">Start a D-Carb Centre</span>
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
  const systemFeature = document.querySelector('#connected-system .system-feature');
  const systemSlide = systemFeature?.querySelector('img');
  if (systemSlide) {
    systemSlide.insertAdjacentHTML('afterend', `<a class="system-full-image" href="${systemSlide.getAttribute('src')}" target="_blank" rel="noopener noreferrer">View diagram full size ↗</a>`);
  }
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
      const deliveries = result.whatsapp_delivery || [];
      const allSent = deliveries.length > 0 && deliveries.every(item => item.status === 'accepted');
      if (enquiryType === 'machine') {
        completionStatus.textContent = allSent
          ? 'WhatsApp message sent to admin.'
          : 'Enquiry saved, but the WhatsApp message could not be sent.';
        completionStatus.classList.toggle('warning', !allSent);
      } else {
        const centreSent = deliveries.some(item => item.recipient.startsWith('centre:') && item.status === 'accepted');
        completionStatus.textContent = allSent
          ? (centreSent ? 'WhatsApp message sent to admin and service centre head.' : 'WhatsApp message sent to the available contacts.')
          : 'Enquiry saved, but the WhatsApp message could not be sent.';
        completionStatus.classList.toggle('warning', !allSent);
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
