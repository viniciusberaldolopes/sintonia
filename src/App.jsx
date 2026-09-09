import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, CircleHelp, Copy, Crown, Eye, EyeOff, Link, LockKeyhole, MessageCircle, Play, Plus, RotateCcw, Share2, ShieldCheck, Sparkles, Trophy, UserRound, Users, Wifi, WifiOff, Zap } from 'lucide-react'
import BrandLogo from './components/BrandLogo.jsx'
import { attribution, track } from './analytics/index.js'
import { scoreGuess, shuffledTargets } from './game/engine.js'
import './App.css'

const THEMES = [
  {
    id: 1, theme: 'Comida',
    subjects: ['pastel de feira', 'pizza com abacaxi', 'café sem açúcar', 'sushi', 'brigadeiro', 'comida apimentada', 'hambúrguer artesanal', 'macarrão instantâneo', 'pão de queijo', 'sobremesa de restaurante', 'misturar doce e salgado', 'comer no sofá', 'pedir o prato mais caro'],
    contexts: ['num primeiro encontro', 'de madrugada', 'num dia de chuva', 'para dividir com amigos', 'antes de uma viagem'],
    scales: [['Passaria longe', 'Pediria de novo'], ['Sem graça', 'Inesquecível'], ['Não combina', 'Combinação perfeita'], ['Só provaria', 'Comeria tudo']],
  },
  {
    id: 2, theme: 'Viagem',
    subjects: ['acampar', 'viajar sem roteiro', 'praia lotada', 'cidade histórica', 'parque de diversões', 'viagem de carro', 'hotel luxuoso', 'mochilão', 'cruzeiro', 'cabana isolada', 'perder o voo', 'viajar com o ex', 'dormir no aeroporto'],
    contexts: ['nas férias', 'com pouco dinheiro', 'com a família', 'com os amigos', 'por uma semana'],
    scales: [['Perrengue total', 'Viagem dos sonhos'], ['Voltaria cedo', 'Ficaria para sempre'], ['Nada relaxante', 'Paz absoluta'], ['História ruim', 'História incrível']],
  },
  {
    id: 3, theme: 'Cultura pop',
    subjects: ['filme de super-herói', 'reality show', 'série policial', 'comédia romântica', 'filme de terror', 'desenho antigo', 'musical', 'documentário', 'novela', 'ficção científica', 'assistir tudo dublado', 'chorar com desenho', 'torcer pelo vilão'],
    contexts: ['para rever hoje', 'num domingo à tarde', 'com os amigos', 'durante uma viagem', 'antes de dormir'],
    scales: [['Eu desligaria', 'Maratonaria'], ['Esquecível', 'Clássico absoluto'], ['Vergonha alheia', 'Obra-prima'], ['Só um episódio', 'Viraria a noite']],
  },
  {
    id: 4, theme: 'Personalidade',
    subjects: ['contar piada ruim', 'chegar falando com todos', 'cancelar na última hora', 'mandar áudio longo', 'dar conselho sem pedirem', 'dançar no meio da festa', 'organizar todos os planos', 'ficar em silêncio', 'emprestar suas coisas', 'fazer uma surpresa', 'falar sozinho', 'rir da própria piada', 'stalkear antes do encontro'],
    contexts: ['num primeiro encontro', 'em uma festa', 'no grupo da família', 'durante uma viagem', 'no trabalho'],
    scales: [['Muito tímido', 'Sem nenhuma vergonha'], ['Irritante', 'Adorável'], ['Eu evitaria', 'Viraria meu amigo'], ['Nada confiável', 'Confiança total']],
  },
  {
    id: 5, theme: 'Tecnologia',
    subjects: ['robô doméstico', 'carro autônomo', 'realidade virtual', 'celular dobrável', 'casa inteligente', 'assistente de voz', 'óculos com câmera', 'entrega por drone', 'relógio inteligente', 'inteligência artificial', 'namorar um robô', 'viver sem celular', 'implante de memória'],
    contexts: ['daqui a dez anos', 'na rotina da família', 'dentro da escola', 'durante uma viagem', 'no ambiente de trabalho'],
    scales: [['Totalmente inútil', 'Mudaria minha vida'], ['Assustador', 'Empolgante'], ['Moda passageira', 'Futuro inevitável'], ['Nunca usaria', 'Usaria todo dia']],
  },
  {
    id: 6, theme: 'Cotidiano',
    subjects: ['acordar cedo', 'arrumar a casa', 'pegar transporte público', 'fazer compras', 'cozinhar', 'responder mensagens', 'ir à academia', 'ficar sem internet', 'receber visita', 'ter um dia sem planos', 'tomar banho gelado', 'fingir que não viu', 'pedir comida de novo'],
    contexts: ['num domingo', 'depois de um dia cansativo', 'durante as férias', 'quando está chovendo', 'com muita pressa'],
    scales: [['Péssima ideia', 'Ideia perfeita'], ['Muito estressante', 'Super relaxante'], ['Eu adiaria', 'Faria agora'], ['Caos completo', 'Tudo sob controle']],
  },
  {
    id: 7, theme: 'Humor adulto 18+',
    subjects: ['sexo a três', 'mandar nude', 'beijar no primeiro encontro', 'contar um fetiche', 'usar brinquedo sexual', 'transar com a luz acesa', 'dormir junto sem compromisso', 'receber mensagem do ex', 'dar match com um conhecido', 'ficar com o crush', 'beijar um amigo', 'voltar com o ex', 'ter amizade colorida', 'transar no primeiro encontro', 'usar algemas na cama', 'gravar vídeo íntimo com consentimento', 'dar match com um casal', 'tomar banho a dois', 'mandar um áudio provocante', 'chamar uma terceira pessoa', 'usar uma fantasia na cama', 'ficar com duas pessoas', 'realizar um fetiche secreto', 'falar besteira no ouvido', 'passar a noite com o ex', 'beijar escondido numa festa', 'usar venda nos olhos', 'fazer uma massagem sensual', 'mandar mensagem de madrugada', 'contar sua maior fantasia', 'experimentar algo novo na cama', 'usar um aplicativo para casais', 'ir a uma festa liberal', 'trocar fotos provocantes', 'marcar um encontro secreto', 'ficar com outro adulto mais velho', 'ficar com outro adulto mais novo', 'beijar duas pessoas na mesma festa', 'ter um caso de uma noite', 'convidar o crush para dormir', 'usar lingerie especial', 'fazer uma surpresa na cama', 'jogar verdade ou desafio adulto', 'assistir a um filme sensual juntos', 'mandar uma mensagem bem direta', 'revelar com quantas pessoas já ficou', 'perguntar a fantasia do parceiro', 'flertar descaradamente', 'ficar sem compromisso', 'reencontrar um antigo contatinho', 'ter química com alguém comprometido', 'usar dados de posições', 'experimentar roleplay consensual', 'dividir uma fantasia com o casal', 'deixar o parceiro escolher tudo', 'tomar a iniciativa na cama', 'passar um fim de semana sem sair do quarto'],
    contexts: ['num primeiro encontro', 'durante uma viagem', 'numa relação nova', 'depois de muita intimidade', 'numa conversa entre amigos'],
    scales: [['Nem pensar', 'Topo na hora'], ['Vergonha total', 'Zero vergonha'], ['Climão garantido', 'Ideia maravilhosa'], ['Segredo absoluto', 'Contaria sem medo'], ['Muito comportado', 'Sem limites'], ['Só fantasia', 'Eu faria'], ['O clima morreu', 'Pegou fogo'], ['Nem contaria', 'Daria detalhes'], ['Romântico', 'Bem safado'], ['Luz apagada', 'Luz acesa'], ['Sóbrio demais', 'Quente demais'], ['Primeiro encontro', 'Depois de muita intimidade']],
  },
  {
    id: 8, theme: 'Música & festa',
    subjects: ['funk no casamento', 'sertanejo no churrasco', 'pagode no karaokê', 'metal logo de manhã', 'MPB num encontro', 'forró na balada', 'música clássica no trânsito', 'hit de TikTok', 'sofrência depois do término', 'gospel durante o treino', 'cantar música errada', 'dançar sem saber', 'pedir música ao DJ'],
    contexts: ['com a família por perto', 'no volume máximo', 'depois da meia-noite', 'com os amigos', 'numa festa elegante'],
    scales: [['Eu iria embora', 'Cantaria gritando'], ['Som de condomínio', 'Som de baile'], ['Ninguém dança', 'Todo mundo desce'], ['Pularia a faixa', 'Colocaria no repeat']],
  },
  {
    id: 9, theme: 'Caos social',
    subjects: ['encontrar o ex', 'errar o nome de alguém', 'cair na frente de todo mundo', 'mandar mensagem no grupo errado', 'ser pego mentindo', 'esquecer um aniversário', 'chegar sem ser convidado', 'rir na hora errada', 'dormir numa reunião', 'dar opinião sem ninguém perguntar', 'curtir foto antiga', 'tropeçar entrando na festa', 'esquecer o nome do date'],
    contexts: ['num casamento', 'no trabalho', 'durante um encontro', 'com a família reunida', 'na frente dos amigos'],
    scales: [['Dá para disfarçar', 'Mudaria de país'], ['Só um deslize', 'Vergonha eterna'], ['Todo mundo esquece', 'Vira apelido'], ['Eu riria', 'Eu choraria']],
  },
]

