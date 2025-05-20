const express = require('express');
const path = require('path');  // Esse 'path' já foi declarado, removi a duplicação abaixo
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');  // Aqui estava tentando declarar o 'multer' em duplicidade
const app = express();
const PORT = 3000;

app.use(cors()); // Para facilitar testes locais
app.use(express.json());



// Serve arquivos estáticos
app.use('/login', express.static(path.join(__dirname, 'public', 'login')));
app.use('/presidente', express.static(path.join(__dirname, 'public', 'presidente')));
app.use('/coordenador', express.static(path.join(__dirname, 'public', 'coordenador')));
app.use('/membro', express.static(path.join(__dirname, 'public', 'membro')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve a pasta de uploads para acessar os arquivos

// Redireciona para login
app.get('/', (req, res) => {
    res.redirect('/login/index_login.html');
});

// Banco SQLite
const db = new sqlite3.Database(':memory:');

// Criando tabelas no banco de dados
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        role TEXT,
        sector TEXT,
        password TEXT
    )`);

    // Definição dos usuários fixos
    const users = [
        { name: 'Gabriel Callegari', email: 'gabrielcallegari@gsd.com', role: 'presidente', sector: 'Diretoria Geral', password: 'senha123' },
        { name: 'Maxine', email: 'maxine@gsd.com', role: 'vice-presidente', sector: 'Diretoria Geral', password: 'senha123' },
        { name: 'Maria Eduarda', email: 'mariaeduarda@gsd.com', role: 'coordenador', sector: 'Finanças', password: 'senha123' },
        { name: 'Arthur', email: 'arthur@gsd.com', role: 'coordenador', sector: 'Finanças', password: 'senha123' },
        { name: 'Mavi', email: 'mavi@gsd.com', role: 'coordenador', sector: 'Eventos', password: 'senha123' },
        { name: 'Estephani', email: 'estephani@gsd.com', role: 'coordenador', sector: 'Eventos', password: 'senha123' },
        { name: 'Isaque', email: 'isaque@gsd.com', role: 'coordenador', sector: 'Esportes', password: 'senha123' },
        { name: 'Muralha', email: 'muralha@gsd.com', role: 'coordenador', sector: 'Esportes', password: 'senha123' },
        { name: 'Suyane', email: 'suyane@gsd.com', role: 'coordenador', sector: 'Relações Sociais', password: 'senha123' },
        { name: 'Heloisa', email: 'heloisa@gsd.com', role: 'coordenador', sector: 'Relações Sociais', password: 'senha123' },
        { name: 'Vitoria', email: 'vitoria@gsd.com', role: 'membro', sector: 'Rádio GSD Mix', password: 'senha123' },
        { name: 'Yan', email: 'yan@gsd.com', role: 'membro', sector: 'Rádio GSD Mix', password: 'senha123' },
        { name: 'Wesley', email: 'wesley@gsd.com', role: 'membro', sector: 'Rádio GSD Mix', password: 'senha123' },
        { name: 'Davi', email: 'davi@gsd.com', role: 'membro', sector: 'Direitos Humanos', password: 'senha123' },
        { name: 'Lorrany', email: 'lorrany@gsd.com', role: 'membro', sector: 'Direitos Humanos', password: 'senha123' },
        { name: 'Isabela', email: 'isabela@gsd.com', role: 'membro', sector: 'Direitos Humanos', password: 'senha123' }
    ];

    const stmt = db.prepare("INSERT INTO users (name, email, role, sector, password) VALUES (?, ?, ?, ?, ?)");
    users.forEach(user => {
        stmt.run(user.name, user.email, user.role, user.sector, user.password);
    });
    stmt.finalize();

    // Criar a tabela de Relatórios
    db.run(`
        CREATE TABLE IF NOT EXISTS relatorios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT,
            descricao TEXT,
            usuario_id INTEGER,
            status TEXT DEFAULT 'pendente',  -- status pode ser: 'pendente', 'aprovado', 'recusado'
            observacoes TEXT,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario_id) REFERENCES users(id)
        )
    `);

    // Criar a tabela de Calendário
    db.run("CREATE TABLE IF NOT EXISTS calendario (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, data TEXT)");

    // Criar a tabela de Arquivos
    db.run(`
        CREATE TABLE IF NOT EXISTS arquivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            caminho TEXT,
            tipo TEXT,
            data_upload DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Criar a tabela de presença
    db.run(`
     CREATE TABLE IF NOT EXISTS presencas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  status TEXT,
  date TEXT,  -- Mudado para "date" para refletir a mudança no backend
  FOREIGN KEY(user_id) REFERENCES users(id)
);
    `);
});

