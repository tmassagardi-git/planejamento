// Dados-semente do Sistema VIC (Vínculo, Interesse, Capacidade): os 16
// critérios padrão e as 68 empresas já pesquisadas e avaliadas, extraídas da
// planilha original do método. Usados apenas na primeira carga do app
// (ver `seed.ts`) para popular `vicCriteria` e, casando por nome de empresa,
// `companies` + `vicEvaluations`.
export interface VicSeedCriterion {
  id: string;
  eixo: 'V' | 'I' | 'C';
  nome: string;
  peso: number;
}

export interface VicSeedCompany {
  nome: string;
  ramo?: string;
  notas: Record<string, number>;
  obs: Record<string, string>;
}

export const vicCriteriosSeed: VicSeedCriterion[] = [
 {
  "id": "c3",
  "eixo": "V",
  "nome": "Quem é o Vinculo na Fundação? Contato da Fundação na Empresa.",
  "peso": 2.5
 },
 {
  "id": "c4",
  "eixo": "V",
  "nome": "Contato tem disponibilidade de ligar para marcar uma reunião",
  "peso": 1
 },
 {
  "id": "c5",
  "eixo": "V",
  "nome": "Proximidade do contato",
  "peso": 2
 },
 {
  "id": "c6",
  "eixo": "V",
  "nome": "Contato pode fazer o pedido/Solicitação?",
  "peso": 0.5
 },
 {
  "id": "c7",
  "eixo": "V",
  "nome": "É frequentador do Museu?",
  "peso": 1
 },
 {
  "id": "c8",
  "eixo": "V",
  "nome": "Poder de decisão",
  "peso": 3
 },
 {
  "id": "c10",
  "eixo": "I",
  "nome": "Utiliza Leis de Incentivos",
  "peso": 2.5
 },
 {
  "id": "c11",
  "eixo": "I",
  "nome": "Institucional",
  "peso": 2
 },
 {
  "id": "c12",
  "eixo": "I",
  "nome": "Conexão do projeto com a empresa",
  "peso": 0
 },
 {
  "id": "c13",
  "eixo": "I",
  "nome": "Responsabilidade Social",
  "peso": 1
 },
 {
  "id": "c14",
  "eixo": "I",
  "nome": "Investimento geográfico",
  "peso": 1
 },
 {
  "id": "c15",
  "eixo": "I",
  "nome": "Se financia ou doa para outros Museus e ou projetos culturais",
  "peso": 1
 },
 {
  "id": "c16",
  "eixo": "I",
  "nome": "Enfrentou alguma crise/escandalos",
  "peso": 2.5
 },
 {
  "id": "c18",
  "eixo": "C",
  "nome": "Cota de doação da empresa",
  "peso": 3.5
 },
 {
  "id": "c19",
  "eixo": "C",
  "nome": "Tem recurso separado no planejamento para doações",
  "peso": 4.5
 },
 {
  "id": "c20",
  "eixo": "C",
  "nome": "Crescimento dos lucros no último ano",
  "peso": 2
 }
];