const EXTRA_SUBJECTS = {
  1: ['ketchup na pizza', 'arroz com banana', 'uva-passa no almoço', 'roubar batata do prato', 'comer a borda primeiro', 'jantar cereal', 'maionese em tudo', 'sobremesa antes do almoço', 'pipoca doce e salgada', 'pizza no café da manhã', 'comida caída por três segundos', 'pedir o prato de sempre', 'cozinhar para impressionar', 'dividir a última coxinha', 'levar marmita para a festa'],
  2: ['viajar sem mala', 'errar o hotel', 'pegar estrada de madrugada', 'viajar com desconhecidos', 'férias sem celular', 'ir sem passagem de volta', 'dormir numa barraca', 'visitar lugar turístico lotado', 'morar numa ilha', 'passar férias no frio', 'fazer amizade no avião', 'perder-se de propósito', 'viajar só com mochila', 'conhecer uma cidade pequena', 'fazer turismo na própria cidade'],
  3: ['ver spoiler de propósito', 'abandonar série no final', 'defender filme ruim', 'assistir novela escondido', 'decorar fala de filme', 'chorar em comercial', 'julgar pela capa', 'rever o mesmo episódio', 'odiar o personagem favorito', 'preferir o livro', 'assistir em velocidade dupla', 'pular a abertura da série', 'ler o final primeiro', 'gostar do remake', 'fingir que entendeu o filme'],
  4: ['sumir do grupo', 'responder só com figurinha', 'corrigir a gramática dos outros', 'chegar uma hora cedo', 'não dividir a sobremesa', 'falar com desconhecidos', 'guardar rancor por anos', 'pedir desculpa primeiro', 'dar presente sem motivo', 'chorar durante discussão', 'rir em momento sério', 'contar segredo sem querer', 'inventar desculpa para não sair', 'ser amigo de todo mundo', 'competir em qualquer brincadeira'],
  5: ['ter um clone digital', 'usar filtro em toda foto', 'deixar a IA escolher o look', 'morar no metaverso', 'conversar com a geladeira', 'ter um chip na mão', 'usar robô como terapeuta', 'deixar o carro decidir o destino', 'apagar as redes sociais', 'viver de realidade virtual', 'ter senha para tudo', 'namorar à distância por holograma', 'usar drone para passear o cachorro', 'receber comida por tubo', 'deixar algoritmo escolher amigos'],
  6: ['dormir com roupa de sair', 'comer direto da panela', 'adiar o despertador cinco vezes', 'deixar louça para amanhã', 'falar que está chegando', 'usar a mesma roupa de novo', 'cancelar planos para ficar em casa', 'assistir TV durante o almoço', 'tomar café à noite', 'trabalhar de pijama', 'ignorar ligação desconhecida', 'cantar durante o banho', 'conversar com o animal de estimação', 'guardar sacolas dentro de sacolas', 'abrir a geladeira sem fome'],
  7: ['mandar nude sem mostrar o rosto', 'ficar com o melhor amigo', 'beijar o ex do amigo', 'ter dois contatinhos', 'receber visita só de madrugada', 'contar onde já transou', 'usar brinquedo em casal', 'propor uma noite diferente', 'experimentar uma posição nova', 'ficar com alguém da academia', 'marcar encontro só por química', 'dormir sem roupa', 'trocar mensagens picantes no trabalho', 'realizar fantasia em hotel', 'contar um segredo íntimo'],
  8: ['sertanejo depois do término', 'funk no almoço de família', 'pagode numa segunda-feira', 'rock no karaokê', 'forró agarradinho', 'eletrônica no café da manhã', 'música triste na festa', 'cantar sem saber a letra', 'pegar o microfone sem convite', 'montar playlist para o crush', 'ouvir a mesma música cem vezes', 'dançar sozinho em casa', 'fingir que gosta da banda', 'chorar ouvindo sofrência', 'colocar remix em tudo'],
  9: ['chamar o professor de mãe', 'acenar para quem não conhece', 'entrar no carro errado', 'responder feliz aniversário errado', 'esquecer a câmera ligada', 'cantar com o microfone aberto', 'mandar áudio falando da pessoa', 'dar parabéns no dia errado', 'rir sem entender a piada', 'usar roupa igual à do anfitrião', 'ser o único fantasiado', 'não reconhecer um conhecido', 'esquecer onde estacionou', 'postar foto comprometedora', 'ser pego stalkeando'],
}

const UNIVERSAL_SCALES = [
  ['Jamais', 'Com certeza'],
  ['Péssimo', 'Perfeito'],
  ['Nada a ver', 'Tudo a ver'],
  ['Ruim', 'Bom'],
  ['Pouco provável', 'Muito provável'],
]

const allSubjects = (theme) => [...theme.subjects, ...(EXTRA_SUBJECTS[theme.id] || [])]

const TOTAL_POSSIBILITIES = THEMES.reduce((total, theme) => total + allSubjects(theme).length * (theme.scales.length + UNIVERSAL_SCALES.length), 0)

function createCard(themeIndex, usedQuestions, target, previousRounds) {
  const theme = THEMES[themeIndex]
  const subjects = allSubjects(theme)
  const scales = [...theme.scales, ...UNIVERSAL_SCALES]
  const seenPrompts = new Set(previousRounds.map((round) => round.prompt.toLocaleLowerCase('pt-BR')))
  const unseenSubjects = subjects.filter((subject) => !seenPrompts.has(subject.toLocaleLowerCase('pt-BR')))
  const subjectPool = unseenSubjects.length > 0 ? unseenSubjects : subjects
  const subject = subjectPool[Math.floor(Math.random() * subjectPool.length)]
  const subjectIndex = subjects.indexOf(subject)
  const availableScales = scales.map((_, index) => index).filter((index) => !usedQuestions.has(`${theme.id}-${subjectIndex}-${index}`))
  const scalePool = availableScales.length > 0 ? availableScales : scales.map((_, index) => index)
  const scaleIndex = scalePool[Math.floor(Math.random() * scalePool.length)]
  const [low, high] = scales[scaleIndex]
  usedQuestions.add(`${theme.id}-${subjectIndex}-${scaleIndex}`)

  return { id: `${theme.id}-${subjectIndex}-${scaleIndex}`, theme: theme.theme, prompt: subject.charAt(0).toUpperCase() + subject.slice(1), low, high, target }
}

function createCustomCard(customTheme, target) {
  const questions = customTheme?.questions || []
  const question = questions[Math.floor(Math.random() * questions.length)]
  if (!question) return null
  return { id: `custom-${question.id}`, theme: customTheme.name, prompt: question.prompt, low: question.low || 'Ruim', high: question.high || 'Bom', target }
}

const INITIAL_PLAYERS = [
  { name: 'Beraldo', color: 'var(--brand-indigo)', score: 0 },
  { name: 'Kazumi', color: 'var(--brand-coral)', score: 0 },
]

const playerName = (index, players = INITIAL_PLAYERS) => players[index]?.name || `Jogador ${index + 1}`

function useMotionReveal(selector) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const nodes = Array.from(document.querySelectorAll(selector))
    nodes.forEach((node) => node.classList.add('motion-reveal'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [selector])
}

