# KinseyTec – M&A · como publicar e instalar

Projeto Firebase: **kinsey-capital-ma** · Administradores gerais: **ia@kinsey.com.br** e **newton.kao@kinsey.com.br**
Direito de uso: **KinseyTec Inovação Tecnológica**, empresa do grupo Kinsey BR.

Tudo é feito no navegador, sem instalar nada no computador. Tempo estimado: 30 a 45 minutos na primeira vez; depois, 5 minutos por atualização.

---

## Parte A · Preparar o projeto no Firebase (uma vez)
Acesse **console.firebase.google.com** com a conta da Kinsey → projeto **kinsey-capital-ma**.

1. **Plano Blaze:** no canto inferior esquerdo deve aparecer **Blaze**. Ele é necessário para as funções automáticas e para guardar as chaves das integrações. O uso normal fica dentro da franquia gratuita ou custa centavos.
   - Recomendado: no Google Cloud, *Faturamento → Orçamentos e alertas*, crie um alerta, por exemplo de R$ 50 por mês.
2. **ID do projeto:** engrenagem ⚙ → *Configurações do projeto* → anote o **ID do projeto**. Pode ser `kinsey-capital-ma` ou ter um final, como `kinsey-capital-ma-a1b2c`.
3. **Login:** *Authentication → Vamos começar → Método de login*:
   - ative **Google** (e-mail de suporte: ia@kinsey.com.br);
   - ative **E-mail/senha**.
4. **Banco de dados:** *Firestore Database → Criar banco de dados* → **modo de produção** → local **southamerica-east1 (São Paulo)**.
5. **Arquivos:** *Storage → Vamos começar* → **modo de produção** → o mesmo local, **southamerica-east1**. Balancetes, contratos, relatórios e evidências vão para o Storage, até 25 MB por arquivo.

## Parte B · Publicar (Cloud Shell, no navegador)
1. Acesse **console.cloud.google.com** com a conta da Kinsey e selecione o projeto **kinsey-capital-ma** no topo.
2. Clique em **>_** (*Ativar o Cloud Shell*), no canto superior direito. Um terminal abre embaixo.
3. No terminal, clique em **⋮ → Fazer upload** e envie o arquivo **KinseyTec_MA_Firebase.zip**.
4. Copie e cole os comandos, um de cada vez. Troque `SEU_ID` pelo ID anotado na Parte A.

```bash
unzip -o KinseyTec_MA_Firebase.zip -d kinseytec-ma
```
```bash
cd kinseytec-ma/firebase
```
```bash
npx -y firebase-tools@13 login --no-localhost
```
O comando acima mostra um link: abra, entre com a conta da Kinsey, copie o código e cole no terminal.

```bash
npx -y firebase-tools@13 deploy --project SEU_ID
```

**Chaves das integrações (só na primeira publicação).** O deploy pede o valor de três chaves: `ECONODATA_TOKEN`, `RAMPER_TOKEN` e `LEMITTI_TOKEN`. São as chaves de API da Prospecção (busca de empresas e celulares dos sócios).
- Enquanto a Kinsey não tiver as chaves oficiais, digite **nao configurado** em cada uma. O sistema funciona normalmente com a importação de arquivos.
- Quando tiver uma chave oficial, cadastre com o comando abaixo (cole a chave quando pedir; ela fica guardada no Secret Manager e nunca aparece no sistema) e depois publique as funções:

```bash
npx -y firebase-tools@13 functions:secrets:set ECONODATA_TOKEN --project SEU_ID
```
```bash
npx -y firebase-tools@13 deploy --project SEU_ID --only functions
```

Nunca use senha de pessoa nas integrações: só a chave de API oficial de cada plataforma.

Na primeira vez, o deploy ativa sozinho as APIs do Google necessárias (Cloud Functions, Cloud Build, Artifact Registry, Cloud Scheduler e Secret Manager) e pode levar alguns minutos. Se der erro só nas funções, publique o restante e me envie a mensagem de erro:

```bash
npx -y firebase-tools@13 deploy --project SEU_ID --only hosting,firestore,storage
```

5. No fim aparece **Hosting URL: https://SEU_ID.web.app**. Esse é o endereço do sistema.

**Para atualizar no futuro:** envie o novo zip, rode o `unzip` e o `cd` e depois o comando `deploy`. Os dados do banco não são apagados por uma atualização.

## Parte C · Primeiro acesso e liberação do time
1. Abra `https://SEU_ID.web.app` no Chrome.
2. Entre com **Entrar com Google** usando **ia@kinsey.com.br** ou **newton.kao@kinsey.com.br**. Se o e-mail não for uma conta Google, use **Primeiro acesso: criar senha**, confirme pelo link que chega no e-mail e entre.
3. Você entra como **administrador geral**. No primeiro acesso o sistema cria sozinho o espaço de trabalho **Kinsey Capital · M&A**, onde ficam a Prospecção, a Órbita, a Base inicial e as operações (não é preciso cadastrar cliente). Se algo foi importado antes desse primeiro acesso, o sistema recupera e mostra o aviso "registro(s) recuperados".
4. Clique em **Usuários** e convide cada pessoa do time, com e-mail, nome e perfil:

| Perfil | Para quem | O que pode fazer |
|---|---|---|
| Administrador | Sócios | Tudo, inclusive convidar e remover usuários. Vê a frequência no sistema da equipe |
| Editor (cliente / Jurídico) | Time de M&A e novos negócios (ex.: Mônica Flissak) | Tudo nas operações: Prospecção, Base inicial, Órbita, análises, Due Diligence, Valuation, Jurídico, relatórios |
| Colaborador (equipe Kinsey) | Apoio | Cadastra, responde e envia documentos |
| Fornecedor (Portal) | Empresas convidadas ao Portal | Só o Portal e só os próprios dados |