export const vicEmpresasSeed: VicSeedCompany[] = [
 {
  "nome": "Magazine Luiza",
  "ramo": "Varejo",
  "notas": {
   "c3": 5,
   "c4": 5,
   "c5": 1,
   "c6": 5,
   "c7": 0,
   "c8": 5,
   "c10": 5,
   "c11": 3,
   "c13": 5,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 3,
   "c19": 4,
   "c20": 4
  },
  "obs": {
   "c3": "Contato Fernanda - Fabio Costa / Contato Thiago Netshoes",
   "c4": "Se for via contato da Fernanda",
   "c5": "Via outros contatos",
   "c10": "PROAC, Auddiovisual e Lei Rouanet - Informação do Site, no site do Proac não achei o nome deles",
   "c12": "História do Mobiliário",
   "c13": "Apoia museus e está no ISE/B3",
   "c14": "Doa para projetos onde tem lojas",
   "c18": "Considerando as doações pela Lei Rouanet",
   "c19": "Doam, mas não tem uma consistencia"
  }
 },
 {
  "nome": "Vale",
  "ramo": "Mineradora",
  "notas": {
   "c3": 5,
   "c4": 4,
   "c5": 4,
   "c6": 3,
   "c7": 2,
   "c8": 5,
   "c10": 3,
   "c11": 2,
   "c13": 5,
   "c14": 2,
   "c15": 5,
   "c16": 2,
   "c18": 4,
   "c19": 3,
   "c20": 1
  },
  "obs": {
   "c3": "Hugo Barreto é Diretor de Sustentabilidade - Conselho da F. Eva",
   "c10": "Lei Rouanet",
   "c13": "Atua com doações para museus",
   "c14": "Consultando o site, eles tem o costume de doar, para mudeus e projetos onde eles tem atuação",
   "c15": "Apoia diversos Museus, mas alguns são própios",
   "c16": "A Vale passou por problemas ambientais graves e está com forte comunicação para demonstrar o que está fazendo para sanar os problemas e melhorar",
   "c19": "Possui Fundação"
  }
 },
 {
  "nome": "CPFL",
  "ramo": "Geração de energia",
  "notas": {
   "c3": 2,
   "c4": 5,
   "c5": 2,
   "c6": 5,
   "c7": 5,
   "c8": 5,
   "c10": 4,
   "c11": 4,
   "c13": 5,
   "c14": 3,
   "c15": 4,
   "c16": 5,
   "c18": 4,
   "c19": 4,
   "c20": 5
  },
  "obs": {
   "c3": "Contato Fernanda/ MarioMazzili - Diretor Sup. Do Instituto",
   "c10": "Lei Rouanet. Proac",
   "c11": "Apoiam até institucional",
   "c12": "Analisando as doações de Lei Rouanet e site as doações são mais em audiovisual",
   "c13": "Está no Pacto Global e atende os ODS se relacionando diretamente com ações",
   "c14": "Tem apoiado projetos em áreas onde atuam",
   "c15": "não tem uma atuação especifica para Museus, somente exposições no interior de São Paulo, realizou parcerias com o MAM, levando a exposição para CPFL",
   "c19": "Possui Instituto",
   "c20": "Alta de 26,9%"
  }
 },
 {
  "nome": "Alupar",
  "ramo": "Transmissão e Geração de Energia",
  "notas": {
   "c3": 0,
   "c4": 0,
   "c5": 0,
   "c6": 0,
   "c7": 0,
   "c8": 0,
   "c10": 3,
   "c11": 1,
   "c13": 5,
   "c14": 2,
   "c15": 2,
   "c16": 3,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {
   "c10": "Lei Rounet",
   "c11": "Holding que atua no campo de geração e transmissão de energia elétrica possui em suas preocupações temas atinentes à sustentabilidade, ao meio ambiente, projetos educativos e culturais.",
   "c12": "Não vejo vínculo com projeto num primeiro momento.",
   "c13": "Regime Fio d'água / parque eólico / CONAMA / EIA / Mecanismo de Desenvolvimento Limpo com Créditos de Carbono / Programa de Comunicação Social",
   "c14": "Atuam com projetos na Amazônia Legal e nos Estados em que atuam, mas há projetos realizados em São Paulo também.",
   "c16": "Problemas de corrupção - Lava Jato"
  }
 },
 {
  "nome": "Coteminas S.A.",
  "ramo": "Têxtil",
  "notas": {
   "c3": 0,
   "c4": 0,
   "c5": 0,
   "c6": 0,
   "c7": 0,
   "c8": 0,
   "c10": 1,
   "c11": 3,
   "c13": 4,
   "c14": 2,
   "c15": 1,
   "c16": 3,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {
   "c11": "Controladora de importantes redes têxteis no Brasil, como M Martan, Springs Global e Santanense. Institucionalmente, podemos pensar a relação casa e conforto com base nos produtos produzidos pela companhia.",
   "c12": "De acordo com a iniciativa/projeto, é possível estabelecer relações para prospecção da patrocinadora em potencial.",
   "c13": "O grupo Spring Global no Brasil desenvolve ações em Minas Gerais na área de cultura e educação."
  }
 },
 {
  "nome": "EcoVias",
  "ramo": "Infraestrutura Rodoviária",
  "notas": {
   "c3": 0,
   "c4": 0,
   "c5": 0,
   "c6": 0,
   "c7": 0,
   "c8": 0,
   "c10": 3,
   "c11": 0,
   "c13": 4,
   "c14": 4,
   "c15": 1,
   "c16": 3,
   "c18": 0,
   "c19": 0,
   "c20": 4
  },
  "obs": {}
 },
 {
  "nome": "Portobello",
  "ramo": "Revestimento Cerâmico",
  "notas": {
   "c3": 0,
   "c4": 0,
   "c5": 0,
   "c6": 0,
   "c7": 0,
   "c8": 0,
   "c10": 3,
   "c11": 1,
   "c13": 4,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 5
  },
  "obs": {
   "c11": "Considerando o nicho de mercado da Portobello com revestimento cerâmico e residência, pode ser possível estabelecer algum vínculo por se tratar de Casa-Museu, porém, Ema Klabin usava mármore rs"
  }
 },
 {
  "nome": "Riachuelo",
  "ramo": "Indústria Textil",
  "notas": {
   "c10": 4,
   "c11": 2,
   "c13": 5,
   "c14": 4,
   "c15": 1,
   "c16": 4,
   "c18": 3,
   "c19": 0,
   "c20": 3
  },
  "obs": {
   "c10": "Lei Rouanet e PROAC",
   "c12": "Lendo sobre os apoios, acredito que seriam mais para projetos específicos de moda ou até mesmo diversidade",
   "c13": "Tem um engajamento com Fórum de Empresas e Direitos LGBTI+, está no Pacto Global, mas não achei museus apoiados",
   "c14": "Não tem definicação dos apoios, pela Lei Rouanet doa para diversos projetos, mas maioria é teatro e música",
   "c15": "Não achei informação de museus apoiados",
   "c16": "Existe um processo de trabalho análogo a escravidão de uma funcionária, em 2011, pelo site, dizem que passam por auditorias. Lembrando que um dos sócios, Flavio Rocha, é uma pessoa polêmica",
   "c18": "Com base no Salic - doações em média de R$ 500.000",
   "c19": "não tem informação"
  }
 },
 {
  "nome": "Cacau Show",
  "ramo": "Indústria Alimentícia",
  "notas": {
   "c10": 3,
   "c11": 2,
   "c13": 4,
   "c14": 4,
   "c15": 2,
   "c16": 5,
   "c18": 3,
   "c19": 3,
   "c20": 2
  },
  "obs": {
   "c10": "Doa via Lei Rouanet",
   "c11": "Talvez para plano anual",
   "c12": "Com base nas doações doaria para projetos especificos incentivados",
   "c13": "Apoia teatro, dança, música",
   "c14": "Apoia proejtos culturais de vários locais",
   "c15": "Doa para projetos culturais, mas não achei para museus",
   "c19": "Tem o Instituto Cacau Show, mas apoia Educação"
  }
 },
 {
  "nome": "Tok Stok",
  "ramo": "Varejo",
  "notas": {
   "c10": 4,
   "c11": 2,
   "c13": 0,
   "c14": 4,
   "c15": 2,
   "c16": 5,
   "c18": 2,
   "c19": 0,
   "c20": 2
  },
  "obs": {
   "c10": "Lei Rouanet e Proac",
   "c12": "Acredito que apoiariam algum projeto especifico",
   "c13": "Não tem nenhuma informação sobre Responsabilidade Social",
   "c15": "Até doa para projetos culturais, mas não achei sobre museus"
  }
 },
 {
  "nome": "Pandora",
  "ramo": "Joalheria",
  "notas": {
   "c10": 0,
   "c11": 3,
   "c13": 5,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {
   "c11": "Como não apoia leis de incentivo, acredito que possa apoiar tanto um projeto como institucional",
   "c13": "Está bem engajado na área de Sustentabilidade e apoia a Unicef, está no Pacto Global e segue as ODS",
   "c14": "Não tem informação"
  }
 },
 {
  "nome": "Tiffany",
  "ramo": "Joalheria",
  "notas": {
   "c10": 3,
   "c11": 3,
   "c13": 5,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 3,
   "c20": 2
  },
  "obs": {
   "c10": "Proac",
   "c11": "Acredito que possa apoiar tanto um projeto como institucional",
   "c13": "Está no Pacto Global, segue as ODS, tem apoia a diversidade, e usa o Proac",
   "c19": "Tem um a Fundação, mas não achei informações sobre doações",
   "c20": "Foi recentemente comprada pela Louis Vuitton"
  }
 },
 {
  "nome": "O Boticário",
  "ramo": "",
  "notas": {},
  "obs": {}
 },
 {
  "nome": "Leroy Merlin",
  "ramo": "Varejo",
  "notas": {
   "c10": 4,
   "c11": 4,
   "c13": 5,
   "c14": 5,
   "c15": 4,
   "c18": 3,
   "c19": 2,
   "c20": 2
  },
  "obs": {
   "c10": "PROAC e Lei Rouanet",
   "c11": "Existe a possibilidade via Lei Rouanet tanto institucional como algum projeto específico",
   "c13": "Segue as ODS, Ethos",
   "c15": "Apoio ao MASP e Tomie Othake",
   "c20": "Estimativa em 2019 de R$ 6 bi"
  }
 },
 {
  "nome": "Suvinil/BASF",
  "ramo": "",
  "notas": {
   "c10": 3,
   "c11": 4,
   "c13": 5,
   "c14": 4,
   "c15": 4,
   "c16": 4,
   "c18": 3,
   "c19": 4,
   "c20": 1
  },
  "obs": {
   "c10": "Lei Rouanet / BASF",
   "c11": "Pode apoiar o Institucional e também alum projeto",
   "c13": "Sim, porém tudo está associado à BASF, apoia as ODS, está no Pacto Global (unidades internacionais)",
   "c15": "Apoiou a UNIBES, APHC",
   "c16": "O problema mais comentado é a questão de usar agrotóxicos proibidos na Europa, aqui no Brasil",
   "c19": "No ano 2019 apoiou € 2.529.800 na América Latina",
   "c20": "Teve queda no Lucro em U$2.5 bilhões"
  }
 },
 {
  "nome": "Ambev",
  "ramo": "Fabricante de Bebidas",
  "notas": {
   "c10": 4,
   "c11": 2,
   "c13": 2,
   "c14": 4,
   "c15": 2,
   "c16": 4,
   "c18": 4,
   "c19": 4,
   "c20": 2
  },
  "obs": {
   "c10": "PROAC, Lei Rouanet",
   "c12": "Conexão com algum projeto específico",
   "c13": "Está no Ethos, segue ODS, Pacto Global",
   "c16": "Um caso em uma fábrica em Teresina de tentativa de estupro - https://180graus.com/geral/homem-tenta-estuprar-colega-de-trabalho-dentro-da-ambev-em-teresina",
   "c18": "Doou R$ 150 milhões em 2020 para ações no combate à COVID-19",
   "c20": "Lucro de 7,1% comparado a 2018"
  }
 },
 {
  "nome": "Renner",
  "ramo": "Varejo",
  "notas": {
   "c10": 4,
   "c11": 2,
   "c13": 5,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 5,
   "c20": 3
  },
  "obs": {
   "c10": "https://www.lojasrennersa.com.br/pt_br/patrocinios-e-projetos",
   "c13": "Fez várias ações em museus",
   "c19": "Instituto Renner"
  }
 },
 {
  "nome": "LG",
  "ramo": "Conglomerado de mídias eletrônicas e digitais",
  "notas": {
   "c10": 1,
   "c11": 3,
   "c13": 4,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 2,
   "c20": 2
  },
  "obs": {
   "c13": "A empresa patrocina um projeto cultural – “Paraisópolis das Artes” – e outro esportivo – “Craques do Amanhã”."
  }
 },
 {
  "nome": "Vivara",
  "ramo": "Fabricante de jóias e acessórios",
  "notas": {
   "c10": 2,
   "c11": 2,
   "c13": 3,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Diageo",
  "ramo": "Fabricante de bebidas",
  "notas": {
   "c10": 2,
   "c11": 2,
   "c13": 3,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 2,
   "c20": 2
  },
  "obs": {}
 },
 {
  "nome": "Mickey",
  "ramo": "Loja de casa e decoração",
  "notas": {
   "c10": 1,
   "c11": 3,
   "c13": 1,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 2,
   "c20": 2
  },
  "obs": {}
 },
 {
  "nome": "GPA",
  "ramo": "Varejo",
  "notas": {
   "c10": 3,
   "c11": 4,
   "c13": 4,
   "c14": 4,
   "c15": 2,
   "c16": 5,
   "c18": 0,
   "c19": 4,
   "c20": 4
  },
  "obs": {}
 },
 {
  "nome": "Dell",
  "ramo": "Fabricante de eletronicos",
  "notas": {
   "c10": 1,
   "c11": 1,
   "c13": 2,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {}
 },
 {
  "nome": "Faber-Castell",
  "ramo": "Material de Escritório",
  "notas": {
   "c3": 0,
   "c4": 0,
   "c5": 0,
   "c6": 0,
   "c7": 0,
   "c8": 0,
   "c10": 4,
   "c11": 5,
   "c13": 5,
   "c14": 4,
   "c15": 2,
   "c16": 4,
   "c18": 0,
   "c19": 4,
   "c20": 5
  },
  "obs": {
   "c10": "Estadual e Federal",
   "c11": "https://www.faber-castell.com.br/corporate/sustainability/social-commitment",
   "c13": "Ex.: Condições de trabalho recomendadas pela OIT / Internalizou as reflexões sobre ODS, especialmente a ODS de número 13"
  }
 },
 {
  "nome": "Whirlpool",
  "ramo": "",
  "notas": {
   "c10": 4,
   "c11": 4,
   "c13": 5,
   "c14": 4,
   "c15": 1,
   "c16": 2,
   "c18": 3,
   "c19": 3,
   "c20": 5
  },
  "obs": {
   "c10": "Estadual e Federal",
   "c11": "Apoia projetos por leis de incentivo, tem potencial de apoiar institucionalmente",
   "c13": "Apesar de não ter achado apoio a museus, eles seguem as ODS e apoiam cultura",
   "c16": "Foi multada em R$25,3 milhões por descumprir leis trabalhistas"
  }
 },
 {
  "nome": "Heineken",
  "ramo": "Fabricante de bebidas",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 2,
   "c14": 4,
   "c15": 0,
   "c16": 3,
   "c18": 0,
   "c19": 0,
   "c20": 4
  },
  "obs": {
   "c13": "Está no Pacto Global",
   "c16": "Realizou uma propaganda racista em 2018 nos Estados Unidos, mas logo retirou do ar"
  }
 },
 {
  "nome": "Estapar",
  "ramo": "Estacionamento",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 2,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 1
  },
  "obs": {}
 },
 {
  "nome": "Fujifilm",
  "ramo": "",
  "notas": {},
  "obs": {}
 },
 {
  "nome": "Saint Marché",
  "ramo": "Varejo",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 0,
   "c14": 3,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Big/Sam´s Club",
  "ramo": "Varejo",
  "notas": {
   "c10": 1,
   "c11": 0,
   "c13": 3,
   "c14": 3,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {
   "c19": "Tem um Instituto , mas não informa valores de doação"
  }
 },
 {
  "nome": "Multiplan",
  "ramo": "Shopping",
  "notas": {
   "c10": 1,
   "c11": 2,
   "c13": 4,
   "c14": 3,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {
   "c10": "Lei de Incentivo a Cultura ( Open Air)"
  }
 },
 {
  "nome": "BRMalls",
  "ramo": "Shopping",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 3,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 1
  },
  "obs": {}
 },
 {
  "nome": "Westwing",
  "ramo": "",
  "notas": {
   "c10": 0,
   "c11": 3,
   "c13": 0,
   "c14": 4,
   "c15": 0,
   "c16": 0,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {}
 },
 {
  "nome": "B2W",
  "ramo": "Varejo",
  "notas": {
   "c10": 3,
   "c11": 3,
   "c13": 4,
   "c14": 3,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 4
  },
  "obs": {
   "c10": "Lei de Incentivo a Cultura (teatro)"
  }
 },
 {
  "nome": "Cecilia Dale",
  "ramo": "Loja de casa e decoração",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 0,
   "c14": 0,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "3M",
  "ramo": "Multi mercado",
  "notas": {
   "c10": 4,
   "c11": 4,
   "c13": 5,
   "c14": 4,
   "c15": 4,
   "c16": 5,
   "c18": 3,
   "c19": 3,
   "c20": 2
  },
  "obs": {
   "c14": "Muitos projetos eles doam para proximidades da fábrica",
   "c15": "Mas doa para diversos Museus"
  }
 },
 {
  "nome": "Swarowski",
  "ramo": "",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 0,
   "c15": 0,
   "c16": 5,
   "c18": 1,
   "c19": 0,
   "c20": 3
  },
  "obs": {
   "c18": "Doou com outras empresas de luxo para o combate a Covid 19"
  }
 },
 {
  "nome": "Arte Cristallo",
  "ramo": "Loja de cristais",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 0,
   "c14": 0,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 0
  },
  "obs": {
   "c18": "não tem nem site"
  }
 },
 {
  "nome": "Strauss",
  "ramo": "Mercado de Luxo",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 0,
   "c14": 3,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Nadir Figueiredo",
  "ramo": "",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 1,
   "c14": 3,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 1
  },
  "obs": {}
 },
 {
  "nome": "BO Concept",
  "ramo": "Loja de Casa e decoração",
  "notas": {
   "c10": 0,
   "c11": 0,
   "c13": 0,
   "c14": 3,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Kitchens",
  "ramo": "Loja de Casa e decoração",
  "notas": {
   "c7": 0,
   "c10": 0,
   "c11": 0,
   "c13": 1,
   "c14": 3,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Deca",
  "ramo": "Fabricante de louças e materiais sanitários",
  "notas": {
   "c7": 1,
   "c10": 1,
   "c11": 2,
   "c13": 2,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Safra",
  "ramo": "Serviços Financeiros",
  "notas": {
   "c10": 3,
   "c11": 3,
   "c13": 4,
   "c14": 4,
   "c15": 2,
   "c16": 5,
   "c18": 3,
   "c19": 5,
   "c20": 4
  },
  "obs": {
   "c10": "Incentivo a Cultura",
   "c15": "Memorial do Holocausto - imigração judaica"
  }
 },
 {
  "nome": "Klabin",
  "ramo": "",
  "notas": {
   "c3": 5,
   "c4": 5,
   "c5": 5,
   "c6": 3,
   "c7": 5,
   "c8": 5,
   "c10": 4,
   "c11": 5,
   "c13": 5,
   "c14": 5,
   "c15": 5,
   "c16": 5,
   "c18": 3,
   "c19": 5,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Hering",
  "ramo": "Indústria Textil",
  "notas": {
   "c10": 3,
   "c11": 4,
   "c13": 4,
   "c14": 4,
   "c15": 3,
   "c16": 5,
   "c18": 0,
   "c19": 2,
   "c20": 2
  },
  "obs": {
   "c10": "Incentivo a Cultura- Tem um museu próprio",
   "c15": "Apoia o museu próprio"
  }
 },
 {
  "nome": "Dior",
  "ramo": "",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {
   "c19": "Preocupação ambiental (pacto da moda) e doações para combate a Covid"
  }
 },
 {
  "nome": "Gucci",
  "ramo": "Moda luxo",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 1,
   "c20": 2
  },
  "obs": {
   "c19": "Gucci Changemakers (diversidade ) e preocupaçãocom sustentabilidade"
  }
 },
 {
  "nome": "Osklen",
  "ramo": "Fabricante de roupas e acessórios",
  "notas": {
   "c10": 1,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 1,
   "c20": 2
  },
  "obs": {
   "c13": "Grnade preocupação com sustentabilidade",
   "c19": "“O novo luxo é a estética da ética”, afirma Oskar Metsavaht"
  }
 },
 {
  "nome": "Yves Saint Laurent",
  "ramo": "Moda luxo",
  "notas": {
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {
   "c13": "Participação Pacto da Moda 2019"
  }
 },
 {
  "nome": "Ralph Lauren",
  "ramo": "Moda luxo",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Chanel",
  "ramo": "",
  "notas": {},
  "obs": {}
 },
 {
  "nome": "Pierre Cardin",
  "ramo": "Moda de luxo",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Reserva",
  "ramo": "Indústria textil",
  "notas": {
   "c10": 1,
   "c11": 2,
   "c13": 4,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 1,
   "c20": 3
  },
  "obs": {
   "c19": "Apoia Gerando Falcoes, WWF e Afro reggae"
  }
 },
 {
  "nome": "Prada",
  "ramo": "Moda luxo",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 3,
   "c20": 3
  },
  "obs": {
   "c19": "Fundação em Milão"
  }
 },
 {
  "nome": "Burberry",
  "ramo": "Moda luxo",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 0,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {}
 },
 {
  "nome": "Grupo Soma",
  "ramo": "",
  "notas": {
   "c10": 1,
   "c11": 2,
   "c13": 2,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 0,
   "c19": 1,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Alpargatas",
  "ramo": "",
  "notas": {
   "c10": 4,
   "c11": 4,
   "c13": 5,
   "c14": 4,
   "c15": 5,
   "c16": 5,
   "c18": 0,
   "c19": 5,
   "c20": 3
  },
  "obs": {
   "c10": "Incentivo a Cultura e FUMCAD",
   "c15": "MAM, MASP, Pinacoteca"
  }
 },
 {
  "nome": "Rolex",
  "ramo": "Moda luxo/ acessórios",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {}
 },
 {
  "nome": "Cartier",
  "ramo": "Jóias",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {
   "c13": "Atua com empoderamento feminino"
  }
 },
 {
  "nome": "Schutz",
  "ramo": "Calçados",
  "notas": {},
  "obs": {}
 },
 {
  "nome": "Arezzo",
  "ramo": "Calçados",
  "notas": {
   "c10": 3,
   "c11": 2,
   "c13": 5,
   "c14": 5,
   "c15": 3,
   "c16": 5,
   "c18": 0,
   "c19": 1,
   "c20": 3
  },
  "obs": {
   "c10": "Incentivo a Cultura",
   "c15": "Pinacoteca"
  }
 },
 {
  "nome": "sarah chofakian",
  "ramo": "Moda luxo",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 0,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 2
  },
  "obs": {
   "c20": "tem muito pouca informação"
  }
 },
 {
  "nome": "ABVTEX",
  "ramo": "Indústria textil",
  "notas": {
   "c10": 0,
   "c11": 2,
   "c13": 1,
   "c14": 4,
   "c15": 0,
   "c16": 5,
   "c18": 0,
   "c19": 0,
   "c20": 3
  },
  "obs": {
   "c13": "Grande preocupação com Sustentbilidade, cadeia produtiva. Tem progrmas , mas são voltados para esse tema."
  }
 },
 {
  "nome": "Nubank",
  "ramo": "Serviços Financeiros",
  "notas": {
   "c10": 0,
   "c11": 1,
   "c13": 1,
   "c14": 4,
   "c15": 1,
   "c16": 3,
   "c18": 0,
   "c19": 1,
   "c20": 2
  },
  "obs": {
   "c16": "A CEO, em uma entrevista no Roda Viva, foi questionada sobre a diversidade da empresa e coentou que \"não nivelam por baixo\" acusada de racismo, após isso eles passaram investir em diversidade dentro da empresa, com investimento alto"
  }
 },
 {
  "nome": "XP Investimentos",
  "ramo": "Serviços Financeiros",
  "notas": {
   "c10": 3,
   "c11": 5,
   "c13": 5,
   "c14": 4,
   "c15": 5,
   "c16": 5,
   "c18": 3,
   "c19": 2,
   "c20": 4
  },
  "obs": {
   "c10": "Lei Rouanet"
  }
 },
 {
  "nome": "Unilever",
  "ramo": "Bens de Consumo",
  "notas": {
   "c10": 3,
   "c11": 5,
   "c13": 5,
   "c14": 5,
   "c15": 4,
   "c16": 4,
   "c18": 4,
   "c19": 3,
   "c20": 1
  },
  "obs": {
   "c11": "Eles realizam apoios por produtos também",
   "c16": "Propaganda na Af. Do Sul com produto TREsemme",
   "c20": "Teve queda no lucro em 2020"
  }
 },
 {
  "nome": "Natura&Co",
  "ramo": "Varejo de cosméticos",
  "notas": {
   "c10": 3,
   "c11": 2,
   "c13": 5,
   "c14": 4,
   "c15": 1,
   "c16": 5,
   "c18": 3,
   "c19": 3,
   "c20": 2
  },
  "obs": {
   "c10": "Lei Rouanet",
   "c12": "Talvez algum projeto Musical ou Ambiental"
  }
 }
];
