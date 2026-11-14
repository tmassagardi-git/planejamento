#!/usr/bin/env python3
"""Converte a planilha do cartão e o extrato do Itaú nos documentos do banco.

Uso: python3 build_data.py <cartao.xlsx> <extrato.xls> <pasta_de_saida>

Requer openpyxl e xlrd. As compras do cartão entram item a item; o pagamento
da fatura que aparece no extrato é marcado como movimentação interna, para a
mesma despesa não contar duas vezes.

A pasta de saída deve ficar FORA do repositório: os lançamentos são dados
pessoais e não devem ser commitados.
"""
import collections, json, os, re, sys
import openpyxl
import xlrd

DIA_FATURA = 10                 # vencimento da fatura do cartão
PAGO_ATE = "2026-11-10"         # faturas até esta data já foram pagas
CONTA_CARTAO = "Cartão LATAM Pass"
POR_BLOCO = 110
IGNORAR_CONTAS = ("PJ",)        # contas da empresa não entram no controle pessoal

CONTA_CORRENTE = "Conta corrente Itaú"

# (trecho da descrição, categoria, tipo de pagamento, interna, recorrente) — a primeira regra que casa vale.
REGRAS = [
    ("REND PAGO", "Rendimentos de aplicação", "Rendimento", False, False),
    ("APLICACAO", "Aplicações / investimentos", "Aplicação", True, False),
    ("RESGATE", "Resgate de investimento", "Resgate", True, False),
    ("LATAM", "Pagamento fatura cartão LATAM Pass", "Pagamento de fatura", True, False),
    ("ITAU MC 1505-4146", "Pagamento fatura cartão LATAM Pass", "Pagamento de fatura", True, False),
    ("PAG TIT INT 285043457000", "Pagamento fatura cartão LATAM Pass", "Pagamento de fatura", True, False),
    ("PERSON VS", "Fatura cartão Itaú Personnalité Visa", "Pagamento de fatura", False, False),
    ("PERS INFINIT", "Fatura cartão Itaú Personnalité Visa", "Pagamento de fatura", False, False),
    ("EMBRACON", "Consórcio", "Boleto", False, True),
    ("PJBANK", "Boleto mensal PJBank (a identificar)", "Boleto", False, True),
    ("TIT 481", "Boleto mensal PJBank (a identificar)", "Boleto", False, True),
    ("INT 481", "Boleto mensal PJBank (a identificar)", "Boleto", False, True),
    ("IPVA", "Veículo (IPVA, licenciamento, multa)", "Boleto", False, False),
    ("LICENCIAMENTO", "Veículo (IPVA, licenciamento, multa)", "Boleto", False, False),
    ("MULTA", "Veículo (IPVA, licenciamento, multa)", "Boleto", False, False),
    ("B2P CAPTACAO", "Retirada / pró-labore (B2P Captação)", "PIX", False, True),
    ("TED ", "Outras entradas (a identificar)", "TED", False, False),
    ("PIX TRANSF THIAGO", "Transferência entre contas próprias", "PIX", True, False),
    ("PIX TRANSF JANAINA", "PIX recorrente Janaina (a identificar)", "PIX", False, True),
    ("PIX TRANSF RITA", "PIX recorrente Rita (a identificar)", "PIX", False, True),
    ("PIX TRANSF PIZZARI", "Restaurantes, bares e cafés", "PIX", False, False),
    ("IFOOD", "Delivery", "PIX", False, False),
    ("AUTOPASS", "Transporte (app/metrô)", None, False, False),
    ("Z.A. DIGITA", "Estacionamento e pedágio", "PIX", False, False),
    ("DR. CONSULT", "Farmácia e saúde", "PIX", False, False),
    ("AMAZON", "Compras diversas / a identificar", "PIX", False, False),
    ("PIX", "Outros PIX (a identificar)", "PIX", False, False),
]
# Compras no débito ("PAY ..."): o banco trunca o nome da loja.
DEBITO = {
    "Supermercado e hortifruti": ("HORT", "HORTI", "CARRE", "SONDA", "PRECO", "EXTRA", "SWIFT", "OXXO", "POEMA"),
    "Farmácia e saúde": ("DROGA",),
    "Casa, móveis e utilidades": ("LEROY",),
    "Educação, livros e papelaria": ("LIVRA",),
}
RECORRENTES_CARTAO = ("Consórcio",)
NOMES = {"PJBANK": "PJBANK PAGAMENTOS", "TIT 481": "PJBANK PAGAMENTOS", "INT 481": "PJBANK PAGAMENTOS",
         "IFOOD": "IFOOD", "EMBRACON": "EMBRACON CONSÓRCIO", "AUTOPASS": "AUTOPASS", "RITA D": "RITA DE"}
