PASSOS PARA CORRER O BACKEND LOCALMENTE

1. Abre a pasta backend_afm no terminal (PowerShell ou Git Bash).

2. Instala as dependências:
   npm install

3. Copia o ficheiro .env.example e renomeia para .env

4. Substitui <a_tua_password> pela palavra-passe da tua base de dados MongoDB Atlas no campo MONGO_URI

5. Inicia o servidor com:
   npm start

O servidor vai correr em http://localhost:5000