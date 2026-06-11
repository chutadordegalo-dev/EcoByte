// Configuração de cores e temas customizados do Tailwind
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'eco-dark': '#314E3F',
                'eco-light': '#A1B59C',
                'eco-blue': '#4B6A7F',
                'eco-bg': '#F9FAFB',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        }
    }
};

let modoAuthIndex = "login";

document.addEventListener("DOMContentLoaded", () => {
    // Menu Hambúrguer Mobile - Atualizado com controle de ícone e sem transparência
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            const icone = menuBtn.querySelector('i');
            
            if (mobileMenu.classList.contains('hidden')) {
                icone.className = "fa-solid fa-bars";
            } else {
                icone.className = "fa-solid fa-xmark";
            }
        });
        
        // Fecha o menu móvel ao clicar em qualquer link interno e resgata o ícone original
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuBtn.querySelector('i').className = "fa-solid fa-bars";
            });
        });
    }

    // --- SEU MAPA REESTILIZADO COM LISTA LATERAL E MECANISMO DE BUSCA ---
    const map = L.map('map').setView([-19.9317, -44.0536], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Lista atualizada com 4 pontos de coleta na região de Contagem com endereços incluídos
    const pontos = [
        { nome: "EcoByte Central - Eldorado", endereco: "Av. João César de Oliveira, 1200", lat: -19.9350, lng: -44.0450 },
        { nome: "Ponto Parceiro - Centro Contagem", endereco: "Praça Silviano Brandão, 45", lat: -19.9320, lng: -44.0600 },
        { nome: "Ecoponto Shopping - Cabral", endereco: "Alameda dos Sabiás, 80", lat: -19.9150, lng: -44.0250 },
        { nome: "EcoByte Posto Reciclagem - Industrial", endereco: "Av. General David Sarnoff, 3000", lat: -19.9525, lng: -44.0280 }
    ];

    const marcadores = [];
    const containerLista = document.getElementById('lista-pontos-lateral');

    // Função para renderizar e sincronizar a lista lateral e os marcadores
    function renderizarPontos(termo = "") {
        if (containerLista) containerLista.innerHTML = "";

        pontos.forEach(p => {
            const correspondeBusca = p.nome.toLowerCase().includes(termo) || p.endereco.toLowerCase().includes(termo);

            if (correspondeBusca) {
                let markerObj = marcadores.find(m => m.nome === p.nome.toLowerCase());
                let markerInstance;
                
                if (!markerObj) {
                    markerInstance = L.marker([p.lat, p.lng]).addTo(map)
                        .bindPopup(`<strong style="color:#314E3F">${p.nome}</strong><br>${p.endereco}<br><span style="font-size:11px; color:#4B6A7F;">Descarte seus eletrônicos aqui!</span>`);
                    marcadores.push({ instancia: markerInstance, nome: p.nome.toLowerCase() });
                } else {
                    markerInstance = markerObj.instancia;
                    markerInstance.addTo(map);
                }

                if (containerLista) {
                    const card = document.createElement('div');
                    card.className = "p-3.5 bg-gray-50 hover:bg-eco-dark/10 border border-gray-100 rounded-xl cursor-pointer transition-all flex flex-col gap-1 shadow-xs";
                    card.innerHTML = `
                        <h5 class="font-bold text-sm text-eco-dark"><i class="fa-solid fa-location-dot text-eco-blue mr-1.5"></i>${p.nome}</h5>
                        <p class="text-xs text-gray-500 pl-4">${p.endereco}</p>
                    `;
                    
                    card.addEventListener('click', () => {
                        map.setView([p.lat, p.lng], 15);
                        markerInstance.openPopup();
                    });

                    containerLista.appendChild(card);
                }
            } else {
                let markerObj = marcadores.find(m => m.nome === p.nome.toLowerCase());
                if (markerObj) {
                    map.removeLayer(markerObj.instancia);
                }
            }
        });

        if (containerLista && containerLista.children.length === 0) {
            containerLista.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">Nenhum ponto encontrado.</p>`;
        }
    }

    // Inicializa a renderização estruturada dos pontos
    renderizarPontos();

    // Filtro de Busca em Tempo Real integrado
    const inputBusca = document.getElementById('busca-ponto');
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            const termoBusca = e.target.value.toLowerCase().trim();
            renderizarPontos(termoBusca);
        });
    }

    atualizarInterfaceUsuario();
});