function LandingPage({ account, onStart, onLogin, onPricing, onTutorial }) {
  const [demoValue, setDemoValue] = useState(50)
  const [demoDone, setDemoDone] = useState(false)
  const demoCompleted = useRef(false)
  useEffect(() => { track('lp_view', attribution()) }, [])
  useMotionReveal('.sales-page > section')
  const play = () => { track('hero_cta_click'); onStart() }
  const demo = (value) => { setDemoValue(Number(value)); if (!demoDone) track('demo_started'); setDemoDone(true) }
  return <main className="sales-page">
    <nav className="sales-nav"><BrandLogo inverse /><div><button className="nav-link tutorial-nav-link" onClick={onTutorial}><CircleHelp size={15} /> Como jogar</button>{account ? <button className="nav-link" onClick={onStart}>Minha conta</button> : <button className="nav-link" onClick={onLogin}>Entrar</button>}<button className="sales-cta small" onClick={play}>Jogar grátis <ArrowRight size={16} /></button></div></nav>
    <section className="sales-hero"><div className="hero-copy"><div className="warning-badge">UM JOGO PARA AMIGOS QUE ACHAM QUE SE CONHECEM</div><h1>Todo grupo acha que está na mesma pista.<br /><em>Até começar a jogar.</em></h1><p>Descubra o que seus amigos realmente pensam com perguntas que viram discussão, histórias e risadas.</p><div className="hero-actions"><button className="sales-cta" onClick={play}><Play size={19} fill="currentColor" /> JOGAR GRÁTIS</button></div><div className="hero-facts"><b>Sem instalar</b><i /> Sala pronta em segundos <i /> Celular ou PC</div></div><div className="hero-game-card"><div className="floating-xp"><Trophy size={17} /> +4 PONTOS</div><div className="mini-top"><span>RODADA 04</span><span className="live-game"><i /> AO VIVO</span></div><div className="mini-prompt"><small>CAOS SOCIAL</small><strong>Mandar mensagem<br />no grupo errado</strong></div><div className="mini-scale"><span>Dá para disfarçar</span><div><i /></div><span>Mudaria de país</span></div><div className="mini-players"><span><b>1</b> Beraldo</span><span><b>2</b> Kazumi</span><span><b>3</b> Você</span></div></div></section>
    <section className="demo-section"><div className="section-kicker">TESTE ANTES DE ENTRAR</div><h2>Quanto você confiaria no seu melhor amigo<br />para escolher sua próxima tatuagem?</h2><div className="demo-card"><div className="demo-labels"><span>NUNCA</span><span>TOTALMENTE</span></div><input aria-label="Sua resposta" type="range" min="0" max="100" value={demoValue} onChange={(event) => demo(event.target.value)} onPointerUp={() => { if (!demoCompleted.current) { demoCompleted.current = true; track('demo_completed', { value: demoValue }) } }} /><div className="demo-result">{demoDone ? <>Você colocou <strong>{demoValue}%</strong>. Seus amigos colocariam o ponto no mesmo lugar?</> : 'Arraste para escolher sua resposta.'}</div>{demoDone && <button className="sales-cta" onClick={play}>CRIAR SALA E DESCOBRIR <ArrowRight size={17} /></button>}</div></section>
    <section className="how-section"><div className="section-kicker">SEM COMPLICAÇÃO</div><h2>Três passos para começar o caos</h2><div className="steps-grid"><article><b>01</b><div><strong>Crie sua sala</strong><span>Sem instalação e sem configuração complicada.</span></div></article><article><b>02</b><div><strong>Mande o código</strong><span>WhatsApp, Discord, Instagram ou onde sua galera estiver.</span></div></article><article><b>03</b><div><strong>Descubram se pensam igual</strong><span>Respondam, comparem e defendam escolhas indefensáveis.</span></div></article></div><button className="sales-cta" onClick={play}>Criar minha sala</button></section>
    <section className="reactions-section"><div><div className="section-kicker">O JOGO TERMINA. A DISCUSSÃO NÃO.</div><h2>Responda. Compare.<br />Julgue silenciosamente.</h2><p>Não são depoimentos. São exemplos bem possíveis do que vai acontecer na sua sala.</p></div><div className="reaction-cloud"><span>“Você colocou ISSO em 90%???”</span><span>“Eu sabia que você ia escolher isso.”</span><span>“Pera. Explica essa resposta.”</span><span>“Não existe a menor possibilidade!”</span></div></section>
    <section className="questions-section"><div className="section-kicker">MAIS DE 1.000 COMBINAÇÕES</div><h2>Perguntas que ninguém consegue responder sem se explicar</h2><div className="question-showcase"><article><small>QUEM DO GRUPO?</small><strong>Quem teria mais chance de ficar famoso?</strong></article><article><small>RELACIONAMENTOS</small><strong>O quão estranho é stalkear antes do primeiro encontro?</strong></article><article><small>IMPOSSÍVEIS</small><strong>Quem sobreviveria mais tempo sozinho numa ilha?</strong></article><article><small>SEM FILTRO</small><strong>Pizza com ketchup: aceitável ou crime?</strong></article></div><div className="category-row"><span>CAOS</span><span>RELACIONAMENTOS</span><span>+18</span><span>PROFUNDAS</span><span>CULTURA POP</span><span>FESTA</span></div></section>
    <section className="uses-section"><div className="section-kicker">TEM UMA GALERA? TEM JOGO.</div><h2>Funciona em qualquer encontro</h2><div className="uses-grid">{[
      ['/illustrations/occasions/festa.webp','Festa','Quando ninguém sabe mais o que fazer.'],
      ['/illustrations/occasions/casal.webp','Casal','Descubra se vocês realmente pensam parecido.'],
      ['/illustrations/occasions/amigos.webp','Amigos','Discussões completamente desnecessárias.'],
      ['/illustrations/occasions/discord.webp','Discord','Perfeito para jogar durante a call.'],
      ['/illustrations/occasions/familia.webp','Família','Opiniões que talvez fosse melhor não descobrir.'],
      ['/illustrations/occasions/equipe.webp','Equipe','Um quebra-gelo que não parece dinâmica de RH.'],
    ].map(([image,title,description]) => <article key={title}><div className="occasion-art"><img src={image} width="512" height="512" loading="lazy" decoding="async" alt="" /></div><strong>{title}</strong><span>{description}</span></article>)}</div></section>
    <section className="ugc-section"><div className="section-kicker">VEJA O CAOS ACONTECENDO</div><h2>As melhores reações não têm roteiro</h2><div className="ugc-grid">{['Reação de uma rodada +18','Amigos descobrindo quem mente mais','Casal defendendo uma resposta'].map((label,index) => <article key={label}><div><Play fill="currentColor" /><span>VÍDEO REAL EM BREVE</span></div><strong>{label}</strong><small>Espaço reservado para conteúdo real — não é depoimento.</small><b>0{index + 1}</b></article>)}</div></section>
    <PricingSection onStart={play} onPricing={onPricing} />
    <section className="faq-section"><div><div className="section-kicker">SEM MISTÉRIO</div><h2>Perguntas frequentes</h2></div><div>{[['Precisa instalar alguma coisa?','Não. O jogo funciona direto no navegador, no celular ou computador.'],['Quantas pessoas podem jogar?','De 2 a 8 pessoas na mesma sala online.'],['Tem conteúdo +18?','Sim. O tema adulto é opcional e identificado antes da escolha.'],['Preciso criar uma conta?','Só o anfitrião cria uma conta. Convidados entram pelo link usando apenas um apelido.'],['Como funciona o plano grátis?','Cada anfitrião pode criar 2 salas e jogar até 8 rodadas por sala a cada 30 dias. Depois disso, é necessário liberar um passe.']].map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section className="final-cta"><span>SEUS AMIGOS ACHAM QUE TE CONHECEM?</span><h2>Coloque isso à prova.</h2><p>A primeira treta é por nossa conta.</p><button className="sales-cta" onClick={play}>Começar a jogar <ArrowRight size={18} /></button></section>
    <footer className="sales-footer"><BrandLogo inverse /><span>© 2026 · Feito para jogar junto.</span></footer>
  </main>
}

function TutorialPage({ onBack, onStart }) {
  useMotionReveal('.tutorial-page > section, .tutorial-page > header')
  const steps = [
    { icon: <Users />, title: 'Crie a sala', text: 'O anfitrião entra na conta, cria uma sala online e manda o link ou código para a galera.' },
    { icon: <Link />, title: 'Todo mundo entra', text: 'Os convidados usam apenas um apelido. O jogo aceita de 2 a 8 pessoas.' },
    { icon: <Sparkles />, title: 'Escolha o tema', text: 'Quem estiver na vez escolhe uma categoria. A sala também pode criar um tema e adicionar perguntas próprias.' },
    { icon: <Eye />, title: 'Veja o alvo e dê a dica', text: 'Só quem dá a dica vê onde o alvo está. Essa pessoa fala uma pista para ajudar os amigos.' },
    { icon: <EyeOff />, title: 'Os outros respondem', text: 'O alvo desaparece. Todos os outros jogadores posicionam seus ponteiros ao mesmo tempo entre os dois extremos.' },
    { icon: <Trophy />, title: 'Revelem e pontuem', text: 'Quanto mais perto do centro do alvo, mais pontos. Depois, a vez de dar a dica passa para a próxima pessoa.' },
  ]
  return <main className="tutorial-page"><nav className="tutorial-nav"><button onClick={onBack} aria-label="Voltar para a página inicial"><BrandLogo inverse /></button><button className="sales-cta small" onClick={onStart}>Jogar agora <ArrowRight size={16} /></button></nav><header className="tutorial-hero"><span className="warning-badge">APRENDA EM DOIS MINUTOS</span><h1>Como jogar<br /><em>Mesma Pista</em></h1><p>Uma pessoa dá a dica. Todo mundo tenta descobrir onde está o alvo secreto. É simples — até vocês perceberem que pensam completamente diferente.</p><button className="sales-cta" onClick={onStart}><Play size={18} fill="currentColor" /> COMEÇAR A JOGAR</button></header><section className="tutorial-steps"><div className="section-kicker">PASSO A PASSO</div><h2>Uma rodada completa</h2><div>{steps.map((step, index) => <article key={step.title}><span>{step.icon}</span><b>{String(index + 1).padStart(2, '0')}</b><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div></section><GameplayGallery /><section className="tutorial-example"><div><span className="section-kicker">EXEMPLO RÁPIDO</span><h2>“Ficar com o crush”</h2><p>Os extremos são <strong>Ruim</strong> e <strong>Bom</strong>. O alvo secreto caiu perto de “Bom”. Quem dá a dica pode falar “esperar por isso há meses”. Os outros decidem onde essa dica ficaria na escala.</p></div><div className="tutorial-scale"><span>RUIM</span><div><i /></div><span>BOM</span><small>alvo secreto</small></div></section><section className="tutorial-score"><span className="section-kicker">PONTUAÇÃO</span><h2>Chegue perto do alvo</h2><div><article><strong>+4</strong><span>Acertou o centro</span></article><article><strong>+3</strong><span>Chegou muito perto</span></article><article><strong>+2</strong><span>Entrou na área do alvo</span></article><article><strong>0</strong><span>Ficou fora da pista</span></article></div></section><section className="tutorial-final"><h2>Agora só falta chamar a galera.</h2><p>Crie sua sala, envie o código e comecem a primeira rodada.</p><button className="sales-cta" onClick={onStart}>CRIAR MINHA SALA <ArrowRight size={17} /></button></section><footer className="sales-footer"><BrandLogo inverse /><button className="nav-link" onClick={onBack}>Voltar para a home</button></footer></main>
}

const GAMEPLAY_SHOTS = [
  { src: '/screenshots/sala-lobby.png', title: 'Reúna a galera', text: 'A sala mostra quem entrou e quem é o anfitrião.' },
  { src: '/screenshots/escolha-tema.png', title: 'Escolha uma categoria', text: 'Quem dá a dica escolhe o assunto da rodada.' },
  { src: '/screenshots/alvo-secreto.png', title: 'Prepare a dica', text: 'Apenas uma pessoa vê a posição secreta do alvo.' },
  { src: '/screenshots/resposta-ponteiro.png', title: 'Marquem o ponteiro', text: 'Todos os outros respondem sem enxergar o alvo.' },
]

function GameplayGallery({ compact = false }) {
  const content = <div className="gameplay-shot-grid">{GAMEPLAY_SHOTS.map((shot) => <figure key={shot.src}><div><img src={shot.src} alt={`${shot.title} no jogo Mesma Pista`} loading="lazy" /></div><figcaption><strong>{shot.title}</strong><span>{shot.text}</span></figcaption></figure>)}</div>
  if (compact) return <details className="room-gameplay-guide"><summary><CircleHelp size={16} /> Ver como funciona a rodada</summary>{content}</details>
  return <section className="gameplay-gallery"><span className="section-kicker">O JOGO DE VERDADE</span><h2>Veja cada etapa na tela</h2>{content}</section>
}

function PricingSection({ onStart, onPricing }) {
  return <section className="sales-pricing"><div className="section-kicker">ESCOLHA O NÍVEL DO CAOS</div><h2>Comece grátis. Libere mais quando quiser.</h2><div className="sales-plans"><article><span>GRÁTIS</span><h3>R$ 0</h3><p>Para conhecer o jogo</p><ul><li><Check /> Packs básicos</li><li><Check /> Salas online</li><li><Check /> Até 8 jogadores</li></ul><button onClick={onStart}>Jogar grátis</button></article><article className="party"><span>PARTY PASS</span><h3>R$ 9,90</h3><p>Tudo liberado por 24 horas</p><ul><li><Check /> Todos os temas</li><li><Check /> Sem limite de rodadas</li><li><Check /> Ideal para a noite de hoje</li></ul><button onClick={() => onPricing('party')}>Quero para a festa</button></article><article><span>PRO</span><h3>R$ 19,90<small>/mês</small></h3><p>Para quem sempre reúne a galera</p><ul><li><Check /> Todos os packs</li><li><Check /> Histórico e estatísticas</li><li><Check /> Modos especiais em breve</li></ul><button onClick={() => onPricing('pro')}>Conhecer o Pro</button></article></div><small>Pagamento seguro processado pelo Stripe. Cancele o plano Pro quando quiser.</small></section>
}

function PricingPage({ account, trialActive, onBack, onStart, onRequireAccount }) {
  const [billingState, setBillingState] = useState(() => new URLSearchParams(window.location.search).get('checkout') === 'success' ? 'success' : 'idle')
  const [billingError, setBillingError] = useState('')
  useEffect(() => { track('pricing_viewed') }, [])

  async function openBilling(endpoint, body) {
    setBillingState('loading'); setBillingError('')
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (!/^https:\/\/(checkout|billing)\.stripe\.com\//.test(data.url || '')) throw new Error('Endereço de pagamento inválido.')
      window.location.assign(data.url)
    } catch (error) {
      setBillingError(error.message || 'Não foi possível abrir o Stripe.')
      setBillingState('idle')
    }
  }

  function checkout(plan) {
    track('checkout_started', { plan })
    if (!account) return onRequireAccount()
    openBilling('/api/stripe-checkout', { plan })
  }

  return <main className="pricing-shell"><button className="brand pricing-brand" onClick={onBack} aria-label="Voltar para a página inicial"><BrandLogo inverse /></button><div className="pricing-head"><span className="launch-badge"><Crown size={14} /> PLANOS</span><h1>Aumente o nível<br /><em>do caos.</em></h1><p>Pagamento protegido pelo Stripe. Seus dados de cartão não passam pelos servidores do Mesma Pista.</p>{billingState === 'success' && <div className="billing-notice success"><Check size={17} /> Pagamento recebido. Seu acesso será liberado em instantes.</div>}{billingError && <div className="billing-notice error">{billingError}</div>}{account?.hasStripeCustomer && <button className="manage-billing" disabled={billingState === 'loading'} onClick={() => openBilling('/api/stripe-portal')}>Gerenciar assinatura e pagamentos</button>}</div><div className={billingState === 'loading' ? 'billing-loading' : ''}><PricingSection onStart={trialActive ? onBack : onStart} onPricing={checkout} /></div></main>
}

function AuthPage({ onSuccess, onBack, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ username: '', email: '', password: '', marketingOptIn: true })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') track('host_lead_started')
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: mode, ...form, attribution: attribution() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (mode === 'signup') track('host_lead_created')
      onSuccess(data.user)
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-shell"><button className="brand auth-brand" onClick={onBack} aria-label="Voltar para a página inicial"><BrandLogo inverse /></button><section className="auth-card"><div className="auth-art"><span className="launch-badge"><Sparkles size={14} /> ENTRE NA RODADA</span><h1>Sua próxima história começa aqui.</h1><p>Crie sua sala, chame a galera e descubra quem está na sua pista.</p><div className="auth-perks"><span><Trophy /> Pontuação individual</span><span><Users /> Até 8 jogadores</span><span><ShieldCheck /> Conta protegida</span></div></div><form onSubmit={submit}><span className="step-label">{mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'SUA PRIMEIRA SALA É GRÁTIS'}</span><h2>{mode === 'login' ? 'Entrar no jogo' : 'Criar minha sala'}</h2>{mode === 'signup' && <label>Nome de usuário<input required minLength="3" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="Como vão te chamar?" /></label>}<label>{mode === 'login' ? 'E-mail ou usuário' : 'E-mail'}<input required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={mode === 'login' ? 'voce@email.com ou usuário' : 'voce@email.com'} type={mode === 'signup' ? 'email' : 'text'} /></label><label>Senha<input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Mínimo de 8 caracteres" /></label>{mode === 'signup' && <label className="check-label"><input type="checkbox" checked={form.marketingOptIn} onChange={(event) => setForm({ ...form, marketingOptIn: event.target.checked })} /> Quero receber novidades e novos temas por e-mail.</label>}{error && <div className="form-error">{error}</div>}<button className="cta-main auth-submit" disabled={loading}>{loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'CRIAR MINHA SALA'}</button><button type="button" className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}</button></form></section></main>
}

const adminTabFromPath = () => window.location.pathname.endsWith('/emails') ? 'emails' : window.location.pathname.endsWith('/adicionar') ? 'create' : 'users'

function AdminDashboard({ account, onGame, onLogout }) {
  const [tab, setTab] = useState(adminTabFromPath)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [growthStats, setGrowthStats] = useState({ guests: 0, rooms: 0, results: 0 })
  const [form, setForm] = useState({ username: '', email: '', password: '', plan: 'free' })

  async function loadUsers() {
    setLoading(true)
    const response = await fetch('/api/admin', { cache: 'no-store' })
    const data = await response.json()
    setUsers(data.users || [])
    setGrowthStats(data.stats || { guests: 0, rooms: 0, results: 0 })
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/admin', { cache: 'no-store' }).then((response) => response.json()).then((data) => { setUsers(data.users || []); setGrowthStats(data.stats || { guests: 0, rooms: 0, results: 0 }) }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handlePopState = () => setTab(adminTabFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const paths = { users: '/admin/usuarios', emails: '/admin/emails', create: '/admin/adicionar' }
    if (window.location.pathname !== paths[tab]) window.history.pushState({}, '', paths[tab])
  }, [tab])

  async function togglePlan(user) {
    const response = await fetch('/api/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, plan: user.plan === 'paid' ? 'free' : 'paid' }) })
    if (response.ok) loadUsers()
  }

  async function createUser(event) {
    event.preventDefault()
    const response = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await response.json()
    if (!response.ok) return setNotice(data.error || 'Erro ao cadastrar.')
    setForm({ username: '', email: '', password: '', plan: 'free' })
    setNotice('Usuário cadastrado com sucesso.')
    loadUsers()
  }

  function exportEmails() {
    const optedIn = users.filter((user) => user.marketingOptIn)
    const csv = ['nome,email,plano', ...optedIn.map((user) => `"${user.username.replaceAll('"', '""')}","${user.email}",${user.plan}`)].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'emails-mesma-pista.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const paid = users.filter((user) => user.plan === 'paid').length
  const marketingUsers = users.filter((user) => user.marketingOptIn)
  return <main className="admin-shell"><aside className="admin-nav"><BrandLogo inverse /><div className="admin-profile"><span>{account.username.charAt(0).toUpperCase()}</span><div><strong>{account.username}</strong><small>Administrador</small></div></div><nav><button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}><Users /> Usuários</button><button className={tab === 'emails' ? 'active' : ''} onClick={() => setTab('emails')}><Zap /> E-mail marketing</button><button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}><UserRound /> Adicionar usuário</button></nav><div className="admin-nav-bottom"><button onClick={onGame}><Play /> Abrir jogo</button><button onClick={onLogout}>Sair da conta</button></div></aside><section className="admin-content"><header><div><span>PAINEL ADMINISTRATIVO</span><h1>{tab === 'users' ? 'Seus usuários' : tab === 'emails' ? 'E-mail marketing' : 'Novo usuário'}</h1></div><div className="admin-live"><i /> Sistema online</div></header><div className="stat-grid"><article><Users /><div><strong>{users.length}</strong><span>usuários cadastrados</span></div></article><article><Crown /><div><strong>{paid}</strong><span>planos pagos</span></div></article><article><Zap /><div><strong>{growthStats.guests}</strong><span>convidados · {growthStats.rooms} salas · {growthStats.results} resultados</span></div></article></div>{loading ? <div className="admin-empty">Carregando usuários…</div> : tab === 'users' ? <div className="admin-table-wrap"><table><thead><tr><th>Usuário</th><th>E-mail</th><th>Plano</th><th>Lead score</th><th>Salas</th><th>Cadastro</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.username}</strong>{user.role === 'admin' && <small> ADMIN</small>}</td><td>{user.email}</td><td><span className={`plan-status ${user.plan}`}>{user.plan === 'paid' ? 'Pago' : 'Grátis'}</span></td><td>{user.leadScore || 0}</td><td>{user.hostedRooms || 0}</td><td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td><td>{user.role !== 'admin' && <button className="table-action" onClick={() => togglePlan(user)}>{user.plan === 'paid' ? 'Marcar grátis' : 'Marcar pago'}</button>}</td></tr>)}</tbody></table></div> : tab === 'emails' ? <div className="email-panel"><div><span className="launch-badge"><Zap size={14} /> BASE AUTORIZADA</span><h2>{marketingUsers.length} contatos disponíveis</h2><p>A lista contém somente pessoas que aceitaram receber comunicações.</p><button className="cta-main" onClick={exportEmails}>Baixar lista CSV</button></div><div className="email-list">{marketingUsers.map((user) => <div key={user.id}><span>{user.username.charAt(0).toUpperCase()}</span><div><strong>{user.username}</strong><small>{user.email}</small></div><b>{user.plan === 'paid' ? 'PRO' : 'FREE'}</b></div>)}</div></div> : <form className="create-user-form" onSubmit={createUser}><h2>Cadastrar manualmente</h2><p>O usuário poderá entrar imediatamente com esses dados.</p><label>Nome de usuário<input required minLength="3" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label><label>E-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Senha temporária<input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><label>Plano<select value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })}><option value="free">Grátis</option><option value="paid">Pago</option></select></label>{notice && <div className="form-notice">{notice}</div>}<button className="cta-main">Cadastrar usuário</button></form>}</section></main>
}

