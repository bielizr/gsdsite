document.addEventListener('DOMContentLoaded', () => {
  // Seletores
  const formAdicionarEvento = document.getElementById('form-adicionar-evento');
  const calendarioVisualizacao = document.getElementById('calendario-visualizacao');
  
  let eventos = []; // Para armazenar os eventos

  // Função para adicionar evento
  formAdicionarEvento.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titulo = document.getElementById('evento-titulo').value.trim();
    const data = document.getElementById('evento-data').value.trim();
    
    if (!titulo || !data) {
      alert('Preencha todos os campos!');
      return;
    }
    
    // Salvar evento no banco (para o backend)
    const res = await fetch('http://localhost:3000/calendario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, data })
    });
    
    if (res.ok) {
      alert('Evento adicionado com sucesso!');
      carregarEventos(); // Recarregar a lista de eventos
      formAdicionarEvento.reset();
    } else {
      alert('Erro ao adicionar evento.');
    }
  });

  // Função para carregar os eventos
  async function carregarEventos() {
    const res = await fetch('http://localhost:3000/calendario');
    eventos = await res.json();

    calendarioVisualizacao.innerHTML = ''; // Limpar a lista antes de renderizar

    if (eventos.length === 0) {
      calendarioVisualizacao.innerHTML = '<p class="text-gray-600">Nenhum evento registrado.</p>';
      return;
    }

    eventos.forEach(evento => {
      const div = document.createElement('div');
      div.className = 'bg-white p-4 rounded shadow';

      div.innerHTML = `
        <h3 class="font-bold text-lg">${evento.titulo}</h3>
        <p><strong>Data:</strong> ${evento.data}</p>
      `;
      
      calendarioVisualizacao.appendChild(div);
    });
  }

  // Inicializa o calendário com os eventos
  carregarEventos();
});

document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  function switchTab(name) {
    tabs.forEach(t => t.dataset.tab === name ? t.classList.add('active') : t.classList.remove('active'));
    contents.forEach(c => c.id === name ? c.classList.remove('hidden') : c.classList.add('hidden'));
  }

  switchTab('calendario'); // Inicia com a aba "calendario" aberta

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // ------- RELATÓRIOS -------

  const listaRelatorios = document.getElementById('lista-relatorios');

  async function carregarRelatorios() {
    const res = await fetch('http://localhost:3000/relatorios'); // Busca os relatórios do backend
    const relatorios = await res.json();

    listaRelatorios.innerHTML = '';
    if (relatorios.length === 0) {
      listaRelatorios.innerHTML = '<p class="text-gray-600">Nenhum relatório pendente.</p>';
      return;
    }

    relatorios.forEach(r => {
      const div = document.createElement('div');
      div.className = 'bg-white p-4 rounded shadow';

      div.innerHTML = `
        <h3 class="font-bold text-lg">${r.titulo}</h3>
        <p><strong>Enviado por:</strong> ${r.usuario_nome}</p>
        <p><strong>Status:</strong> ${r.status}</p>
        <p><strong>Observações:</strong> ${r.observacoes || 'Nenhuma'}</p>
        <button class="bg-blue-500 text-white px-4 py-2 rounded mt-4" onclick="aprovarRelatorio(${r.id})">Aprovar</button>
        <button class="bg-red-500 text-white px-4 py-2 rounded mt-4" onclick="recusarRelatorio(${r.id})">Recusar</button>
      `;

      listaRelatorios.appendChild(div);
    });
  }

  // Aprovar relatório
  async function aprovarRelatorio(id) {
    const res = await fetch(`http://localhost:3000/relatorios/${id}/aprovar`, { method: 'PATCH' });
    if (res.ok) {
      alert('Relatório aprovado!');
      carregarRelatorios(); // Recarregar os relatórios
    } else {
      alert('Erro ao aprovar o relatório.');
    }
  }

  // Recusar relatório
  async function recusarRelatorio(id) {
    const res = await fetch(`http://localhost:3000/relatorios/${id}/recusar`, { method: 'PATCH' });
    if (res.ok) {
      alert('Relatório recusado!');
      carregarRelatorios(); // Recarregar os relatórios
    } else {
      alert('Erro ao recusar o relatório.');
    }
  }

  carregarRelatorios(); // Carregar os relatórios ao carregar a página
});

// ------ UPLOAD DE ARQUIVOS ------

// Seletores
const formUploadArquivo = document.getElementById('form-upload-arquivo');
const listaArquivos = document.getElementById('lista-arquivos');

