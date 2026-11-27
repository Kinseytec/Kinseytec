# KinseyTec – M&A · tutorial para republicar (versão 3.28)

O sistema já está publicado. Republicar **substitui** a versão no ar e **não apaga nenhum dado**: empresas, documentos, balancetes, análises e usuários continuam. Tempo: cerca de 10 minutos, tudo no navegador.

Arquivo: **KinseyTec_MA_Firebase.zip** (está dentro do pacote KinseyTec_MA_publicacao_v3.28.zip; não envie o pacote inteiro, só este arquivo).

## Seus dados ficam guardados (o que a publicação troca e o que não troca)
| O que | Onde fica | Na publicação |
|---|---|---|
| Sistema (telas e regras de cálculo) | Firebase Hosting | **substituído** pela versão nova |
| Funções do servidor (leitura de documentos, convites, cotações) | Cloud Functions | **substituídas** pela versão nova |
| Regras de acesso | Firestore e Storage | **atualizadas** (só dizem quem pode ler e gravar; não apagam nada) |
| Clientes, empresas, prospecção, listas, balancetes, análises, contratos, pareceres | Banco Firestore | **não é tocado** |
| Documentos importados (PDF, Excel, ECD…) | Firebase Storage | **não é tocado** |
| Contas e senhas dos usuários | Firebase Authentication | **não é tocado** |

Camadas de proteção (ligadas pelo script do passo 4, uma única vez):
- **Recuperação a um ponto no tempo** do banco: volta o banco a qualquer minuto dos últimos 7 dias;
- **Backup automático diário** do banco, guardado por 7 dias;
- **Backup antes de cada publicação**: o sistema guarda **o último e o penúltimo**; os mais antigos são removidos sozinhos;
- **Lixeira do Storage**: um documento apagado fica recuperável por 30 dias;
- **Exportação completa e datada** do banco antes de cada publicação;
- No sistema: **Usuários e convites › Backup e segurança dos dados › Baixar backup do cliente (JSON)**, para uma cópia extra no computador.

No próprio sistema, nenhuma rotina automática apaga dados: excluir só acontece por ação de um usuário, com confirmação.

## Republicar agora (passo a passo)
1. Entre em **console.cloud.google.com** com a conta da Kinsey e escolha o projeto **kinsey-capital-ma** no topo.
2. Clique no ícone **>_** (*Ativar o Cloud Shell*), no canto superior direito. Abre um terminal embaixo.
3. No terminal, clique em **⋮ → Fazer upload** e envie o **KinseyTec_MA_Firebase.zip**.
4. Copie e cole os 4 comandos, um de cada vez, apertando Enter depois de cada um:

```bash
rm -rf kinseytec-ma && unzip -o KinseyTec_MA_Firebase.zip -d kinseytec-ma && cd kinseytec-ma/firebase
```
```bash
npx -y firebase-tools@13 login --no-localhost
```
(Se aparecer um link: abra, entre com a conta da Kinsey, copie o código e cole no terminal. Se disser que já está logado, siga em frente.)

**Backup antes de publicar** (liga as proteções na primeira vez e exporta o banco; leva 1 a 3 minutos):
```bash
bash backup_antes_de_publicar.sh kinsey-capital-ma
```

```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma
```

5. Pronto quando aparecer **Deploy complete!**. Atualize a página do sistema; no celular, feche e abra o aplicativo.

## Importante nesta versão (3.28, inclui as versões 3.03 a 3.27)
Esta versão corrige o problema de os documentos não serem reconhecidos nem analisados no sistema publicado. **As funções precisam ser publicadas junto** (o comando de deploy acima já publica tudo): a leitura dos arquivos agora passa por uma função nova do servidor, chamada **lerArquivo**. Se o deploy das funções falhar, me envie a mensagem: sem ela, a análise automática continua sem conseguir abrir os documentos guardados.

**Assinatura:** as funções só rodam no plano Blaze; confira em Firebase › Uso e faturamento (passo 1 do tutorial "Resolver a leitura automática dos documentos"). O que acontecia:
1. **Storage sem liberação de download para o navegador (CORS):** o sistema guardava o documento, mas não conseguia abri-lo de novo para analisar. Agora o servidor entrega o arquivo ao sistema.
2. **Limite de 1 MB por registro do Firestore:** o ECD mês a mês, gravado dentro do cadastro da empresa, podia passar desse limite e travar todas as gravações daquela empresa. Agora cada balancete tem registro próprio; os dados antigos são migrados sozinhos na primeira abertura.

**Recomendado (resolve a leitura mesmo se a função falhar):** liberar o download direto do Storage para o endereço do sistema. O passo a passo completo está no tutorial "Resolver a leitura automática dos documentos". No mesmo Cloud Shell, rode:

```bash
echo '[{"origin":["https://kinseytec-ma.web.app","https://kinseytec-ma.firebaseapp.com","https://kinsey-capital-ma.web.app","https://kinsey-capital-ma.firebaseapp.com"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json && gcloud storage buckets update gs://$(gcloud storage buckets list --project kinsey-capital-ma --format="value(name)" | grep -E "firebasestorage.app|appspot.com" | head -1) --cors-file=cors.json
```
(Se o sistema for acessado por outro domínio, me avise para incluir. Com este passo a leitura funciona mesmo se a função do servidor falhar.)

## Documentos importados: como ficam guardados
Todo arquivo importado fica no Storage do Firebase da Kinsey, separado por cliente, por empresa e pela natureza do documento, com a data e o nome original:

`evidences/<cliente>/<EMPRESA>_<código>/<natureza>/<AAAA-MM-DD>_<nome original>`

| Pasta | Natureza | Exemplos |
|---|---|---|
| 01 | Financeiro e contábil | balanço, DRE, balancete, ECD, razão, relatório de auditoria |
| 02 | Fiscal e tributário | ECF, EFD, certidões, guias, parcelamentos, notas fiscais |
| 03 | Trabalhista e previdenciário | folha, eSocial, FGTS, INSS, CAGED |
| 04 | Societário | contrato social, alterações, estatuto, atas, acordo de sócios, cartão CNPJ |
| 05 | Jurídico e contratos | NDA, mandato, IOI, LOI, MOU, SPA, contratos, processos, pareceres |
| 06 | Valuation e laudos | laudos, avaliações, estudos de viabilidade, projeções |
| 07 | Comercial e apresentações | teaser, apresentação institucional, comunicados |
| 08 | Ativos e imóveis | matrícula, escritura, IPTU, inventário, fotos de visita |
| 99 | Outros | documentos sem natureza reconhecida |

- Em **Importação de documentos**, escolha a empresa: junto do sininho aparece **Arquivo do dossiê**, com os documentos agrupados por natureza e o botão **Baixar o dossiê organizado (.zip)**, já nas pastas.
- Documentos enviados antes da versão 3.28 continuam onde estão (nada é movido nem apagado) e aparecem organizados do mesmo jeito na tela e no .zip.
- Publicar uma nova versão não mexe nos documentos nem no banco.

## Convites de novos usuários (enviados pelo próprio sistema)
1. Em **Usuários e convites**, preencha e-mail, nome, perfil, cliente e WhatsApp e toque em **Convidar**. O sistema cria o acesso e prepara a mensagem com o link para criar a senha.
2. Escolha como enviar:
   - **Enviar por e-mail**: abre o seu aplicativo de e-mail (Outlook, Mail do iPhone etc.) com destinatário, assunto e mensagem prontos; é só tocar em Enviar. A mensagem sai do **seu e-mail da Kinsey**, então não cai como spam.
   - **Abrir no Gmail**: o mesmo, pelo Gmail no navegador.
   - **Enviar por WhatsApp**: abre a conversa com a mensagem pronta.
3. O link de senha vale por **1 hora**. Se expirar, a pessoa usa **"Esqueci a senha"** na tela de entrada, ou você toca em **Reenviar** na lista de usuários.
4. O botão **E-mail automático do Firebase** continua disponível como alternativa (sai de noreply@kinsey-capital-ma.firebaseapp.com).

No console do Firebase, confira só uma vez: **Authentication › Sign-in method › E-mail/senha** ativado e **Domínios autorizados** com kinseytec-ma.web.app. O link de senha depende da função **convidar** publicada (a publicação automática cuida disso); sem ela, a mensagem leva o endereço do sistema e o passo "Primeiro acesso".

## Se aparecer alguma pergunta
- **"Would you like to proceed with deletion?"** (apagar funções antigas): responda **N**.
- **Pergunta sobre apagar índices do Firestore** ("delete these indexes?"): responda **N**. (Índices só aceleram consultas; mesmo assim, não apague.)
- **Pede ECONODATA_TOKEN, RAMPER_TOKEN ou LEMITTI_TOKEN:** digite **nao configurado** (ou a chave oficial, se já tiver).
- **Erro só nas funções:** rode o comando abaixo para publicar o restante e me envie a mensagem de erro (nesta versão a função lerArquivo é necessária para analisar os documentos).

```bash
npx -y firebase-tools@13 deploy --project kinsey-capital-ma --only hosting,firestore,storage
```