const viewFromPath = () => {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/sala/')) return 'game'
  if (path === '/entrar') return 'auth'
  if (path === '/planos') return 'pricing'
  if (path === '/como-jogar') return 'tutorial'
  if (path === '/jogar') return 'game'
  return 'landing'
}

function App() {
  const [appView, setAppView] = useState(viewFromPath)
  const [trialEndsAt, setTrialEndsAt] = useState(() => Number(localStorage.getItem('sintonia-trial-ends-v1')) || 0)
  const [account, setAccount] = useState(null)
  const [authInitialMode, setAuthInitialMode] = useState('login')
  const [authReady, setAuthReady] = useState(false)
  const [phase, setPhase] = useState('setup')
  const [cardIndex, setCardIndex] = useState(0)
  const [card, setCard] = useState(null)
  const [guess, setGuess] = useState(50)
  const [players, setPlayers] = useState(INITIAL_PLAYERS)
  const [history, setHistory] = useState([])
  const [chooser, setChooser] = useState(0)
  const [responderCursor, setResponderCursor] = useState(0)
  const [guesses, setGuesses] = useState({})
  const [resultId, setResultId] = useState(null)
  const [customTheme, setCustomTheme] = useState(null)
  const usedQuestions = useRef(new Set())
  const targetBag = useRef([])
  const participantId = useRef((() => {
    const saved = localStorage.getItem('mesma-pista-guest-id')
    if (saved) return saved
    const created = globalThis.crypto?.randomUUID?.() || `player-${Date.now()}-${Math.random()}`
    localStorage.setItem('mesma-pista-guest-id', created)
    return created
  })())
  const latestRevision = useRef(0)
  const roomToken = useRef('')
  const viewedResult = useRef(null)
  const [playMode, setPlayMode] = useState('offline')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState(() => window.location.pathname.match(/^\/sala\/([A-Z0-9]{5})$/i)?.[1]?.toUpperCase() || '')
  const [joinName, setJoinName] = useState('')
  const [onlineRole, setOnlineRole] = useState(null)
  const [syncStatus, setSyncStatus] = useState('offline')
  const [joinNotice, setJoinNotice] = useState('')
  const [roomError, setRoomError] = useState('')
  const guestInvite = window.location.pathname.startsWith('/sala/')

  const responders = players.map((_, index) => index).filter((index) => index !== chooser)
  const responder = responders[responderCursor] ?? responders[0] ?? 0
  const myPlayerId = players[onlineRole]?.id
  const hasSubmitted = Boolean(myPlayerId && Object.prototype.hasOwnProperty.call(guesses, myPlayerId))
  const { points, feedback } = card ? scoreGuess(guess, card.target) : { points: 0, feedback: 'fora do alvo' }
  const canAct = playMode === 'offline' || (phase === 'guess' ? onlineRole !== chooser && !hasSubmitted : onlineRole === chooser)
  const trialDays = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86400000)) : 7

  function navigate(view, replace = false) {
    const paths = { landing: '/', auth: '/entrar', pricing: '/planos', tutorial: '/como-jogar', game: '/jogar', admin: '/admin/usuarios' }
    const nextPath = paths[view] || '/'
    if (window.location.pathname !== nextPath) window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
    setAppView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handlePopState = () => setAppView(viewFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (phase === 'result' && resultId && viewedResult.current !== resultId) {
      viewedResult.current = resultId
      track('results_viewed', { resultId })
    }
  }, [phase, resultId])

  useEffect(() => {
    fetch('/api/auth', { cache: 'no-store' }).then((response) => response.json()).then((data) => {
      setAccount(data.user || null)
    }).catch(() => setAccount(null)).finally(() => setAuthReady(true))
  }, [])

  function startTrial() {
    const endsAt = Date.now() + 7 * 86400000
    localStorage.setItem('sintonia-trial-ends-v1', String(endsAt))
    setTrialEndsAt(endsAt)
    setAuthInitialMode('signup')
    navigate(account ? 'game' : 'auth')
  }

  function enterAfterAuth(user) {
    setAccount(user)
    if (!trialEndsAt) {
      const endsAt = Date.now() + 7 * 86400000
      localStorage.setItem('sintonia-trial-ends-v1', String(endsAt))
      setTrialEndsAt(endsAt)
    }
    navigate(user.role === 'admin' ? 'admin' : 'game')
  }

  async function logout() {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    setAccount(null)
    navigate('landing')
  }

  function gameSnapshot(overrides = {}) {
    return { phase, cardIndex, card, customTheme, guess, guesses, players, history, chooser, responderCursor, resultId, ...overrides }
  }

  function applyGameState(state) {
    setPhase(state.phase)
    setCardIndex(state.cardIndex ?? 0)
    setCard(state.card ?? null)
    setCustomTheme(state.customTheme ?? null)
    setGuess(state.guess ?? 50)
    setPlayers(state.players ?? INITIAL_PLAYERS)
    setHistory(state.history ?? [])
    setChooser(state.chooser ?? 0)
    setResponderCursor(state.responderCursor ?? 0)
    setGuesses(state.guesses ?? {})
    setResultId(state.resultId ?? null)
  }

  async function pushRoom(state) {
    if (playMode !== 'online' || !roomCode) return
    try {
      setSyncStatus('syncing')
      const response = await fetch('/api/room', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Participant-Token': roomToken.current }, body: JSON.stringify({ action: 'update', code: roomCode, state, participantId: participantId.current }) })
      const data = await response.json()
      if (!response.ok) {
        setRoomError(data.error || 'Falha ao sincronizar')
        if (response.status === 402 && onlineRole === 0) navigate('pricing')
        throw new Error(data.error)
      }
      latestRevision.current = data.revision || latestRevision.current
      applyGameState(data.state)
      setSyncStatus('online')
    } catch {
      setSyncStatus('error')
    }
  }

  useEffect(() => {
    if (playMode !== 'online' || !roomCode) return undefined
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/room?code=${roomCode}&participantId=${encodeURIComponent(participantId.current)}&revision=${latestRevision.current}&time=${Date.now()}`, { cache: 'no-store', headers: { Pragma: 'no-cache', 'X-Participant-Token': roomToken.current } })
        if (!response.ok) throw new Error('Sala indisponível')
        const remote = await response.json()
        if ((remote.revision || 0) < latestRevision.current) return
        latestRevision.current = remote.revision || latestRevision.current
        if ((remote.state.players?.length || 0) > players.length) {
          const newcomer = remote.state.players[remote.state.players.length - 1]
          setJoinNotice(`${newcomer.name} entrou na sala`)
          window.setTimeout(() => setJoinNotice(''), 4000)
        }
        const activeLocally = phase === 'guess' && onlineRole !== chooser && !hasSubmitted
        if (!activeLocally || remote.state.phase !== 'guess') applyGameState(remote.state)
        setSyncStatus('online')
      } catch {
        setSyncStatus('error')
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [playMode, roomCode, phase, onlineRole, chooser, hasSubmitted, players.length])

  async function createOnlineRoom() {
    setSyncStatus('syncing')
    setRoomError('')
    try {
      const initialState = { phase: 'lobby', cardIndex: 0, card: null, customTheme: null, guess: 50, guesses: {}, players: [{ ...INITIAL_PLAYERS[0], id: participantId.current }], history: [], chooser: 0, responderCursor: 0 }
      initialState.players[0].name = account?.username || 'Anfitrião'
      const response = await fetch('/api/room', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', state: initialState, participantId: participantId.current }) })
      const data = await response.json()
      if (!response.ok) {
        setRoomError(data.error || 'Não foi possível criar a sala')
        if (response.status === 402) navigate('pricing')
        throw new Error(data.error)
      }
      applyGameState(initialState)
      setRoomCode(data.code)
      roomToken.current = data.participantToken || ''
      localStorage.setItem(`mesma-pista-room-token:${data.code}`, roomToken.current)
      latestRevision.current = data.revision || 1
      setOnlineRole(0)
      setPlayMode('online')
      setSyncStatus('online')
      track('room_created')
    } catch {
      setSyncStatus('error')
    }
  }

  async function joinOnlineRoom() {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 5) return
    setSyncStatus('syncing')
    setRoomError('')
    try {
      const savedRoomToken = localStorage.getItem(`mesma-pista-room-token:${code}`) || ''
      const response = await fetch('/api/room', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Participant-Token': savedRoomToken }, body: JSON.stringify({ action: 'join', code, name: joinName.trim(), participantId: participantId.current, attribution: attribution() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Sala não encontrada')
      applyGameState(data.state)
      setRoomCode(code)
      roomToken.current = data.participantToken || savedRoomToken
      localStorage.setItem(`mesma-pista-room-token:${code}`, roomToken.current)
      setOnlineRole(data.role)
      latestRevision.current = data.revision || 0
      setPlayMode('online')
      setSyncStatus('online')
      window.history.replaceState({}, '', `/sala/${code}`)
      track('guest_session_created', { roomCode: code })
      track('guest_joined_room', { roomCode: code })
    } catch (error) {
      setRoomError(error.message)
      setSyncStatus('error')
    }
  }

  function leaveOnlineRoom() {
    setPlayMode('offline')
    setRoomCode('')
    setOnlineRole(null)
    roomToken.current = ''
    setSyncStatus('offline')
    resetGame(false)
  }

  async function shareResult(mode = 'native') {
    if (!resultId) return
    const url = `${window.location.origin}/resultado/${resultId}`
    const title = `${players.map((player) => player.name).slice(0, 3).join(' + ')} na Mesma Pista`
    try {
      if (mode === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`, '_blank', 'noopener,noreferrer')
      else if (mode === 'native' && navigator.share) await navigator.share({ title, text: 'Veja como foi nossa rodada no Mesma Pista.', url })
      else await navigator.clipboard?.writeText(url)
      track('results_shared', { mode })
    } catch {
      // Cancelar o compartilhamento nativo não deve interromper a partida.
    }
  }

  async function copyInvite() {
    await navigator.clipboard?.writeText(`${window.location.origin}/sala/${roomCode}`)
    track('invite_copied', { roomCode })
  }

  function startOnlineGame() {
    if (onlineRole !== 0 || players.length < 2) return
    setPhase('setup')
    pushRoom(gameSnapshot({ phase: 'setup', chooser: 0, responderCursor: 0 }))
    track('game_started', { players: players.length })
  }

  async function updateCustomTheme(action, fields) {
    try {
      setRoomError('')
      setSyncStatus('syncing')
      const response = await fetch('/api/room', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Participant-Token': roomToken.current }, body: JSON.stringify({ action, code: roomCode, participantId: participantId.current, ...fields }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar o tema.')
      latestRevision.current = data.revision || latestRevision.current
      applyGameState(data.state)
      setSyncStatus('online')
      return true
    } catch (error) {
      setRoomError(error.message)
      setSyncStatus('error')
      return false
    }
  }

  function chooseCard(index) {
    if (targetBag.current.length === 0) targetBag.current = shuffledTargets()
    const nextCard = index === THEMES.length ? createCustomCard(customTheme, targetBag.current.pop()) : createCard(index, usedQuestions.current, targetBag.current.pop(), history)
    if (!nextCard) return
    setCardIndex(index)
    setCard(nextCard)
    setPhase('target')
    pushRoom(gameSnapshot({ cardIndex: index, card: nextCard, phase: 'target' }))
  }

  function hideWheel() {
    const nextPhase = playMode === 'online' ? 'guess' : 'hide'
    setGuess(50)
    setGuesses({})
    setResultId(null)
    setPhase(nextPhase)
    pushRoom(gameSnapshot({ phase: nextPhase, guess: 50, guesses: {} }))
  }

  function startGuessing() {
    setGuess(50)
    setPhase('guess')
    pushRoom(gameSnapshot({ phase: 'guess', guess: 50 }))
  }

  async function revealAnswer() {
    if (playMode === 'online') {
      try {
        setSyncStatus('syncing')
        const response = await fetch('/api/room', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Participant-Token': roomToken.current }, body: JSON.stringify({ action: 'guess', code: roomCode, participantId: participantId.current, guess }) })
        const data = await response.json()
        if (!response.ok) {
          setRoomError(data.error || 'Não foi possível enviar o palpite')
          if (response.status === 402 && onlineRole === 0) navigate('pricing')
          throw new Error(data.error)
        }
        latestRevision.current = data.revision || latestRevision.current
        applyGameState(data.state)
        if (data.state.phase === 'result') track('round_completed')
        setSyncStatus('online')
      } catch {
        setSyncStatus('error')
      }
      return
    }
    const nextPlayers = players.map((player, index) => index === responder ? { ...player, score: player.score + points } : player)
    const nextHistory = [{ prompt: card.prompt, points, guess, target: card.target, chooser, responder }, ...history]
    setPlayers(nextPlayers)
    setHistory(nextHistory)
    setPhase('result')
    pushRoom(gameSnapshot({ players: nextPlayers, history: nextHistory, phase: 'result' }))
  }

  function advanceTurn() {
    if (playMode === 'offline' && responderCursor < responders.length - 1) {
      const nextCursor = responderCursor + 1
      setResponderCursor(nextCursor)
      setGuess(50)
      setPhase('guess')
      pushRoom(gameSnapshot({ responderCursor: nextCursor, guess: 50, phase: 'guess' }))
      return
    }
    const nextCardIndex = (cardIndex + 1) % THEMES.length
    const nextChooser = (chooser + 1) % players.length
    setCardIndex(nextCardIndex)
    setGuess(50)
    setChooser(nextChooser)
    setResponderCursor(0)
    setGuesses({})
    setPhase('setup')
    pushRoom(gameSnapshot({ cardIndex: nextCardIndex, guess: 50, guesses: {}, chooser: nextChooser, responderCursor: 0, phase: 'setup' }))
  }

  function resetGame(sync = true) {
    setCardIndex(0)
    setCard(null)
    setGuess(50)
    setPlayers(INITIAL_PLAYERS)
    setHistory([])
    setChooser(0)
    setResponderCursor(0)
    setGuesses({})
    usedQuestions.current.clear()
    targetBag.current = []
    setPhase('setup')
    if (sync) pushRoom({ phase: 'setup', cardIndex: 0, card: null, guess: 50, guesses: {}, players, history: [], chooser: 0, responderCursor: 0 })
  }

  if (!authReady) return <div className="app-loading"><BrandLogo inverse /><span>Carregando Mesma Pista…</span></div>
  if (appView === 'landing') return <LandingPage account={account} onStart={account ? () => navigate(account.role === 'admin' ? 'admin' : 'game') : startTrial} onLogin={() => { setAuthInitialMode('login'); navigate('auth') }} onPricing={() => navigate('pricing')} onTutorial={() => navigate('tutorial')} />
  if (appView === 'tutorial') return <TutorialPage onBack={() => navigate('landing')} onStart={account ? () => navigate(account.role === 'admin' ? 'admin' : 'game') : startTrial} />
  if (appView === 'auth' || (appView === 'game' && !account && !guestInvite)) return <AuthPage initialMode={authInitialMode} onSuccess={enterAfterAuth} onBack={() => navigate('landing')} />
  if (appView === 'admin' && account?.role !== 'admin') return <AuthPage initialMode="login" onSuccess={enterAfterAuth} onBack={() => navigate('landing')} />
  if (appView === 'admin' && account?.role === 'admin') return <AdminDashboard account={account} onGame={() => navigate('game')} onLogout={logout} />
  if (appView === 'pricing') return <PricingPage account={account} trialActive={trialEndsAt > Date.now()} onBack={() => navigate(trialEndsAt > Date.now() && account ? 'game' : 'landing')} onStart={startTrial} onRequireAccount={startTrial} />
  if (appView === 'game' && guestInvite && playMode !== 'online') return <GuestEntry code={joinCode} name={joinName} error={roomError} loading={syncStatus === 'syncing'} onName={setJoinName} onJoin={joinOnlineRoom} onBack={() => navigate('landing')} />

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => navigate('landing')} aria-label="Ir para a página inicial"><BrandLogo /></button>
        <div className="topbar-actions"><button className="trial-pill tutorial-game-link" onClick={() => navigate('tutorial')}><CircleHelp size={13} /> COMO JOGAR</button>{account?.role === 'admin' && <button className="trial-pill" onClick={() => navigate('admin')}><Crown size={13} /> ADMIN</button>}<button className="trial-pill" onClick={() => navigate('pricing')}><Zap size={13} /> {account?.plan === 'paid' ? 'PLANO PRO' : `TESTE · ${trialDays}D`}</button>{phase !== 'lobby' && <><span className="round-count">RODADA {Math.max(1, history.length + (phase === 'result' ? 0 : 1))}</span>{(playMode === 'offline' || onlineRole === 0) && <button className="icon-button" onClick={resetGame} aria-label="Reiniciar jogo" title="Reiniciar jogo"><RotateCcw size={17} /></button>}</>}</div>
      </header>

      <section className="intro-row">
        <div><p className="eyebrow"><Sparkles size={15} /> VÁRIAS PESSOAS, UMA PISTA</p><h1>Até onde vocês<br /><em>pensam igual?</em></h1><p className="subtitle">Um jogador dá a dica. Todos os outros respondem, ganham seus próprios pontos e a vez de dar a dica gira.</p></div>
        <div className="how-to"><CircleHelp size={20} /><div><strong>Joguem frente a frente</strong><span>Passe o celular para o outro jogador quando a tela pedir.</span></div></div>
      </section>

      <OnlinePanel playMode={playMode} roomCode={roomCode} joinCode={joinCode} joinName={joinName} role={onlineRole} players={players} status={syncStatus} canHost={Boolean(account)} error={roomError} onJoinCode={setJoinCode} onJoinName={setJoinName} onCreate={createOnlineRoom} onJoin={joinOnlineRoom} onCopyInvite={copyInvite} onLeave={leaveOnlineRoom} />
      {joinNotice && <div className="join-notice"><UserRound size={17} /><strong>{joinNotice}</strong></div>}

      <div className={`game-layout layout-${phase}`}>
        <section className={`board-panel phase-${phase}`}>
          {phase === 'lobby' && <LobbyScreen isAdmin={onlineRole === 0} players={players} roomCode={roomCode} customTheme={customTheme} onCreateTheme={(themeName) => updateCustomTheme('create_theme', { themeName })} onAddQuestion={(question) => updateCustomTheme('add_question', question)} onStart={startOnlineGame} />}
          {phase === 'setup' && (canAct ? <ThemePicker chooser={chooser} players={players} onChoose={chooseCard} selected={cardIndex} customTheme={customTheme} /> : <WaitingScreen name={playerName(chooser, players)} action="está escolhendo o tema" />)}
          {phase === 'target' && (canAct ? <TargetPhase chooser={chooser} players={players} card={card} onHide={hideWheel} onSkip={() => chooseCard(cardIndex)} /> : <WaitingScreen name={playerName(chooser, players)} action="está olhando o alvo e preparando a dica" />)}
          {phase === 'hide' && <PassScreen chooser={chooser} responder={responder} onContinue={startGuessing} />}
          {phase === 'guess' && (canAct ? <GuessPhase responder={playMode === 'online' ? onlineRole : responder} players={players} card={card} guess={guess} result={false} points={points} feedback={feedback} onGuess={setGuess} onReveal={revealAnswer} /> : <WaitingScreen name={hasSubmitted ? 'Os outros jogadores' : 'Os jogadores'} action={hasSubmitted ? 'ainda estão escolhendo seus ponteiros' : 'estão respondendo ao mesmo tempo'} />)}
          {phase === 'result' && (playMode === 'online' ? <MultiplayerResult players={players} chooser={chooser} card={card} guesses={guesses} resultId={resultId} onShare={shareResult} onNext={canAct ? advanceTurn : null} /> : <GuessPhase responder={responder} players={players} card={card} guess={guess} result points={points} feedback={feedback} onGuess={setGuess} onReveal={revealAnswer} onNext={advanceTurn} />)}
        </section>

        <aside className="sidebar">
          <div className="side-section"><div className="section-heading"><span>{phase === 'lobby' ? 'Usuários na sala' : 'Placar'} · {players.length}</span><UserRound size={17} /></div><div className="score-list">{players.map((player, index) => { const isClueGiver = index === chooser && (phase === 'setup' || phase === 'target'); const isResponder = (playMode === 'online' ? index !== chooser : index === responder) && (phase === 'hide' || phase === 'guess' || phase === 'result'); return <div key={`${player.name}-${index}`} className={`player-row ${isClueGiver || isResponder ? 'active' : ''}`}><span className="team-dot" style={{ background: player.color }} /><span>{player.name}</span>{phase === 'lobby' && <small>{index === 0 ? 'admin' : 'pronto'}</small>}{phase !== 'lobby' && isClueGiver && <small>dá a dica</small>}{phase !== 'lobby' && isResponder && <small>{playMode === 'online' && guesses[player.id] !== undefined ? 'respondeu' : 'respondendo'}</small>}{phase !== 'lobby' && <strong>{player.score}</strong>}</div> })}</div></div>
          {phase !== 'lobby' && <div className="side-section recent"><div className="section-heading"><span>Turnos recentes</span><span className="history-count">{history.length}</span></div>{history.length === 0 ? <p className="empty-history">As jogadas aparecem aqui<br />depois do primeiro turno.</p> : <div className="history-list">{history.slice(0, 6).map((item, index) => <div className="history-item" key={`${item.prompt}-${index}`}><span className="history-team" style={{ background: players[item.responder]?.color }} /> <span>{playerName(item.chooser, players)} deu a dica, {playerName(item.responder, players)} respondeu: <b>{item.prompt}</b></span><strong>+{item.points}</strong></div>)}</div>}</div>}
          {phase !== 'lobby' && <div className="tip-card"><span className="tip-number">{phase === 'setup' ? '01' : phase === 'guess' ? '03' : '02'}</span><strong>{phase === 'guess' ? `Agora é a vez do ${players[responder].name}.` : phase === 'setup' ? `A vez é do ${players[chooser].name}.` : 'Passe a vez com cuidado.'}</strong><p>{phase === 'guess' ? 'O ponteiro está coberto. Posicione a sua resposta e confirme somente quando tiver certeza.' : phase === 'setup' ? 'Escolha uma carta sem deixar o outro jogador ver a sua decisão.' : 'Guarde o resultado e entregue o celular para quem vai responder.'}</p></div>}
        </aside>
      </div>
      {phase === 'result' && playMode === 'online' && onlineRole !== 0 && !account && <GuestLeadPrompt defaultName={players[onlineRole]?.name || ''} onConverted={(user) => setAccount(user)} />}
      <footer><span>MESMA PISTA © 2026</span><span>feito para jogar junto <span className="footer-dot">●</span></span></footer>
    </main>
  )
}

