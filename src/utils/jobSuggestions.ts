/**
 * @file src/utils/jobSuggestions.ts
 * @description Catálogo de modelos de descrição e requisitos rápidos por ocupação para agilizar a publicação de vagas.
 */

import type { ContractType, ExperienceLevel } from '../types/brickjobs';

export interface JobSuggestionTemplate {
  id: string;
  titulo: string;
  descricao: string;
  requisitos: string[];
  requiredCompetencies: string[];
  preferredCompetencies: string[];
}

export interface SuggestionContext {
  experienceLevel?: ExperienceLevel;
  contractType?: ContractType;
  neighborhood?: string;
}

interface RolePreset {
  templates: Array<{
    id: string;
    titulo: string;
    baseDescricao: string;
    baseRequisitos: string[];
  }>;
  quickRequirements: string[];
  requiredCompetencies?: string[];
  preferredCompetencies?: string[];
}

const ROLE_PRESETS: Record<string, RolePreset> = {
  Pedreiro: {
    templates: [
      {
        id: 'pedreiro-alvenaria',
        titulo: 'Alvenaria e Reboco',
        baseDescricao:
          'Execução de alvenaria estrutural e de vedação, chapisco, emboço, reboco interno/externo e contrapiso seguindo alinhamento, prumo e nível do projeto.',
        baseRequisitos: [
          'Prática em assentamento de blocos e tijolos no prumo e nível',
          'Uso obrigatório de EPIs e cumprimento das normas de segurança do canteiro',
        ],
      },
      {
        id: 'pedreiro-acabamento',
        titulo: 'Fundação e Acabamento',
        baseDescricao:
          'Abertura e concretagem de sapatas/baldrames, impermeabilização, regularização de pisos e reparos finos para entrega de obra residencial ou comercial.',
        baseRequisitos: [
          'Vivência com traço de argamassa e leitura básica de planta baixa',
          'Compromisso com prazos, limpeza da frente de serviço e trabalho em equipe',
        ],
      },
    ],
    quickRequirements: [
      'Leitura básica de planta',
      'Alvenaria estrutural',
      'Ferramentas próprias básicas',
      'Disponibilidade imediata',
    ],
    requiredCompetencies: [
      'Prática em alvenaria no prumo e nível',
      'Uso obrigatório de EPIs (NR-06 e NR-18)',
    ],
    preferredCompetencies: [
      'Leitura básica de planta arquitetônica',
      'Ferramentas manuais próprias',
    ],
  },
  'Servente de Obras': {
    templates: [
      {
        id: 'servente-apoio',
        titulo: 'Apoio Geral de Canteiro',
        baseDescricao:
          'Auxílio direto a pedreiros, armadores e carpinteiros no preparo de massa/concreto, transporte de materiais e organização contínua das frentes de obra.',
        baseRequisitos: [
          'Disposição física para carga e descarga de materiais',
          'Pontualidade, atenção às orientações do mestre e uso correto de EPIs',
        ],
      },
      {
        id: 'servente-infra',
        titulo: 'Escavação e Limpeza Técnica',
        baseDescricao:
          'Abertura de valas, apiloamento de solo, remoção de entulhos, lavagem de áreas técnicas e suporte na concretagem de lajes e pilares.',
        baseRequisitos: [
          'Facilidade para trabalhar em equipe no canteiro',
          'Zelo pelas ferramentas e organização do estoque de insumos',
        ],
      },
    ],
    quickRequirements: [
      'Não exige experiência prévia',
      'Uso obrigatório de EPIs',
      'Disponibilidade para início imediato',
      'Residir fácil em Rondonópolis',
    ],
  },
  'Mestre de Obras': {
    templates: [
      {
        id: 'mestre-lideranca',
        titulo: 'Gestão de Equipes e Cronograma',
        baseDescricao:
          'Coordenação diária das frentes de alvenaria, estrutura e acabamento, distribuição de tarefas, conferência de qualidade e acompanhamento do cronograma físico da obra.',
        baseRequisitos: [
          'Domínio na leitura e interpretação de projetos arquitetônicos e estruturais',
          'Liderança de equipes próprias e terceirizadas com controle de produtividade',
        ],
      },
      {
        id: 'mestre-seguranca',
        titulo: 'Controle Técnico e Materiais',
        baseDescricao:
          'Fiscalização da execução técnica, levantamento de pedidos de materiais sem desperdício, interface com engenharia e garantia das normas NR-18 no canteiro.',
        baseRequisitos: [
          'Experiência comprovada em obras residenciais, comerciais ou galpões',
          'Organização de diário de obra e controle rigoroso de prumo, nível e esquadro',
        ],
      },
    ],
    quickRequirements: [
      'Leitura completa de projetos',
      'Gestão de 15+ colaboradores',
      'Conhecimento em NR-18',
      'CNH categoria B',
    ],
  },
  'Armador de Ferragem': {
    templates: [
      {
        id: 'armador-estrutura',
        titulo: 'Corte, Dobra e Montagem',
        baseDescricao:
          'Leitura de detalhamento estrutural, corte, dobra e amarração de aço CA-50/CA-60 para sapatas, vigas, pilares e lajes em obras de pequeno a grande porte.',
        baseRequisitos: [
          'Interpretação de projetos estruturais e tabelas de ferragem',
          'Agilidade e precisão na amarração com arame recozido e espaçadores',
        ],
      },
      {
        id: 'armador-galpao',
        titulo: 'Estrutura Pesada e Pré-Moldados',
        baseDescricao:
          'Montagem de armaduras pesadas para fundações profundas, blocos de coroamento, muros de arrimo e estruturas industriais com foco em qualidade e segurança.',
        baseRequisitos: [
          'Experiência com bancada de dobra e guincho/movimentação segura de aço',
          'Atenção rigorosa às bitolas, cobrimentos e normas de segurança',
        ],
      },
    ],
    quickRequirements: [
      'Leitura de projeto estrutural',
      'Experiência em ferragem pesada',
      'NR-35 (trabalho em altura)',
      'Ferramentas de corte e dobra',
    ],
  },
  Carpinteiro: {
    templates: [
      {
        id: 'carpinteiro-forma',
        titulo: 'Fôrmas e Escoramentos',
        baseDescricao:
          'Montagem, escoramento, nivelamento e desforma de caixarias em madeira ou painel compensado para pilares, vigas, escadas e lajes.',
        baseRequisitos: [
          'Conhecimento em nível, prumo, esquadro e escoramento metálico/madeira',
          'Manuseio seguro de serra circular de bancada e ferramentas manuais',
        ],
      },
      {
        id: 'carpinteiro-cobertura',
        titulo: 'Telhados e Madeiramento',
        baseDescricao:
          'Confecção e instalação de tesouras, caibros, ripas, pergolados e estruturas de cobertura garantindo vedação, caimento correto e acabamento limpo.',
        baseRequisitos: [
          'Prática em cortes de encaixe, alinhamento de telhado e segurança em altura',
          'Zelo pela precisão dimensional e aproveitamento de madeira',
        ],
      },
    ],
    quickRequirements: [
      'Montagem de fôrmas de laje',
      'NR-35 trabalho em altura',
      'Operação de serra circular',
      'Leitura de planta de fôrmas',
    ],
    requiredCompetencies: [
      'Prática em montagem de fôrmas e escoramentos',
      'Cumprimento de NR-12 e NR-35',
    ],
    preferredCompetencies: [
      'Execução de telhados e estruturas em Wood Frame',
      'Leitura de projeto de fôrmas',
    ],
  },
  'Montador de Pré-Moldados': {
    templates: [
      {
        id: 'premoldado-galpao',
        titulo: 'Montagem Estrutural Industrial',
        baseDescricao:
          'Içamento, posicionamento, prumo e grauteamento de pilares, vigas protendidas, tesouras e painéis pré-moldados em galpões industriais e logísticos.',
        baseRequisitos: [
          'Certificação NR-35 (trabalho em altura) e NR-11 (movimentação de cargas) válidas',
          'Leitura de projeto de montagem e cumprimento rigoroso de plano de rigging (NR-18)',
        ],
      },
      {
        id: 'premoldado-lajes',
        titulo: 'Lajes Alveolares e Fechamentos',
        baseDescricao:
          'Instalação de lajes alveolares, placas de fechamento lateral, soldagem de chapas de ligação e vedação de juntas em obras pré-fabricadas.',
        baseRequisitos: [
          'Vivência com linha de vida, trava-quedas e plataforma elevatória (PTA/PEMT)',
          'Comunicação padronizada por sinais e rádio com operador de guindaste',
        ],
      },
    ],
    quickRequirements: [
      'Certificado NR-11 (Cargas)',
      'Certificado NR-35 (Altura)',
      'Leitura de plano de rigging',
      'Vivência em galpões industriais',
    ],
    requiredCompetencies: [
      'Certificação NR-11 e NR-35 atualizadas',
      'Leitura de projeto de montagem pré-moldada (NR-18)',
    ],
    preferredCompetencies: [
      'Experiência com lajes alveolares e vigas protendidas',
      'Operação de plataforma elevatória (PTA/PEMT)',
    ],
  },
  'Operador de Guindaste / Içamento': {
    templates: [
      {
        id: 'icamento-munck-guindaste',
        titulo: 'Içamento de Pré-Moldados e Cargas Pesadas',
        baseDescricao:
          'Operação de guindaste ou caminhão munck para descarga, içamento e posicionamento de peças pré-moldadas e estruturas metálicas em canteiros industriais.',
        baseRequisitos: [
          'CNH D ou E em dia e certificação NR-11 / NR-12 para equipamentos de guindar',
          'Interpretação de tabela de carga, nivelamento de patolas e inspeção de cintas/manilhas',
        ],
      },
      {
        id: 'icamento-ponte-rolante',
        titulo: 'Pátio Fabril e Ponte Rolante',
        baseDescricao:
          'Movimentação de formas metálicas, armaduras e elementos pré-fabricados em central industrial utilizando ponte rolante ou pórtico.',
        baseRequisitos: [
          'Atenção rigorosa ao isolamento de área de giro e checklist diário pré-operação',
          'Coordenação direta com sinaleiro/rigger conforme NR-11 e NR-18',
        ],
      },
    ],
    quickRequirements: [
      'Certificado NR-11 e NR-12',
      'CNH D ou E válida',
      'Interpretação de tabela de carga',
      'Plano de rigging e sinaleiro',
    ],
    requiredCompetencies: [
      'Habilitação e treinamento NR-11 / NR-12 em movimentação de cargas',
      'Leitura de tabela de carga e checklist de cintas/eslingas',
    ],
    preferredCompetencies: [
      'Experiência em içamento de pilares e vigas pré-moldadas',
      'Certificação de rigger ou sinaleiro industrial',
    ],
  },
  'Especialista em Construções Sustentáveis': {
    templates: [
      {
        id: 'sustentavel-steel-tijolo',
        titulo: 'Steel Frame e Tijolo Ecológico',
        baseDescricao:
          'Execução de edificações alternativas com tijolo ecológico (solo-cimento), Light Steel Frame, placas cimentícias e isolamento termoacústico com mínimo desperdício.',
        baseRequisitos: [
          'Domínio de montagem modulada, alinhamento a laser e fixação estrutural',
          'Uso rigoroso de respirador PFF2, óculos vedados e luva anticorte (NR-06 e NR-18)',
        ],
      },
      {
        id: 'sustentavel-bioconstrucao-agua',
        titulo: 'Bioconstrução, Reúso e Eficiência Energética',
        baseDescricao:
          'Implantação de sistemas construtivos de baixo impacto ambiental, cisternas de captação pluvial, telhados verdes e preparo de infraestrutura para energia solar.',
        baseRequisitos: [
          'Experiência prática em construção seca, drywall ou técnicas de bioconstrução',
          'Organização limpa do canteiro com triagem e reaproveitamento de resíduos',
        ],
      },
    ],
    quickRequirements: [
      'Prática em Steel Frame / Drywall',
      'Alvenaria com tijolo ecológico',
      'Uso de PFF2 e EPIs NR-06',
      'Captação pluvial e eficiência térmica',
    ],
    requiredCompetencies: [
      'Montagem de sistemas construtivos modulares ou solo-cimento',
      'Cumprimento de NR-06 e NR-18 contra poeira mineral e cortes',
    ],
    preferredCompetencies: [
      'Vivência com Light Steel Frame, drywall ou bioconstrução',
      'Noções de reúso de água pluvial e infraestrutura solar',
    ],
  },
  'Eletricista Predial': {
    templates: [
      {
        id: 'eletricista-infra',
        titulo: 'Infraestrutura e Cabeamento',
        baseDescricao:
          'Passagem de eletrodutos, enfiação, instalação de caixas de passagem, tomadas, interruptores e pontos de iluminação seguindo diagrama elétrico predial.',
        baseRequisitos: [
          'Certificação NR-10 válida e conhecimento da norma NBR 5410',
          'Leitura de diagramas elétricos e uso de multímetro/alicate amperímetro',
        ],
      },
      {
        id: 'eletricista-qdc',
        titulo: 'Quadros e Comandos',
        baseDescricao:
          'Montagem e balanceamento de quadros de distribuição (QDC), instalação de disjuntores, DR/DPS, aterramento e testes finais de carga e continuidade.',
        baseRequisitos: [
          'Experiência em montagem de quadros trifásicos e identificação de circuitos',
          'Organização, capricho no acabamento e cumprimento rigoroso de segurança',
        ],
      },
    ],
    quickRequirements: [
      'Certificado NR-10 atualizado',
      'NR-35 para áreas elevadas',
      'Leitura de projeto elétrico',
      'Ferramentas isoladas próprias',
    ],
  },
  'Instalações Elétricas': {
    templates: [
      {
        id: 'instalacoes-eletricas-obra',
        titulo: 'Instalações Elétricas Residenciais e Comerciais',
        baseDescricao:
          'Execução completa de instalações elétricas em obras novas e reformas, incluindo passagem de cabos, montagem de quadros de distribuição (QDC), padrões de entrada, aterramento e testes de carga conforme NBR 5410.',
        baseRequisitos: [
          'Certificado NR-10 válido e domínio das normas técnicas NBR 5410',
          'Experiência prática em dimensionamento de circuitos, DR/DPS e uso de instrumentos de medição',
        ],
      },
      {
        id: 'instalacoes-eletricas-industrial',
        titulo: 'Infraestrutura, Eletrocalhas e Comandos',
        baseDescricao:
          'Montagem de eletrocalhas, perfilados, leitos de cabos, painéis de força/comando e iluminação técnica para galpões comerciais e edificações de grande porte.',
        baseRequisitos: [
          'Leitura e interpretação de diagramas unifilares e projetos elétricos',
          'Certificação NR-35 para serviços em andaimes ou plataformas elevatórias',
        ],
      },
    ],
    quickRequirements: [
      'NR-10 atualizado',
      'Domínio de NBR 5410',
      'Montagem de QDC e aterramento',
      'NR-35 trabalho em altura',
    ],
  },
  'Manutenção de Redes Elétricas': {
    templates: [
      {
        id: 'redes-eletricas-preventiva',
        titulo: 'Manutenção Preventiva e Corretiva em Redes',
        baseDescricao:
          'Inspeção, manutenção preventiva e corretiva em redes elétricas de baixa e média tensão, reparo de alimentadores, substituição de chaves seccionadoras, disjuntores e diagnóstico de falhas de isolamento.',
        baseRequisitos: [
          'Certificação NR-10 básica e NR-10 SEP (Sistema Elétrico de Potência)',
          'Experiência em manutenção de redes aéreas/subterrâneas e testes com megômetro',
        ],
      },
      {
        id: 'redes-eletricas-emergencia',
        titulo: 'Pronto Atendimento e Subestações',
        baseDescricao:
          'Atendimento técnico a ocorrências de queda de fase, curto-circuito, balanceamento de carga, manutenção em transformadores e quadros gerais de baixa tensão (QGBT) em canteiros e galpões.',
        baseRequisitos: [
          'Curso NR-35 válido, uso rigoroso de vestimenta antichama e EPIs isolados',
          'CNH categoria B e disponibilidade para atendimentos programados',
        ],
      },
    ],
    quickRequirements: [
      'NR-10 SEP (Sistema Elétrico)',
      'NR-35 trabalho em altura',
      'Diagnóstico em média/baixa tensão',
      'CNH categoria B',
    ],
  },
  'Encanador / Hidráulico': {
    templates: [
      {
        id: 'encanador-prumadas',
        titulo: 'Água Fria, Quente e Esgoto',
        baseDescricao:
          'Instalação de prumadas de água fria, água quente (PPR/CPVC), redes de esgoto, drenagem pluvial e testes de estanqueidade antes do fechamento das paredes.',
        baseRequisitos: [
          'Leitura de projetos hidrossanitários e isométricos',
          'Domínio em soldagem de PVC, termofusão e testes de pressão',
        ],
      },
      {
        id: 'encanador-loucas',
        titulo: 'Acabamento e Louças Sanitárias',
        baseDescricao:
          'Instalação de registros, torneiras, vasos sanitários, bancadas, caixas d’água, bombas de recalque e manutenção preventiva em rede predial.',
        baseRequisitos: [
          'Cuidado com acabamentos finos e vedação livre de vazamentos',
          'Vivência com prevenção e combate a incêndio (hidrantes)',
        ],
      },
    ],
    quickRequirements: [
      'Termofusão e PPR/CPVC',
      'Leitura de projeto hidráulico',
      'Teste de estanqueidade',
      'Instalação de louças e metais',
    ],
  },
  'Pintor Predial': {
    templates: [
      {
        id: 'pintor-interno',
        titulo: 'Massa Corrida e Acabamento Interno',
        baseDescricao:
          'Preparação de superfícies, lixamento fino, aplicação de selador, massa corrida/acrílica e pintura látex ou acrílica com recorte limpo e uniforme.',
        baseRequisitos: [
          'Experiência com acabamento fino em paredes, tetos e esquadrias',
          'Limpeza e proteção de pisos, rodapés e vidros durante a execução',
        ],
      },
      {
        id: 'pintor-fachada',
        titulo: 'Fachadas, Texturas e Epóxi',
        baseDescricao:
          'Aplicação de textura, grafiato, pintura externa de fachadas em balancim/andaime e pintura epóxi em pisos industriais ou garagens.',
        baseRequisitos: [
          'Certificado NR-35 para pintura em altura/andaimes',
          'Conhecimento na diluição correta de tintas e proteção de áreas vizinhas',
        ],
      },
    ],
    quickRequirements: [
      'NR-35 trabalho em altura',
      'Acabamento fino em massa corrida',
      'Aplicação com Airless',
      'Pintura epóxi e esmalte',
    ],
  },
  'Azulejista / Revestidor': {
    templates: [
      {
        id: 'azulejista-porcelanato',
        titulo: 'Porcelanato e Grandes Formatos',
        baseDescricao:
          'Assentamento de porcelanato, cerâmica e revestimentos de grandes formatos em pisos e paredes utilizando niveladores, corte em 45° (meia-esquadria) e rejuntamento.',
        baseRequisitos: [
          'Domínio de paginação, alinhamento de juntas e caimentos de áreas molhadas',
          'Experiência com argamassa colante AC-II / AC-III e niveladores',
        ],
      },
      {
        id: 'azulejista-pastilhas',
        titulo: 'Áreas Molhadas e Fachadas',
        baseDescricao:
          'Revestimento completo de banheiros, cozinhas, sacadas e piscinas com atenção à impermeabilização prévia, rodapés embutidos e acabamento limpo.',
        baseRequisitos: [
          'Precisão no corte com riscadeira e serra mármore',
          'Compromisso com esquadro perfeito e zero peças ocas',
        ],
      },
    ],
    quickRequirements: [
      'Corte em meia-esquadria (45°)',
      'Experiência com grandes formatos',
      'Leitura de paginação de piso',
      'Ferramentas de corte próprias',
    ],
  },
  'Operador de Máquinas': {
    templates: [
      {
        id: 'operador-terraplanagem',
        titulo: 'Retroescavadeira e Escavadeira',
        baseDescricao:
          'Operação de retroescavadeira, escavadeira hidráulica ou pá carregadeira em serviços de terraplanagem, abertura de valas, nivelamento e carregamento de caminhões.',
        baseRequisitos: [
          'CNH categoria C, D ou E compatível e certificação de operador (NR-11/NR-12)',
          'Checklist diário preventivo do equipamento e atenção à segurança no pátio',
        ],
      },
      {
        id: 'operador-compactacao',
        titulo: 'Movimentação e Compactação',
        baseDescricao:
          'Operação de minicarregadeira (Bobcat), rolo compactador ou empilhadeira em canteiros urbanos e industriais seguindo sinalização e limites de carga.',
        baseRequisitos: [
          'Experiência comprovada em operação segura próxima a equipes de solo',
          'Zelo pela conservação, lubrificação e registro de horímetro',
        ],
      },
    ],
    quickRequirements: [
      'CNH D ou E em dia',
      'Certificado NR-11 / NR-12',
      'Experiência em terraplanagem',
      'Disponibilidade para obra integral',
    ],
  },
  'Soldador / Serralheiro': {
    templates: [
      {
        id: 'soldador-estrutura',
        titulo: 'Estruturas Metálicas e Solda',
        baseDescricao:
          'Corte, montagem e soldagem (eletrodo revestido, MIG/MAG) de vigas, treliças, pilares metálicos e coberturas para galpões e edifícios comerciais.',
        baseRequisitos: [
          'Leitura de desenho técnico serralheiro/estrutural e traçagem de peças',
          'Uso rigoroso de máscara de solda, avental de raspa e EPIs',
        ],
      },
      {
        id: 'soldador-esquadrias',
        titulo: 'Portões, Grades e Corrimãos',
        baseDescricao:
          'Fabricação e instalação em obra de portões, gradis, escadas metálicas e guarda-corpos com acabamento de lixamento, solda limpa e pintura anticorrosiva.',
        baseRequisitos: [
          'Experiência com esquadro, nível a laser e corte com lixadeira/policorte',
          'Qualidade visual nas soldas e pontualidade na instalação',
        ],
      },
    ],
    quickRequirements: [
      'Solda MIG/MAG e Eletrodo',
      'Leitura de desenho metálico',
      'NR-35 montagem em altura',
      'Montagem de galpões',
    ],
  },
  'Técnico em Segurança do Trabalho': {
    templates: [
      {
        id: 'tst-canteiro',
        titulo: 'Fiscalização de Canteiro e DDS',
        baseDescricao:
          'Condução de Diálogo Diário de Segurança (DDS), inspeção de frentes de trabalho, entrega/controle de EPIs e liberação de Permissões de Trabalho (PT).',
        baseRequisitos: [
          'Registro ativo no MTE e formação completa em Técnico de Segurança do Trabalho',
          'Domínio prático das normas NR-18, NR-35, NR-10 e NR-06 em construção civil',
        ],
      },
      {
        id: 'tst-documentacao',
        titulo: 'Treinamentos e Gestão PGR',
        baseDescricao:
          'Acompanhamento de PGR/PCMSO, integração de novos colaboradores e terceirizados, investigação de incidentes e auditorias preventivas de canteiro.',
        baseRequisitos: [
          'Boa comunicação para treinamentos práticos com equipes de obra',
          'Organização de prontuários, fichas de EPI e relatórios gerenciais',
        ],
      },
    ],
    quickRequirements: [
      'Registro ativo no MTE',
      'Domínio de NR-18 e NR-35',
      'Vivência em obras de grande porte',
      'CNH B e veículo próprio',
    ],
  },
  'Engenheiro Civil': {
    templates: [
      {
        id: 'eng-execucao',
        titulo: 'Acompanhamento e Controle de Obra',
        baseDescricao:
          'Gestão técnica da execução em canteiro, compatibilização de projetos, controle físico-financeiro, medições de empreiteiros e garantia de qualidade construtiva.',
        baseRequisitos: [
          'Graduação em Engenharia Civil com registro ativo no CREA-MT',
          'Experiência na gestão de cronograma, orçamento e normas técnicas ABNT',
        ],
      },
      {
        id: 'eng-orcamento',
        titulo: 'Planejamento, Orçamento e Compras',
        baseDescricao:
          'Levantamento de quantitativos, cotações de materiais, elaboração de cronogramas (MS Project/Excel), emissão de RDO e suporte técnico à diretoria.',
        baseRequisitos: [
          'Domínio de AutoCAD, leitura de projetos complementares e planilhas de custo',
          'Perfil analítico, liderança colaborativa e foco em redução de retrabalho',
        ],
      },
    ],
    quickRequirements: [
      'CREA-MT ativo',
      'Experiência em obras multifamiliares',
      'Domínio de AutoCAD e Excel',
      'Gestão de medições e RDO',
    ],
  },
};

