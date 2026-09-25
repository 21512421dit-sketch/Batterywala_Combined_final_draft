(() => {
  const dialog = document.getElementById('engineLegalDialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const title = document.getElementById('engineLegalTitle');
  const close = dialog.querySelector('.engine-legal-close');
  const body = dialog.querySelector('.engine-legal-dialog-body');
  const sections = [...dialog.querySelectorAll('[data-engine-legal-content]')];
  let opener = null;

  document.querySelectorAll('[data-engine-legal]').forEach(link => {
    link.addEventListener('click', event => {
      const kind = link.dataset.engineLegal;
      if (!sections.some(section => section.dataset.engineLegalContent === kind)) return;
      event.preventDefault();
      opener = link;
      sections.forEach(section => { section.hidden = section.dataset.engineLegalContent !== kind; });
      title.textContent = kind === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions';
      body.scrollTop = 0;
      dialog.showModal();
      close.focus();
    });
  });

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
