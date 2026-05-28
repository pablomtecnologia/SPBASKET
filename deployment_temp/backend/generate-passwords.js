// generate-passwords.js - Genera hashes bcrypt para las contraseñas
const bcrypt = require('bcryptjs');

const users = [
    { username: 'admin', password: 'spbasket2024' },
    { username: 'jugador', password: 'jugador123' },
    { username: 'entrenador', password: 'entrenador123' }
];

console.log('Generando hashes de contraseñas...\n');

users.forEach(user => {
    const hash = bcrypt.hashSync(user.password, 10);
    console.log(`Usuario: ${user.username}`);
    console.log(`Contraseña: ${user.password}`);
    console.log(`Hash: ${hash}`);
    console.log('');
    console.log(`UPDATE users SET password = '${hash}' WHERE username = '${user.username}';`);
    console.log('');
});

console.log('Copia los comandos UPDATE y ejecútalos en MySQL Command Line');