function formatExperienceContextRequirement(
  experienceLevel?: ExperienceLevel
): string {
  switch (experienceLevel) {
    case 'Sem experiência / Auxiliar':
      return 'Perfil aberto para nível auxiliar/sem experiência prévia, com disposição para aprender e seguir orientações técnicas.';
    case 'Experiente (3+ anos)':
      return 'Exige experiência sólida (3+ anos) na função, com autonomia na execução e controle de qualidade.';
    case 'Intermediário (1 a 3 anos)':
    default:
      return 'Desejável vivência prática de 1 a 3 anos na função em canteiro de obras.';
  }
}

export function getRoleCompetencySuggestions(roleName: string): {
  requiredCompetencies: string[];
  preferredCompetencies: string[];
} {
  const cleanRole = roleName.trim();
  const preset = ROLE_PRESETS[cleanRole];
  if (preset && preset.requiredCompetencies && preset.preferredCompetencies) {
    return {
      requiredCompetencies: [...preset.requiredCompetencies],
      preferredCompetencies: [...preset.preferredCompetencies],
    };
  }

  return {
    requiredCompetencies: [
      `Experiência prática comprovada em ${cleanRole || 'canteiro de obras'}`,
      'Uso obrigatório de EPIs e respeito às NRs aplicáveis (NR-06 e NR-18)',
    ],
    preferredCompetencies: [
      'Certificações complementares (NR-11, NR-12 ou NR-35 conforme atividade)',
      'Disponibilidade imediata e ferramentas próprias básicas',
    ],
  };
}

