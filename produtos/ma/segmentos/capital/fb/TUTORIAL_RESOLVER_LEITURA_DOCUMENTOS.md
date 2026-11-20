# KinseyTec – M&A · resolver a leitura automática dos documentos (Firebase)

**O sintoma:** os documentos estão guardados no dossiê (o sistema conta, por exemplo, "5 documentos financeiros já estão no dossiê da Futura"), mas "não abriram: servidor indisponível". Os arquivos **estão arquivados**: o que falha é **reabrir** o arquivo para analisar.

**A causa:** no Firebase, o arquivo fica no Storage, e o Storage não deixa o navegador baixá-lo de volta (regra chamada CORS). Para contornar, o sistema pede o arquivo à função do servidor **lerArquivo**, e é ela que não está respondendo. Isso acontece por um destes motivos, em ordem de probabilidade:
1. As funções não foram publicadas (o deploy das funções falhou ou foi pulado).
2. O Google Cloud da Kinsey bloqueia o acesso público às funções (política da organização). O sistema confere o login dentro da função; o bloqueio impede até a chegada do pedido.
3. O plano do Firebase não é o Blaze, ou a conta de faturamento está suspensa (sem Blaze não há funções).

**A solução definitiva e mais simples é o passo 5:** liberar o Storage para o endereço do sistema. Com isso o navegador lê os arquivos direto, sem depender da função. Recomendamos fazer os passos 1 a 6 em sequência (cerca de 20 minutos), no **Cloud Shell** (console.cloud.google.com › projeto **kinsey-capital-ma** › ícone **>_**).

---

## 1. Conferir a assinatura (plano e faturamento)
- **console.firebase.google.com** › projeto kinsey-capital-ma › engrenagem › **Uso e faturamento** › **Detalhes e configurações**: o plano deve ser **Blaze (pagamento por uso)**. Se estiver **Spark**, clique em "Modificar plano" e escolha Blaze.
- **console.cloud.google.com** › **Faturamento**: a conta de faturamento deve estar **ativa** e **vinculada** ao projeto kinsey-capital-ma (sem cartão recusado ou pagamento pendente).
- Custo esperado para o uso atual: muito baixo (centavos a poucos reais por mês). Se quiser, crie um alerta de orçamento em Faturamento › Orçamentos e alertas.

## 2. Publicar a versão 3.20 (deploy completo)
Envie o **KinseyTec_MA_Firebase.zip** da versão 3.20 ao Cloud Shell e rode, um de cada vez:
```bash
rm -rf kinseytec-ma && unzip -o KinseyTec_MA_Firebase.zip -d kinseytec-ma && cd kinseytec-ma/firebase
```
```bash
npx -y firebase-tools@13 login --no-localhost
```
```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma
```
**Leia o final da saída.** Se aparecer erro em "functions", anote a mensagem. Os mais comuns:
- *billing / Blaze* → volte ao passo 1;
- *API not enabled* (Cloud Functions, Cloud Build, Artifact Registry, Cloud Run, Eventarc, Secret Manager) → responda **Y** quando perguntar se deve ativar, e rode o deploy de novo;
- *permission denied* → use a conta proprietária do projeto;
- pedido de ECONODATA_TOKEN, RAMPER_TOKEN ou LEMITTI_TOKEN → digite **nao configurado**;
- "Would you like to proceed with deletion?" → **N**.

## 3. Conferir se as funções estão no ar
```bash
npx -y firebase-tools@13 functions:list --project kinsey-capital-ma
```
A lista deve ter **lerArquivo** e **convidar**, na região **southamerica-east1**. Se não tiverem, publique só as funções e mande a mensagem de erro:
```bash
npx -y firebase-tools@13 deploy --only functions --project kinsey-capital-ma
```

## 4. Liberar o acesso às funções (política da organização)
Confira se as funções aceitam chamadas do sistema:
```bash
gcloud run services get-iam-policy lerarquivo --region=southamerica-east1 --project=kinsey-capital-ma
```
O resultado deve conter `allUsers` com `roles/run.invoker`. Se não contiver, rode:
```bash
gcloud run services add-iam-policy-binding lerarquivo --region=southamerica-east1 --member=allUsers --role=roles/run.invoker --project=kinsey-capital-ma
```
```bash
gcloud run services add-iam-policy-binding convidar --region=southamerica-east1 --member=allUsers --role=roles/run.invoker --project=kinsey-capital-ma
```
É seguro: a função só entrega arquivos a quem está logado no sistema, com perfil e cliente corretos.

Se aparecer o erro *"do not belong to a permitted customer"* (ou *iam.allowedPolicyMemberDomains*), a organização da Kinsey restringe o compartilhamento por domínio. O administrador do Google Cloud ou Workspace precisa abrir **IAM e administrador › Políticas da organização › "Compartilhamento restrito de domínio"**, personalizar **só para o projeto kinsey-capital-ma** e permitir todos; depois, rode de novo os dois comandos acima.

## 5. Liberar o Storage para o endereço do sistema (solução definitiva)
Descubra o nome do bucket:
```bash
gcloud storage buckets list --project=kinsey-capital-ma --format="value(name)"
```
Crie a regra e aplique, trocando NOME_DO_BUCKET pelo nome que apareceu (termina em `.firebasestorage.app` ou `.appspot.com`):
```bash
echo '[{"origin":["https://kinseytec-ma.web.app","https://kinseytec-ma.firebaseapp.com","https://kinsey-capital-ma.web.app","https://kinsey-capital-ma.firebaseapp.com"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json
```
```bash
gcloud storage buckets update gs://NOME_DO_BUCKET --cors-file=cors.json
```
Conferir:
```bash
gcloud storage buckets describe gs://NOME_DO_BUCKET --format="default(cors_config)"
```
É seguro: a regra só permite que **o endereço do sistema** baixe arquivos, e cada arquivo continua exigindo o link protegido e as regras de acesso do Storage. Se o sistema for acessado por outro domínio, inclua-o na lista.

## 6. Conferir no sistema
1. Atualize a página (no celular, feche e abra o app).
2. Abra o **Valuation** ou a **Importação de documentos** da Futura e toque em **Diagnóstico do Firebase**. O esperado é:
   - ✓ Banco de dados;
   - ✓ Função lerArquivo publicada;
   - ✓ Download direto do Storage (CORS) liberado;
   - ✓ Leitura de um documento pelo servidor;
   - ✓ Função convidar.
3. Toque em **Analisar documentos do dossiê**. Os balanços entram na Due Diligence e o valuation aparece.
4. Se ainda houver ✗, toque em **Copiar diagnóstico** e envie ao suporte, junto com os registros da função:
```bash
gcloud functions logs read lerArquivo --region=southamerica-east1 --gen2 --limit=30 --project=kinsey-capital-ma
```

---

**Resumo:** o passo 5 (Storage liberado para o endereço do sistema) já faz a leitura funcionar mesmo que a função falhe. Os passos 1 a 4 deixam a função pronta como segunda via e para os convites. Nada disso apaga dados.