function GuestEntry({ code, name, error, loading, onName, onJoin, onBack }) {
  return <main className="guest-entry"><button className="guest-entry-logo" onClick={onBack} aria-label="Ir para a página inicial"><BrandLogo /></button><section><span className="section-kicker">VOCÊ FOI CHAMADO PARA A RODADA</span><h1>Entre na sala<br /><em>{code}</em></h1><p>Nada de cadastro agora. Escolha como a galera vai te chamar e entre direto no jogo.</p><label>Seu apelido<input autoFocus maxLength="18" value={name} onChange={(event) => onName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && name.trim() && onJoin()} placeholder="Ex.: Vini" /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={loading || !name.trim()} onClick={onJoin}>{loading ? 'Entrando…' : <>ENTRAR NA SALA <ArrowRight size={18} /></>}</button><small>Sem e-mail • Sem instalar • Resultado na hora</small></section></main>
}

function OnlinePanel({ playMode, roomCode, joinCode, joinName, role, players, status, canHost, error, onJoinCode, onJoinName, onCreate, onJoin, onCopyInvite, onLeave }) {
  if (playMode === 'online') {
    return <section className="online-panel is-connected"><div className="online-state"><Wifi size={18} /><div><strong>Sala {roomCode} · {players.length} {players.length === 1 ? 'jogador' : 'jogadores'}</strong><span>Você é {playerName(role, players)} · {status === 'syncing' ? 'sincronizando…' : status === 'error' ? 'tentando reconectar…' : 'conectado'}</span></div></div><div className="room-actions"><button className="room-code" onClick={onCopyInvite} title="Copiar link da sala"><Copy size={15} /> Copiar convite · {roomCode}</button><button className="text-button" onClick={onLeave}>Sair da sala</button></div></section>
  }

  return <section className="online-panel"><div className="online-state"><WifiOff size={18} /><div><strong>{joinCode ? 'Você recebeu um convite' : 'Modo local'}</strong><span>{joinCode ? 'Digite apenas seu apelido para entrar.' : 'Continua funcionando sem internet neste aparelho.'}</span></div></div><div className="online-options">{canHost && <button className="secondary-button" onClick={onCreate}><Wifi size={16} /> Criar sala online</button>}<div className="join-room"><input value={joinName} onChange={(event) => onJoinName(event.target.value.slice(0, 18))} placeholder="SEU APELIDO" aria-label="Seu apelido" /><input value={joinCode} onChange={(event) => onJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} onKeyDown={(event) => event.key === 'Enter' && onJoin()} placeholder="CÓDIGO" aria-label="Código da sala" /><button className="secondary-button" onClick={onJoin} disabled={joinCode.length !== 5 || !joinName.trim()}><Link size={16} /> Entrar</button></div></div>{error && <span className="online-error">{error}</span>}</section>
}