// --- ENGENHARIA DE AUTENTICAÇÃO DINÂMICA ---
function atualizarInterfaceUsuario() {
    const usuarioLogado = JSON.parse(localStorage.getItem('ecobyte_sessao'));
    const wrapperDesktop = document.getElementById('area-auth-index');
    const wrapperMobile = document.getElementById('area-auth-index-mobile');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuBtn = document.getElementById('menu-btn');

    if (wrapperDesktop) {
        if (usuarioLogado) {
            wrapperDesktop.innerHTML = `
                <a href="perfil.html" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="${usuarioLogado.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3'}" class="w-8 h-8 rounded-full object-cover border border-eco-light" alt="Avatar">
                    <span class="text-xs font-bold text-eco-dark">Meu Perfil</span>
                </a>
            `;
        } else {
            wrapperDesktop.innerHTML = `
                <button onclick="abrirLogin()" class="bg-eco-dark text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-eco-blue transition-colors shadow-sm focus:outline-none">Entrar / Cadastrar</button>
            `;
        }
    }

    if (wrapperMobile) {
        if (usuarioLogado) {
            wrapperMobile.innerHTML = `
                <a href="perfil.html" class="flex items-center gap-2 hover:opacity-80 transition-opacity py-1">
                    <img src="${usuarioLogado.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3'}" class="w-7 h-7 rounded-full object-cover border border-eco-light">
                    <span class="text-sm font-bold text-eco-dark">Meu Perfil (${usuarioLogado.nome.split(' ')[0]})</span>
                </a>
                <button onclick="realizarLogoutPaginaInicial(); if(document.getElementById('mobile-menu')) document.getElementById('mobile-menu').classList.add('hidden'); if(document.getElementById('menu-btn')) document.getElementById('menu-btn').querySelector('i').className = 'fa-solid fa-bars';" class="text-red-500 text-sm font-bold text-left flex items-center gap-2 py-1 focus:outline-none">
                    <i class="fa-solid fa-power-off"></i> Sair da Conta
                </button>
            `;
        } else {
            wrapperMobile.innerHTML = `
                <button onclick="abrirLogin(); if(document.getElementById('mobile-menu')) document.getElementById('mobile-menu').classList.add('hidden'); if(document.getElementById('menu-btn')) document.getElementById('menu-btn').querySelector('i').className = 'fa-solid fa-bars';" class="w-full bg-eco-dark text-white text-sm font-bold py-2.5 rounded-xl hover:bg-eco-blue transition-colors text-center shadow-sm focus:outline-none">Entrar / Cadastrar</button>
            `;
        }
    }
}

window.realizarLogoutPaginaInicial = function() {
    localStorage.removeItem('ecobyte_sessao');
    atualizarInterfaceUsuario();
    alert("Sessão finalizada com sucesso!");
};

window.abrirLogin = function() {
    const modal = document.getElementById('modal-auth');
    const card = document.getElementById('card-auth');
    if (modal && card) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('opacity-100');
            card.classList.remove('scale-95');
        }, 10);
    }
};

window.fecharLogin = function() {
    const modal = document.getElementById('modal-auth');
    const card = document.getElementById('card-auth');
    if (modal && card) {
        modal.classList.remove('opacity-100');
        card.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

window.alternarModoIndex = function() {
    const inputNome = document.getElementById('campo-nome-index');
    const tito = document.getElementById('auth-titulo');
    const sub = document.getElementById('auth-subtitulo');
    const subBtn = document.getElementById('btn-submit');
    const altTex = document.getElementById('alternar-texto');

    if (modoAuthIndex === "login") {
        modoAuthIndex = "cadastro";
        inputNome.classList.remove('hidden');
        document.getElementById('auth-nome').required = true;
        tito.innerText = "Crie sua Conta";
        sub.innerText = "Inscreva-se na plataforma EcoByte";
        subBtn.innerText = "Cadastrar";
        altTex.innerHTML = `Já possui uma conta? <button type="button" onclick="alternarModoIndex()" class="text-eco-dark font-bold hover:underline focus:outline-none">Entre aqui</button>`;
    } else {
        modoAuthIndex = "login";
        inputNome.classList.add('hidden');
        document.getElementById('auth-nome').required = false;
        tito.innerText = "Acesse sua Conta";
        sub.innerText = "Monitore seus pontos e coletas";
        subBtn.innerText = "Entrar";
        altTex.innerHTML = `Não tem uma conta? <button type="button" onclick="alternarModoIndex()" class="text-eco-dark font-bold hover:underline focus:outline-none">Cadastre-se</button>`;
    }
};

const authForm = document.getElementById('authForm');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const senha = document.getElementById('auth-senha').value;
        
        if (modoAuthIndex === "cadastro") {
            const nome = document.getElementById('auth-nome').value.trim();
            try {
                const resposta = await fetch('http://localhost:3000/api/auth/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha })
                });
                const dados = await resposta.json();
                if (dados.sucesso) {
                    alert('🎉 Conta cadastrada com sucesso! Faça login para continuar.');
                    alternarModoIndex();
                    authForm.reset();
                } else {
                    alert(`❌ ${dados.mensagem}`);
                }
            } catch (err) {
                alert('❌ Erro ao conectar com o servidor.');
            }
        } else {
            try {
                const resposta = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const dados = await resposta.json();
                
                if (dados.sucesso) {
                    alert(`🎉 Bem-vindo de volta, ${dados.usuario.nome}!`);
                    localStorage.setItem('ecobyte_sessao', JSON.stringify(dados.usuario));
                    fecharLogin();
                    authForm.reset();
                    atualizarInterfaceUsuario();
                    window.location.href = "perfil.html";
                } else {
                    alert(`❌ ${dados.mensagem}`);
                }
            } catch (err) {
                alert('❌ Erro ao conectar com o servidor.');
            }
        }
    });
}

// Integração do formulário de Cotações Ampliado
const cotacaoForm = document.getElementById('cotacaoForm');
if (cotacaoForm) {
    cotacaoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dadosCotacao = {
            nome: document.getElementById('cotacao-nome').value.trim(),
            email: document.getElementById('cotacao-email').value.trim(),
            contato: document.getElementById('cotacao-contato').value.trim(),
            endereco: document.getElementById('cotacao-endereco').value.trim(),
            descricao: document.getElementById('cotacao-descricao').value.trim()
        };

        try {
            const resposta = await fetch('http://localhost:3000/api/cotacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCotacao)
            });
            if (resposta.ok) {
                alert("🎉 Solicitação de coleta corporativa enviada e salva com sucesso!");
                cotacaoForm.reset();
            } else {
                alert("⚠️ Erro ao processar formulário no servidor.");
            }
        } catch (err) {
            alert("❌ Erro de rede ao enviar solicitação.");
        }
    });
}