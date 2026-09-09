const projects = [
  { name: 'Sato7', url: 'https://www.sato7.com.br/', stack: 'PHP + React', tags: ['react'], image: 'sato7.png', tone: 'lime', index: '01' },
  { name: 'Grupo Isorecort', url: 'https://www.isorecort.com.br/', stack: 'WordPress Theme', tags: ['wordpress'], image: 'isorecort.png', tone: 'blue', index: '02' },
  { name: 'Perfumaria Sumirê', url: 'https://www.perfumariasumire.com.br', stack: 'Adobe Commerce', tags: ['commerce'], image: 'sumire.png', tone: 'pink', index: '03' },
  { name: 'Go S7ven', url: 'https://gos7ven.com.br/', stack: 'WordPress + Elementor', tags: ['wordpress'], tone: 'orange', index: '04' },
  { name: 'CS Seminovos', url: 'https://csseminovosveiculos.com.br/', stack: 'WordPress + Elementor', tags: ['wordpress'], tone: 'blue', index: '05' },
  { name: 'Doctor AI', url: 'https://site.doctorai.com.br/', stack: 'WordPress Theme', tags: ['wordpress'], tone: 'lime', index: '06' },
  { name: 'Action 360', url: 'https://www.action360.com.br/seja-um-franqueado/', stack: 'WordPress + Elementor', tags: ['wordpress'], tone: 'pink', index: '07' },
  { name: 'Kookabu', url: 'https://campanhas.kookabu.com.br/seja-um-franqueado/', stack: 'WordPress + Elementor', tags: ['wordpress'], tone: 'orange', index: '08' },
  { name: 'Bajaj Brasil', url: 'https://bajaj.com.br/', stack: 'HTML + CSS + JavaScript', tags: ['javascript'], image: 'bajaj.png', tone: 'blue', index: '09' },
  { name: 'FK Partners', url: 'https://fkpartners.com/', stack: 'WordPress Theme', tags: ['wordpress'], image: 'fkpartners.png', tone: 'lime', index: '10' },
  { name: 'World Plastic Summit', url: 'https://worldplasticconnectionsummit.com/', stack: 'WordPress + Elementor + Crocoblock', tags: ['wordpress'], image: 'world-plastic.png', tone: 'orange', index: '11' },
  { name: '9-Box Comercial', url: 'https://9boxcomercial.abeelity.com.br/', stack: 'React + Node.js', tags: ['react', 'javascript'], image: '9box.png', tone: 'pink', index: '12' },
  { name: 'Sintonia', url: 'https://sintonia-seven.vercel.app/', stack: 'Projeto pessoal · React', tags: ['react'], image: 'sintonia.png', tone: 'lime', index: '13', featured: true },
  { name: 'aBeelity', url: 'https://abeelity.app/', stack: 'PHP + JavaScript', tags: ['javascript'], image: 'abeelity.png', tone: 'blue', index: '14' },
];

const grid = document.querySelector('#project-grid');

function render(filter = 'all') {
  const visible = projects.filter((project) => filter === 'all' || project.tags.includes(filter));
  grid.innerHTML = visible.map((project) => `
    <article class="project-card reveal ${project.featured ? 'featured' : ''}">
      <a href="${project.url}" target="_blank" rel="noreferrer" aria-label="Abrir ${project.name}">
        <div class="project-visual ${project.tone} ${project.image ? '' : 'placeholder'}">
          ${project.image
            ? `<img src="/projects/${project.image}" alt="Página inicial do projeto ${project.name}" loading="lazy" />`
            : `<span class="placeholder-name">${project.name}</span>`}
          <span class="project-number">${project.index}</span>
          <span class="visit">Visitar ↗</span>
        </div>
        <div class="project-info">
          <h3>${project.name}</h3>
          <p>${project.stack}</p>
        </div>
      </a>
    </article>
  `).join('');
  observeReveals();
}

document.querySelectorAll('.filters button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.filters .active')?.classList.remove('active');
    button.classList.add('active');
    render(button.dataset.filter);
  });
});

function observeReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

document.querySelector('#year').textContent = new Date().getFullYear();
render();
