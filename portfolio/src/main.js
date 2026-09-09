const projects = [
  { name: 'Sintonia', url: 'https://sintonia-seven.vercel.app/', type: 'Aplicação web', description: 'Projeto pessoal de um jogo online de perguntas para criar conexão e boas conversas entre amigos.', stack: ['React'], tags: ['react'], image: 'sintonia.png', personal: true },
  { name: 'Sato7', url: 'https://www.sato7.com.br/', type: 'Site institucional', description: 'Experiência digital para uma agência de performance e soluções de crescimento.', stack: ['PHP', 'React'], tags: ['react'], image: 'sato7.png' },
  { name: 'Grupo Isorecort', url: 'https://www.isorecort.com.br/', type: 'Site institucional', description: 'Website corporativo para apresentação de produtos, soluções e atuação da empresa.', stack: ['WordPress', 'Theme'], tags: ['wordpress'], image: 'isorecort.png' },
  { name: 'Perfumaria Sumirê', url: 'https://www.perfumariasumire.com.br', type: 'E-commerce', description: 'Loja virtual de beleza com catálogo amplo, campanhas comerciais e experiência responsiva.', stack: ['Adobe Commerce'], tags: ['commerce'], image: 'sumire.png' },
  { name: 'Go S7ven', url: 'https://gos7ven.com.br/', type: 'Site institucional', description: 'Projeto web desenvolvido para comunicação institucional e aquisição digital.', stack: ['WordPress', 'Elementor'], tags: ['wordpress'] },
  { name: 'CS Seminovos', url: 'https://csseminovosveiculos.com.br/', type: 'Site automotivo', description: 'Presença digital para exposição de veículos e contato com potenciais clientes.', stack: ['WordPress', 'Elementor'], tags: ['wordpress'] },
  { name: 'Doctor AI', url: 'https://site.doctorai.com.br/', type: 'Produto digital', description: 'Website de apresentação para uma solução de tecnologia aplicada à saúde.', stack: ['WordPress', 'Theme'], tags: ['wordpress'] },
  { name: 'Action 360', url: 'https://www.action360.com.br/seja-um-franqueado/', type: 'Landing page', description: 'Página de conversão voltada à apresentação e captação de novos franqueados.', stack: ['WordPress', 'Elementor'], tags: ['wordpress'] },
  { name: 'Kookabu', url: 'https://campanhas.kookabu.com.br/seja-um-franqueado/', type: 'Landing page', description: 'Landing page para campanha de expansão de franquias e geração de leads.', stack: ['WordPress', 'Elementor'], tags: ['wordpress'] },
  { name: 'Bajaj Brasil', url: 'https://bajaj.com.br/', type: 'Site institucional', description: 'Experiência web para a operação brasileira de uma das maiores fabricantes de motocicletas do mundo.', stack: ['HTML', 'CSS', 'JavaScript'], tags: ['javascript'], image: 'bajaj.png' },
  { name: 'FK Partners', url: 'https://fkpartners.com/', type: 'Plataforma educacional', description: 'Site de cursos preparatórios e certificações para profissionais do mercado financeiro.', stack: ['WordPress', 'Theme'], tags: ['wordpress'], image: 'fkpartners.png' },
  { name: 'World Plastic Connection Summit', url: 'https://worldplasticconnectionsummit.com/', type: 'Site de evento', description: 'Plataforma internacional para conteúdo, programação e informações do evento.', stack: ['WordPress', 'Elementor', 'Crocoblock'], tags: ['wordpress'], image: 'world-plastic.png' },
  { name: '9-Box Comercial', url: 'https://9boxcomercial.abeelity.com.br/', type: 'Aplicação web', description: 'Ferramenta interativa para avaliação e desenvolvimento de performance comercial.', stack: ['React', 'Node.js'], tags: ['react', 'javascript'], image: '9box.png' },
  { name: 'aBeelity', url: 'https://abeelity.app/', type: 'Plataforma digital', description: 'Plataforma de desenvolvimento de pessoas apoiada por inteligência artificial.', stack: ['PHP', 'JavaScript'], tags: ['javascript'], image: 'abeelity.png' },
];

const grid = document.querySelector('#project-grid');
function render(filter = 'all') {
  const visible = projects.filter((project) => filter === 'all' || project.tags.includes(filter));
  grid.innerHTML = visible.map((project, index) => `
    <article class="project-card ${project.personal ? 'personal' : ''}">
      <a class="project-image ${project.image ? '' : 'placeholder'}" href="${project.url}" target="_blank" rel="noreferrer" aria-label="Abrir ${project.name}">
        ${project.image ? `<img src="/projects/${project.image}" alt="Página inicial do projeto ${project.name}" loading="lazy" />` : `<span>${project.name}</span>`}
        <span class="open-project">Abrir projeto ↗</span>
      </a>
      <div class="project-details">
        <div class="project-index">${String(index + 1).padStart(2, '0')}</div>
        <div class="project-copy">
          <div class="project-title"><h3>${project.name}</h3>${project.personal ? '<span>Projeto pessoal</span>' : ''}</div>
          <p class="project-type">${project.type}</p>
          <p class="project-description">${project.description}</p>
          <ul>${project.stack.map((item) => `<li>${item}</li>`).join('')}</ul>
        </div>
      </div>
    </article>`).join('');
}

document.querySelectorAll('.filters button').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('.filters .active')?.classList.remove('active');
  button.classList.add('active');
  render(button.dataset.filter);
}));
document.querySelector('#year').textContent = new Date().getFullYear();
render();
