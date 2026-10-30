document.getElementById('supportKofi').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    if (window.studio?.supportKofi) await window.studio.supportKofi();
    else window.open('https://ko-fi.com/forbidden_fantasy', '_blank', 'noopener,noreferrer');
  } catch {
    window.alert('Could not open your browser. Visit https://ko-fi.com/forbidden_fantasy to support the creator.');
  } finally { button.disabled = false; }
});