// Evento de envio do formulário para upload de arquivos
formUploadArquivo.addEventListener('submit', async (e) => {
  e.preventDefault();

  const tipo = document.getElementById('tipo').value.trim();
  const arquivoInput = document.getElementById('arquivo');
  const arquivo = arquivoInput.files[0];

  if (!tipo || !arquivo) {
    alert('Por favor, preencha o nome e selecione um arquivo.');
    return;
  }

  const formData = new FormData();
  formData.append('nome', tipo); // Tipo do arquivo, como 'Ata', 'Apresentação', etc.
  formData.append('arquivo', arquivo); // O arquivo a ser enviado

  try {
    const response = await fetch('http://localhost:3000/arquivos', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      alert('Erro ao enviar arquivo.');
      return;
    }

    alert('Arquivo enviado com sucesso!');
    carregarArquivos(); // Carregar arquivos após o upload
  } catch (err) {
    console.error(err);
    alert('Erro ao conectar ao servidor.');
  }
});

// Carregar arquivos
async function carregarArquivos() {
  const res = await fetch('http://localhost:3000/arquivos');
  const arquivos = await res.json();

  listaArquivos.innerHTML = ''; // Limpar a lista antes de renderizar

  if (arquivos.length === 0) {
    listaArquivos.innerHTML = '<p class="text-gray-600">Nenhum arquivo enviado.</p>';
    return;
  }

  arquivos.forEach(arquivo => {
    const div = document.createElement('div');
    div.className = 'bg-white p-4 rounded shadow';

    div.innerHTML = `
      <h3 class="font-bold text-lg">${arquivo.nome}</h3>
      <p><strong>Tipo:</strong> ${arquivo.tipo}</p>
      <p><strong>Data de Upload:</strong> ${arquivo.data_upload}</p>
      <a href="${arquivo.caminho}" target="_blank" class="text-blue-600 hover:underline">Baixar</a>
    `;

    listaArquivos.appendChild(div);
  });
}

// Carregar arquivos ao iniciar
carregarArquivos();

document.addEventListener('DOMContentLoaded', () => {
  const formPresenca = document.getElementById('form-presenca');
  const btnSalvarPresenca = document.getElementById('btn-salvar-presenca');
  const presencaMsg = document.getElementById('presenca-msg');
  const dataReuniaoInput = document.getElementById('data-reuniao');
  
  let usuarios = [];

  // Função para carregar os usuários
  async function carregarUsuarios() {
    const res = await fetch('http://localhost:3000/users');
    usuarios = await res.json();
    renderizarUsuarios();
  }

  // Função para renderizar a lista de presença
  function renderizarUsuarios() {
    formPresenca.innerHTML = ''; // Limpa a lista antes de renderizar novamente
    usuarios.forEach(u => {
      const div = document.createElement('div');
      div.className = 'flex items-center space-x-4 bg-white p-2 rounded shadow';

      div.innerHTML = `
        <span class="flex-1">${u.name} (${u.sector})</span>
        <label class="flex items-center space-x-2">
          <input type="radio" name="presenca-${u.id}" value="presente" />
          <span>Presente</span>
        </label>
        <label class="flex items-center space-x-2">
          <input type="radio" name="presenca-${u.id}" value="ausente" />
          <span>Ausente</span>
        </label>
      `;
      formPresenca.appendChild(div);
    });
  }

  // Função para salvar a presença
  btnSalvarPresenca.addEventListener('click', async () => {
    const dataReuniao = dataReuniaoInput.value.trim();
    if (!dataReuniao) {
      alert('Selecione uma data');
      return;
    }

    // Coleta as presenças
    const presencas = usuarios.map(u => {
      const radios = document.getElementsByName(`presenca-${u.id}`);
      let status = 'ausente';  // Se não for selecionado, assume como ausente
      for (const r of radios) {
        if (r.checked) {
          status = r.value;
          break;
        }
      }
      return { user_id: u.id, status };
    });

    // Envia para o backend
    const res = await fetch('http://localhost:3000/presencas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dataReuniao, presencas })  // Enviando a data corretamente
    });

    if (res.ok) {
      presencaMsg.textContent = 'Presenças salvas com sucesso!';
      formPresenca.innerHTML = '';  // Limpa após salvar
    } else {
      presencaMsg.textContent = 'Erro ao salvar presença.';
    }
  });

  // Inicializa o carregamento dos usuários
  carregarUsuarios();
});