5. Envie o link à pessoa (mensagem pronta na Parte F). Ela entra com o mesmo e-mail do convite.
6. Em **Prospecção → Equipe M&A e SDR**, confira o nome e o **e-mail corporativo** de cada membro. O e-mail liga a frequência no sistema e as atividades à pessoa certa.
7. **Dados de demonstração:** não carregue na base de produção. Use só num projeto de teste.

## Parte D · Instalar o aplicativo no celular e no computador
O KinseyTec M&A é um aplicativo web: instala direto pelo navegador, sem loja de aplicativos, e atualiza sozinho a cada publicação.

**Link único de instalação** (envie para o time): **https://SEU_ID.web.app/instalar**

**iPhone (Safari)**
1. Abra o link no **Safari**. No iPhone, a instalação só funciona pelo Safari.
2. **Opção 1 · atalho:** abra `https://SEU_ID.web.app`, toque em **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**.
3. **Opção 2 · perfil de instalação:** na página /instalar, toque em **Instalar KinseyTec no iPhone** → **Permitir** → *Ajustes* → **Perfil Transferido** → **Instalar**.
4. O ícone **KinseyTec** aparece na tela de início. Entre com o e-mail do convite. Se "Entrar com Google" não abrir dentro do app instalado, use **e-mail e senha**; no primeiro acesso, toque em *Primeiro acesso: criar senha*.

**Android (Chrome)**
1. Abra `https://SEU_ID.web.app` no **Chrome**.
2. Menu **⋮** → **Instalar app** (ou **Adicionar à tela inicial**) → **Instalar**.
3. O ícone aparece com os outros aplicativos. Entre com o e-mail do convite.

**Computador (Chrome ou Edge)**
- No Chrome: menu ⋮ → **Transmitir, salvar e compartilhar → Instalar página como app**. No Edge: menu … → **Aplicativos → Instalar este site como aplicativo**.
- O KinseyTec abre na própria janela, com ícone na barra de tarefas ou no Dock.

O perfil de instalação do iPhone aponta para `https://kinsey-capital-ma.web.app`. Se o ID do projeto tiver um final (ex.: `kinsey-capital-ma-a1b2c`), use a Opção 1 ou me envie o ID para eu gerar o perfil com o endereço correto.

## Parte E · Conferência depois de publicar
- [ ] Login com Google e com e-mail e senha.
- [ ] Convite de um usuário Editor: ele entra e vê as áreas.
- [ ] Prospecção: importar uma lista, consulta rápida no celular (Ligar, WhatsApp, E-mail).
- [ ] Painel de novos negócios: semana, mês, comparativo, agenda. Frequência visível só para os sócios.
- [ ] Base inicial, Órbita e um projeto de teste: Análises financeiras, Due Diligence, Valuation, relatórios em PDF.
- [ ] Instalação no iPhone, no Android e no computador.

## Parte F · Mensagens prontas
**Para o time:**
> *KinseyTec – M&A* · Seu acesso ao sistema de M&A da Kinsey está liberado.
> 👉 https://SEU_ID.web.app
> Entre com sua conta Google ou crie a senha em "Primeiro acesso" com este e-mail.
> Para instalar no celular: https://SEU_ID.web.app/instalar (iPhone pelo Safari; Android pelo Chrome).

**Para uma empresa convidada ao Portal:**
> *KinseyTec – M&A · Portal* · A Kinsey Capital convida sua empresa a preencher o cadastro com segurança:
> 👉 https://SEU_ID.web.app/portal.html
> Entre com Google ou crie a senha em "Primeiro acesso" com este e-mail. As informações são confidenciais (LGPD).

## Parte G · Endereço próprio (opcional)
*Hosting → Adicionar domínio personalizado* → por exemplo `ma.kinseytec.com.br` → siga os registros de DNS indicados. O endereço `web.app` continua funcionando.

## Atualização da v2.65 (avaliação de ativos)
A v2.65 cria a coleção "ativos" no banco. As regras de acesso dela vão junto na publicação (comando de publicação da Parte B, que já inclui as regras). As fotos do inventário ficam no Storage, na pasta do cliente.

## Parte H · Publicação automática (opcional, configurar uma vez)
Depois de configurada, cada nova versão aprovada na branch **main** do repositório é testada e publicada sozinha no Firebase, sem Cloud Shell e sem baixar pacote. Nenhuma chave ou senha é guardada: o GitHub entra no Google Cloud pela federação de identidade, e só a branch main deste repositório pode publicar.
1. No Cloud Shell do projeto, rode o script `ferramentas/configurar_publicacao_automatica.sh` do repositório (ele mostra no final os dois valores do passo 2).
2. No GitHub, em **Settings → Secrets and variables → Actions → Variables**, crie `GCP_WIF_PROVIDER` e `GCP_SERVICE_ACCOUNT` com os valores mostrados.
3. Em **Settings → Environments**, crie o ambiente **producao**. Em *Required reviewers*, coloque quem aprova cada publicação (ex.: ia@ ou newton.kao@): a versão só vai ao ar depois desse clique.
4. Para publicar na hora, sem esperar uma nova versão: aba **Actions → Publicar KinseyTec M&A → Run workflow**.
5. O resultado (site no ar e banco de dados) aparece no resumo da execução, na aba Actions.

## Segurança
- Ninguém deve compartilhar senha. Cada pessoa entra com o próprio e-mail.
- Chaves de API só no Secret Manager.
- Dados de clientes ficam no banco do projeto, com acesso por perfil e regras de segurança publicadas junto com o sistema.
- Para remover o acesso de alguém: **Usuários → Remover**.
