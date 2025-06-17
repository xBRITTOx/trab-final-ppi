import express from "express";
import cookieParser from "cookie-parser";
const app = express();
const port = 3000;
const host = "localhost";

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simulando usuários
const usuarios = [{ login: "admin", senha: "123" }];

// Dados de sessão simples
const sessoes = {};

// Dados armazenados
const equipes = [];
const jogadores = [];

// CSS padrão usado nas páginas (igual do seu código original)
const style = `
<style>
  body { font-family: Arial, sans-serif; background: #f2f2f2; margin:0; padding:0; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 5px #ccc; }
  h1 { text-align: center; }
  form { display: flex; flex-direction: column; }
  label { margin-top: 12px; }
  input, select { padding: 8px; font-size: 16px; border: 1px solid #aaa; border-radius: 4px; }
  .text-danger { color: red; font-size: 14px; }
  button { margin-top: 20px; padding: 10px; font-size: 18px; background: #28a745; border: none; color: white; border-radius: 4px; cursor: pointer; }
  button:hover { background: #218838; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { border: 1px solid #aaa; padding: 8px; text-align: left; }
  th { background: #eee; }
  a { display: inline-block; margin-top: 15px; text-decoration: none; color: #007bff; }
  a:hover { text-decoration: underline; }
</style>
`;

// Middleware para verificar autenticação
function verificarAutenticacao(req, res, next) {
  const sessao = sessoes[req.cookies.sessionid];
  if (sessao && sessao.login) {
    req.usuario = sessao.login;
    return next();
  }
  res.redirect("/");
}

// Rota login GET
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Login</title>
${style}
</head>
<body>
  <div class="container">
    <h1>Login</h1>
    <form action="/login" method="POST">
      <label for="login">Login</label>
      <input type="text" id="login" name="login" autocomplete="username" required>
      <label for="senha">Senha</label>
      <input type="password" id="senha" name="senha" autocomplete="current-password" required>
      <button type="submit">Entrar</button>
    </form>
  </div>
</body>
</html>`);
});

// POST login
app.post("/login", (req, res) => {
  const { login, senha } = req.body;
  const user = usuarios.find(u => u.login === login && u.senha === senha);
  if (!user) {
    return res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Login - Erro</title>
${style}
</head>
<body>
  <div class="container">
    <h1>Login</h1>
    <p class="text-danger">Usuário ou senha incorretos.</p>
    <a href="/">Voltar</a>
  </div>
</body>
</html>`);
  }
  // Criar sessão simples
  const sessionid = Math.random().toString(36).slice(2);
  sessoes[sessionid] = { login };
  res.cookie("sessionid", sessionid, { httpOnly: true });
  res.cookie("ultimologin", new Date().toLocaleString());
  res.redirect("/menu");
});

// Rota menu
app.get("/menu", verificarAutenticacao, (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Menu</title>
${style}
</head>
<body>
  <div class="container">
    <h1>Menu Principal</h1>
    <nav>
      <ul>
        <li><a href="/equipe">Cadastro de Equipe</a></li>
        <li><a href="/jogador">Cadastro de Jogador</a></li>
      </ul>
    </nav>
    <a href="/logout">Logout</a>
  </div>
</body>
</html>`);
});

// Logout
app.get("/logout", verificarAutenticacao, (req, res) => {
  delete sessoes[req.cookies.sessionid];
  res.clearCookie("sessionid");
  res.clearCookie("ultimologin");
  res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Logout</title>
${style}
</head>
<body>
  <div class="container">
    <h1>Logout efetuado</h1>
    <a href="/">Voltar ao Login</a>
  </div>
</body>
</html>`);
});

// --- Cadastro de Equipes ---

const camposEquipe = ["nomeEquipe", "nomeTecnico", "telefoneTecnico"];

app.get("/equipe", verificarAutenticacao, (req, res) => {
  res.send(getEquipeForm({}));
});

app.post("/equipe", verificarAutenticacao, (req, res) => {
  const dados = {};
  let erro = false;

  for (const campo of camposEquipe) {
    dados[campo] = req.body[campo]?.trim();
    if (!dados[campo]) erro = true;
  }

  if (erro) {
    return res.send(getEquipeForm(dados));
  }

  equipes.push(dados);
  res.redirect("/equipes");
});

