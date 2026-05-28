const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.es',
    port: 587,
    secure: false,
    auth: {
        user: 'comunicacion@saskipenguins.com',
        pass: 'Saskipenguins2o24@'
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function sendTest() {
    try {
        console.log('Enviando email de prueba...');
        const info = await transporter.sendMail({
            from: '"Test Script" <comunicacion@saskipenguins.com>',
            to: 'comunicacion@saskipenguins.com',
            subject: 'Prueba Definitiva Script',
            text: 'Si lees esto, las credenciales y el envío funcionan.'
        });
        console.log('Email enviado:', info.messageId);
    } catch (err) {
        console.error('Error enviando:', err);
    }
}

sendTest();
