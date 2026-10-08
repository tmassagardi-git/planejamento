#!/usr/bin/env bash
# Hook UserPromptSubmit: lembra o Claude de perguntar em qual projeto
# um trabalho novo deve ser colocado. O texto impresso aqui vira contexto.
DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cat <<'MSG'
[Regra do usuário] Se esta mensagem pedir um TRABALHO NOVO (código, documento,
design, análise, artefato etc.), ANTES de começar pergunte ao usuário em qual
projeto esse trabalho deve ser colocado (use AskUserQuestion, com os projetos
abaixo como opções). Não pergunte de novo se o projeto já foi informado nesta
conversa ou na própria mensagem, nem para perguntas rápidas ou continuações.
MSG
if [ -f "$DIR/config/projetos.md" ]; then
  echo "Projetos conhecidos:"
  grep -E '^- ' "$DIR/config/projetos.md"
fi