app.get("/equipes", verificarAutenticacao, (req, res) => {
  let tabela = `<div class="container">
    <h1>Equipes Cadastradas</h1>
    <table>
      <tr>
        <th>Nome da Equipe</th>
        <th>Técnico Responsável</th>
        <th>Telefone do Técnico</th>
      </tr>`;

  for (const e of equipes) {
    tabela += `<tr>
      <td>${e.nomeEquipe}</td>
      <td>${e.nomeTecnico}</td>
      <td>${e.telefoneTecnico}</td>
    </tr>`;
  }

  tabela += `</table>
    <a href="/equipe">Cadastrar nova equipe</a><br>
    <a href="/menu">Voltar ao menu</a>
  </div>`;

  res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Equipes Cadastradas</title>
${style}
</head>
<body>
  ${tabela}
</body>
</html>`);
});

function getEquipeForm(dados) {
  const {
    nomeEquipe = "", nomeTecnico = "", telefoneTecnico = ""
  } = dados;

  let conteudo = `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Cadastro de Equipe</title>
${style}
</head>
<body>
  <div class="container">
    <h1>Cadastro de Equipe</h1>
    <form action="/equipe" method="POST">`;

  conteudo += `<label for="nomeEquipe">Nome da Equipe</label>`;
  if (!nomeEquipe) {
    conteudo += `
      <input type="text" id="nomeEquipe" name="nomeEquipe" value="">
      <span class="text-danger">Por favor, informe o nome da equipe</span>`;
  } else {
    conteudo += `
      <input type="text" id="nomeEquipe" name="nomeEquipe" value="${nomeEquipe}">`;
  }

  conteudo += `<label for="nomeTecnico">Nome do Técnico Responsável</label>`;
  if (!nomeTecnico) {
    conteudo += `
      <input type="text" id="nomeTecnico" name="nomeTecnico" value="">
      <span class="text-danger">Por favor, informe o nome do técnico</span>`;
  } else {
    conteudo += `
      <input type="text" id="nomeTecnico" name="nomeTecnico" value="${nomeTecnico}">`;
  }

  conteudo += `<label for="telefoneTecnico">Telefone do Técnico Responsável</label>`;
  if (!telefoneTecnico) {
    conteudo += `
      <input type="tel" id="telefoneTecnico" name="telefoneTecnico" value="">
      <span class="text-danger">Por favor, informe o telefone do técnico</span>`;
  } else {
    conteudo += `
      <input type="tel" id="telefoneTecnico" name="telefoneTecnico" value="${telefoneTecnico}">`;
  }

  conteudo += `<button type="submit">Cadastrar Equipe</button>
    </form>
    <a href="/menu">Voltar ao menu</a>
  </div>
</body>
</html>`;

  return conteudo;
}

// --- Cadastro de Jogadores ---

const camposJogador = ["nomeJogador", "numeroJogador", "dataNascimento", "altura", "genero", "posicao", "equipe"];

app.get("/jogador", verificarAutenticacao, (req, res) => {
  res.send(getJogadorForm({}, equipes));
});

app.post("/jogador", verificarAutenticacao, (req, res) => {
  const dados = {};
  let erro = false;

  for (const campo of camposJogador) {
    dados[campo] = req.body[campo]?.trim();
    if (!dados[campo]) erro = true;
  }

  // Validação extra: número e altura devem ser numéricos
  if (dados.numeroJogador && isNaN(parseInt(dados.numeroJogador))) erro = true;
  if (dados.altura && isNaN(parseInt(dados.altura))) erro = true;

  // Validar se equipe escolhida existe
  if (dados.equipe && !equipes.find(e => e.nomeEquipe === dados.equipe)) erro = true;

  if (erro) {
    return res.send(getJogadorForm(dados, equipes));
  }

  jogadores.push(dados);
  res.redirect("/jogadores");
});

app.get("/jogadores", verificarAutenticacao, (req, res) => {
  let conteudo = `<div class="container">
    <h1>Jogadores Cadastrados</h1>`;

  if (equipes.length === 0) {
    conteudo += `<p>Nenhuma equipe cadastrada. <a href="/equipe">Cadastre uma equipe primeiro</a>.</p>`;
  } else {
    // Agrupar jogadores por equipe
    for (const equipe of equipes) {
      conteudo += `<h2>${equipe.nomeEquipe}</h2>`;
      const jogadoresEquipe = jogadores.filter(j => j.equipe === equipe.nomeEquipe);
      if (jogadoresEquipe.length === 0) {
        conteudo += `<p>Sem jogadores cadastrados para essa equipe.</p>`;
      } else {
        conteudo += `<table>
          <tr>
            <th>Nome do Jogador</th>
            <th>Número</th>
            <th>Data de Nascimento</th>
            <th>Altura (cm)</th>
            <th>Gênero</th>
            <th>Posição</th>
          </tr>`;
        for (const j of jogadoresEquipe) {
          conteudo += `<tr>
            <td>${j.nomeJogador}</td>
            <td>${j.numeroJogador}</td>
            <td>${j.dataNascimento}</td>
            <td>${j.altura}</td>
            <td>${j.genero}</td>
            <td>${j.posicao}</td>
          </tr>`;
        }
        conteudo += `</table>`;
      }
    }
  }

  conteudo += `<a href="/jogador">Cadastrar novo jogador</a><br>
    <a href="/menu">Voltar ao menu</a>
  </div>`;

  res.send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Jogadores Cadastrados</title>
${style}
</head>
<body>
  ${conteudo}
</body>
</html>`);
});

