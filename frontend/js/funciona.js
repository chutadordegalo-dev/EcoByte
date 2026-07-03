document.addEventListener('DOMContentLoaded', () => {
    const formProdutoLoja = document.getElementById('form-produto-loja-direto');
    const inputImg = document.getElementById('prod-loja-img');
    const imgPreview = document.getElementById('prod-loja-preview');
    
    let imagemBase64 = ""; // Variável para guardar a imagem convertida em texto

    // 1. Escuta quando o usuário escolhe uma foto do computador dele
    if (inputImg) {
        inputImg.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    imagemBase64 = event.target.result; // Armazena a string Base64 da imagem
                    if (imgPreview) {
                        imgPreview.src = event.target.result; // Mostra o preview da imagem
                        imgPreview.classList.remove('hidden'); // Torna o preview visível
                    }
                };
                
                reader.readAsDataURL(file); // Converte o arquivo para Base64
            }
        });
    }
    
    // 2. Envio do formulário direto da Loja
    if (formProdutoLoja) {
        formProdutoLoja.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const inputNome = document.getElementById('prod-loja-nome');
            const inputPreco = document.getElementById('prod-loja-preco');
            const inputQtd = document.getElementById('prod-loja-qtd');

            if (!inputNome || !inputPreco || !inputQtd) {
                alert("Erro interno: Campos do formulário não foram localizados pelo script.");
                return;
            }

            // Opcional: Obrigar a carregar imagem se você preferir
            if (!imagemBase64) {
                alert("⚠️ Por favor, selecione uma imagem para o produto antes de enviar.");
                return;
            }

            const dadosProduto = {
                nome: inputNome.value.trim(),
                preco: parseFloat(inputPreco.value),
                quantidade: parseInt(inputQtd.value),
                imagem: imagemBase64 // Enviando a string de texto da imagem!
            };

            try {
                const resposta = await fetch('http://localhost:3000/api/admin/produtos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosProduto)
                });
                
                const resultado = await resposta.json();

                if (resultado.sucesso) {
                    alert("🎉 Produto adicionado e salvo com sucesso no banco de dados!");
                    formProdutoLoja.reset(); 
                    if (imgPreview) imgPreview.classList.add('hidden'); // Esconde o preview
                    imagemBase64 = ""; // Limpa a variável
                    
                    // Atualiza a vitrine de produtos automaticamente
                    window.location.reload();
                } else {
                    alert("⚠️ Erro do Servidor: " + resultado.erro);
                }
            } catch (err) {
                console.error("Erro ao enviar produto:", err);
                alert("❌ Falha ao conectar com o servidor. Verifique o limite de tamanho ou o terminal do Node.js.");
            }
        });
    }
});