'use client';
import { useState } from 'react';

const SECTIONS = [
  {
    title: '1. Introdução',
    content: 'O Bolão dos Meladores nasce com um único propósito: resgatar a zoeira que sempre foi marca registrada desse grupo. A interação andou meio parada, mas a Copa do Mundo 2026 é a desculpa perfeita pra trazer todo mundo de volta. Aqui não tem especialista, não tem analista tático — tem palpite na fé, sofrimento coletivo e a certeza de que alguém vai passar vergonha. Bora manter a tradição viva e provar quem realmente entende de bola (ou quem tem mais sorte).'
  },
  {
    title: '2.1 Jogos — Quando há vencedor',
    content: '10 pts — Placar exato. Ex: palpitou 2x1, resultado 2x1.\n7 pts — Acertou vencedor + gols de pelo menos 1 time. Ex: palpitou 2x1, resultado 2x0.\n5 pts — Acertou vencedor, errou gols dos dois. Ex: palpitou 2x1, resultado 1x0.\n2 pts — Errou vencedor, acertou gols de pelo menos 1 time. Ex: palpitou 2x1, resultado 0x1.\n0 pts — Errou tudo.'
  },
  {
    title: '2.2 Jogos — Empates',
    content: '10 pts — Placar exato. Ex: palpitou 1x1, resultado 1x1.\n7 pts — Acertou empate, placar diferente. Ex: palpitou 1x1, resultado 2x2.\n2 pts — Errou empate, acertou gols de pelo menos 1 time. Ex: palpitou 2x2, resultado 2x1.\n0 pts — Errou tudo.'
  },
  {
    title: '2.3 Jogos do Brasil',
    content: 'Toda pontuação do placar é dobrada nos jogos do Brasil.\nEx: placar exato em jogo do Brasil = 20 pts.'
  },
  {
    title: '2.4 Classificação — Fase de Grupos',
    content: 'Palpitar a classificação completa do grupo (1º ao 4º).\n10 pts por posição acertada.\nMáximo por grupo: 40 pts (acertou as 4 posições).\nEx: acertou 1º e 3º mas errou 2º e 4º = 20 pts.\n12 grupos = máximo 480 pts.'
  },
  {
    title: '2.5 Classificação — Mata-mata',
    content: 'Palpitar quem avança em cada jogo:\n32-avos: 7 pts\nOitavas: 10 pts\nQuartas: 15 pts\nSemifinais: 20 pts\nFinal: 40 pts'
  },
  {
    title: '2.6 Palpite Inicial',
    content: 'Registrado antes da Copa, pontuação só entra após a final.\nCampeão: 60 pts\nVice: 40 pts\n3º Lugar: 20 pts\nMáximo: 120 pts'
  },
  {
    title: '3. Prazos para Palpites',
    content: 'Todos os palpites da rodada devem ser enviados de uma vez, antes do primeiro jogo da rodada. Bloqueio automático.\n\nPalpite Inicial + Classificados + 1ª Rodada: 11/06 às 16h\n2ª Rodada: 18/06 às 13h\n3ª Rodada: 24/06 às 16h\n32-avos: 28/06 às 16h\nOitavas: 04/07 às 14h\nQuartas: 09/07 às 17h\nSemifinais: 14/07 às 16h\n3º Lugar: 18/07 às 18h\nFinal: 19/07 às 16h'
  },
  {
    title: '4. Classificação e Desempate',
    content: 'Classificação pela soma total de pontos acumulados. O ranking é atualizado automaticamente após cada rodada.\n\nA pontuação do palpite inicial só entra após a final.\n\nDesempate: maior número de acertos exatos (placar cravado). Persistindo o empate, os participantes dividem a posição.'
  },
];

export default function RegulamentoPage() {
  const [open, setOpen] = useState(0);

  return (
    <div className="max-w-[900px] mx-auto p-5">
      <div className="card">
        <h3 className="section-title">📋 Regulamento Oficial</h3>

        <div className="flex flex-col gap-1">
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              className={`border border-dark-200 rounded-lg overflow-hidden transition-all ${
                open === i ? 'bg-primary-50' : 'bg-dark-50'
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full px-4 py-3 flex justify-between items-center text-left"
              >
                <span className="font-sans text-sm font-bold text-dark-900">{s.title}</span>
                <span className={`text-xs transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {open === i && (
                <div className="px-4 pb-3 text-xs text-dark-700 leading-relaxed whitespace-pre-line animate-fade-in">
                  {s.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
