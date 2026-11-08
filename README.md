# Cinema Social 3D Multiplayer 🎬🍿

Um jogo web 3D multiplayer em tempo real: cinema virtual ao ar livre onde amigos podem entrar, explorar o cenário, sentar em poltronas, conversar por voz espacial 3D (Web Audio HRTF + LiveKit Cloud) e assistir juntos a vídeos e transmissões em um telão sincronizado.

---

## 🌟 Principais Funcionalidades

### 1. Ambiente 3D Cinema ao Ar Livre
- **Visual Estilizado e Noturno:** Céu com constelações de estrelas, iluminação ambiente suave, luar com sombras projetadas.
- **Detalhes Cenográficos:** Cordão de lâmpadas decorativas (fairy lights / varal de luzes suspensas) com emissão quente sobre a plateia, postes de madeira, chão de grama e caminhos de pedra, palco de madeira com uplights e árvores estilizadas ao redor.
- **Telão Cinematográfico Gigante:** Moldura metálica e tela 16:9 montada a 14 metros de largura, com backlight suave e encaixe em 3D.
- **Plateia Escalonada:** 4 fileiras de poltronas confortáveis em desnível (arquibancada escalonada), garantindo visibilidade para todas as posições.

### 2. Sistema de Cadeiras e Interação
- Cadeiras com posições e orientações fixas voltadas ao telão.
- Indicador 3D interativo flutuante `[E] Sentar` ao se aproximar (< 1.6m).
- Posição e rotação do personagem travados na poltrona enquanto sentados.
- Transição de câmera em terceira pessoa confortável ao sentar.
- Controle rigoroso de ocupação pelo servidor: uma cadeira ocupada não aceita um segundo jogador.
- Desconexões liberam a poltrona automaticamente para os demais espectadores.
- `[E]` ou `[Espaço]` para levantar a qualquer momento.

### 3. Multiplayer em Tempo Real
- **Salas Públicas e Privadas:** Crie salas privadas ou use o código de convite (ex: `CINEMA-7X9`).
- **Link de Convite:** Clique único no HUD para copiar o link direto (`?room=CODIGO`).
- **Sincronização 25Hz:** Buffer de movimentação com interpolação suave (lerp e angular lerp) no cliente, evitando movimentações travadas.
- **Anfitrião da Sala:** O criador da sala tem permissões de anfitrião (ícone de coroa 👑) para trocar o vídeo e controlar a reprodução. Transferência automática caso o anfitrião saia.

### 4. Áudio Espacial 3D e Chat de Voz
- **LiveKit Cloud + WebRTC:** Conexão oficial via `livekit-client` com geração segura de tokens no backend.
- **Web Audio API com PannerNode HRTF:**
  - Modelo HRTF (Head-Related Transfer Function) para percepção 3D de direção (esquerda, direita, frente, trás).
  - Atenuação realista por distância: amigos ao lado são ouvidos com clareza; longe, o volume diminui até sumir no perímetro.
  - Listener atualizado frame a frame com a orientação da câmera.
- **Controles de Voz:** Botão de Mute, modo Pressionar para Falar (PTT na tecla `V`), indicador visual de fala (halo e aura verde) e ajuste individual de volume.
- **Fallback Gracioso:** Se as chaves do LiveKit Cloud ainda não estiverem configuradas, o sistema ativa monitoramento de microfone local e simulação espacial sem travar o jogo.

### 5. Telão e Fontes de Mídia Modulares
- **YouTube:** Player oficial da YouTube IFrame API com play/pause e sincronização de tempo.
- **Twitch:** Embed oficial interativo (`Twitch.Player`) com suporte ao parâmetro de domínio `parent`.
- **TikTok:** Suporte a vídeos oficiais embutidos e card inteligente para TikTok LIVE (com aviso técnico das diretrizes de segurança da TikTok e link para transmissão oficial).
- **Vídeo Direto:** Suporte a arquivos MP4 / WebM / HLS.

---

## 🎮 Controles

| Tecla / Ação | Função |
| :--- | :--- |
| **W, A, S, D** | Movimentar o personagem |
| **Shift** | Correr |
| **Espaço** | Pular (ou levantar se estiver sentado) |
| **E** | Sentar na cadeira próxima / Levantar |
| **Mouse (Arrastar)** | Rotacionar câmera em terceira pessoa |
| **V (opcional)** | Pressionar para falar (PTT) |
| **HUD (Telão)** | Abrir painel de controle do telão (anfitrião) |
| **HUD (Participantes)** | Ver lista e ajustar volume individual |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ (recomendado Node 20+)
- NPM

### 1. Instalar Dependências
```bash
npm run install:all
```

### 2. Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
*(Opcional: insira suas credenciais do LiveKit Cloud para ativar o SFU de voz).*

### 3. Rodar em Desenvolvimento
```bash
# Servidor (porta 3001)
npm run dev:server

# Cliente Vite (porta 5173 com proxy automático)
npm run dev:client
```

### 4. Rodar Testes Automatizados de Multiplayer
```bash
npm run test:multiplayer
```

### 5. Compilar para Produção
```bash
npm run build
npm start
```
Acesse `http://localhost:3001`. O servidor Express hospeda tanto a API, os WebSockets do jogo quanto o cliente React Three Fiber compilado.

---

## 🌐 Deploy no Render

O projeto está pronto para deploy como **Web Service** no Render utilizando o arquivo `render.yaml` ou as ferramentas do MCP Render.

1. **Repositório:** `https://github.com/perdidoguru/s3amd`
2. **Branch:** `feat/cinema-multiplayer`
3. **Build Command:** `npm run build`
4. **Start Command:** `npm start`
5. **Porta:** `3001` (ou a atribuída pela variável `$PORT` do Render).
