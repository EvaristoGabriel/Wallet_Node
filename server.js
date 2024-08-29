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

server.register(fastifyCookie);
server.register(fastifySession, {
    secret: 'meusegredohabsudhkjashdkjhsakjdahskjdhakjadhsj', // Altere para um segredo seguro
    cookie: { secure: true }, // Altere para true se usar HTTPS
    saveUninitialized: false,
    resave: false
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
    console.log("Ta é aqui")
    const {cpf,senha} = JSON.parse(JSON.stringify(request.body))
    console.log(cpf + ' ' + senha)  
    const result = await db.query("SELECT * FROM fiis;")
    console.log(result.rows)
    reply.status(200).send()
})

server.post('/loading', async (request, reply) => {
    const {cpf,senha} = JSON.parse(JSON.stringify(request.body))
    console.log(cpf + ' ' + senha)
    try{
        const consulta = await db.query("SELECT * FROM usuario WHERE cpf = $1 AND senha = $2",[cpf,senha])
        if(consulta.rows.length === 1){
            request.session.loggedIn = true
            request.session.user = consulta.rows[0]
            return reply.redirect('/home')
        }else{
            return reply.status(401).send("Credenciais inválidas");
        }
    }catch(err){
        console.error('Erro ao fazer login:', err);
        return reply.status(500).send('Erro ao fazer login');
    }
})

server.post('/entrar', async (request, reply) => {
    console.log("Clicou em entrar")
    // console.log(request.body)
    // console.log("Ta é aqui")
    // const {cpf,senha} = JSON.parse(JSON.stringify(request.body))
    // console.log(cpf + ' ' + senha)  
    // const result = await db.query("SELECT * FROM fiis;")
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
    // const result = await db.query("SELECT * FROM fiis;")
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

server.get('/home', (request, reply) =>{
    const file = readFileSync(__dirname + "/home.html")
    return reply.type("html").send(file)
})
server.get('/fii', (request, reply) =>{
    const file = readFileSync(__dirname + "/fii.html")
    return reply.type("html").send(file)
})
server.post('/api/fiis', async (request, reply) => {
    const { nome, qtdecotas, valcompra, datacompra } = JSON.parse(JSON.stringify(request.body))
    console.log(nome+" "+qtdecotas+" "+valcompra+" "+ data);
    try {
        await db.query('BEGIN');

        for (let i = 0; i < qtdecotas; i++) {
            await db.query(
                'INSERT INTO fiis (nome, valor_gasto, valor_atual,data_compra) VALUES ($1, $2, $3)',
                [nome, valcompra / qtdecotas, valcompra / qtdecotas,datacompra]
            );
        }

        // Confirmar a transação
        await db.query('COMMIT');
        return reply.status(201).send('Fundo Imobiliário adicionado com sucesso');
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erro ao adicionar fundo imobiliário:', error);
        return reply.status(500).send('Erro ao adicionar fundo imobiliário');
    }
});
server.get('/tesouro', (request, reply) =>{
    const file = readFileSync(__dirname + "/tesouro.html")
    return reply.type("html").send(file)
})
server.get('/acoes', (request, reply) =>{
    const file = readFileSync(__dirname + "/acoes.html")
    return reply.type("html").send(file)
})
server.get('/extrato', (request, reply) =>{
    const file = readFileSync(__dirname + "/extrato.html")
    return reply.type("html").send(file)
})

server.post('/fii', (request, reply) =>{
    const {nome} = JSON.parse(JSON.stringify(request.body))
    // nome.create({
    //     nome,
    // })
    const file = readFileSync(__dirname + "/fii.html")
    return reply.type("html").send(file)
})

server.post('/tesouro', (request, reply) =>{
    const {nome} = JSON.parse(JSON.stringify(request.body))
    // nome.create({
    //     nome,
    // })
    const file = readFileSync(__dirname + "/tesouro.html")
    return reply.type("html").send(file)
})

server.post('/acoes', (request, reply) =>{
    const {nome} = JSON.parse(JSON.stringify(request.body))
    // nome.create({
    //     nome,
    // })
    const file = readFileSync(__dirname + "/acoes.html")
    return reply.type("html").send(file)
})

server.listen({port: 3333,
})
