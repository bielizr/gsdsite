const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors()); // Para facilitar testes locais
app.use(express.json());

// Servir arquivos estáticos
app.use('/login', express.static(path.join(__dirname, 'public', 'login')));
app.use('/presidente', express.static(path.join(__dirname, 'public', 'presidente')));

// Redireciona para login
app.get('/', (req, res) => {
    res.redirect('/login/index_login.html');
});

// Banco SQLite
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    // Criar tabelas
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        role TEXT,
        sector TEXT,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS presencas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT,
        status TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comissoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        tipo TEXT,
        responsavel_id INTEGER,
        FOREIGN KEY(responsavel_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comissoes_membros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comissao_id INTEGER,
        user_id INTEGER,
        FOREIGN KEY(comissao_id) REFERENCES comissoes(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS enquetes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS enquetes_opcoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enquete_id INTEGER,
        texto TEXT,
        votos INTEGER DEFAULT 0,
        FOREIGN KEY(enquete_id) REFERENCES enquetes(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS enquetes_votos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enquete_id INTEGER,
        opcao_id INTEGER,
        user_id INTEGER,
        FOREIGN KEY(enquete_id) REFERENCES enquetes(id),
        FOREIGN KEY(opcao_id) REFERENCES enquetes_opcoes(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Inserir usuários
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
        { name: 'Isabela', email: 'isabela@gsd.com', role: 'membro', sector: 'Direitos Humanos', password: 'senha123' },
    ];

    const stmt = db.prepare("INSERT INTO users (name, email, role, sector, password) VALUES (?, ?, ?, ?, ?)");
    users.forEach(user => {
        stmt.run(user.name, user.email, user.role, user.sector, user.password);
    });
    stmt.finalize();
});

// Login
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

// Buscar usuários (para presença e comissões)
app.get('/users', (req, res) => {
    db.all("SELECT id, name, email, role, sector FROM users ORDER BY name", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar usuários' });
        res.json(rows);
    });
});

// Marcar presença (date no formato YYYY-MM-DD)
app.post('/presencas', (req, res) => {
    const { date, presencas } = req.body; // presencas: [{ user_id, status }]
    if (!date || !presencas) return res.status(400).json({ error: 'Dados incompletos' });

    // Inserir ou atualizar presenças
    const insert = db.prepare(`INSERT INTO presencas (user_id, date, status) VALUES (?, ?, ?)`);
    const update = db.prepare(`UPDATE presencas SET status = ? WHERE user_id = ? AND date = ?`);

    presencas.forEach(p => {
        db.get("SELECT * FROM presencas WHERE user_id = ? AND date = ?", [p.user_id, date], (err, row) => {
            if (row) {
                update.run(p.status, p.user_id, date);
            } else {
                insert.run(p.user_id, date, p.status);
            }
        });
    });

    insert.finalize();
    update.finalize();

    res.json({ message: 'Presenças registradas com sucesso' });
});

// Buscar presença por data
app.get('/presencas/:date', (req, res) => {
    const date = req.params.date;
    db.all(`SELECT p.user_id, p.status, u.name FROM presencas p JOIN users u ON p.user_id = u.id WHERE date = ?`, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar presenças' });
        res.json(rows);
    });
});

// Comissões - criar
app.post('/comissoes', (req, res) => {
    const { nome, tipo, responsavel_id, membros } = req.body; // membros: [user_id,...]
    if (!nome || !tipo || !responsavel_id) return res.status(400).json({ error: 'Dados incompletos' });

    db.run(`INSERT INTO comissoes (nome, tipo, responsavel_id) VALUES (?, ?, ?)`, [nome, tipo, responsavel_id], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao criar comissão' });
        const comissao_id = this.lastID;

        if (!membros || membros.length === 0) return res.json({ message: 'Comissão criada', comissao_id });

        const stmt = db.prepare(`INSERT INTO comissoes_membros (comissao_id, user_id) VALUES (?, ?)`);
        membros.forEach(u => stmt.run(comissao_id, u));
        stmt.finalize();

        res.json({ message: 'Comissão criada com membros', comissao_id });
    });
});

// Buscar comissões com membros e responsáveis
app.get('/comissoes', (req, res) => {
    db.all(`SELECT c.id, c.nome, c.tipo, c.responsavel_id, u.name as responsavel_nome
            FROM comissoes c
            LEFT JOIN users u ON c.responsavel_id = u.id`, [], (err, comissoes) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar comissões' });

        // Para cada comissão, buscar membros
        const promises = comissoes.map(c => {
            return new Promise((resolve) => {
                db.all(`SELECT u.id, u.name FROM comissoes_membros cm JOIN users u ON cm.user_id = u.id WHERE cm.comissao_id = ?`, [c.id], (err, membros) => {
                    c.membros = membros || [];
                    resolve();
                });
            });
        });

        Promise.all(promises).then(() => res.json(comissoes));
    });
});

// Criar enquete com opções
app.post('/enquetes', (req, res) => {
    const { titulo, opcoes } = req.body; // opcoes: [texto,...]
    if (!titulo || !opcoes || opcoes.length === 0) return res.status(400).json({ error: 'Dados incompletos' });

    db.run(`INSERT INTO enquetes (titulo) VALUES (?)`, [titulo], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao criar enquete' });
        const enquete_id = this.lastID;

        const stmt = db.prepare(`INSERT INTO enquetes_opcoes (enquete_id, texto) VALUES (?, ?)`);
        opcoes.forEach(op => stmt.run(enquete_id, op));
        stmt.finalize();

        res.json({ message: 'Enquete criada', enquete_id });
    });
});

// Listar enquetes com opções
app.get('/enquetes', (req, res) => {
    db.all(`SELECT * FROM enquetes`, [], (err, enquetes) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar enquetes' });

        const promises = enquetes.map(e => {
            return new Promise((resolve) => {
                db.all(`SELECT id, texto, votos FROM enquetes_opcoes WHERE enquete_id = ?`, [e.id], (err, opcoes) => {
                    e.opcoes = opcoes || [];
                    resolve();
                });
            });
        });

        Promise.all(promises).then(() => res.json(enquetes));
    });
});

// Votar numa enquete
app.post('/enquetes/votar', (req, res) => {
    const { enquete_id, opcao_id, user_id } = req.body;
    if (!enquete_id || !opcao_id || !user_id) return res.status(400).json({ error: 'Dados incompletos' });

    // Verifica se já votou
    db.get(`SELECT * FROM enquetes_votos WHERE enquete_id = ? AND user_id = ?`, [enquete_id, user_id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });
        if (row) return res.status(400).json({ error: 'Usuário já votou nessa enquete' });

        // Inserir voto
        db.run(`INSERT INTO enquetes_votos (enquete_id, opcao_id, user_id) VALUES (?, ?, ?)`, [enquete_id, opcao_id, user_id], function(err) {
            if (err) return res.status(500).json({ error: 'Erro ao registrar voto' });

            // Incrementar votos da opção
            db.run(`UPDATE enquetes_opcoes SET votos = votos + 1 WHERE id = ?`, [opcao_id], (err) => {
                if (err) return res.status(500).json({ error: 'Erro ao atualizar votos' });
                res.json({ message: 'Voto registrado com sucesso' });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
