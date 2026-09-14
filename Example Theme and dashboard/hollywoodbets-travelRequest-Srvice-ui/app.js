const toast = (message) => { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 2200); };
const chartSets = {
  spend: { bars: [52,68,43,42,62,78,66,84,78,75,65,77], line: [55,63,42,42,58,84,60,91,83,80,67,80], labels: 'R2.0M\\A R1.5M\\A R1.0M\\A R0.5M\\A R0' },
  trips: { bars: [45,57,46,43,45,56,62,76,62,45,43,67], line: [47,68,56,43,54,65,69,84,72,55,48,72], labels: '250\\A 200\\A 150\\A 100\\A 50\\A 0' },
  travellers: { bars: [48,51,54,55,55,69,58,72,58,53,51,68], line: [50,61,67,61,65,82,70,83,72,62,59,79], labels: '250\\A 200\\A 150\\A 100\\A 50\\A 0' }
};
document.querySelectorAll('.chart').forEach(chart => {
  const data = chartSets[chart.dataset.type], left = 38, step = 42, base = 105;
  const bars = data.bars.map((v, i) => `<rect x="${left + i * step}" y="${base - v}" width="17" height="${v}" rx="1"/>`).join('');
  const points = data.line.map((v, i) => `${left + 8 + i * step},${base - v}`).join(' ');
  const dots = data.line.map((v, i) => `<circle cx="${left + 8 + i * step}" cy="${base - v}" r="3"/>`).join('');
  chart.innerHTML = `<svg viewBox="0 0 600 122" preserveAspectRatio="none"><g fill="#391493">${bars}</g><polyline points="${points}" fill="none" stroke="#12869a" stroke-width="2"/><g fill="#12869a">${dots}</g></svg><span class="y-labels">${data.labels}</span>`;
});
document.querySelector('#clearBtn').addEventListener('click', () => { document.querySelectorAll('.filters input').forEach(input => input.value = ''); document.querySelectorAll('.filters select').forEach(select => select.selectedIndex = 0); toast('Filters cleared'); });
document.querySelectorAll('.shortcuts button').forEach(button => button.addEventListener('click', () => toast(`${button.dataset.range} selected`)));
document.querySelector('#exportBtn').addEventListener('click', () => toast('Dashboard export prepared'));
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', event => { event.preventDefault(); document.querySelectorAll('.main-nav a').forEach(item => item.classList.remove('active')); link.classList.add('active'); toast(`${link.textContent.trim()} selected`); }));
