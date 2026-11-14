# KinseyTec – Cacau · como publicar no Google (Firebase)

Projeto: **kinseytec-cacau** · Administrador geral: **ia@kinsey.com.br** · Contato: contato@kinsey.com.br · newton.kao@kinsey.com.br · (11) 96635-0424

Tudo é feito no navegador, sem instalar nada no computador.

---

## Parte A · Ativar os serviços no Firebase (plano Blaze ativo)
Acesse **console.firebase.google.com** → projeto **kinseytec-cacau**. Confira no canto inferior esquerdo se aparece **Blaze**.

1. **ID do projeto:** engrenagem ⚙ → *Configurações do projeto* → anote o **ID do projeto** (pode ser `kinseytec-cacau` ou ter um final, como `kinseytec-cacau-a1b2c`).
2. **Login:** *Criação → Authentication → Vamos começar → Método de login*:
   - ative **Google** (e-mail de suporte: ia@kinsey.com.br) e salve;
   - ative **E-mail/senha** e salve.
3. **Banco de dados:** *Criação → Firestore Database → Criar banco de dados* → **modo de produção** → local **southamerica-east1 (São Paulo)**.
4. **Arquivos:** *Criação → Storage → Vamos começar* → **modo de produção** → local **southamerica-east1 (São Paulo)**, o mesmo do banco.

Fotos, contratos, notas e PDFs vão para o Storage, até **25 MB por arquivo**.

**Custo:** para o teste o uso fica dentro da franquia gratuita ou em centavos. Recomendado: no Google Cloud, *Faturamento → Orçamentos e alertas* → crie um alerta de, por exemplo, R$ 50 por mês, para receber um e-mail se o gasto passar disso.

## Parte B · Publicar (Cloud Shell, no navegador)
1. Acesse **console.cloud.google.com** com a conta da Kinsey e selecione o projeto **kinseytec-cacau** no topo.
2. Clique no ícone **>_** (*Ativar o Cloud Shell*), no canto superior direito. Um terminal abre embaixo.
3. No terminal, clique em **⋮ → Fazer upload** e envie o arquivo **KinseyTec_Cacau_Firebase.zip**.
4. Copie e cole estes comandos, um de cada vez. Troque `SEU_ID` pelo ID anotado na Parte A:

```bash
unzip -o KinseyTec_Cacau_Firebase.zip -d kinseytec
```

```bash
cd kinseytec/firebase
```

```bash
npx -y firebase-tools@13 login --no-localhost
```

O último comando mostra um link: abra, entre com a conta da Kinsey, copie o código e cole no terminal.

```bash
npx -y firebase-tools@13 deploy --project SEU_ID
```

O mesmo comando publica também as **funções automáticas** (cotações de hora em hora, das 8h15 às 19h15 e listas oficiais às 6h30). Na primeira vez, ele ativa sozinho as APIs do Google necessárias (Cloud Functions, Cloud Build, Artifact Registry e Cloud Scheduler) e instala as bibliotecas oficiais do Firebase para as funções; pode levar alguns minutos. Se aparecer erro só nas funções, publique o restante com:

```bash
npx -y firebase-tools@13 deploy --project SEU_ID --only hosting,firestore,storage
```

Para fazer a primeira carga de cotações e listas sem esperar o horário (opcional):

```bash
gcloud scheduler jobs run firebase-schedule-cotacoes-southamerica-east1 --location southamerica-east1 --project SEU_ID
```

```bash
gcloud scheduler jobs run firebase-schedule-listas-southamerica-east1 --location southamerica-east1 --project SEU_ID
```

5. No fim aparece **Hosting URL: https://SEU_ID.web.app**. Esse é o endereço do sistema.
   - Sistema (cliente e Kinsey): `https://SEU_ID.web.app`
   - Portal do Fornecedor: `https://SEU_ID.web.app/portal.html`

Para atualizar no futuro, envie o novo zip e repita os dois últimos comandos.

