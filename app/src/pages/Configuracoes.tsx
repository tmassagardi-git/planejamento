import { useState } from 'react'
import { useStore } from '../lib/store'
import { Button, Card, CardHeader } from '../components/ui'
import { formatPercent } from '../lib/format'

export function Configuracoes() {
  const { data, updateSettings, resetToSeed } = useStore()
  const [percent, setPercent] = useState(String((data.settings.repassePercent * 100).toFixed(2)))
  const [taxJ, setTaxJ] = useState(String((data.settings.taxJungers * 100).toFixed(2)))
  const [taxE, setTaxE] = useState(String((data.settings.taxEverest * 100).toFixed(2)))

  function save() {
    updateSettings({
      repassePercent: Number(percent.replace(',', '.')) / 100,
      taxJungers: Number(taxJ.replace(',', '.')) / 100,
      taxEverest: Number(taxE.replace(',', '.')) / 100,
    })
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Card>
        <CardHeader title="Regra padrão de repasse" subtitle="Usada para sugerir o repasse de novos lançamentos, quando não informado manualmente" />
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 pt-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">% de repasse padrão</span>
            <input value={percent} onChange={(e) => setPercent(e.target.value)} className="input" />
            <span className="text-xs text-slate-400">Atual: {formatPercent(data.settings.repassePercent)} do valor bruto</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Imposto Jungers (%)</span>
            <input value={taxJ} onChange={(e) => setTaxJ(e.target.value)} className="input" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Imposto Everest (%)</span>
            <input value={taxE} onChange={(e) => setTaxE(e.target.value)} className="input" />
          </label>
        </div>
        <div className="flex justify-end px-5 pb-5">
          <Button onClick={save}>Salvar parâmetros</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Dados locais" subtitle="Todos os lançamentos ficam salvos no navegador (localStorage), a partir da planilha histórica importada" />
        <div className="flex items-center justify-between px-5 pb-5 pt-3">
          <p className="max-w-sm text-xs text-slate-400">
            Restaurar os dados originais descarta qualquer edição feita neste navegador e recarrega os valores da planilha
            "Everest e Jungers — Repasses mensais".
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Restaurar os dados originais da planilha? Todas as edições feitas neste navegador serão perdidas.')) {
                resetToSeed()
              }
            }}
          >
            Restaurar dados originais
          </Button>
        </div>
      </Card>
    </div>
  )
}
