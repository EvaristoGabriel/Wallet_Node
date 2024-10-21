import { readFile, readFileSync } from "fs";
import { fastify } from "fastify";
import path from 'path';
import fastifyStatic from "@fastify/static";
import fastifyFormbody from '@fastify/formbody';
import fastifySession from 'fastify-session';
import fastifyCookie from 'fastify-cookie';
import {db} from "./database/database.js"
import bodyParser from "body-parser";


const __dirname = path.resolve();
const server = fastify()

 // Criando a instância do RedisStore


server.register(fastifyCookie);
server.register(fastifySession, {
    secret: 'meusegredohabsudhkjashdkjhsakjdahskjdhakjadhsj', // Altere para um segredo seguro
    cookie: { secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 604800000,
     }, // Altere para true se usar HTTPS
    saveUninitialized: false,
    resave: false,
});

server.register(fastifyFormbody);

server.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/public/', 
});
// server.use(bodyParser.urlencoded({ extended: true }))

server.get('/', (request, reply) =>{
    const file = readFileSync(__dirname + "/login.html")
    return reply.type("html").send(file)
})
// server.post('/', (request, reply) =>{
//     const file = readFileSync(__dirname + "/login.html")
//     return reply.type("html").send(file)
// })

server.post('/submit', async (request, reply) => {
    console.log(request.body)
    const {cpf,senha} = JSON.parse(JSON.stringify(request.body))
    console.log(cpf + ' ' + senha)  
    const result = await db.query("SELECT * FROM fii;")
    console.log(result.rows)
    reply.status(200).send()
})

server.post('/loading', async (request, reply) => {
    const {cpf,senha} = request.body
    console.log(cpf + ' ' + senha)
    try{
        const consulta = await db.query("SELECT * FROM usuario WHERE cpf = $1 AND senha = $2",[cpf,senha])
        if(consulta.rows.length === 1){
            request.session.loggedIn = true
            request.session.user = consulta.rows[0]
            request.session.userId = consulta.rows[0].id
            // return reply.redirect('/home')
            console.log("Até aqui ta indo")
            console.log(request.session.userId)
            return reply.send({ success: true });
        }else{
            // return reply.status(401).send("Credenciais inválidas");
            console.log("Deu erro?")
            return reply.status(401).send({ success: false, message: 'Credenciais inválidas' });
        }
    }catch(err){
        console.error('Erro ao fazer login:', err);
        // return reply.status(500).send('Erro ao fazer login');
        return reply.status(500).send({ success: false, message: 'Erro ao fazer login' });
    }
})

server.post('/entrar', async (request, reply) => {
    console.log("Clicou em entrar")
    // console.log(request.body)
    // console.log("Ta é aqui")
    // const {cpf,senha} = JSON.parse(JSON.stringify(request.body))
    // console.log(cpf + ' ' + senha)  
    // const result = await db.query("SELECT * FROM fii;")
    // console.log(result.rows)
    // reply.status(200).send()
})
server.post('/cadastrar', async (request, reply) => {
    const file = readFileSync(__dirname + "/cadastrar.html")
    return reply.type("html").send(file)
    // console.log(request.body)
    // console.log("Ta é aqui")
    // const {cpf,senha} = JSON.parse(JSON.stringify(request.body))
    // console.log(cpf + ' ' + senha)  
    // const result = await db.query("SELECT * FROM fii;")
    // console.log(result.rows)
    // reply.status(200).send()
})
server.post('/entrarC', async (request, reply) => {
    const {nome,idade,cpf,senha,senha2} = JSON.parse(JSON.stringify(request.body))
    if(senha !== senha2){
        return reply.status(500).send("Erro ao inserir usuário");
    }
    try{
        await db.query("INSERT INTO usuario (nome,idade,cpf,senha) VALUES ($1, $2, $3, $4)",
            [nome, idade, cpf, senha]);
        console.log('Usuário cadastrado com sucesso');    
        return reply.redirect('/');    
    }catch (error){
        console.error("Erro ao inserir usuário:",error);
        return reply.status(500).send("Erro ao inserir usuário");
    }
})

