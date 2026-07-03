const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Configuração da Criptografia para o Cartão de Crédito
const ALGORITMO_CARTAO = 'aes-256-cbc';
const CHAVE_SECRETA_CARTAO = crypto.scryptSync('SuaPalavraChaveMuitoSeguraEcoByte', 'salt', 32); 
const IV_CARTAO = crypto.randomBytes(16); 

function criptografarCartao(dados) {
    const cipher = crypto.createCipheriv(ALGORITMO_CARTAO, CHAVE_SECRETA_CARTAO, IV_CARTAO);
    let encrypted = cipher.update(JSON.stringify(dados), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

app.use(cors()); 
app.use(express.json());

// Conexão com o banco de dados MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecobyte_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro ao conectar no Banco de Dados:', err.message);
    } else {
        console.log('🚀 Conectado com sucesso ao Banco de Dados da EcoByte!');
        connection.release();
    }
});

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO E USUÁRIOS
// ==========================================

app.post('/api/auth/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ sucesso: false, erro: "Campos obrigatórios ausentes" });

    try {
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
        db.query(sql, [nome, email, senhaCriptografada], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ sucesso: false, erro: "E-mail já cadastrado." });
                }
                return res.status(500).json({ sucesso: false, erro: err.message });
            }
            res.status(201).json({ sucesso: true, id: result.insertId, nome, email });
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro interno no servidor." });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        if (results.length === 0) return res.status(401).json({ sucesso: false, erro: "Usuário ou senha inválidos." });

        const usuario = results[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) return res.status(401).json({ sucesso: false, erro: "Usuário ou senha inválidos." });

        res.json({
            sucesso: true,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, foto: usuario.foto }
        });
    });
});

// ==========================================
// 2. ROTAS DA LOJA E PRODUTOS (CRIAR E BUSCAR)
// ==========================================

// BUSCAR PRODUTOS (O que faz puxar a vitrine e a quantidade)
app.get('/api/produtos', (req, res) => {
    const query = "SELECT * FROM produtos ORDER BY id DESC";
    db.query(query, (err, resultados) => {
        if (err) {
            console.error("Erro ao buscar produtos no MySQL:", err.message);
            return res.status(500).json({ sucesso: false, erro: "Erro ao buscar produtos." });
        }
        res.json(resultados);
    });
});

// CRIAR NOVO PRODUTO (Esta rota resolve o seu problema!)
// Ela responde tanto para o /api/admin/produtos que o funciona.js e admin.js chamam
app.post('/api/admin/produtos', (req, res) => {
    const { nome, preco, quantidade, imagem } = req.body;

    // Validação para não deixar salvar se faltar dados importantes
    if (!nome || preco === undefined || quantidade === undefined) {
        return res.status(400).json({ sucesso: false, erro: "Por favor, preencha o nome, preço e a quantidade!" });
    }

    const query = "INSERT INTO produtos (nome, preco, quantidade, imagem) VALUES (?, ?, ?, ?)";
    const imagemFinal = imagem && imagem.trim() !== "" ? imagem.trim() : 'img/default.png';

    db.query(query, [nome, preco, quantidade, imagemFinal], (err, resultado) => {
        if (err) {
            console.error("❌ Erro ao inserir produto no MySQL:", err.message);
            return res.status(500).json({ sucesso: false, erro: "Erro ao salvar o produto no banco de dados: " + err.message });
        }
        
        console.log(`🎉 Produto '${nome}' criado com sucesso no ID: ${resultado.insertId}`);
        // Retorna "sucesso: true" exatamente como o seu frontend espera no "if (resultado.sucesso)"
        res.json({ 
            sucesso: true, 
            mensagem: "Produto cadastrado com sucesso no estoque!", 
            id: resultado.insertId 
        });
    });
});

// ==========================================
// 3. ROTAS DE PEDIDOS E HISTÓRICO
// ==========================================

