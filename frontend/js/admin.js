const API_URL = 'https://ecobyte-backend.up.railway.app/api';

// Envio do formulário de Produtos


// Envio do formulário de Pontos de Coleta
document.getElementById('form-ponto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        nome: document.getElementById('ponto-nome').value.trim(),
        endereco: document.getElementById('ponto-end').value.trim(),
        lat: parseFloat(document.getElementById('ponto-lat').value),
        lng: parseFloat(document.getElementById('ponto-lng').value)
    };

    try {
        const resposta = await fetch(`${API_URL}/admin/pontos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();

        if (resultado.sucesso) {
            alert("🎉 Novo ponto de coleta adicionado geograficamente!");
            document.getElementById('form-ponto').reset();
        } else {
            alert("⚠️ Erro: " + resultado.erro);
        }
    } catch (err) {
        alert("❌ Falha ao conectar com o servidor.");
    }
    const formDoacao = document.getElementById('form-doacao');
    if (formDoacao) {
        formDoacao.addEventListener('submit', async (e) => {
            e.preventDefault();

            const sessao = JSON.parse(localStorage.getItem('ecobyte_sessao'));
            const dados = {
                id_usuario: sessao ? sessao.id : null,
                item_doado: document.getElementById('doacao-item').value.trim(),
                quantidade: parseInt(document.getElementById('doacao-qtd').value)
            };

            try {
                const resposta = await fetch('https://ecobyte-backend.up.railway.app/api/doacoes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                const resultado = await resposta.json();

                if (resultado.sucesso) {
                    alert("💝 Obrigado! Sua intenção de doação foi registrada com sucesso.");
                    formDoacao.reset();
                } else {
                    alert("⚠️ Erro ao registrar doação: " + resultado.erro);
                }
            } catch (err) {
                console.error(err);
                alert("❌ Erro de conexão com o servidor.");
            }
        });
    }
    // ==========================================
    // FUNÇÃO PARA CARREGAR TODAS AS TABELAS
    // ==========================================
    async function carregarTabelasIniciais() {
        try {
            // 1. Carregar Classificações
            const resClassif = await fetch('https://ecobyte-backend.up.railway.app/api/residuos/classificar');
            const dadosClassif = await resClassif.json();
            const bodyClassif = document.getElementById('tabela-classificacoes-body');
            if(bodyClassif && Array.isArray(dadosClassif)) {
                bodyClassif.innerHTML = dadosClassif.length === 0 ? '<tr><td colspan="2" class="py-3 text-center text-gray-400">Nenhum registro.</td></tr>' : 
                dadosClassif.map(c => `
                    <tr>
                        <td class="py-2.5 font-medium">${c.material}</td>
                        <td class="py-2.5 text-right font-bold ${c.tipo_classificacao === 'Reutilizável' ? 'text-blue-600' : c.tipo_classificacao === 'Reciclável' ? 'text-green-600' : 'text-red-500'}">${c.tipo_classificacao}</td>
                    </tr>
                `).join('');
            }

            // 2. Carregar Doações
            const resDoacoes = await fetch('https://ecobyte-backend.up.railway.app/api/doacoes');
            const dadosDoacoes = await resDoacoes.json();
            const bodyDoacoes = document.getElementById('tabela-doacoes-body');
            if(bodyDoacoes && Array.isArray(dadosDoacoes)) {
                bodyDoacoes.innerHTML = dadosDoacoes.length === 0 ? '<tr><td colspan="3" class="py-3 text-center text-gray-400">Nenhuma doação.</td></tr>' : 
                dadosDoacoes.map(d => `
                    <tr>
                        <td class="py-2.5 font-medium">${d.item_doado}</td>
                        <td class="py-2.5 text-center">${d.quantidade}</td>
                        <td class="py-2.5 text-right"><span class="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">${d.status}</span></td>
                    </tr>
                `).join('');
            }

            // 3. Carregar Ranking de Mais Classificados
            const resRanking = await fetch('https://ecobyte-backend.up.railway.app/api/residuos/ranking');
            const dadosRanking = await resRanking.json();
            const bodyRanking = document.getElementById('tabela-ranking-body');
            if(bodyRanking && Array.isArray(dadosRanking)) {
                bodyRanking.innerHTML = dadosRanking.length === 0 ? '<tr><td colspan="2" class="py-3 text-center text-gray-400">Nenhum ranking.</td></tr>' : 
                dadosRanking.map((r, index) => `
                    <tr>
                        <td class="py-2.5 font-medium flex items-center gap-1.5">
                            <span class="font-bold text-gray-400">#${index + 1}</span> ${r.material}
                        </td>
                        <td class="py-2.5 text-right font-bold text-amber-600">${r.total}x</td>
                    </tr>
                `).join('');
            }

        } catch (error) {
            console.error("Erro ao carregar tabelas do painel ecológico:", error);
        }
    }
    

    // Executa a carga das tabelas assim que a página abrir
    carregarTabelasIniciais();
});
