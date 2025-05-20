document.addEventListener('DOMContentLoaded', function() {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const navLinks = document.querySelectorAll('.nav-link');
    const pageTitle = document.getElementById('page-title');
    
    // Função para mostrar o dashboard (painel principal) de acordo com o papel do usuário
    function showDashboard(userRole) {
        loginScreen.style.display = 'none'; // Esconde a tela de login
        dashboard.style.display = 'block';  // Exibe o painel principal

        // Configurar o título e as funcionalidades de acordo com o papel do usuário
        if (userRole === 'presidente') {
            pageTitle.textContent = 'Painel do Presidente';
        } else if (userRole === 'coordenador') {
            pageTitle.textContent = 'Painel do Coordenador';
        } else {
            pageTitle.textContent = 'Painel do Membro';
        }
    }

    // Lógica para o envio do formulário de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Envia os dados para o back-end
        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Login bem-sucedido') {
                // Exibe o painel principal após login
                showDashboard(data.user.role);
            } else {
                alert('Credenciais inválidas');
            }
        })
        .catch(error => console.error('Erro:', error));
    });

    // Navegação entre as seções do painel
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.add('hidden');
            });
            document.getElementById(`${target}-content`).classList.remove('hidden');
        });
    });

    // Exibe a tela de login quando a página for carregada
    loginScreen.style.display = 'flex';  // Garante que a tela de login seja visível
    dashboard.style.display = 'none';    // Garante que o painel principal esteja oculto inicialmente
});
