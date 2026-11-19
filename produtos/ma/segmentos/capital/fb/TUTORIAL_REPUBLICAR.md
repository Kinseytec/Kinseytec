# KinseyTec – M&A · tutorial para republicar (versão 3.04)

O sistema já está publicado. Republicar **substitui** a versão no ar e **não apaga nenhum dado**: empresas, documentos, balancetes, análises e usuários continuam. Tempo: cerca de 10 minutos, tudo no navegador.

Arquivo: **KinseyTec_MA_Firebase.zip** (está dentro do pacote KinseyTec_MA_publicacao_v3.04.zip; não envie o pacote inteiro, só este arquivo).

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

## Importante nesta versão (3.04, inclui a 3.03)
Esta versão corrige o problema de os documentos não serem reconhecidos nem analisados no sistema publicado. **As funções precisam ser publicadas junto** (o comando de deploy acima já publica tudo): a leitura dos arquivos agora passa por uma função nova do servidor, chamada **lerArquivo**. Se o deploy das funções falhar, me envie a mensagem: sem ela, a análise automática continua sem conseguir abrir os documentos guardados.

**Não é problema de assinatura.** O plano Blaze já está ativo (as funções agendadas de mercado e cotações só rodam nele). O que acontecia:
1. **Storage sem liberação de download para o navegador (CORS):** o sistema guardava o documento, mas não conseguia abri-lo de novo para analisar. Agora o servidor entrega o arquivo ao sistema.
2. **Limite de 1 MB por registro do Firestore:** o ECD mês a mês, gravado dentro do cadastro da empresa, podia passar desse limite e travar todas as gravações daquela empresa. Agora cada balancete tem registro próprio; os dados antigos são migrados sozinhos na primeira abertura.

**Opcional (deixa a leitura um pouco mais rápida):** liberar o download direto do Storage para o endereço do sistema. No mesmo Cloud Shell, rode:

```bash
echo '[{"origin":["https://kinsey-capital-ma.web.app","https://kinsey-capital-ma.firebaseapp.com"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json && gcloud storage buckets update gs://$(gcloud storage buckets list --project kinsey-capital-ma --format="value(name)" | grep -E "firebasestorage.app|appspot.com" | head -1) --cors-file=cors.json
```
(Se o sistema for acessado por outro domínio, me avise para incluir. Sem este passo o sistema funciona do mesmo jeito, pelo servidor.)

## Se aparecer alguma pergunta
- **"Would you like to proceed with deletion?"** (apagar funções antigas): responda **N**.
- **Pede ECONODATA_TOKEN, RAMPER_TOKEN ou LEMITTI_TOKEN:** digite **nao configurado** (ou a chave oficial, se já tiver).
- **Erro só nas funções:** rode o comando abaixo para publicar o restante e me envie a mensagem de erro (nesta versão a função lerArquivo é necessária para analisar os documentos).

```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma --only hosting,firestore,storage
```

## Conferência (2 minutos)
- **Prospecção:** acima da busca, filtros "Segmento empresarial", "Região do Brasil" e "Estado (UF)"; na ficha da empresa, o segmento pode ser trocado.
- **Base inicial → Importação de documentos:** escolha a Tallenty ou a Futura; aparece o **sininho** (amarelo: sem documentos; vermelho: documento com problema ou faltando; verde: tudo certo). Toque nele para ver os pontos; o botão **Analisar documentos** fica ao lado.
- Na primeira abertura depois de republicar, os documentos já enviados são lidos de novo, uma vez, e os números aparecem no dossiê, na Due Diligence e no valuation.
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
