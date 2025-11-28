/**
 * Templates base para petições jurídicas
 */

export const TEMPLATE_PETICAO_INICIAL = `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA __ª VARA CÍVEL DA COMARCA DE ________

[Nome do Autor], [nacionalidade], [estado civil], [profissão], portador do CPF nº [número], residente e domiciliado na [endereço completo], por seu advogado que esta subscreve, com escritório à [endereço do escritório], onde recebe intimações, nos termos da procuração anexa, vem, respeitosamente, à presença de Vossa Excelência, propor a presente

AÇÃO REVISIONAL DE CONTRATO BANCÁRIO

em face de [Nome da Instituição Financeira], pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [número], com sede na [endereço completo], pelos fatos e fundamentos jurídicos a seguir expostos:

I - DOS FATOS

O Autor celebrou com o Réu contrato de [tipo de contrato] em [data], conforme documento anexo.

[Continuar descrevendo os fatos relevantes...]

II - DO DIREITO

[Fundamentação jurídica...]

III - DOS PEDIDOS

Diante do exposto, requer:

a) A citação do Réu para, querendo, apresentar contestação;
b) A revisão das cláusulas contratuais abusivas;
c) A condenação do Réu ao pagamento das custas processuais e honorários advocatícios;

Nestes termos,
Pede deferimento.

[Cidade], [data].

[Nome do Advogado]
OAB/[UF] nº [número]`;

export const TEMPLATE_CONTESTACAO = `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA __ª VARA CÍVEL DA COMARCA DE ________

Processo nº [número do processo]

[Nome do Réu], já qualificado nos autos da ação [tipo de ação] que lhe move [Nome do Autor], vem, por seu advogado que esta subscreve, apresentar

CONTESTAÇÃO

pelos fatos e fundamentos que passa a expor:

I - DOS FATOS

[Expor os fatos conforme versão do réu...]

II - DO DIREITO

[Fundamentação jurídica da defesa...]

III - DOS PEDIDOS

Diante do exposto, requer:

a) O acolhimento da presente contestação;
b) A improcedência total dos pedidos formulados pelo Autor;
c) A condenação do Autor ao pagamento das custas processuais e honorários advocatícios;

Nestes termos,
Pede deferimento.

[Cidade], [data].

[Nome do Advogado]
OAB/[UF] nº [número]`;

export const TEMPLATE_RECURSO = `EXCELENTÍSSIMO SENHOR DOUTOR DESEMBARGADOR RELATOR DO TRIBUNAL DE JUSTIÇA DO ESTADO DE ________

Processo nº [número do processo]

[Nome do Recorrente], já qualificado nos autos da ação [tipo de ação], vem, por seu advogado que esta subscreve, apresentar

RECURSO DE APELAÇÃO

em face da r. sentença de fls. [número], que [descrever dispositivo da sentença], pelos fundamentos que passa a expor:

I - DO CABIMENTO

[Fundamentar o cabimento do recurso...]

II - DOS FATOS

[Expor os fatos relevantes...]

III - DO DIREITO

[Fundamentação jurídica do recurso...]

IV - DOS PEDIDOS

Diante do exposto, requer:

a) O conhecimento e provimento do presente recurso;
b) A reforma da sentença recorrida;

Nestes termos,
Pede deferimento.

[Cidade], [data].

[Nome do Advogado]
OAB/[UF] nº [número]`;

export const TEMPLATE_MEMORIAL = `EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA __ª VARA CÍVEL DA COMARCA DE ________

Processo nº [número do processo]

[Nome da Parte], já qualificado nos autos, vem, por seu advogado que esta subscreve, apresentar

MEMORIAL

conforme autorizado às fls. [número], com os seguintes fundamentos:

I - SÍNTESE DO PROCESSO

[Breve resumo do processo...]

II - ARGUMENTAÇÃO

[Argumentação detalhada...]

III - CONCLUSÃO

[Conclusão e pedidos finais...]

Nestes termos,
Pede deferimento.

[Cidade], [data].

[Nome do Advogado]
OAB/[UF] nº [número]`;