app.post('/api/pedidos', (req, res) => {
    const { id_usuario, total, frete, metodo_pagamento, itens, produtos, detalhes_cartao } = req.body;
    const listaItens = itens || produtos;

    if (!listaItens || !Array.isArray(listaItens) || listaItens.length === 0) {
        return res.status(400).json({ sucesso: false, erro: "O pedido não possui itens válidos." });
    }

    let pixCopiaECola = null;
    let boletoCodigo = null;
    let cartaoCriptografado = null;

    if (metodo_pagamento === 'Pix') {
        pixCopiaECola = `00020101021126330014br.gov.bcb.pix0111ecobytepix5204000053039865405${total}5802BR5915EcoByte6009SaoPaulo62070503***6304ABCD`;
    } else if (metodo_pagamento === 'Boleto' || metodo_pagamento === 'Boleto Bancário') {
        boletoCodigo = `34191.79001 01043.513184 91020.150008 7 987600000${total.toString().replace('.', '')}`;
    } else if (metodo_pagamento === 'Cartão de Crédito' && detalhes_cartao) {
        cartaoCriptografado = criptografarCartao(detalhes_cartao);
    }

    const queryPedido = "INSERT INTO pedidos (id_usuario, total, frete, metodo_pagamento, pix_copia_e_cola, boleto_codigo, cartao_dados_criptografados) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(queryPedido, [id_usuario, total, frete, metodo_pagamento, pixCopiaECola, boletoCodigo, cartaoCriptografado], (err, resultPedido) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });

        const idPedidoInserido = resultPedido.insertId;

        db.query("SELECT id, nome FROM produtos", (errProd, produtosBanco) => {
            if (errProd) return res.status(500).json({ sucesso: false, erro: "Erro ao ler produtos." });

            listaItens.forEach(item => {
                const produtoCorrespondente = produtosBanco.find(p => 
                    p.id === Number(item.id) || 
                    (p.nome && item.nome && p.nome.trim().toLowerCase() === item.nome.trim().toLowerCase())
                );
                
                if (produtoCorrespondente) {
                    const queryItens = "INSERT INTO pedido_itens (id_pedido, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)";
                    db.query(queryItens, [idPedidoInserido, produtoCorrespondente.id, item.quantidade || 1, item.preco], (errIten) => {
                        if (!errIten) {
                            db.query("UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?", [item.quantidade || 1, produtoCorrespondente.id]);
                        }
                    });
                }
            });

            res.json({
                sucesso: true,
                mensagem: "Pedido gravado com sucesso!",
                id_pedido: idPedidoInserido,
                pix: pixCopiaECola,
                boleto: boletoCodigo
            });
        });
    });
});

// ==========================================
// 4. ROTAS DE PONTOS DE COLETA (ADMIN)
// ==========================================

// Rota POST que aceita a criação vinda do admin.js (/api/admin/pontos)
app.post('/api/admin/pontos', (req, res) => {
    const { nome, endereco, lat, lng } = req.body;

    if (!nome || !endereco || lat === undefined || lng === undefined) {
        return res.status(400).json({ sucesso: false, erro: "Todos os campos do ponto são obrigatórios." });
    }

    // Nota: Seu banco.sql cria a tabela como 'pontos_coleta'
    const sql = "INSERT INTO pontos_coleta (nome, endereco, lat, lng) VALUES (?, ?, ?, ?)";
    db.query(sql, [nome, endereco, lat, lng], (err, result) => {
        if (err) {
            console.error("Erro ao inserir ponto:", err.message);
            return res.status(500).json({ sucesso: false, erro: err.message });
        }
        res.json({ sucesso: true, mensagem: "Novo ponto de coleta adicionado geograficamente!", idInserido: result.insertId });
    });
});

app.get('/api/pontos', (req, res) => {
    db.query("SELECT * FROM pontos_coleta", (err, resultados) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        res.json(resultados);
    });
});

// ==========================================
// 5. ROTAS DE COLETA CORPORATIVA
// ==========================================

app.post('/api/cotacao', (req, res) => {
    const { nome, email, contato, endereco, descricao } = req.body;
    const sql = "INSERT INTO coletas_corporativas (nome, email, contato, endereco, descricao) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [nome, email, contato, endereco, descricao], (err, result) => {
        if (err) return res.status(500).json({ sucesso: false, erro: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

app.listen(PORT, () => {
    console.log(`📡 Servidor EcoByte rodando perfeitamente na porta ${PORT}`);
});