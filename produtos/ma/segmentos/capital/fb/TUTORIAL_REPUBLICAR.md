# KinseyTec – M&A · tutorial para republicar (versão 3.02)

O sistema já está publicado. Republicar **substitui** a versão no ar e **não apaga nenhum dado**: empresas, documentos, balancetes, análises e usuários continuam. Tempo: cerca de 10 minutos, tudo no navegador.

Arquivo: **KinseyTec_MA_Firebase.zip** (está dentro do pacote KinseyTec_MA_publicacao_v3.02.zip; não envie o pacote inteiro, só este arquivo).

## Republicar agora (passo a passo)
1. Entre em **console.cloud.google.com** com a conta da Kinsey e escolha o projeto **kinsey-capital-ma** no topo.
2. Clique no ícone **>_** (*Ativar o Cloud Shell*), no canto superior direito. Abre um terminal embaixo.
3. No terminal, clique em **⋮ → Fazer upload** e envie o **KinseyTec_MA_Firebase.zip**.
4. Copie e cole os 3 comandos, um de cada vez, apertando Enter depois de cada um:

```bash
rm -rf kinseytec-ma && unzip -o KinseyTec_MA_Firebase.zip -d kinseytec-ma && cd kinseytec-ma/firebase
```
```bash
npx -y firebase-tools@13 login --no-localhost
```
(Se aparecer um link: abra, entre com a conta da Kinsey, copie o código e cole no terminal. Se disser que já está logado, siga em frente.)

```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma
```

5. Pronto quando aparecer **Deploy complete!**. Atualize a página do sistema; no celular, feche e abra o aplicativo.

## Se aparecer alguma pergunta
- **"Would you like to proceed with deletion?"** (apagar funções antigas): responda **N**.
- **Pede ECONODATA_TOKEN, RAMPER_TOKEN ou LEMITTI_TOKEN:** digite **nao configurado** (ou a chave oficial, se já tiver).
- **Erro só nas funções:** rode o comando abaixo para publicar o restante e me envie a mensagem de erro.

```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma --only hosting,firestore,storage
```

## Conferência (2 minutos)
- O menu tem **Pós-aquisição** (PPA) e, logo depois, **Impairment**, com a pergunta "Cliente da Órbita?".
- **Base inicial:** botões "Importação de documentos" e "Analisar documentos importados"; documento não reconhecido aparece "A confirmar" com Ver, Aprovar e Excluir.
- **Dossiê da Tallenty:** o "Resumo para o investidor" mostra faturamento, EBITDA e faixa de valuation (o sistema lê os documentos do dossiê ao abrir).
- **Jurídico:** abas "Validação dos documentos" e "Parecer do advogado".

## Para não repetir este passo a passo: publicação automática
Depois de configurada, cada nova versão vai ao ar sozinha. É preciso fazer **uma vez**:
1. **Chave de publicação:** no mesmo Cloud Shell, rode o comando abaixo, entre com a conta da Kinsey e copie o código longo que aparece no final (começa com "1//").

```bash
npx -y firebase-tools@13 login:ci --no-localhost
```
2. No GitHub, repositório **kinseytec/kinseytec**: **Settings → Secrets and variables → Actions → New repository secret**. Nome: **FIREBASE_TOKEN**. Valor: o código copiado. Salve. (Nunca envie esse código por mensagem.)
3. Me avise que o segredo foi criado e autorize a criação da branch **main**. Eu ajusto o arquivo de publicação automática (ele precisa montar o sistema antes de publicar) e, a partir daí, cada versão aprovada é publicada sozinha; o andamento aparece na aba **Actions** do GitHub.

Enquanto isso não for feito, continue republicando pelo passo a passo acima.