function LobbyScreen({ isAdmin, players, roomCode, customTheme, onCreateTheme, onAddQuestion, onStart }) {
  return <div className="lobby-screen"><div className="lobby-icon"><Wifi size={28} /></div><span className="step-label">SALA {roomCode}</span><h2>{isAdmin ? 'Sua sala está pronta.' : 'Você entrou na sala.'}</h2><p>{players.length < 2 ? 'Compartilhe o código e aguarde pelo menos mais uma pessoa.' : isAdmin ? 'Todos estão conectados. Você controla quando a partida começa.' : 'Aguarde o administrador iniciar a partida.'}</p><div className="lobby-code"><span>Código para entrar</span><button onClick={() => navigator.clipboard?.writeText(roomCode)}><Copy size={17} /> {roomCode}</button></div><GameplayGallery compact /><CustomThemeBuilder isAdmin={isAdmin} theme={customTheme} onCreate={onCreateTheme} onAdd={onAddQuestion} />{isAdmin ? <button className="primary-button" disabled={players.length < 2} onClick={onStart}>{players.length < 2 ? 'Aguardando jogadores…' : <>Iniciar partida <ArrowRight size={18} /></>}</button> : <div className="admin-wait"><span className="live-dot" /> Administrador: {players[0]?.name}</div>}</div>
}