# Recorrentes projetados: (estabelecimento, valor mínimo para contar como a recorrência, meses à frente, dia)
PROJETAR = [("RITA DE", 1000, 24, 10)]


def iso(d):
    return d.strftime("%Y-%m-%d")


def conta_curta(c):
    return c.split(" ag.")[0].strip()


def estab_cartao(desc):
    return re.sub(r"\s+\d{2}/\d{2}$", "", desc).strip()


def linhas(ws):
    it = ws.iter_rows(values_only=True)
    next(it)
    return [r for r in it if any(c is not None for c in r)]


def texto(s):
    """O extrato do Itaú vem com acentos corrompidos (UTF-8 lido como Latin-1)."""
    try:
        return s.encode("latin1").decode("utf8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def ler_cartao(xlsx):
    itens = []
    ws = openpyxl.load_workbook(xlsx, data_only=True).worksheets[0]
    for i, r in enumerate(linhas(ws), 1):
        compra, venc, desc, cat, valor, parcela, _status, final, grupo = r[:9]
        pagamento = venc.replace(day=DIA_FATURA)
        itens.append({
            "id": f"c{i:04d}", "origem": "cartao", "tipo": "saida",
            "dataCompra": iso(compra), "dataPagamento": iso(pagamento),
            "descricao": desc, "estabelecimento": estab_cartao(desc),
            "categoria": cat, "valor": round(float(valor), 2),
            "meio": "Cartão de crédito", "conta": CONTA_CARTAO,
            "cartaoFinal": final if final and final != "—" else "",
            "parcela": parcela or "", "grupoParcela": grupo or "",
            "status": "pago" if iso(pagamento) <= PAGO_ATE else "aberto",
            "recorrente": cat in RECORRENTES_CARTAO, "interno": False,
        })
    return itens


def ler_extrato(xls):
    itens = []
    sh = xlrd.open_workbook(xls).sheet_by_index(0)
    for n in range(sh.nrows):
        data, desc, _, valor, _saldo = sh.row_values(n)[:5]
        if valor == "" or not re.match(r"\d\d/\d\d/\d{4}$", str(data)):
            continue
        desc = texto(str(desc)).strip()
        valor = float(valor)
        dia, mes, ano = data.split("/")
        pagamento = f"{ano}-{mes}-{dia}"
        compra = pagamento
        m = re.search(r"(\d\d)/(\d\d)$", desc)       # data da compra/PIX no fim da descrição
        if m and not desc.startswith("PAG "):
            a = int(ano) - 1 if int(m.group(2)) > int(mes) else int(ano)
            compra = f"{a}-{m.group(2)}-{m.group(1)}"
        nome = re.sub(r"\s*\d\d/\d\d$", "", desc).strip()

        if nome.startswith("PAY") or nome.startswith("RSHOP"):
            loja = re.sub(r"^(PAY|RSHOP)\s*-?\s*", "", nome)
            loja = re.sub(r"\s*\d{4}$", "", loja).strip()
            meio, interno, rec = "Cartão de débito", False, False
            cat = next((c for c, ks in DEBITO.items() if loja.upper() in ks), "Compras diversas / a identificar")
            if "AUTOPASS" in loja:
                cat = "Transporte (app/metrô)"
            estab = loja
        else:
            regra = next((r for r in REGRAS if r[0].upper() in nome.upper()), None)
            cat, meio, interno, rec = regra[1:] if regra else ("Outros (a identificar)", "Outros", False, False)
            meio = meio or "PIX"
            estab = re.sub(r"^(PIX TRANSF|PIX QRS|SISPAG PIX|PAG BOLETO|TED [\d.]+)\s*", "", nome).strip(" .") or nome
            estab = re.sub(r"\s+DE R$", "", estab)
        estab = next((v for k, v in NOMES.items() if k in nome.upper()), estab.upper())
        itens.append({
            "id": f"e{len(itens) + 1:04d}", "origem": "conta",
            "tipo": "entrada" if valor > 0 else "saida",
            "dataCompra": compra, "dataPagamento": pagamento,
            "descricao": desc, "estabelecimento": estab,
            "categoria": cat, "valor": round(abs(valor), 2),
            "meio": meio, "conta": CONTA_CORRENTE,
            "cartaoFinal": "", "parcela": "", "grupoParcela": "",
            "status": "pago", "recorrente": rec, "interno": interno,
        })
    return itens


def soma_meses(data, k):
    y, m, d = int(data[:4]), int(data[5:7]) - 1 + k, int(data[8:])
    return f"{y + m // 12}-{m % 12 + 1:02d}-{d:02d}"


def projetar(itens):
    """Lança em aberto os próximos meses de cada recorrente fixo, numerados como parcelas."""
    novos = []
    for nome, minimo, meses, dia in PROJETAR:
        serie = [x for x in itens if x["estabelecimento"] == nome and x["tipo"] == "saida"]
        for x in serie:
            x["recorrente"] = x["valor"] >= minimo
        base = max((x for x in serie if x["recorrente"]), key=lambda x: x["dataPagamento"])
        inicio = base["dataPagamento"][:8] + f"{dia:02d}"
        for k in range(1, meses + 1):
            data = soma_meses(inicio, k)
            novos.append(dict(base, id=f"r{len(novos) + 1:04d}", dataCompra=data, dataPagamento=data,
                              descricao=f"{nome} (recorrente)", status="aberto",
                              parcela=f"{k:02d}/{meses:02d}", grupoParcela=f"{nome} – recorrente"))
    return novos


def conferir(itens):
    """Compara cada fatura paga no extrato com a soma das compras do cartão."""
    faturas = collections.defaultdict(float)
    for x in itens:
        if x["origem"] == "cartao":
            faturas[x["dataPagamento"][:7]] += x["valor"]
    for x in itens:
        if x["categoria"].startswith("Pagamento fatura cartão LATAM"):
            mes = x["dataPagamento"][:7]
            dif = round(faturas[mes] - x["valor"], 2)
            print(f"  fatura {mes}: extrato {x['valor']:.2f} | compras {faturas[mes]:.2f} | diferença {dif:.2f}")


def main(xlsx, xls, saida):
    itens = ler_cartao(xlsx) + ler_extrato(xls)
    itens += projetar(itens)
    conferir(itens)

    os.makedirs(saida, exist_ok=True)
    blocos = []
    for n in range(0, len(itens), POR_BLOCO):
        nome = f"base-{n // POR_BLOCO + 1:02d}"
        with open(os.path.join(saida, nome + ".json"), "w") as f:
            json.dump({"itens": {x["id"]: x for x in itens[n:n + POR_BLOCO]}}, f, ensure_ascii=False)
        blocos.append(nome)

    # Estabelecimentos que se repetem viram cadastro padrão.
    grupos = collections.defaultdict(list)
    for x in itens:
        grupos[x["estabelecimento"]].append(x)
    estabs = {}
    for nome, xs in sorted(grupos.items()):
        if len(xs) < 2:
            continue
        cat = collections.Counter(x["categoria"] for x in xs).most_common(1)[0][0]
        tipo = collections.Counter(x["tipo"] for x in xs).most_common(1)[0][0]
        meio = collections.Counter(x["meio"] for x in xs).most_common(1)[0][0]
        estabs[f"s{len(estabs) + 1:04d}"] = {"nome": nome, "categoria": cat, "tipo": tipo, "meio": meio}
    with open(os.path.join(saida, "estabelecimentos.json"), "w") as f:
        json.dump({"itens": estabs}, f, ensure_ascii=False)

    cats = sorted({x["categoria"] for x in itens})
    with open(os.path.join(saida, "categorias.json"), "w") as f:
        json.dump({"itens": {f"k{i:03d}": {"nome": c} for i, c in enumerate(cats, 1)}}, f, ensure_ascii=False)

    print(len(itens), "lançamentos em", len(blocos), "blocos;", len(estabs), "estabelecimentos;", len(cats), "categorias")
    return itens


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
