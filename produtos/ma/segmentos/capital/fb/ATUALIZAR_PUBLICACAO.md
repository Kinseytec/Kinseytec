# KinseyTec – M&A · substituir a publicação (versão 2.94)

O sistema já está publicado. Esta atualização **substitui** a versão no ar e **não apaga nenhum dado** (empresas, balancetes, documentos e usuários continuam). Tempo: cerca de 10 minutos. Tudo no navegador.

Arquivo para enviar: **KinseyTec_MA_Firebase.zip** (versão 2.94).

## Passo a passo
1. Entre em **console.cloud.google.com** com a conta da Kinsey e escolha o projeto **kinsey-capital-ma** no topo da página.
2. Clique no ícone **>_** (*Ativar o Cloud Shell*), no canto superior direito. Um terminal abre embaixo.
3. No terminal, clique em **⋮ → Fazer upload** e envie o arquivo **KinseyTec_MA_Firebase.zip**.
4. Copie e cole os 3 comandos abaixo, um de cada vez, apertando Enter depois de cada um:

```bash
rm -rf kinseytec-ma && unzip -o KinseyTec_MA_Firebase.zip -d kinseytec-ma && cd kinseytec-ma/firebase
```
```bash
npx -y firebase-tools@13 login --no-localhost
```
(Se aparecer um link, abra, entre com a conta da Kinsey, copie o código e cole no terminal. Se disser que já está logado, siga em frente.)

```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma
```

5. Pronto quando aparecer **Deploy complete!** e **Hosting URL**. Abra o sistema e atualize a página (no celular, feche e abra o aplicativo).

## Se algo der diferente
- **Pergunta "Would you like to proceed with deletion?"** (apagar funções antigas): responda **N** (não).
- **Pede o valor de ECONODATA_TOKEN, RAMPER_TOKEN ou LEMITTI_TOKEN:** digite **nao configurado** (ou a chave oficial, se já tiver).
- **Erro só nas funções:** publique o restante com o comando abaixo e me envie a mensagem de erro.

```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma --only hosting,firestore,storage
```
- **ID do projeto com final** (ex.: `kinsey-capital-ma-a1b2c`): troque no último comando o `kinsey-capital-ma` pelo ID que aparece em ⚙ Configurações do projeto.

## Conferência rápida (2 minutos)
- Entre no sistema: o menu termina em **Apresentação** e o topo mostra a faixa de cotações (dólar, Selic, Ibovespa).
- **Valuation → FCD:** aparece o quadro **Investimentos · CAPEX**. **Valuation → Dívida líquida:** síntese com a fonte.
- **Pós-aquisição:** aparece a aba **Impairment · CPC 01**.
- As cotações da bolsa são atualizadas pelo servidor a cada 30 minutos nos dias úteis; logo após publicar, podem levar até meia hora para aparecer.

## Publicação automática (para não repetir este passo a passo)
Configurada uma vez, cada nova versão é publicada sozinha, com a sua aprovação por um clique no GitHub. Nenhuma senha ou chave é guardada.
1. No mesmo Cloud Shell, envie e rode o arquivo **configurar_publicacao_automatica.sh** (vai junto com este guia):

```bash
bash configurar_publicacao_automatica.sh kinsey-capital-ma kinseytec/kinseytec
```
2. O comando mostra no final dois valores. No GitHub do repositório **kinseytec/kinseytec**: **Settings → Secrets and variables → Actions → aba Variables → New repository variable**, crie **GCP_WIF_PROVIDER** e **GCP_SERVICE_ACCOUNT** com esses valores.
3. Em **Settings → Environments → New environment**, crie **producao** e, em *Required reviewers*, coloque quem aprova as publicações.
4. Me avise e autorize a criação da branch **main**: a partir daí, cada versão nova vai ao ar depois da sua aprovação na aba **Actions** do GitHub.