function getJogadorForm(dados, equipesDisponiveis) {
  const {
    nomeJogador = "", numeroJogador = "", dataNascimento = "", altura = "",
    genero = "", posicao = "", equipe = ""
  } = dados;

  let conteudo = `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>Cadastro de Jogador</title>
${style}
</head>
<body>
  <div class="container">
    <h1>Cadastro de Jogador</h1>
    <form action="/jogador" method="POST">`;

  conteudo += `<label for="nomeJogador">Nome do Jogador</label>`;
  if (!nomeJogador) {
    conteudo += `
      <input type="text" id="nomeJogador" name="nomeJogador" value="">
      <span class="text-danger">Por favor, informe o nome do jogador</span>`;
  } else {
    conteudo += `
      <input type="text" id="nomeJogador" name="nomeJogador" value="${nomeJogador}">`;
  }

  conteudo += `<label for="numeroJogador">Número do Jogador (nº da camisa)</label>`;
  if (!numeroJogador) {
    conteudo += `
      <input type="number" id="numeroJogador" name="numeroJogador" value="">
      <span class="text-danger">Por favor, informe o número do jogador</span>`;
  } else {
    conteudo += `
      <input type="number" id="numeroJogador" name="numeroJogador" value="${numeroJogador}">`;
  }

  conteudo += `<label for="dataNascimento">Data de Nascimento</label>`;
  if (!dataNascimento) {
    conteudo += `
      <input type="date" id="dataNascimento" name="dataNascimento" value="">
      <span class="text-danger">Por favor, informe a data de nascimento</span>`;
  } else {
    conteudo += `
      <input type="date" id="dataNascimento" name="dataNascimento" value="${dataNascimento}">`;
  }

  conteudo += `<label for="altura">Altura em cm</label>`;
  if (!altura) {
    conteudo += `
      <input type="number" id="altura" name="altura" value="" step="1" min="0">
      <span class="text-danger">Por favor, informe a altura</span>`;
  } else {
    conteudo += `
      <input type="number" id="altura" name="altura" value="${altura}" step="1" min="0">`;
  }

  conteudo += `<label for="genero">Gênero</label>`;
  if (!genero) {
    conteudo += `
      <input type="text" id="genero" name="genero" value="">
      <span class="text-danger">Por favor, informe o gênero</span>`;
  } else {
    conteudo += `
      <input type="text" id="genero" name="genero" value="${genero}">`;
  }

  conteudo += `<label for="posicao">Posição</label>`;
  if (!posicao) {
    conteudo += `
      <input type="text" id="posicao" name="posicao" value="">
      <span class="text-danger">Por favor, informe a posição</span>`;
  } else {
    conteudo += `
      <input type="text" id="posicao" name="posicao" value="${posicao}">`;
  }

  conteudo += `<label for="equipe">Equipe</label>`;
  if (!equipe) {
    conteudo += `<select id="equipe" name="equipe">
      <option value="">-- Selecione uma equipe --</option>`;
    for (const e of equipesDisponiveis) {
      conteudo += `<option value="${e.nomeEquipe}">${e.nomeEquipe}</option>`;
    }
    conteudo += `</select>
      <span class="text-danger">Por favor, selecione uma equipe</span>`;
  } else {
    conteudo += `<select id="equipe" name="equipe">
      <option value="">-- Selecione uma equipe --</option>`;
    for (const e of equipesDisponiveis) {
      if (e.nomeEquipe === equipe) {
        conteudo += `<option value="${e.nomeEquipe}" selected>${e.nomeEquipe}</option>`;
      } else {
        conteudo += `<option value="${e.nomeEquipe}">${e.nomeEquipe}</option>`;
      }
    }
    conteudo += `</select>`;
  }

  conteudo += `<button type="submit">Cadastrar Jogador</button>
    </form>
    <a href="/menu">Voltar ao menu</a>
  </div>
</body>
</html>`;

  return conteudo;
}

app.listen(port, host, () => {
  console.log(`Servidor rodando em http://${host}:${port}`);
});