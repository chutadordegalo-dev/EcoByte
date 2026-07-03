document.addEventListener('DOMContentLoaded', () => {
    const formProdutoLoja = document.getElementById('form-produto-loja-direto');
    
    if (formProdutoLoja) {
        formProdutoLoja.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Lendo os inputs do formulário da loja
            const inputNome = document.getElementById('prod-loja-nome');
            const inputPreco = document.getElementById('prod-loja-preco');
            const inputQtd = document.getElementById('prod-loja-qtd');
            const inputImg = document.getElementById('prod-loja-img');

            if (!inputNome || !inputPreco || !inputQtd) {
                alert("Erro interno: Campos do formulário não foram localizados pelo script.");
                return;
            }

            // Monta o objeto exatamente igual ao que o backend espera receber
            const dadosProduto = {
                nome: inputNome.value.trim(),
                preco: parseFloat(inputPreco.value),
                quantidade: parseInt(inputQtd.value),
                imagem: inputImg && inputImg.value.trim() !== "" ? inputImg.value.trim() : 'img/default.png'
            };

            try {
                const resposta = await fetch('http://localhost:3000/api/admin/produtos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosProduto)
                });
                
                const resultado = await resposta.json();

                // Aceita tanto .sucesso quanto .success vindo do servidor para não quebrar por nada!
                if (resultado.sucesso || resultado.success) {
                    alert("🎉 Produto adicionado e salvo com sucesso no banco de dados!");
                    formProdutoLoja.reset(); 
                    
                    // Força a atualização da página para recarregar o banco de dados na tela
                    window.location.reload();
                } else {
                    alert("⚠️ Erro do Servidor: " + (resultado.erro || resultado.mensagem || "Erro desconhecido"));
                }
            } catch (err) {
                console.error("Erro ao enviar produto:", err);
                alert("❌ Falha ao conectar com o servidor. Verifique se deu 'node server.js' no terminal.");
            }
        });
    }
});