function CustomThemeBuilder({ isAdmin, theme, onCreate, onAdd }) {
  const [themeName, setThemeName] = useState('')
  const [question, setQuestion] = useState({ prompt: '', low: 'Ruim', high: 'Bom' })
  const [loading, setLoading] = useState(false)

  async function create(event) {
    event.preventDefault(); setLoading(true)
    if (await onCreate(themeName)) setThemeName('')
    setLoading(false)
  }
  async function add(event) {
    event.preventDefault(); setLoading(true)
    if (await onAdd(question)) setQuestion({ prompt: '', low: 'Ruim', high: 'Bom' })
    setLoading(false)
  }

  if (!theme) return <section className="custom-theme-box"><div><span className="section-kicker">TEMA DA GALERA</span><h3>Criem as próprias perguntas</h3><p>O anfitrião abre o tema e cada pessoa contribui antes da partida.</p></div>{isAdmin ? <form onSubmit={create}><label>Nome do tema<input required minLength="3" maxLength="48" value={themeName} onChange={(event) => setThemeName(event.target.value)} placeholder="Ex.: Histórias do grupo" /></label><button className="secondary-button" disabled={loading}><Plus size={16} /> Criar tema</button></form> : <small>Aguardando o anfitrião criar o tema personalizado…</small>}</section>

  return <section className="custom-theme-box active"><div className="custom-theme-head"><div><span className="section-kicker">TEMA DA GALERA</span><h3>{theme.name}</h3></div><b>{theme.questions.length} {theme.questions.length === 1 ? 'pergunta' : 'perguntas'}</b></div><div className="custom-question-list">{theme.questions.map((item) => <div key={item.id}><strong>{item.prompt}</strong><span>{item.low} ↔ {item.high} · por {item.author}</span></div>)}</div>{theme.canAdd ? <form className="custom-question-form" onSubmit={add}><label>Pergunta<input required minLength="3" maxLength="180" value={question.prompt} onChange={(event) => setQuestion({ ...question, prompt: event.target.value })} placeholder="Ex.: Viajar sem planejar nada" /></label><div><label>Extremo esquerdo<input required maxLength="60" value={question.low} onChange={(event) => setQuestion({ ...question, low: event.target.value })} /></label><label>Extremo direito<input required maxLength="60" value={question.high} onChange={(event) => setQuestion({ ...question, high: event.target.value })} /></label></div><button className="secondary-button" disabled={loading}><Plus size={16} /> Adicionar pergunta</button><small>{theme.unlimited ? 'Plano pago: perguntas ilimitadas para a sala.' : 'Plano grátis: uma pergunta por jogador nesta sala.'}</small></form> : <div className="custom-limit"><Check size={16} /> Sua pergunta grátis já foi adicionada.</div>}</section>
}