export function getJobDescriptionSuggestions(
  roleName: string,
  context: SuggestionContext = {}
): JobSuggestionTemplate[] {
  const cleanRole = roleName.trim() || 'Profissional da Construção Civil';
  const preset = ROLE_PRESETS[cleanRole];
  const compDefaults = getRoleCompetencySuggestions(cleanRole);
  const expReq = formatExperienceContextRequirement(context.experienceLevel);
  const contractNote = context.contractType
    ? `Regime de contratação: ${context.contractType}.`
    : '';
  const locationNote = context.neighborhood
    ? `Atuação em obra no bairro ${context.neighborhood}, Rondonópolis-MT.`
    : '';

  if (preset) {
    return preset.templates.map((tpl) => {
      const requisitos = [...tpl.baseRequisitos, expReq];
      if (contractNote) {
        requisitos.push(contractNote);
      }
      const descricao = locationNote
        ? `${tpl.baseDescricao} ${locationNote}`
        : tpl.baseDescricao;
      return {
        id: tpl.id,
        titulo: tpl.titulo,
        descricao,
        requisitos,
        requiredCompetencies: compDefaults.requiredCompetencies,
        preferredCompetencies: compDefaults.preferredCompetencies,
      };
    });
  }

  // Fallback for custom role ("Outra função...")
  const lower = cleanRole.toLowerCase();
  return [
    {
      id: 'custom-execucao',
      titulo: `Execução técnica de ${cleanRole}`,
      descricao: `Atuação como ${lower} em frente de obra${
        context.neighborhood ? ` no bairro ${context.neighborhood}, Rondonópolis-MT` : ' em Rondonópolis-MT'
      }, executando serviços conforme especificações técnicas, prazos e padrões de qualidade da construtora.`,
      requisitos: [
        `Conhecimento prático das rotinas e ferramentas de ${lower}`,
        'Uso obrigatório de EPIs e respeito às normas de segurança NR-18',
        expReq,
      ],
      requiredCompetencies: compDefaults.requiredCompetencies,
      preferredCompetencies: compDefaults.preferredCompetencies,
    },
    {
      id: 'custom-acabamento',
      titulo: `Qualidade e produtividade em ${cleanRole}`,
      descricao: `Serviços especializados de ${lower} com foco em acabamento limpo, aproveitamento racional de materiais e integração com as demais equipes do canteiro.`,
      requisitos: [
        'Pontualidade, organização da área de trabalho e trabalho em equipe',
        expReq,
        ...(contractNote ? [contractNote] : []),
      ],
      requiredCompetencies: compDefaults.requiredCompetencies,
      preferredCompetencies: compDefaults.preferredCompetencies,
    },
  ];
}

export function getQuickRequirementsForRole(roleName: string): string[] {
  const cleanRole = roleName.trim();
  const preset = ROLE_PRESETS[cleanRole];
  if (preset) return preset.quickRequirements;

  return [
    'Uso obrigatório de EPIs',
    'Disponibilidade imediata',
    'Experiência em canteiro de obras',
    'Compromisso com prazos',
  ];
}

export function formatSuggestionForTextarea(
  suggestion: JobSuggestionTemplate
): string {
  const reqText = suggestion.requisitos.map((r) => `• ${r}`).join('\n');
  return `${suggestion.descricao}\n\nRequisitos:\n${reqText}`;
}

export function appendRequirementSnippet(
  currentText: string,
  snippet: string
): string {
  const cleanSnippet = snippet.trim();
  if (!cleanSnippet) return currentText;

  const trimmed = currentText.trim();
  if (!trimmed) {
    return `Requisitos:\n• ${cleanSnippet}`;
  }

  // Avoid duplicate insertion (case-insensitive check)
  if (trimmed.toLowerCase().includes(cleanSnippet.toLowerCase())) {
    return currentText;
  }

  return `${trimmed}\n• ${cleanSnippet}`;
}