## Parte C · Primeiro acesso e teste
**No computador (Chrome):**
1. Abra `https://SEU_ID.web.app`.
2. Clique em **Entrar com Google** com **ia@kinsey.com.br**. Se esse e-mail não for uma conta Google, use **Primeiro acesso: criar senha**, confirme pelo link que chega por e-mail e entre.
3. Você entra como **administrador**. Clique em **Usuários** → **Carregar dados de exemplo**.
4. Em **Convidar usuário**, coloque o e-mail de quem vai testar, o nome, a empresa e o perfil, e clique em **Salvar convite**.
5. Envie o link à pessoa (mensagem pronta abaixo).
6. Para instalar como app no Chrome: menu ⋮ → **Transmitir, salvar e compartilhar → Instalar página como app**.

**No iPhone:**
1. Abra o link no **Safari** e entre: com Google, ou com e-mail e senha.
2. Toque em **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**.
3. O ícone **KinseyTec** aparece na tela. Se "Entrar com Google" não abrir dentro do app instalado, use **e-mail e senha**.

**Teste do fornecedor:** convide um e-mail com o perfil **Fornecedor** e envie o link `https://SEU_ID.web.app/portal.html`. Ele preenche e clica em **Enviar à Kinsey BR**. A ficha aparece no sistema em **Cadeia → Importar ficha do fornecedor → Fichas recebidas pelo Portal**.

## Instalar no celular (link único)
Depois de publicar, envie este link (abre no Safari do iPhone ou no Chrome do Android):

**https://kinseytec-cacau.web.app/instalar**

- **iPhone (administrador, cliente, equipe):** toque em *Instalar KinseyTec no iPhone* → **Permitir** → *Ajustes* → **Perfil Transferido** → **Instalar**. O ícone KinseyTec aparece na tela de início. Abra e entre com **ia@kinsey.com.br** (no app instalado, use **e-mail e senha**; se for o primeiro acesso, toque em *Primeiro acesso: criar senha*).
- **Fornecedor:** botão *Instalar Portal do Fornecedor*, mesmos passos.
- **Android:** abra o link do sistema no Chrome → menu ⋮ → **Instalar app** / **Adicionar à tela inicial**.

Se o ID do projeto tiver um final (ex.: `kinseytec-cacau-a1b2c`), o link muda para `https://SEU_ID.web.app/instalar` e eu gero os instaladores com o ID correto.

## Perfis
| Perfil | Quem | O que faz |
|---|---|---|
| Administrador | Kinsey BR (ia@kinsey.com.br) | Tudo, inclusive convidar e remover usuários |
| Editor | Cliente contratante, Jurídico Kinsey | Tudo do sistema, inclusive pareceres e classificação final |
| Colaborador | Equipe de campo Kinsey | Cadastra, responde, fotografa, envia contratos |
| Fornecedor | Traders, fornecedores, produtores | Só o Portal, só os próprios dados |

## Mensagens prontas
**Para o cliente / equipe:**
> *KinseyTec – Cacau* · Você foi convidado para o sistema de matriz de risco dos fornecedores de cacau.
> 👉 https://SEU_ID.web.app
> Entre com sua conta Google ou crie a senha em "Primeiro acesso" com este e-mail. No iPhone: Safari → Compartilhar → "Adicionar à Tela de Início". A tecla PT | EN muda o idioma.

**Para o fornecedor:**
> *KinseyTec – Cacau · Portal do Fornecedor* · A Kinsey BR conduz a verificação da origem do cacau comprado pelo cliente contratante. Preencha seu cadastro:
> 👉 https://SEU_ID.web.app/portal.html
> Entre com Google ou crie a senha em "Primeiro acesso" com este e-mail. Suas informações são confidenciais (LGPD).

## Endereço próprio (depois)
*Hosting → Adicionar domínio personalizado* → ex.: `app.kinseytec.com.br` → siga os registros de DNS indicados. O endereço `web.app` continua funcionando.