server.get('/home', async (request, reply) =>{
    if (!request.session.loggedIn) {
        return reply.redirect('/');
    }
    const userid = request.session.userId
    const consultaFiis = await db.query(`
                                            SELECT COUNT(*) as soma, COALESCE(SUM(valor_compra),0.0) as vc, COALESCE(SUM(dividendos),0.0) as div 
                                            FROM fii f
                                            INNER JOIN wallet w on f.walletid = w.id 
                                            INNER JOIN usuario u on w.usercpf = u.cpf 
                                            WHERE u.id = $1;
                                       `, [userid]);
    console.log(consultaFiis.rows)
    const result = consultaFiis.rows[0]
    const soma =result.soma
    const valor_compra = result.vc
    const dividendos = result.div
    const consultaTesouro = await db.query(`
                                            SELECT COALESCE(SUM(valor_compra),0.0) as soma, COALESCE(SUM(valor_prometido),0.0) as vc, COALESCE(SUM(valor_atual),0.0) as div 
                                            FROM tesouro t
                                            INNER JOIN wallet w on t.walletid = w.id 
                                            INNER JOIN usuario u on w.usercpf = u.cpf 
                                            WHERE u.id = $1;
                                           `, [userid])
    console.log(consultaTesouro.rows)
    const result_tesouro = consultaTesouro.rows[0]
    const valor_aplicado = result_tesouro.soma
    const valor_prometido = result_tesouro.vc
    const valor_atual = result_tesouro.div
    const consultaAcoes = await db.query(`
                                            SELECT COUNT(*) as soma, COALESCE(SUM(valor_compra),0.0) as vc, COALESCE(SUM(dividendos),0.0) as div 
                                            FROM acao a
                                            INNER JOIN wallet w on a.walletid = w.id 
                                            INNER JOIN usuario u on w.usercpf = u.cpf 
                                            WHERE u.id = $1;
                                        `, [userid])
    console.log("Ta aqui")
    console.log(consultaAcoes.rows)
    const result_acoes = consultaAcoes.rows[0]
    const soma_acoes =result_acoes.soma
    const valor_acoes = result_acoes.vc
    const dividendos_acoes = result_acoes.div




    const file = readFileSync(__dirname + "/home.html", "utf-8");

    // Substitui o placeholder no HTML pelo valor de soma
    let updatedFile = file
    updatedFile = updatedFile.replace("{{quantidade_cotas}}", soma);
    updatedFile = updatedFile.replace("{{valor_gasto_fii}}", valor_compra);
    updatedFile = updatedFile.replace("{{dividendos_ganhos_fii}}", dividendos);

    updatedFile = updatedFile.replace("{{valor_aplicado}}", valor_aplicado);
    updatedFile = updatedFile.replace("{{valor_prometido}}", valor_prometido);
    updatedFile = updatedFile.replace("{{valor_atual}}", valor_atual);

    updatedFile = updatedFile.replace("{{quantidade_acoes}}", soma_acoes);
    updatedFile = updatedFile.replace("{{valor_acoes}}", valor_acoes);
    updatedFile = updatedFile.replace("{{dividendo_acoes}}", dividendos_acoes);

    // Envia o HTML atualizado
    return reply.type("html").send(updatedFile);
})


