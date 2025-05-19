// presidente.js
document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  function switchTab(name) {
    tabs.forEach(t => t.dataset.tab === name ? t.classList.add('active') : t.classList.remove('active'));
    contents.forEach(c => c.id === name ? c.classList.remove('hidden') : c.classList.add('hidden'));
  }

  switchTab('presenca');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // ------- PRESENÇA -------

  const dataInput = document.getElementById('presenca-data');
  const btnCarregarPresenca = document.getElementById('btn-carregar-presenca');
  const formPresenca = document.getElementById('form-presenca');
  const btnSalvarPresenca = document.getElementById('btn-salvar-presenca');
  const presencaMsg = document.getElementById('presenca-msg');

  let usuarios = [];

  // Buscar usuários para lista
  async function carregarUsuarios() {
    const res = await fetch('http://localhost:3000/users');
    usuarios = await res.json();
  }

  // Montar lista de presença com checkboxes
  function montarListaPresenca(presencasDoDia = []) {
    formPresenca.innerHTML = '';
    usuarios.forEach(u => {
      const presenca = presencasDoDia.find(p => p.user_id === u.id);
      const status = presenca ? presenca.status : 'ausente';

      const div = document.createElement('div');
      div.className = 'flex items-center space-x-4 bg-white p-2 rounded shadow';

      div.innerHTML = `
        <span class="flex-1">${u.name} (${u.sector})</span>
        <label class="flex items-center space-x-2">
          <input type="radio" name="presenca-${u.id}" value="presente" ${status==='presente'?'checked':''} />
          <span>Presente</span>
        </label>
        <label class="flex items-center space-x-2">
          <input type="radio" name="presenca-${u.id}" value="ausente" ${status==='ausente'?'checked':''} />
          <span>Ausente</span>
        </label>
      `;
      formPresenca.appendChild(div);
    });
  }

  // Carregar presenças do dia
  btnCarregarPresenca.addEventListener('click', async () => {
    if (!dataInput.value) {
      alert('Selecione uma data');
      return;
    }
    const res = await fetch(`http://localhost:3000/presencas/${dataInput.value}`);
    const presencas = await res.json();
    montarListaPresenca(presencas);
    presencaMsg.textContent = '';
  });

  // Salvar presenças
  btnSalvarPresenca.addEventListener('click', async () => {
    if (!dataInput.value) {
      alert('Selecione uma data');
      return;
    }

    const presencas = usuarios.map(u => {
      const radios = document.getElementsByName(`presenca-${u.id}`);
      let status = 'ausente';
      for (const r of radios) {
        if (r.checked) {
          status = r.value;
          break;
        }
      }
      return { user_id: u.id, status };
    });

    const res = await fetch('http://localhost:3000/presencas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dataInput.value, presencas })
    });

    if (res.ok) {
      presencaMsg.textContent = 'Presenças salvas com sucesso!';
    } else {
      presencaMsg.textContent = 'Erro ao salvar presença.';
    }
  });

  // Inicializa usuários ao carregar a página
  carregarUsuarios();

 // ------- COMISSÕES -------

const formCriarComissao = document.getElementById('form-criar-comissao');
const selectResponsavel = document.getElementById('comissao-responsavel');
const divMembros = document.getElementById('comissao-membros');
const listaComissoes = document.getElementById('lista-comissoes');

// Montar selects para responsáveis e membros (membros como multi-select)
function montarSelectsUsuarios() {
  // Limpar selects
  selectResponsavel.innerHTML = '<option value="">Selecione</option>';
  divMembros.innerHTML = '';

  usuarios.forEach(u => {
    // Responsável - select simples
    const option = document.createElement('option');
    option.value = u.id;
    option.textContent = `${u.name} (${u.sector})`;
    selectResponsavel.appendChild(option);
  });

  // Membros - select múltiplo
  const selectMembros = document.createElement('select');
  selectMembros.id = 'comissao-membros-multi';
  selectMembros.multiple = true;
  selectMembros.className = 'w-full p-2 border rounded h-48';

  usuarios.forEach(u => {
    const option = document.createElement('option');
    option.value = u.id;
    option.textContent = `${u.name} (${u.sector})`;
    selectMembros.appendChild(option);
  });

  divMembros.appendChild(selectMembros);
}