## Conferência (2 minutos)
- **Prospecção:** abas Prospecção, Cadastros gerais de times, Importações gerais e Fora da política; em Fora da política, use "Mover para o standby" para a base importada antes da regra.
- **Usuários e convites:** convide um e-mail de teste; a tela mostra "E-mail enviado" e o botão "Enviar por WhatsApp".
- **Faixa do mercado:** PIB, Ibovespa e Bitcoin; com a Tallenty ou a Futura em consulta, aparecem as 5 principais ações do setor. As cotações das ações são gravadas pelo servidor a cada 30 minutos no pregão; para atualizar na hora, use Indicadores › Atualizar agora (administrador).
- **Valuation da Tallenty:** sem pedir importação; aparece o valor da empresa a partir dos balanços do dossiê (ou o botão "Analisar documentos do dossiê").
- **Fechar:** em qualquer área, × no canto superior direito e "Fechar esta tela" no fim.
- **Due Diligence › Workbook preenchido (Excel):** a planilha já vem com Sumário, Posição patrimonial, DRE, Análise do EBITDA, Capital de giro, Endividamento e os ajustes do sistema.
- **Due Diligence da Tallenty:** ao abrir, aparece "Analisando N documento(s) importados no início" e, em seguida, os balanços no quadro "Balanços, balancetes e relatórios".
- **Órbita:** linha pontilhada entre cada target e os investidores indicados; tocar na linha mostra o par com os dossiês.
- **Prospecção:** acima da busca, filtros "Segmento empresarial", "Região do Brasil" e "Estado (UF)"; na ficha da empresa, o segmento pode ser trocado.
- **Base inicial → Importação de documentos:** escolha a Tallenty ou a Futura; aparece o **sininho** (amarelo: sem documentos; vermelho: documento com problema ou faltando; verde: tudo certo). Toque nele para ver os pontos; o botão **Analisar documentos** fica ao lado.
- Na primeira abertura depois de republicar, os documentos já enviados são lidos de novo, uma vez, e os números aparecem no dossiê, na Due Diligence e no valuation.
- O menu tem **Pós-aquisição** (PPA) e, logo depois, **Impairment**, com a pergunta "Cliente da Órbita?".
- **Base inicial:** botões "Importação de documentos" e "Analisar documentos importados"; documento não reconhecido aparece "A confirmar" com Ver, Aprovar e Excluir.
- **Dossiê da Tallenty:** o "Resumo para o investidor" mostra faturamento, EBITDA e faixa de valuation (o sistema lê os documentos do dossiê ao abrir).
- **Jurídico:** abas "Validação dos documentos" e "Parecer do advogado".

## Publicação automática (o jeito mais simples: configurar uma única vez, cerca de 10 minutos)
Depois disso, **vocês não fazem mais nada**: pedem a atualização aqui, a nova versão é enviada e o sistema se atualiza sozinho em 5 a 10 minutos, com backup antes. **Não usa chave nem senha:** o GitHub entra no Google Cloud pela federação de identidade, e só este repositório pode publicar.

**Passo 1 · No Cloud Shell** (console.cloud.google.com › projeto kinsey-capital-ma › ícone **>_**, com a conta proprietária do projeto). Envie o arquivo **configurar_publicacao_automatica.sh** (está no pacote) pelo menu ⋮ › Fazer upload e rode:
```bash
bash configurar_publicacao_automatica.sh kinsey-capital-ma kinseytec/kinseytec
```
No final ele mostra **dois valores**. Deixe a tela aberta.

**Passo 2 · No GitHub**, repositório kinseytec/kinseytec › **Settings › Secrets and variables › Actions › aba Variables › New repository variable**. Crie as duas, copiando os valores do passo 1:
- **GCP_WIF_PROVIDER**
- **GCP_SERVICE_ACCOUNT**

(São endereços, não senhas. Mesmo assim, não precisa enviá-los por mensagem.)

**Pronto.** A partir daí:
1. Vocês pedem a mudança aqui, na conversa de desenvolvimento.
2. A nova versão é enviada ao repositório.
3. O GitHub monta e testa o sistema, faz o backup do banco, publica e confere site, banco e leitura de documentos.
4. Em 5 a 10 minutos a nova versão está no ar. No celular, feche e abra o app.

Para acompanhar: GitHub › **Actions › Publicar KinseyTec M&A** (verde = publicado; o resumo mostra site, banco e função de leitura). Para publicar de novo sem mudanças: **Run workflow**.

**Backups mantidos (segurança):**
| Proteção | Quanto guarda |
|---|---|
| Backup antes de cada publicação | o **último e o penúltimo** |
| Backup automático diário do banco | 7 dias |
| Recuperação a um ponto no tempo (PITR) | qualquer minuto dos últimos 7 dias |
| Lixeira do Storage (documentos) | 30 dias |

A publicação troca só as telas e as funções. Empresas, contas, balancetes, listas e documentos ficam no banco e no Storage e não são apagados.

Se o resumo mostrar o aviso "acesso público bloqueado (política da organização)", o administrador do Google Cloud ou Workspace libera a exceção só para o projeto kinsey-capital-ma (IAM e administrador › Políticas da organização › "Compartilhamento restrito de domínio").

Enquanto isso não for feito, continue republicando pelo passo a passo acima.