server.get('/fii', async (request, reply) =>{
    // if (!request.session.loggedIn) {
    //     return reply.redirect('/');
    // }
    const userid = request.session.userId
    const consultaFiis = await db.query(`
                                            SELECT f.NOME, SUM(f.dividendos) AS DIVIDENDOS, SUM(f.valor_atual) AS VALOR_ATUAL, COUNT(f.NOME) quantidade
                                            FROM fii f
                                            INNER JOIN wallet w on f.walletid = w.id 
                                            INNER JOIN usuario u on w.usercpf = u.cpf 
                                            WHERE u.id = $1 
                                            GROUP BY f.NOME ORDER BY f.NOME;
                                       `, [userid]);
                                       
    
    if (consultaFiis.rows.length > 0) {
        let file = readFileSync(__dirname + "/fii.html", 'utf8'); // Certifique-se de ler como string
      
        // Monta o HTML com os dados dos FIIs
        let fiisHtml = consultaFiis.rows.map(fii => `
            <form class="form-component" action="" method="">
                <div class="div-form-esq">
                <input type="hidden" name="nome" value="${fii.nome}">
                <button name="FiiDetail" class="componente" type="submit">
                    <div class="cima">
                    <h3 class="h3">${fii.nome}</h3>
                    <p class="texto-fii">Valor:<br>R$${fii.valor_atual}</p>
                    </div>
                    <div class="baixo">
                    <div class="baixo-esq">
                        <p class="texto-fii">Ultimo dividendo:</p>
                        <p class="texto-fii">R$${fii.dividendos}</p>
                    </div>
                    <div class="baixo-dir">
                        <p class="texto-fii texto-fii-baixo">Quantidade de cotas: </p>
                        <p class="texto-fii texto-cotas">${fii.quantidade}</p>
                    </div>
                    </div>
                </button>
                </div>
                <div class="div-form-dir">
                <ul class="ul-component">
                    <li class="li-component"><a href="" title="Adicionar ao extrato" class="a-component"><img class="img-component" src="/public/image/addtoextract.ico">
                    </a></li>
                    <li class="li-component"><a href="" title="Deletar" class="a-component"><img class="img-component" src="/public/image/trash.ico">
                    </a></li>
                </ul>
                </div>
            </form>
        `).join(''); 

        file = file.replace('{{fiis}}', fiisHtml);
        return reply.type('text/html').send(file);
      } else {
        // Se não houver FIIs, retorna o HTML sem os boxes de FIIs
        const file = readFileSync(__dirname + "/fii.html", 'utf8');
        return reply.type('text/html').send(file.replace('{{fiis}}', '<p>Nenhum fundo encontrado</p>'));
      }
})
// server.post('/api/fiis', async (request, reply) => {
//     const { nome, qtdecotas, valcompra, datacompra } = JSON.parse(JSON.stringify(request.body))
//     console.log(nome+" "+qtdecotas+" "+valcompra+" "+ data);
//     try {
//         await db.query('BEGIN');

//         for (let i = 0; i < qtdecotas; i++) {
//             await db.query(
//                 'INSERT INTO fiis (nome, valor_gasto, valor_atual,data_compra) VALUES ($1, $2, $3)',
//                 [nome, valcompra / qtdecotas, valcompra / qtdecotas,datacompra]
//             );
//         }