function WaitingScreen({ name, action }) {
  return <div className="waiting-screen"><div className="waiting-pulse"><Wifi size={27} /></div><span className="step-label">SALA SINCRONIZADA</span><h2>Aguardando {name}</h2><p>{name} {action}. Esta tela avançará automaticamente.</p></div>
}

function ThemePicker({ chooser, players, onChoose, selected, customTheme }) {
  return <div className="setup-screen"><div className="step-label">ETAPA 01 <span>{`${playerName(chooser, players).toUpperCase()} PREPARA A DICA`}</span></div><div className="setup-title"><div><span className="theme-label">Escolha uma carta</span><h2>Qual tema vai guiar<br />a rodada?</h2></div><div className="private-badge"><LockKeyhole size={15} /> escolha em segredo</div></div><div className="role-flow"><span><b>{playerName(chooser, players)}</b> vê o alvo e dá a dica</span><ArrowRight size={16} /><span><b>Todos os outros</b> posicionam o ponteiro</span></div><div className="theme-grid">{THEMES.map((theme, index) => <button key={theme.id} className={`theme-card ${selected === index ? 'selected' : ''}`} onClick={() => onChoose(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{theme.theme}</strong><small>Nova pergunta a cada escolha</small><ArrowRight size={15} /></button>)}{customTheme?.questions?.length > 0 && <button className={`theme-card custom ${selected === THEMES.length ? 'selected' : ''}`} onClick={() => onChoose(THEMES.length)}><span>DA GALERA</span><strong>{customTheme.name}</strong><small>{customTheme.questions.length} perguntas criadas pela sala</small><Sparkles size={15} /></button>}</div><p className="screen-hint">{TOTAL_POSSIBILITIES.toLocaleString('pt-BR')} combinações, sem repetir durante a partida.</p></div>
}

function Dial({ value = 50, target, revealed = false, interactive = false }) {
  const needleAngle = -82 + value * 1.64
  const targetAngle = -82 + target * 1.64
  return <div className={`dial ${revealed ? 'is-revealed' : ''} ${interactive ? 'is-interactive' : ''}`} style={{ '--needle-angle': `${needleAngle}deg`, '--target-angle': `${targetAngle}deg` }}>
    <div className="dial-shell">
      <div className="dial-face">
        <div className="target-band"><i>2</i><i>3</i><i>4</i><i>3</i><i>2</i></div>
        <div className="dial-shutter" />
        <div className="dial-needle" />
        <div className="dial-hub"><img src="/brand/logo/mesma-pista-symbol.svg" alt="" /></div>
      </div>
    </div>
  </div>
}

function TargetPhase({ chooser, players, card, onHide, onSkip }) {
  return <div className="wheel-screen target-screen">
    <div className="target-stage-head">
      <div className="step-label">ETAPA 02 <span>{`${playerName(chooser, players).toUpperCase()} DÁ A DICA`}</span></div>
      <span className="private-badge"><LockKeyhole size={15} /> alvo secreto</span>
    </div>
    <div className="target-dial-stage">
      <Dial value={card.target} target={card.target} revealed />
      <div className="spectrum-labels dial-labels"><span>{card.low}</span><span>{card.high}</span></div>
    </div>
    <div className="target-info-panel">
      <div className="target-copy">
        <span className="theme-label">{card.theme}</span>
        <h2>{card.prompt}</h2>
        <p className="clue-copy">Dê uma dica para todos tentarem encontrar o centro azul.</p>
      </div>
      <div className="target-actions"><button className="secondary-button" onClick={onSkip}><RotateCcw size={16} /> Pular pergunta</button><button className="primary-button spin-button" onClick={onHide}>Já dei minha dica <EyeOff size={17} /></button></div>
    </div>
  </div>
}

function PassScreen({ chooser, responder, onContinue }) {
  return <div className="pass-screen"><div className="pass-icon"><EyeOff size={28} /></div><span className="step-label">RESULTADO ESCONDIDO</span><h2>{`${playerName(chooser)}, passe`}<br />o celular.</h2><p>{`Não deixe ${playerName(responder)} ver onde a roleta parou. Quando estiver pronto, entregue o celular.`}</p><button className="primary-button" onClick={onContinue}>{`${playerName(responder)}, estou pronto`} <ArrowRight size={18} /></button></div>
}

function MultiplayerResult({ players, chooser, card, guesses, resultId, onShare, onNext }) {
  const results = players.map((player, index) => ({ player, index, guess: guesses[player.id] })).filter((item) => item.index !== chooser && item.guess !== undefined).map((item) => { const distance = Math.abs(item.guess - card.target); return { ...item, points: distance <= 4 ? 4 : distance <= 9 ? 3 : distance <= 14 ? 2 : 0 } })
  return <div className="multi-result"><span className="step-label">RESULTADO DA RODADA</span><div className="wheel-title"><div><span className="theme-label">{card.theme}</span><h2>{card.prompt}</h2></div><span className="private-badge"><Eye size={15} /> alvo revelado</span></div><Dial value={card.target} target={card.target} revealed /><div className="spectrum-labels dial-labels"><span>{card.low}</span><span>{card.high}</span></div><div className="answers-grid">{results.map(({ player, guess, points }) => <div className="answer-card" key={player.id}><span className="team-dot" style={{ background: player.color }} /><strong>{player.name}</strong><span>marcou {guess}%</span><b>+{points}</b></div>)}</div>{resultId && <div className="share-actions"><button className="secondary-button" onClick={() => onShare('native')}><Share2 size={16} /> Compartilhar resultado</button><button className="secondary-button" onClick={() => onShare('whatsapp')}><MessageCircle size={16} /> WhatsApp</button><button className="secondary-button" onClick={() => onShare('copy')}><Copy size={16} /> Copiar link</button></div>}<div className="board-footer"><span className="drag-copy">O alvo estava em {card.target}%.</span><button className="primary-button" disabled={!onNext} onClick={onNext}>{onNext ? <>Próxima rodada <ArrowRight size={18} /></> : <>Aguardando quem deu a dica…</>}</button></div></div>
}

function GuestLeadPrompt({ defaultName, onConverted }) {
  const [form, setForm] = useState({ name: defaultName, email: '', password: '', marketingOptIn: false })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  useEffect(() => { track('guest_lead_prompt_viewed') }, [])

  async function submit(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const response = await fetch('/api/guest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, attribution: attribution() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      track('guest_lead_created')
      track('guest_converted_to_host')
      setStatus('done')
      onConverted(data.user)
    } catch (conversionError) {
      setError(conversionError.message || 'Não foi possível salvar seu resultado.')
      setStatus('idle')
    }
  }

  return <section className="guest-lead-card"><div><span className="section-kicker">SEU RESULTADO FICA COM VOCÊ</span><h2>Quer descobrir com quem você combina mais?</h2><p>Salve seu histórico, crie sua própria sala e desafie outros amigos.</p></div>{status === 'done' ? <div className="guest-success"><Check /> Histórico preservado. Agora você também pode criar salas.</div> : <form onSubmit={submit}><label>Seu nome<input required minLength="2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>E-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Crie uma senha<input required type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><label className="guest-marketing"><input type="checkbox" checked={form.marketingOptIn} onChange={(event) => setForm({ ...form, marketingOptIn: event.target.checked })} /> Quero receber novos temas e novidades por e-mail.</label>{error && <span className="form-error">{error}</span>}<button className="primary-button" disabled={status === 'loading'}>{status === 'loading' ? 'Salvando…' : 'CRIAR MINHA SALA GRÁTIS'}</button></form>}</section>
}

function GuessPhase({ responder, players, card, guess, result, points, feedback, onGuess, onReveal, onNext }) {
  const [dragging, setDragging] = useState(false)

  function movePointer(event) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left))
    onGuess(Math.round((x / bounds.width) * 100))
  }

  function startPointer(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    movePointer(event)
  }

  function stopPointer() {
    setDragging(false)
  }

  function useKeyboard(event) {
    if (result) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') onGuess(Math.max(0, guess - 1))
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') onGuess(Math.min(100, guess + 1))
    else if (event.key === 'Home') onGuess(0)
    else if (event.key === 'End') onGuess(100)
    else return
    event.preventDefault()
  }

  return <div className="guess-screen"><div className="step-label">ETAPA 03 <span>{`${playerName(responder, players).toUpperCase()} RESPONDE`}</span></div><div className="card-head"><div><span className="theme-label">{card.theme}</span><h2>{card.prompt}</h2></div><div className="turn-chip"><span className="live-dot coral" /> vez de {playerName(responder, players)}</div></div><div className="hint-box"><Sparkles size={17} /><span>Use a dica que você ouviu e posicione o ponteiro entre os dois extremos.</span></div><div className="dial-hit-area" role="slider" tabIndex={result ? -1 : 0} aria-label="Posição do ponteiro" aria-valuemin="0" aria-valuemax="100" aria-valuenow={guess} aria-disabled={result} onKeyDown={useKeyboard} onPointerDown={result ? undefined : startPointer} onPointerMove={result || !dragging ? undefined : movePointer} onPointerUp={stopPointer} onPointerCancel={stopPointer}><Dial value={guess} target={card.target} revealed={result} interactive={!result} /></div><div className="spectrum-labels dial-labels"><span>{card.low}</span><span>{card.high}</span></div><p className="wheel-instruction">Arraste o ponteiro pelo mostrador</p><div className="board-footer"><span className="drag-copy">Quem deu a dica não pode falar mais nada agora</span><button className="primary-button" disabled={result && !onNext} onClick={result ? onNext : onReveal}>{result ? onNext ? <>Próximo turno <ArrowRight size={18} /></> : <>Aguardando {playerName(responder, players)}…</> : <>Revelar alvo <Eye size={18} /></>}</button></div>{result && <div className="result-banner"><div className="result-score">+{points}<small>pontos</small></div><div><strong>{feedback}</strong><span>O alvo estava em {card.target}% e você marcou {guess}%.</span></div><Eye size={20} /></div>}</div>
}

export default App
