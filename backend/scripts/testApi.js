const axios = require('axios');

async function run(){
  try{
    const base = 'http://localhost:3000';
    const login = await axios.post(base + '/auth/login', { email: 'pablo@test.com', password: '123456' });
    const token = login.data.token;
    console.log('token:', token);

    const candidates = await axios.get(base + '/swipes/candidates?limit=10', { headers: { Authorization: `Bearer ${token}` } });
    console.log('candidates:', JSON.stringify(candidates.data, null, 2));

    const matches = await axios.get(base + '/matches', { headers: { Authorization: `Bearer ${token}` } });
    console.log('matches:', JSON.stringify(matches.data, null, 2));

  }catch(err){
    console.error(err.response ? err.response.data : err.message);
  }
}

run();
