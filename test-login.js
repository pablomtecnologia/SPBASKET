const axios = require('axios');

axios.post('http://localhost:3001/api/login', {
    username: 'admin',
    password: 'admin123'
})
    .then(res => console.log('✅ LOGIN OK:', res.data))
    .catch(err => console.error('❌ LOGIN ERROR:', err.response?.data || err.message));