// Criar comissão via API
formCriarComissao.addEventListener('submit', async e => {
  e.preventDefault();
  const nome = document.getElementById('comissao-nome').value.trim();
  const tipo = document.getElementById('comissao-tipo').value;
  const responsavel_id = selectResponsavel.value;
  const selectMembros = document.getElementById('comissao-membros-multi');
  const membros = Array.from(selectMembros.selectedOptions).map(opt => parseInt(opt.value));

  if (!nome || !tipo || !responsavel_id) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  const res = await fetch('http://localhost:3000/comissoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, tipo, responsavel_id: parseInt(responsavel_id), membros })
  });

  if (res.ok) {
    alert('Comissão criada com sucesso!');
    formCriarComissao.reset();
    carregarComissoes();
  } else {
    alert('Erro ao criar comissão.');
  }
});

// Carregar e mostrar comissões
async function carregarComissoes() {
  const res = await fetch('http://localhost:3000/comissoes');
  const comissoes = await res.json();

  listaComissoes.innerHTML = '';
  if (comissoes.length === 0) {
    listaComissoes.innerHTML = '<p class="text-gray-600">Nenhuma comissão criada.</p>';
    return;
  }

  comissoes.forEach(c => {
    const div = document.createElement('div');
    div.className = 'bg-white p-4 rounded shadow';

    div.innerHTML = `
      <h3 class="font-bold text-lg">${c.nome} <span class="text-sm text-gray-500">(${c.tipo})</span></h3>
      <p><strong>Responsável:</strong> ${c.responsavel_nome || 'Não definido'}</p>
      <p><strong>Membros:</strong> ${c.membros.map(m => m.name).join(', ') || 'Nenhum'}</p>
    `;

    listaComissoes.appendChild(div);
  });
}

// Inicializar selects e lista comissões
montarSelectsUsuarios();
carregarComissoes();

  // ------- ENQUETES -------

  const formCriarEnquete = document.getElementById('form-criar-enquete');
  const listaEnquetes = document.getElementById('lista-enquetes');

  formCriarEnquete.addEventListener('submit', async e => {
    e.preventDefault();
    const titulo = document.getElementById('enquete-titulo').value.trim();
    const opcoesRaw = document.getElementById('enquete-opcoes').value.trim();
    if (!titulo || !opcoesRaw) {
      alert('Preencha título e opções.');
      return;
    }

    const opcoes = opcoesRaw.split(',').map(o => o.trim()).filter(o => o);

    const res = await fetch('http://localhost:3000/enquetes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, opcoes })
    });

    if (res.ok) {
      alert('Enquete criada!');
      formCriarEnquete.reset();
      carregarEnquetes();
    } else {
      alert('Erro ao criar enquete.');
    }
  });

  // Mostrar enquetes
  async function carregarEnquetes() {
    const res = await fetch('http://localhost:3000/enquetes');
    const enquetes = await res.json();

    listaEnquetes.innerHTML = '';
    if (enquetes.length === 0) {
      listaEnquetes.innerHTML = '<p class="text-gray-600">Nenhuma enquete criada.</p>';
      return;
    }

    enquetes.forEach(enquete => {
      const div = document.createElement('div');
      div.className = 'bg-white p-4 rounded shadow';

      let opcoesHtml = '';
      enquete.opcoes.forEach(opcao => {
        opcoesHtml += `
          <label class="flex items-center space-x-2 mb-1 cursor-pointer">
            <input type="radio" name="enquete-${enquete.id}" value="${opcao.id}" />
            <span>${opcao.texto} (${opcao.votos} votos)</span>
          </label>`;
      });

      div.innerHTML = `
        <h3 class="font-bold text-lg mb-2">${enquete.titulo}</h3>
        <form data-enquete-id="${enquete.id}" class="form-votar-enquete">
          ${opcoesHtml}
          <button type="submit" class="bg-yellow-500 hover:bg-yellow-400 text-white px-4 py-1 rounded mt-2">Votar</button>
        </form>
      `;

      listaEnquetes.appendChild(div);
    });

    // Adicionar listeners para votação
    document.querySelectorAll('.form-votar-enquete').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const enqueteId = parseInt(form.dataset.enqueteId);
        const opcaoId = form.querySelector('input[type="radio"]:checked')?.value;
        if (!opcaoId) {
          alert('Selecione uma opção para votar.');
          return;
        }

        // Aqui você deve passar o user_id do usuário logado, vamos usar 1 para teste
        const user_id = 1;

        const res = await fetch('http://localhost:3000/enquetes/votar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enquete_id: enqueteId, opcao_id: parseInt(opcaoId), user_id })
        });

        if (res.ok) {
          alert('Voto registrado!');
          carregarEnquetes();
        } else {
          const json = await res.json();
          alert(json.error || 'Erro ao registrar voto.');
        }
      });
    });
  }

  carregarEnquetes();
});
