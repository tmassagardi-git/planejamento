#!/usr/bin/env python3
"""Converte a planilha de extrato/faturas nos documentos do banco do sistema.

Uso: python3 build_data.py <planilha.xlsx> <pasta_de_saida>

A pasta de saída deve ficar FORA do repositório: os lançamentos são dados
pessoais e não devem ser commitados.
"""
import collections, json, os, re, sys
import openpyxl

DIA_FATURA = 10                 # vencimento da fatura do cartão
PAGO_ATE = "2026-11-10"         # faturas até esta data já foram pagas
CONTA_CARTAO = "Cartão LATAM Pass"
POR_BLOCO = 110
IGNORAR_CONTAS = ("PJ",)        # contas da empresa não entram no controle pessoal

INTERNAS = (
    "Transferência entre contas próprias",
    "Transferência entre contas da empresa",
    "Pagamento fatura cartão LATAM Pass",
    "Aplicações / investimentos",
    "Resgate de investimento",
    "Retirada Thiago",
    "Retirada recebida da Everest",
)
RECORRENTES = ("Consórcio", "Telefonia e internet", "Plano de saúde",
               "Sistema de cobrança", "recorrente")
PREFIXOS = ("PIX ENVIADO ", "PIX RECEBIDO ", "BOLETO PAGO ", "TED RECEBIDA ",
            "TED ENVIADA ", "RECEBIMENTO ", "PAGAMENTO ", "PIX TRANSF ",
            "SISPAG PIX ", "PIX QRS ", "PAY -", "DÉB. AUTOMÁTICO ")
MEIOS = {"Boleto/tributo": "Boleto", "Fatura de cartão": "Pagamento de fatura"}


def iso(d):
    return d.strftime("%Y-%m-%d")


def conta_curta(c):
    return c.split(" ag.")[0].strip()


def estab_cartao(desc):
    return re.sub(r"\s+\d{2}/\d{2}$", "", desc).strip()


def estab_conta(desc):
    d = re.sub(r"\s+\d{2}/\d{2}$", "", desc).strip()
    for p in PREFIXOS:
        if d.upper().startswith(p):
            d = d[len(p):].strip()
            break
    return d or desc


def linhas(ws):
    it = ws.iter_rows(values_only=True)
    next(it)
    return [r for r in it if any(c is not None for c in r)]


def main(xlsx, saida):
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    itens = []

    for i, r in enumerate(linhas(wb["Cartão – lançamentos"]), 1):
        compra, venc, desc, cat, valor, parcela, _status, final, grupo = r
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
            "recorrente": any(k in cat for k in RECORRENTES),
            "interno": False,
        })

    for i, r in enumerate(linhas(wb["Conta corrente"]), 1):
        data, conta, desc, meio, es, cat, valor = r
        if conta.startswith(IGNORAR_CONTAS):
            continue
        itens.append({
            "id": f"e{i:04d}", "origem": "conta",
            "tipo": "entrada" if es == "Entrada" else "saida",
            "dataCompra": iso(data), "dataPagamento": iso(data),
            "descricao": desc, "estabelecimento": estab_conta(desc),
            "categoria": cat.split(" (detalhada")[0], "valor": round(float(valor), 2),
            "meio": MEIOS.get(meio, meio), "conta": conta_curta(conta),
            "cartaoFinal": "", "parcela": "", "grupoParcela": "",
            "status": "pago",
            "recorrente": any(k in cat for k in RECORRENTES),
            "interno": any(cat.startswith(k) for k in INTERNAS),
        })

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
    main(sys.argv[1], sys.argv[2])