//         // Confirmar a transação
//         await db.query('COMMIT');
//         return reply.status(201).send('Fundo Imobiliário adicionado com sucesso');
//     } catch (error) {
//         await db.query('ROLLBACK');
//         console.error('Erro ao adicionar fundo imobiliário:', error);
//         return reply.status(500).send('Erro ao adicionar fundo imobiliário');
//     }
// });
server.get('/tesouro', async(request, reply) =>{
    // if (!request.session.loggedIn) {
    //     return reply.redirect('/');
    // }
    const userid = request.session.userId
    const consultaFiis = await db.query(`
                                            SELECT F.*
                                            FROM tesouro f
                                            INNER JOIN wallet w on f.walletid = w.id 
                                            INNER JOIN usuario u on w.usercpf = u.cpf 
                                            WHERE u.id = $1 
                                            ORDER BY f.NOME;
                                       `, [userid]);
                                       
    
    if (consultaFiis.rows.length > 0) {
        let file = readFileSync(__dirname + "/tesouro.html", 'utf8'); // Certifique-se de ler como string
      
        // Monta o HTML com os dados dos FIIs
        let tesouroHTML = consultaFiis.rows.map(fii => `
            <form class="form-component" action="" method="post">
            <div class="div-form-esq">
                <input type="hidden" name="id" value="">
                <button name="tesouroDetail" class="componente componente-tesouro" type="submit">
                    <div class="cima cima-tesouro">
                        <h3 class="h3"></h3>
                        <p class="texto-fii">Valor Aplicado:</p>
                    </div>
                    <div class="baixo baixo-tesouro">
                        <div class="baixo-esq">
                            <p class="texto-fii">Valor Atual:</p>
                            <p class="texto-fii">R$ </p>
                        </div>
                        <div class="baixo-dir baixo-dir-tesouro">
                            <p class="texto-fii texto-fii-baixo">Valor Prometido: </p>
                            <p class="texto-fii ">R$</p>
                        </div>
                    </div>
                </button>
            </div>
            <div class="div-form-dir">
                <ul class="ul-component">
                    <li class="li-component"><a href="" title="Adicionar ao extrato" class="a-component"><img class="img-component" src="/public/image/addtoextract.ico">
                        </a></li>
                    <li class="li-component"><a href="" title="Deletar" class="a-component"><img class="img-component" src="/public/image/trash.ico">
                        </a></li>
                </ul>
            </div>
        </form>
        `).join(''); 
        
        file = file.replace('{{tesouro}}', tesouroHTML);
        return reply.type('text/html').send(file);
      } else {
        // Se não houver FIIs, retorna o HTML sem os boxes de FIIs
        const file = readFileSync(__dirname + "/tesouro.html", 'utf8');
        return reply.type('text/html').send(file.replace('{{tesouro}}', '<p>Nenhum tesouro encontrado</p>'));
      }
})
server.get('/acoes', async(request, reply) =>{
    // if (!request.session.loggedIn) {
    //     return reply.redirect('/');
    // }
    const userid = request.session.userId
    const consultaFiis = await db.query(`
                                            SELECT F.*
                                            FROM acao f
                                            INNER JOIN wallet w on f.walletid = w.id 
                                            INNER JOIN usuario u on w.usercpf = u.cpf 
                                            WHERE u.id = $1 
                                            ORDER BY f.NOME;
                                       `, [userid]);
                                       
    
    if (consultaFiis.rows.length > 0) {
        let file = readFileSync(__dirname + "/acao.html", 'utf8'); // Certifique-se de ler como string
      
        // Monta o HTML com os dados dos FIIs
        let acaoHTML = consultaFiis.rows.map(fii => `
            <form class="form-component" action="" method="">
                <div class="div-form-esq">
                <input type="hidden" name="nome" value="${fii.nome}">
                <button name="FiiDetail" class="componente" type="submit">
                    <div class="cima">
                    <h3 class="h3">${fii.nome}</h3>
                    <p class="texto-fii">Valor:<br>R$${fii.valor_atual}</p>
                    </div>
                    <div class="baixo">
                    <div class="baixo-esq">
                        <p class="texto-fii">Ultimo dividendo:</p>
                        <p class="texto-fii">R$${fii.dividendos}</p>
                    </div>
                    <div class="baixo-dir">
                        <p class="texto-fii texto-fii-baixo">Quantidade de cotas: </p>
                        <p class="texto-fii texto-cotas">${fii.quantidade}</p>
                    </div>
                    </div>
                </button>
                </div>
                <div class="div-form-dir">
                <ul class="ul-component">
                    <li class="li-component"><a href="" title="Adicionar ao extrato" class="a-component"><img class="img-component" src="/public/image/addtoextract.ico">
                    </a></li>
                    <li class="li-component"><a href="" title="Deletar" class="a-component"><img class="img-component" src="/public/image/trash.ico">
                    </a></li>
                </ul>
                </div>
            </form>
        `).join(''); 
        
        file = file.replace('{{acao}}', acaoHTML);
        return reply.type('text/html').send(file);
      } else {
        // Se não houver FIIs, retorna o HTML sem os boxes de FIIs
        const file = readFileSync(__dirname + "/acao.html", 'utf8');
        return reply.type('text/html').send(file.replace('{{acao}}', '<p>Nenhuma ação encontrada</p>'));
      }
})
server.get('/extrato', async(request, reply) =>{
    // if (!request.session.loggedIn) {
    //     return reply.redirect('/');
    // }
    const userid = request.session.userId
    const consultaFiis = await db.query(`
                                            SELECT f.NOME, SUM(f.dividendos) AS DIVIDENDOS, SUM(f.valor_atual) AS VALOR_ATUAL, COUNT(f.NOME) quantidade
                                            FROM fii f
                                            INNER JOIN wallet w on f.walletid = w.id 
                                            INNER JOIN usuario u on w.usercpf = u.cpf 
                                            WHERE u.id = $1 
                                            GROUP BY f.NOME ORDER BY f.NOME;
                                       `, [userid]);
                                       
    
    if (consultaFiis.rows.length > 0) {
        let file = readFileSync(__dirname + "/fii.html", 'utf8'); // Certifique-se de ler como string
      
        // Monta o HTML com os dados dos FIIs
        let fiisHtml = consultaFiis.rows.map(fii => `
            <form class="form-component" action="" method="">
                <div class="div-form-esq">
                <input type="hidden" name="nome" value="${fii.nome}">
                <button name="FiiDetail" class="componente" type="submit">
                    <div class="cima">
                    <h3 class="h3">${fii.nome}</h3>
                    <p class="texto-fii">Valor:<br>R$${fii.valor_atual}</p>
                    </div>
                    <div class="baixo">
                    <div class="baixo-esq">
                        <p class="texto-fii">Ultimo dividendo:</p>
                        <p class="texto-fii">R$${fii.dividendos}</p>
                    </div>
                    <div class="baixo-dir">
                        <p class="texto-fii texto-fii-baixo">Quantidade de cotas: </p>
                        <p class="texto-fii texto-cotas">${fii.quantidade}</p>
                    </div>
                    </div>
                </button>
                </div>
                <div class="div-form-dir">
                <ul class="ul-component">
                    <li class="li-component"><a href="" title="Adicionar ao extrato" class="a-component"><img class="img-component" src="/public/image/addtoextract.ico">
                    </a></li>
                    <li class="li-component"><a href="" title="Deletar" class="a-component"><img class="img-component" src="/public/image/trash.ico">
                    </a></li>
                </ul>
                </div>
            </form>
        `).join(''); 
        
        file = file.replace('{{fiis}}', fiisHtml);
        return reply.type('text/html').send(file);
      } else {
        // Se não houver FIIs, retorna o HTML sem os boxes de FIIs
        const file = readFileSync(__dirname + "/fii.html", 'utf8');
        return reply.type('text/html').send(file.replace('{{fiis}}', '<p>Nenhum fundo encontrado</p>'));
      }
})

// server.post('/fii', (request, reply) =>{
//     const {nome} = JSON.parse(JSON.stringify(request.body))
//     // nome.create({
//     //     nome,
//     // })
//     const file = readFileSync(__dirname + "/fii.html")
//     return reply.type("html").send(file)
// })

// server.post('/tesouro', (request, reply) =>{
//     const {nome} = JSON.parse(JSON.stringify(request.body))
//     // nome.create({
//     //     nome,
//     // })
//     const file = readFileSync(__dirname + "/tesouro.html")
//     return reply.type("html").send(file)
// })

// server.post('/acoes', (request, reply) =>{
//     const {nome} = JSON.parse(JSON.stringify(request.body))
//     // nome.create({
//     //     nome,
//     // })
//     const file = readFileSync(__dirname + "/acoes.html")
//     return reply.type("html").send(file)
// })

server.listen({port: 3333,
})
