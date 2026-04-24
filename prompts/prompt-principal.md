# Contas as Pagar e Receber - FlowCash

- Criar um app de controle de contas pessoais (receber/pagar).
- O usuario pode criar, editar e deletar (fcam no banco com flag=apagada, e com a data de apagada) contas para pagar ou receber.
- Cada conta tem titulo, conteudo/descrição, data de criação, data do vencimento, valor em reais e dolar, tipo (receber/pagar), situação (paga, recebida).

## **Página principal**

- A pagina inicial lista todas as contas em cards e ao lado uma tabela bonita e um gráfico.
- Criar um dashboard com as contas a vencer nos proximos 7 dias, contas vencidas e contas pagas/recebidas.
- Clicar numa conta abre ela pra editar.-
- Tem um botao de criar conta nova.

## Detalhes do **visual** :

- Visual bonito e dark e light mode, com Login e cadastro de usuario modenos, com tela de login dividida e ela no lado direitom lado esrquerdo para o nome do projeto e propagandas com animações.
- Cores suaves e fontes modernas, background/fundo com linhas verticais, horizontais finais e com blur.
- Blur no fundo dos cards e dialogos, e todos os card e dialogos, azul brilante e com bordascom efeitos no hoover (azul brilhante) percorrento a bordas.
- Usar transparencia e blur para criar um efeito de profundidade, especialmente nos cards e diálogos.
- Animações suaves para transições de página, abertura de diálogos e interações com os cards, como hover e clique.
- Gráficos modernos e interativos para visualizar as contas a vencer, vencidas e pagas/recebidas, usando bibliotecas como Chart.js ou Recharts, integrados com o design geral do aplicativo.

## **Tecnologias**:

- Usa **bun, Next.js, Drizzle ORM, Postgres, ShadCN/UI e Tailwind**.
- Cria seed com 5 notas de exemplo, e com um super-usuário, com email: admin@flowclash.com, senha: @flowcash123.
- nota nunca são apagadas no banco, só não aparecem mais para o usuário, ou seja, tem uma flag de apagada e a data de apagada.
- Criar um **docker-compose.yml** para rodar o app e o banco de dados.

## **SAAS e multi-tenent**

- Criar niveis de usuários (super-user, admin, standard e free) e planos: Free, 10 contas de cada (receber/pagar) e etc (com base na quantidade de contas)
- Cada usuário pode personalizar seu dashboard
- o super-usuario e o primeiro a se cadastrar e ele tem o dominio geral de todos usuarios.
- o usuario admin tem dominmio apenas da sua conta.
