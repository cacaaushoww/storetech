const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public')); 

// CONFIGURAÇÃO - Suas chaves de PRODUÇÃO
const ACCESS_TOKEN = "APP_USR-1954942567690031-012818-20e9de4b75bb3d0c284b51790db079c8-3163639724"; 

app.post('/validar-cartao', async (req, res) => {
    const { token, cpf } = req.body;

    try {
        // O SERVIDOR tenta cobrar R$ 1,00 para ver se o cartão tem saldo/existe
        const response = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: 1.0,
            token: token,
            description: "Verificação de Segurança",
            installments: 1,
            payment_method_id: "visa", 
            payer: {
                email: "verificador@check.com",
                identification: { type: "CPF", number: cpf.replace(/\D/g, '') }
            }
        }, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        // Se o banco aprovou, pegamos o NOME do modelo (ex: Visa Platinum)
        if (response.data.status === 'approved' || response.data.status === 'in_process') {
            return res.json({ 
                status: 'success', 
                modelo: response.data.payment_method?.name || "Comum" 
            });
        }
        
        res.status(400).json({ status: 'error' });

    } catch (error) {
        res.status(400).json({ status: 'error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