// Endpoint para login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });
        if (!row) return res.status(401).json({ error: 'Credenciais inválidas' });

        res.json({
            message: 'Login bem-sucedido',
            user: { id: row.id, name: row.name, email: row.email, role: row.role, sector: row.sector }
        });
    });
});

// Rota para adicionar evento no calendário
app.post('/calendario', (req, res) => {
    const { titulo, data } = req.body;

    if (!titulo || !data) {
        return res.status(400).json({ error: 'Título e data são obrigatórios.' });
    }

    db.run('INSERT INTO calendario (titulo, data) VALUES (?, ?)', [titulo, data], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao salvar evento.' });
        }
        res.status(200).json({ message: 'Evento adicionado com sucesso!' });
    });
});

// Rota para buscar todos os eventos do calendário
app.get('/calendario', (req, res) => {
    db.all('SELECT * FROM calendario ORDER BY data ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar eventos.' });
        }
        res.json(rows);
    });
});

// Rota para enviar relatório
app.post('/relatorios', (req, res) => {
    const { titulo, descricao, usuario_id } = req.body;

    if (!titulo || !descricao || !usuario_id) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    db.run('INSERT INTO relatorios (titulo, descricao, usuario_id, status) VALUES (?, ?, ?, ?)',
        [titulo, descricao, usuario_id, 'pendente'], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao enviar relatório.' });
            }
            res.status(201).json({ message: 'Relatório enviado com sucesso!', id: this.lastID });
        });
});

// Listar relatórios pendentes para o presidente
app.get('/relatorios', (req, res) => {
    db.all('SELECT * FROM relatorios WHERE status = "pendente"', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar relatórios.' });
        }
        res.json(rows);
    });
});

// Aprovar/Recusar relatório com observação
app.put('/relatorios/:id', (req, res) => {
    const { status, observacoes } = req.body;
    const { id } = req.params;

    if (!status || !observacoes) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    db.run('UPDATE relatorios SET status = ?, observacoes = ? WHERE id = ?', [status, observacoes, id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar relatório.' });
        }
        res.json({ message: 'Relatório atualizado com sucesso.' });
    });
});

// Configuração do multer para salvar arquivos no servidor
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Rota para upload de arquivos
app.post('/arquivos', upload.single('arquivo'), (req, res) => {
    const { nome } = req.body;
    const { filename, mimetype } = req.file;

    const caminhoArquivo = `/uploads/${filename}`;
    const tipoArquivo = mimetype;

    const stmt = db.prepare('INSERT INTO arquivos (nome, caminho, tipo) VALUES (?, ?, ?)');
    stmt.run(nome, caminhoArquivo, tipoArquivo, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao salvar arquivo no banco de dados' });
        }

        res.status(200).json({ message: 'Arquivo enviado e salvo com sucesso!' });
    });
    stmt.finalize();
});


// Rota para listar arquivos
app.get('/arquivos', (req, res) => {
    db.all('SELECT * FROM arquivos', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar arquivos' });
        res.json(rows);
    });
});

// Rota para salvar a presença dos usuários
app.post('/presencas', (req, res) => {
  const { presencas, date } = req.body;  // Alinhei o nome do campo para "date"

  if (!presencas || !date) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  const stmt = db.prepare('INSERT INTO presencas (user_id, status, date) VALUES (?, ?, ?)');
  presencas.forEach(p => {
    stmt.run(p.user_id, p.status, date);  // Usei "date" para garantir consistência com o frontend
  });

  stmt.finalize();
  res.json({ message: 'Presenças registradas com sucesso!' });
});

// Rota para consultar as presenças por data
app.get('/presencas/:data_reuniao', (req, res) => {
  const { data_reuniao } = req.params;

  db.all('SELECT u.name, p.status FROM presencas p JOIN users u ON p.user_id = u.id WHERE p.data_reuniao = ?', [data_reuniao], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar presenças.' });
    res.json(rows);
  });
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
