#!/usr/bin/env bash
export TERM="${TERM:-xterm-256color}"
cd /Users/gerhardgustav/Desktop/hobby-dev/ai-mindset-hackathon-aug-15-2026

type_line() {
  echo -n "$ "
  for ((i=0; i<${#1}; i++)); do
    printf "%s" "${1:$i:1}"
    sleep 0.012
  done
  echo
}

clear
echo "── dataset/: разрозненная выгрузка одного человека за полгода ──"
sleep 0.6
type_line "cat dataset/ПРОЧТИ\\ МЕНЯ.txt"
cat "dataset/ПРОЧТИ МЕНЯ.txt"
sleep 1.2

type_line "find dataset -mindepth 1 -maxdepth 1 -type d"
find dataset -mindepth 1 -maxdepth 1 -type d | sort
sleep 0.8

type_line "find dataset -type f | wc -l   # заметки, чаты, календарь, счета, расшифровки, скрины"
find dataset -type f | wc -l | tr -d ' '
sleep 1.2

echo
echo "── CLI отвечает на вопрос, связывая 3-4 источника ──"
sleep 0.6
Q1='Почему Артём не выходил на связь в начале мая и как разрешилась ситуация?'
type_line "node bin/cli.mjs query \"$Q1\""
node bin/cli.mjs query "$Q1"
sleep 1.5

echo
Q2='В чём разница между условиями оплаты по «Тропе» и «Пергаменту»?'
type_line "node bin/cli.mjs query \"$Q2\""
node bin/cli.mjs query "$Q2"
sleep 2
