# KinseyTec – SDR

Sistema de prospecção comercial das SDRs da Kinsey BR: auditoria e contabilidade, consultoria e BPO, Due Diligence e Valuation.

- Construir: `python3 ferramentas/construir.py sdr comercial` (gera `dist/sdr/comercial/` e `dist/KinseyTec_SDR_Firebase.zip`).
- Projeto Firebase próprio: `kinseytec-sdr` (acesso e endereço separados do M&A).
- O motor de prospecção é o mesmo do KinseyTec M&A (`produtos/ma/segmentos/capital/app/prospeccao.js`, em modo `sdr`), compartilhado pelo campo `compartilha` do `seg.json`: melhorias valem para os dois sistemas.
- Ponte com o M&A: leads marcados com "Interesse em M&A" saem em "Leads para o M&A" no formato de importação da Prospecção do M&A (sem duplicar empresas).
- Comissão de SDR: 5% sobre serviços fechados das reuniões que a SDR agendou (regra provisória até a política comercial).
