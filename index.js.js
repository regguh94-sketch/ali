const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/get-pairing-code', async (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.json({ status: false, message: 'رقم الهاتف مطلوب' });
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });

        sock.ev.on('creds.update', saveCreds);

        if (!sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    // Format code with dash
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    res.json({ status: true, pairingCode: code, message: 'تم التوليد بنجاح' });
                } catch (err) {
                    res.json({ status: false, message: err.message });
                }
            }, 3000);
        } else {
            res.json({ status: false, message: 'هذا الرقم مسجل بالفعل في السيرفر' });
        }
    } catch (error) {
        res.json({ status: false, message: 'حدث خطأ في الخادم' });
    }
});

app.get('/', (req, res) => {
    res.send('WhatsApp Pro Server is Running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});