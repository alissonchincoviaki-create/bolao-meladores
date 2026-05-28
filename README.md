# 🍯 Bolão dos Meladores — Guia de Instalação

## Passo a Passo para colocar no ar (Vercel + Supabase)

### 1. Criar conta no Supabase (Banco de Dados)
1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em "New Project"
3. Escolha um nome (ex: bolao-meladores) e uma senha para o banco
4. Região: escolha "South America (São Paulo)" para menor latência
5. Aguarde a criação (~2 min)
6. Vá em **SQL Editor** e cole TODO o conteúdo do arquivo `supabase-schema.sql`
7. Clique em **Run** para criar as tabelas e inserir os jogos
8. Vá em **Settings > API** e copie:
   - `Project URL` (ex: https://xxxxx.supabase.co)
   - `anon public key` (a chave longa)

### 2. Criar conta na API da Anthropic (Zoeira AI)
1. Acesse https://console.anthropic.com e crie uma conta
2. Vá em **API Keys** e crie uma nova chave
3. Adicione crédito mínimo (US$ 5 é mais que suficiente para a Copa toda)
4. Copie a API key gerada

### 3. Deploy na Vercel
1. Acesse https://vercel.com e crie uma conta (pode usar GitHub)
2. Faça upload do projeto ou conecte o repositório GitHub
3. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
   ADMIN_PASSWORD=meladores2026
   ```
4. Clique em **Deploy**
5. Seu site estará em: `bolao-meladores.vercel.app`

### 4. Configurar o Admin
1. Acesse o site e faça login como admin
2. Cadastre os participantes (nome + login)
3. Faça upload das 3 fotos/zoeiras de cada um
4. Compartilhe o link e a senha temporária com o grupo

### 5. Durante a Copa
- Após cada jogo, entre no painel admin e insira o resultado
- O sistema calcula pontuação, ranking e gera zoeiras automaticamente
- Após a fase de grupos, insira a classificação final de cada grupo
- No mata-mata, atualize os times conforme avançam

---

## Estrutura do Projeto

```
bolao-meladores/
├── src/
│   ├── app/          # Páginas Next.js
│   ├── components/   # Componentes React
│   ├── lib/
│   │   ├── scoring.js    # Lógica de pontuação
│   │   ├── zoeira.js     # Engine de zoeira (API Claude)
│   │   └── supabase.js   # Conexão com banco
│   └── data/         # Dados estáticos
├── public/           # Assets
├── supabase-schema.sql  # Schema do banco
└── README.md
```

## Custos
- **Vercel**: R$ 0 (plano gratuito)
- **Supabase**: R$ 0 (plano gratuito — suporta até 500MB e 50.000 requests/mês)
- **API Anthropic**: ~R$ 2 pela Copa toda (zoeira AI)
- **Total: ~R$ 2**
