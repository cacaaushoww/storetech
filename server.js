const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Adicione isso
const app = express();

app.use(cors()); // Isso permite que o TrebeEdit envie dados para o servidor
app.use(express.json());
// ... resto do seu código 

// CONFIGURAÇÃO - Suas chaves de PRODUÇÃO
const ACCESS_TOKEN = "TEST-1954942567690031-012818-850379838b41e06adc7844005dea9141-3163639724"; 

app.post('/validar-cartao', async (req, res) => {
    // Agora recebemos também o payment_method_id do front-end
    const { token, cpf, payment_method_id } = req.body; 

    try {
        const response = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: 1.0,
            token: token,
            description: "Verificacao de Seguranca",
            installments: 1,
            // Usa a bandeira detectada pelo SDK do Mercado Pago
            payment_method_id: payment_method_id, 
            payer: {
                email: "cliente_verificado@email.com",
                identification: { type: "CPF", number: cpf.replace(/\D/g, '') }
            }
        }, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        if (response.data.status === 'approved' || response.data.status === 'in_process') {
            return res.json({ 
                status: 'success', 
                modelo: response.data.payment_method?.name || "Cartao Padrao" 
            });
        }
        res.status(400).json({ status: 'error' });
    } catch (error) {
        // Log de erro para você saber o que o Mercado Pago respondeu
        console.error("Erro MP:", error.response ? error.response.data : error.message);
        res.status(400).json({ status: 'error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
