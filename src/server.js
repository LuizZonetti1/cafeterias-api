import app from './app.js';
//import './database/index.js'; //importa a configuração do banco de dados

const PORT = process.env.PORT || 3001; //define a porta do servidor

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); //inicia o servidor na porta 3001
