const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { initMatches, allocateSchedules, splitIntoGroups, getGroupLayout } = require('./services/scheduler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const DEFAULT_GROUP_LOGIC_NAME = 'LOGICA SPBASKET'
const DEFAULT_GROUP_LOGIC_CONFIG = JSON.stringify({
  definitions: [
    {
      teamCount: 3,
      roundTripCount: 2,
      groups: { A: 3, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: false, final: true },
      positions: ['A1', 'A2', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 4,
      roundTripCount: 1,
      groups: { A: 4, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: false },
      positions: ['A1', 'A4', 'A3', 'A2', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 5,
      roundTripCount: 1,
      groups: { A: 5, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: false, final: true },
      positions: ['A1', 'A2', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 6,
      roundTripCount: 1,
      groups: { A: 6, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: false, final: true },
      positions: ['A1', 'A2', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 7,
      roundTripCount: 1,
      groups: { A: 7, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: false, final: true },
      positions: ['A1', 'A2', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 8,
      roundTripCount: 1,
      groups: { A: 4, B: 4, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: false, cuartos: true, semifinal: true, final: true },
      positions: ['A1', 'B4', 'B2', 'A3', 'A2', 'B3', 'B1', 'A4', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 9,
      roundTripCount: 1,
      groups: { A: 5, B: 4, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: false, cuartos: true, semifinal: true, final: true },
      positions: ['A1', 'B4', 'B2', 'A3', 'A2', 'B3', 'B1', 'A4', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 10,
      roundTripCount: 1,
      groups: { A: 5, B: 5, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: false, final: true },
      positions: ['A1', 'B1', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 11,
      roundTripCount: 1,
      groups: { A: 6, B: 5, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: false, final: true },
      positions: ['A1', 'B1', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 12,
      roundTripCount: 1,
      groups: { A: 4, B: 4, C: 4, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: true, cuartos: true, semifinal: true, final: true },
      positions: ['A1', 'BYE', 'C3', 'B3', 'B2', 'A4', 'BYE', 'A2', 'C1', 'BYE', 'C2', 'B4', 'A3', 'C4', 'BYE', 'B1']
    },
    {
      teamCount: 13,
      roundTripCount: 1,
      groups: { A: 5, B: 4, C: 4, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: true, cuartos: true, semifinal: true, final: true },
      positions: ['A1', 'BYE', 'C3', 'B3', 'B2', 'A4', 'BYE', 'A2', 'C1', 'BYE', 'C2', 'B4', 'A3', 'C4', 'BYE', 'B1']
    },
    {
      teamCount: 14,
      roundTripCount: 1,
      groups: { A: 5, B: 5, C: 4, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: true, cuartos: true, semifinal: true, final: true },
      positions: ['A1', 'BYE', 'C3', 'B3', 'B2', 'A4', 'BYE', 'A2', 'C1', 'BYE', 'C2', 'B4', 'A3', 'C4', 'BYE', 'B1']
    },
    {
      teamCount: 15,
      roundTripCount: 1,
      groups: { A: 5, B: 5, C: 5, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '1', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', '1-2', 'B1', 'C1', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 16,
      roundTripCount: 1,
      groups: { A: 4, B: 4, C: 4, D: 4, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: true, cuartos: true, semifinal: true, final: true },
      positions: ['A1', 'D4', 'B2', 'C3', 'B1', 'A4', 'C2', 'D3', 'C1', 'B4', 'D2', 'A3', 'D1', 'C4', 'A2', 'B3']
    },
    {
      teamCount: 17,
      roundTripCount: 1,
      groups: { A: 5, B: 4, C: 4, D: 4, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: 'T', 3: 'T', 4: 'T', 5: '' },
      finals: { octavos: true, cuartos: true, semifinal: true, final: true },
      positions: ['A1', 'D4', 'B2', 'C3', 'B1', 'A4', 'C2', 'D3', 'C1', 'B4', 'D2', 'A3', 'D1', 'C4', 'A2', 'B3']
    },
    {
      teamCount: 18,
      roundTripCount: 1,
      groups: { A: 6, B: 6, C: 6, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '1', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', '1-2', 'B1', 'C1', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 19,
      roundTripCount: 1,
      groups: { A: 7, B: 6, C: 6, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '1', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', 'C1', 'B1', 'A2', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 20,
      roundTripCount: 1,
      groups: { A: 5, B: 5, C: 5, D: 5, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', 'D1', 'B1', 'C1', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 21,
      roundTripCount: 1,
      groups: { A: 6, B: 5, C: 5, D: 5, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', 'D1', 'B1', 'C1', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 22,
      roundTripCount: 1,
      groups: { A: 6, B: 6, C: 5, D: 5, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', 'D1', 'B1', 'C1', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 23,
      roundTripCount: 1,
      groups: { A: 6, B: 6, C: 6, D: 5, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', 'D1', 'C1', 'B1', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 24,
      roundTripCount: 1,
      groups: { A: 6, B: 6, C: 6, D: 6, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: false, semifinal: true, final: true },
      positions: ['A1', 'D1', 'B1', 'C1', '', '', '', '', '', '', '', '', '', '', '', '']
    },
    {
      teamCount: 25,
      roundTripCount: 1,
      groups: { A: 5, B: 5, C: 5, D: 5, E: 5, F: 0, G: 0, H: 0, I: 0, J: 0 },
      qualifiers: { 1: 'T', 2: '3', 3: '', 4: '', 5: '' },
      finals: { octavos: false, cuartos: true, semifinal: true, final: true },
      positions: ['A1', '2-2', 'E1', 'D1', 'C1', '3-2', '1-2', 'B1', '', '', '', '', '', '', '', '']
    }
  ]
}, null, 2)

// Middleware de logging para diagnóstico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
const prisma = new PrismaClient();

async function getCategoryManualGroupAssignment(categoryId) {
  const rows = await prisma.$queryRaw`
    SELECT manualGroupAssignment
    FROM Category
    WHERE id = ${categoryId}
    LIMIT 1
  `;

  if (!rows.length) return false;
  return !!rows[0].manualGroupAssignment;
}

async function setCategoryManualGroupAssignment(categoryId, enabled) {
  await prisma.$executeRaw`
    UPDATE Category
    SET manualGroupAssignment = ${enabled ? 1 : 0}
    WHERE id = ${categoryId}
  `;
}
const PORT = process.env.PORT || 3001;

// Helper para registro de eventos en el acta
const createLog = async (matchId, officialName, action, matchData = {}, details = null, gameTime = null) => {
  try {
    await prisma.matchLog.create({
      data: {
        matchId,
        officialName,
        action,
        homeScore: matchData.homeScore,
        awayScore: matchData.awayScore,
        homeFouls: matchData.homeFouls || 0,
        awayFouls: matchData.awayFouls || 0,
        gameTime,
        details
      }
    });
  } catch (e) {
    console.error("Error creating log:", e);
  }
};

const ownsLiveMatchSession = (match, officialName, sessionKey) => {
  if (!match?.isLive) return true;
  if (!match.liveSessionKey) return true;
  return match.officialName === officialName && match.liveSessionKey === sessionKey;
};

function normalizeOfficialName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Sirve el frontend (carpeta dist) en producción
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

async function ensureDefaultGroupLogic() {
  let existing = await prisma.groupLogic.findFirst({ where: { isDefault: true } })
  if (!existing) {
    existing = await prisma.groupLogic.create({
      data: {
        name: DEFAULT_GROUP_LOGIC_NAME,
        description: 'Lógica histórica del sistema para generación de grupos y cuadros finales.',
        config: DEFAULT_GROUP_LOGIC_CONFIG,
        isDefault: true
      }
    })
  } else if (
    existing.name !== DEFAULT_GROUP_LOGIC_NAME ||
    existing.description !== 'Lógica histórica del sistema para generación de grupos y cuadros finales.' ||
    existing.config !== DEFAULT_GROUP_LOGIC_CONFIG
  ) {
    existing = await prisma.groupLogic.update({
      where: { id: existing.id },
      data: {
        name: DEFAULT_GROUP_LOGIC_NAME,
        description: 'Lógica histórica del sistema para generación de grupos y cuadros finales.',
        config: DEFAULT_GROUP_LOGIC_CONFIG
      }
    })
  }

  return existing
}

async function resolveTournamentGroupLogicId(groupLogicId) {
  const defaultLogic = await ensureDefaultGroupLogic()
  const resolvedId = parseInt(groupLogicId) || defaultLogic.id
  const logic = await prisma.groupLogic.findUnique({ where: { id: resolvedId } })
  if (!logic) throw new Error('La lógica de grupos seleccionada no existe.')
  return logic.id
}

function validateGroupLogicConfig(configString) {
  const parsed = JSON.parse(configString)
  if (!parsed || typeof parsed !== 'object') throw new Error('Configuración de lógica inválida.')
  if (!Array.isArray(parsed.definitions)) throw new Error('La configuración debe incluir "definitions".')

  const seen = new Set()
  for (const def of parsed.definitions) {
    const teamCount = parseInt(def.teamCount)
    if (!Number.isInteger(teamCount) || teamCount <= 0) throw new Error('Cada definición debe tener un número de jugadores válido.')
    if (seen.has(teamCount)) throw new Error(`Ya existe una definición para ${teamCount} jugadores en esta lógica.`)
    seen.add(teamCount)
  }
  return parsed
}

function parseLogicConfig(configString) {
  const parsed = JSON.parse(configString || '{}')
  return Array.isArray(parsed.definitions) ? parsed : { definitions: [] }
}

function getEnabledBracketSize(finals = {}) {
  if (finals.octavos) return 16
  if (finals.cuartos) return 8
  if (finals.semifinal) return 4
  if (finals.final) return 2
  return 0
}

function getStageNameBySize(size) {
  if (size === 16) return 'Octavos'
  if (size === 8) return 'Cuartos'
  if (size === 4) return 'Semifinal'
  if (size === 2) return 'Final'
  return null
}

function buildBracketStages(definition) {
  const bracketSize = getEnabledBracketSize(definition?.finals)
  if (!bracketSize) return []

  const stages = []
  let size = bracketSize
  let round = 2
  while (size >= 2) {
    const stageName = getStageNameBySize(size)
    if (!stageName) break
    const matchCount = size / 2
    stages.push({
      name: stageName,
      size,
      round,
      matchCount,
      labels: Array.from({ length: matchCount }, (_, idx) => stageName === 'Final' ? 'Final' : `${stageName} ${idx + 1}`)
    })
    size /= 2
    round += 1
  }
  return stages
}

async function getCategoryLogicDefinition(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      tournament: {
        include: {
          groupLogic: true
        }
      }
    }
  })

  if (!category) throw new Error('Categoría no encontrada.')
  const logic = category.tournament?.groupLogic
  if (!logic?.config) throw new Error('El torneo no tiene una lógica de grupos asociada.')

  const teamCount = await prisma.team.count({ where: { categoryId } })
  const config = parseLogicConfig(logic.config)
  const definition = config.definitions.find(def => parseInt(def.teamCount) === teamCount)
  if (!definition) {
    throw new Error(`La lógica "${logic.name}" no tiene definición para ${teamCount} jugadores.`)
  }

  return { category, logic, definition, teamCount }
}


// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir imágenes publicitarias del torneo desde carpeta local
const imagesDir = 'C:/Users/jamayuelas/OneDrive - ELMUBAS IBERICA, SLU/Documentos/Personal/IA/Antigravity/spbasket-3x3/Imagenes_Torneo';
app.use('/api/tournament-images', express.static(imagesDir));

app.get('/api/images-list', (req, res) => {
  try {
    const files = fs.readdirSync(imagesDir);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files.filter(file => validExtensions.includes(path.extname(file).toLowerCase()));
    res.json(images);
  } catch (e) {
    console.error("Error listing images:", e);
    res.json([]);
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  // Usar ruta relativa para que funcione en cualquier dominio/túnel
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ─────────────────────────────────────────────────────────────
// GROUP LOGICS
// ─────────────────────────────────────────────────────────────
app.get('/api/group-logics', async (req, res) => {
  try {
    await ensureDefaultGroupLogic()
    const logics = await prisma.groupLogic.findMany({
      include: {
        _count: { select: { tournaments: true } }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    })
    res.json(logics)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/group-logics', async (req, res) => {
  try {
    const { name, description, config } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' })
    if (!config?.trim()) return res.status(400).json({ error: 'La configuración es obligatoria' })

    validateGroupLogicConfig(config)

    const created = await prisma.groupLogic.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        config: config.trim(),
        isDefault: false
      }
    })
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/group-logics/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const logic = await prisma.groupLogic.findUnique({
      where: { id },
      include: { _count: { select: { tournaments: true } } }
    })
    if (!logic) return res.status(404).json({ error: 'Lógica no encontrada' })
    if (logic.isDefault) return res.status(403).json({ error: 'La lógica marcada como POR DEFECTO no se puede modificar.' })

    const { name, description, config } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' })
    if (!config?.trim()) return res.status(400).json({ error: 'La configuración es obligatoria' })
    validateGroupLogicConfig(config)

    const updated = await prisma.groupLogic.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        config: config.trim()
      }
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/group-logics/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const logic = await prisma.groupLogic.findUnique({
      where: { id },
      include: { _count: { select: { tournaments: true } } }
    })
    if (!logic) return res.status(404).json({ error: 'Lógica no encontrada' })
    if (logic.isDefault) return res.status(403).json({ error: 'La lógica marcada como POR DEFECTO no se puede borrar.' })
    if (logic._count.tournaments > 0) return res.status(403).json({ error: 'No se puede borrar una lógica asociada a torneos existentes.' })

    await prisma.groupLogic.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})


// ─────────────────────────────────────────────
// COURTS (Pistas)
// ─────────────────────────────────────────────
app.get('/api/tournaments/:tid/courts', async (req, res) => {
  try {
    const tid = parseInt(req.params.tid);
    const courts = await prisma.court.findMany({ 
      where: { tournamentId: tid },
      orderBy: { name: 'asc' }
    });
    res.json(courts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tournaments/:tid/courts', async (req, res) => {
  try {
    const tid = parseInt(req.params.tid);
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre de pista obligatorio' });
    const court = await prisma.court.create({ 
      data: { name, tournamentId: tid } 
    });
    res.status(201).json(court);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tournaments/:tid/courts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    const court = await prisma.court.update({
      where: { id },
      data: { name }
    });
    res.json(court);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tournaments/:tid/courts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tid = parseInt(req.params.tid);
    const locked = await hasActiveSchedule(tid);
    if (locked) return res.status(423).json({ error: '🔒 CALENDARIO ACTIVO — elimina primero el calendario asignado' });
    
    await prisma.court.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────
// COURT CONFIGURATIONS (Franjas, Pistas y Categorías)
// ─────────────────────────────────────────────
app.get('/api/tournaments/:tid/court-configs', async (req, res) => {
  try {
    const tid = parseInt(req.params.tid);
    const configs = await prisma.jornadaCourtConfig.findMany({
      where: { court: { tournamentId: tid } },
      include: {
        categories: true,
        court: true,
        jornada: true
      }
    });
    res.json(configs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tournaments/:tid/court-configs', async (req, res) => {
  try {
    const tid = parseInt(req.params.tid);

    const locked = await hasActiveSchedule(tid);
    if (locked) return res.status(423).json({ error: '🔒 CALENDARIO ACTIVO — No se puede modificar la configuración de pistas porque ya hay partidos programados. Elimina primero el calendario para realizar cambios.' });

    const { configs, jornadaId, courtId, categoryIds } = req.body;

    // Caso 1: Bulk Update (usado por CourtManager)
    if (configs && Array.isArray(configs)) {
      // Obtenemos todas las pistas del torneo para limpiar sus configuraciones
      const courts = await prisma.court.findMany({ where: { tournamentId: tid } });
      const courtIds = courts.map(c => c.id);

      // Usamos una transacción para asegurar consistencia
      const result = await prisma.$transaction(async (tx) => {
        // Borrar todas las configuraciones actuales de las pistas de este torneo
        await tx.jornadaCourtConfig.deleteMany({
          where: { courtId: { in: courtIds } }
        });

        // Crear las nuevas
        const created = [];
        for (const conf of configs) {
          const newConf = await tx.jornadaCourtConfig.create({
            data: {
              jornadaId: parseInt(conf.jornadaId),
              courtId: parseInt(conf.courtId),
              categories: {
                connect: (conf.categoryIds || []).map(id => ({ id: parseInt(id) }))
              }
            }
          });
          created.push(newConf);
        }
        return created;
      });

      return res.status(201).json(result);
    }

    // Caso 2: Creación individual (fallback)
    if (!jornadaId || !courtId) return res.status(400).json({ error: 'Jornada y Pista son obligatorias' });
    
    const config = await prisma.jornadaCourtConfig.create({
      data: {
        jornadaId: parseInt(jornadaId),
        courtId: parseInt(courtId),
        categories: {
          connect: (categoryIds || []).map(id => ({ id: parseInt(id) }))
        }
      },
      include: { categories: true, court: true, jornada: true }
    });
    res.status(201).json(config);
  } catch (e) { 
    console.error("Error saving court configs:", e);
    res.status(500).json({ error: e.message }); 
  }
});


app.put('/api/tournaments/:tid/court-configs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { categoryIds } = req.body;
    
    const config = await prisma.jornadaCourtConfig.update({
      where: { id },
      data: {
        categories: {
          set: (categoryIds || []).map(id => ({ id: parseInt(id) }))
        }
      },
      include: { categories: true, court: true, jornada: true }
    });
    res.json(config);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tournaments/:tid/court-configs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.jornadaCourtConfig.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────
// OFFICIALS (Oficiales de Mesa) — Scoped by Tournament
// ─────────────────────────────────────────────
app.get('/api/tournaments/:tid/officials', async (req, res) => {
  try {
    const tid = req.params.tid;
    const tournamentId = parseInt(tid);
    if (isNaN(tournamentId)) return res.status(400).json({ error: 'ID de torneo inválido' });
    
    const officials = await prisma.official.findMany({ 
      where: { tournamentId },
      include: {
        assignedCourt: true
      },
      orderBy: { firstName: 'asc' } 
    });
    res.json(officials || []);
  } catch (e) { 
    console.error("Error fetching officials:", e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/tournaments/:tid/officials', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tid);
    const { firstName, lastName, isOperational, assignedCourtId } = req.body;
    const operational = isOperational !== undefined ? !!isOperational : true;
    if (!firstName || !lastName) return res.status(400).json({ error: 'Nombre y apellidos obligatorios' });
    if (!operational && assignedCourtId) return res.status(400).json({ error: 'No se puede asignar una pista a un oficial no operativo.' });
    if (assignedCourtId) {
      const court = await prisma.court.findFirst({
        where: { id: parseInt(assignedCourtId), tournamentId }
      });
      if (!court) return res.status(400).json({ error: 'La pista asignada no pertenece a este torneo.' });
    }
    const official = await prisma.official.create({ 
      data: { 
        firstName, 
        lastName, 
        tournamentId, 
        isOperational: operational,
        assignedCourtId: operational && assignedCourtId ? parseInt(assignedCourtId) : null
      },
      include: {
        assignedCourt: true
      }
    });
    res.status(201).json(official);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tournaments/:tid/officials/:id', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tid);
    const id = parseInt(req.params.id);
    const { firstName, lastName, isOperational, assignedCourtId } = req.body;

    if (isNaN(tournamentId) || isNaN(id)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const existing = await prisma.official.findFirst({
      where: { id, tournamentId }
    });

    if (!existing) return res.status(404).json({ error: 'Oficial no encontrado' });
    const nextOperational = isOperational !== undefined ? !!isOperational : existing.isOperational;
    if (!nextOperational && assignedCourtId) return res.status(400).json({ error: 'No se puede asignar una pista a un oficial no operativo.' });
    if (assignedCourtId) {
      const court = await prisma.court.findFirst({
        where: { id: parseInt(assignedCourtId), tournamentId }
      });
      if (!court) return res.status(400).json({ error: 'La pista asignada no pertenece a este torneo.' });
    }

    const official = await prisma.official.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(isOperational !== undefined && { isOperational: !!isOperational }),
        ...((assignedCourtId !== undefined || isOperational !== undefined) && {
          assignedCourtId: nextOperational
            ? (assignedCourtId !== undefined ? (assignedCourtId ? parseInt(assignedCourtId) : null) : existing.assignedCourtId)
            : null
        })
      },
      include: {
        assignedCourt: true
      }
    });

    res.json(official);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tournaments/:tid/officials/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID de oficial inválido' });
    await prisma.official.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) { 
    console.error("Error deleting official:", e);
    res.status(500).json({ error: e.message }); 
  }
});

// ─────────────────────────────────────────────
// ACTIVATION LOGIC (Torneos y Partidos)
// ─────────────────────────────────────────────

app.get('/api/tournaments/active', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: { active: true },
      include: { jornadas: true }
    });
    res.json(tournament);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/tournaments/:id/activate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { active } = req.body;

    if (active) {
      await prisma.tournament.updateMany({ data: { active: false } });
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { active }
    });
    res.json(tournament);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/tournaments/:id/timer', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { timerRemainingSeconds, timerRunning } = req.body;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        timerRemainingSeconds,
        timerRunning,
        timerLastSync: new Date()
      }
    });
    res.json(tournament);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/matches/:id/activate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { active, officialName } = req.body;

    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        scheduleSlot: true,
        category: { include: { tournament: true } }
      }
    });

    if (!existingMatch) return res.status(404).json({ error: 'Partido no encontrado' });

    // REGLA: No se puede activar un partido si el torneo no está activo
    if (active && !existingMatch.category.tournament.active) {
      return res.status(400).json({ error: 'No se puede activar el partido porque el torneo no está activo. Activa primero el torneo.' });
    }

    // REGLA: No se puede activar un partido ya finalizado
    if (active && existingMatch.status === 'played') {
      return res.status(400).json({ error: 'No se puede poner en activo un partido ya finalizado con resultado.' });
    }

    if (active) {
      if (!existingMatch.scheduleSlot) return res.status(400).json({ error: 'Partido no programado' });

      // Desactivar otros en la misma pista
      await prisma.match.updateMany({
        where: {
          scheduleSlot: {
            tournamentId: existingMatch.scheduleSlot.tournamentId,
            court: existingMatch.scheduleSlot.court
          }
        },
        data: { active: false }
      });
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        active,
        // Al desactivar manualmente desde admin, también liberamos el isLive y limpiamos oficial si no está jugado
        isLive: active ? existingMatch.isLive : false,
        officialName: (!active && existingMatch.status !== 'played') ? null : existingMatch.officialName,
        liveSessionKey: active ? existingMatch.liveSessionKey : null
      }
    });

    // Registrar log si hay un officialName (Admin)
    if (officialName) {
      await createLog(id, officialName, active ? "ACTIVATE" : "DEACTIVATE", updatedMatch, active ? "Partido activado por administración" : "Partido desactivado por administración");
    }

    res.json(updatedMatch);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Endpoint para que un oficial se "asocie" a un partido (bloqueo)
app.post('/api/matches/:id/join', async (req, res) => {
  const { officialName, sessionKey, officialId } = req.body;
  const matchId = parseInt(req.params.id);

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        scheduleSlot: true,
        category: {
          include: {
            tournament: true
          }
        }
      }
    });

    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.status === 'played') return res.status(400).json({ error: 'Este partido ya ha finalizado' });
    if (!match.active) return res.status(400).json({ error: 'El partido no está marcado como ACTIVO por la organización' });
    if (!sessionKey) return res.status(400).json({ error: 'No se ha podido validar la sesión del acta digital.' });

    const normalizedRequestedName = normalizeOfficialName(officialName);
    let joinedOfficial = null;

    if (officialId !== undefined && officialId !== null && officialId !== '' && Number.isInteger(parseInt(officialId))) {
      joinedOfficial = await prisma.official.findFirst({
        where: {
          id: parseInt(officialId),
          tournamentId: match.category.tournamentId,
          isOperational: true
        },
        include: {
          assignedCourt: true
        }
      });
    }

    if (!joinedOfficial) {
      const tournamentOfficials = await prisma.official.findMany({
        where: {
          tournamentId: match.category.tournamentId,
          isOperational: true
        },
        include: {
          assignedCourt: true
        }
      });

      joinedOfficial = tournamentOfficials.find((official) => {
        const fullName = normalizeOfficialName(`${official.firstName} ${official.lastName}`);
        const firstName = normalizeOfficialName(official.firstName);
        const lastName = normalizeOfficialName(official.lastName);
        return normalizedRequestedName && (
          fullName === normalizedRequestedName ||
          firstName === normalizedRequestedName ||
          lastName === normalizedRequestedName
        );
      }) || null;
    }

    if (!joinedOfficial) {
      return res.status(400).json({ error: 'El oficial seleccionado no está operativo para este torneo.' });
    }

    const resolvedOfficialName = `${joinedOfficial.firstName} ${joinedOfficial.lastName}`.trim();

    if (match.category.tournament.assignOfficialsToCourt) {
      const assignedCourtName = joinedOfficial?.assignedCourt?.name;
      if (!assignedCourtName) {
        return res.status(400).json({ error: 'Este oficial no tiene una pista asignada.' });
      }
      if (assignedCourtName !== match.scheduleSlot?.court) {
        return res.status(400).json({ error: `Este oficial solo puede gestionar la ${assignedCourtName}.` });
      }
    }

    // REGLA: No permitir accesos simultáneos al mismo acta.
    if (match.isLive && match.officialName) {
      if (normalizeOfficialName(match.officialName) !== normalizeOfficialName(resolvedOfficialName)) {
        return res.status(400).json({ error: `Esta pista está siendo gestionada en este momento por ${match.officialName}` });
      }
      if (match.liveSessionKey && match.liveSessionKey !== sessionKey) {
        return res.status(400).json({ error: 'Ya tienes este mismo partido abierto en otra sesión. Ciérralo antes de volver a entrar.' });
      }
    }

    // 2. ¿Está este oficial ya en OTRA pista activa? (solo si no es el mismo partido)
    const otherMatch = await prisma.match.findFirst({
      where: {
        officialName: resolvedOfficialName,
        isLive: true,
        id: { not: matchId },
        status: { not: 'played' }
      },
      include: { scheduleSlot: true }
    });

    if (otherMatch) {
      return res.status(400).json({ error: `Ya tienes un acta abierta para el partido #${otherMatch.matchNumber} en la ${otherMatch.scheduleSlot?.court || 'otra pista'}` });
    }

    // Si todo OK, marcamos como isLive
    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { officialName: resolvedOfficialName, isLive: true, liveSessionKey: sessionKey }
    });

    // Registramos el log de entrada
    await createLog(matchId, resolvedOfficialName, "JOIN", updated, "Entrada al acta digital");

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint para salir del acta sin finalizar
app.post('/api/matches/:id/exit', async (req, res) => {
  const { officialName, sessionKey } = req.body;
  const matchId = parseInt(req.params.id);

  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (!ownsLiveMatchSession(match, officialName, sessionKey)) {
      return res.status(400).json({ error: 'Solo la sesión que abrió esta acta puede cerrarla.' });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { isLive: false, liveSessionKey: null }
    });

    await createLog(matchId, officialName, "EXIT", updated, "Salida del acta (vuelve a estado activo)");
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint para obtener logs de un partido por su número y torneo
app.get('/api/tournaments/:tid/matches/logs/:number', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tid);
    const matchNumber = parseInt(req.params.number);
    const logs = await prisma.matchLog.findMany({
      where: {
        match: {
          matchNumber,
          category: { tournamentId }
        }
      },
      orderBy: { timestamp: 'asc' },
      include: { match: { include: { homeTeam: true, awayTeam: true } } }
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/matches/active/:tournamentId/:court', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tournamentId);
    const court = req.params.court;

    const match = await prisma.match.findFirst({
      where: {
        active: true,
        scheduleSlot: {
          tournamentId,
          court: court // PISTA 1, PISTA 2...
        }
      },
      include: {
        homeTeam: { include: { players: true } },
        awayTeam: { include: { players: true } },
        category: true,
        scheduleSlot: true
      }
    });
    res.json(match);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ─────────────────────────────────────────────
// TOURNAMENTS
// ─────────────────────────────────────────────
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        categories: { include: { teams: { include: { _count: { select: { players: true } } } } } },
        jornadas: true,
        courts: true,
        groupLogic: true,
        _count: { select: { scheduleSlots: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enriquecer con contadores de partidos (total y pendientes)
    const enriched = await Promise.all(tournaments.map(async (t) => {
      const [total, pending] = await Promise.all([
        prisma.match.count({ where: { category: { tournamentId: t.id } } }),
        prisma.match.count({ where: { category: { tournamentId: t.id }, status: 'pending' } })
      ]);
      return { 
        ...t, 
        totalMatches: total, 
        pendingMatches: pending 
      };
    }));

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        categories: {
          include: {
            teams: { include: { players: true } },
            matches: { include: { homeTeam: true, awayTeam: true, scheduleSlot: true } },
          },
        },
        jornadas: {
          include: {
            courtConfigs: { include: { categories: true, court: true } }
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
        },
        courts: true,
        groupLogic: true,
        scheduleSlots: { include: { match: { include: { homeTeam: true, awayTeam: true, category: true } } } },
        _count: { select: { scheduleSlots: true } }
      },
    });
    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });
    res.json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


function resolveRestRoundsBetweenMatches(value, fallback = 1) {
  if (value === undefined || value === null || value === '') return fallback;
  return Math.max(0, parseInt(value) || 0);
}

app.post('/api/tournaments', async (req, res) => {
  try {
    const { name, date, venue, numCourts, matchDuration, matchPlayTime, jornadas, rules, contactInfo, locationInfo, generalInfo, eventPosterUrl, cafePosterUrl, sponsorsImageUrl, headerLogoUrl, backgroundLogoUrl, strictScheduleMode, monitorRefreshTime, assignOfficialsToCourt, groupLogicId } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const resolvedGroupLogicId = await resolveTournamentGroupLogicId(groupLogicId)

    const mainDate = date || (jornadas && jornadas.length > 0 ? jornadas[0].date : null);

    if (jornadas) {
      for (const j of jornadas) {
        if (j.startTime >= j.endTime) {
          return res.status(400).json({ error: `En la jornada ${j.date}, la hora de fin debe ser posterior a la de inicio` });
        }
        const jornadaMatchDuration = j.matchDuration !== undefined ? parseInt(j.matchDuration) : (matchDuration !== undefined ? parseInt(matchDuration) : 15);
        const jornadaMatchPlayTime = j.matchPlayTime !== undefined ? parseInt(j.matchPlayTime) : (matchPlayTime !== undefined ? parseInt(matchPlayTime) : 10);
        if (jornadaMatchPlayTime > jornadaMatchDuration) {
          return res.status(400).json({ error: `En la jornada ${j.date}, el tiempo de partido no puede ser mayor que la duración de la ronda` });
        }
      }
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        date: mainDate,
        venue,
        numCourts: parseInt(numCourts) || 1,
        matchDuration: matchDuration !== undefined ? parseInt(matchDuration) : 15,
        matchPlayTime: matchPlayTime !== undefined ? parseInt(matchPlayTime) : 10,
        strictScheduleMode: !!strictScheduleMode,
        monitorRefreshTime: parseInt(monitorRefreshTime) || 30,
        assignOfficialsToCourt: !!assignOfficialsToCourt,
        groupLogicId: resolvedGroupLogicId,
        rules: rules || null,
        contactInfo: contactInfo || null,
        locationInfo: locationInfo || null,
        generalInfo: generalInfo || null,
        eventPosterUrl: eventPosterUrl || null,
        cafePosterUrl: cafePosterUrl || null,
        sponsorsImageUrl: sponsorsImageUrl || null,
        headerLogoUrl: headerLogoUrl || null,
        backgroundLogoUrl: backgroundLogoUrl || null,
        jornadas: jornadas && jornadas.length > 0 ? {
          create: jornadas.map(j => ({
            date: j.date,
            startTime: j.startTime,
            endTime: j.endTime,
            matchDuration: j.matchDuration !== undefined ? parseInt(j.matchDuration) : (matchDuration !== undefined ? parseInt(matchDuration) : 15),
            matchPlayTime: j.matchPlayTime !== undefined ? parseInt(j.matchPlayTime) : (matchPlayTime !== undefined ? parseInt(matchPlayTime) : 10),
            restRoundsBetweenMatches: resolveRestRoundsBetweenMatches(j.restRoundsBetweenMatches, 1)
          }))
        } : undefined
      },
      include: { jornadas: true, groupLogic: true }
    });
    res.status(201).json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tournaments/:id', async (req, res) => {
  try {
    const { name, date, venue, numCourts, matchDuration, matchPlayTime, jornadas, rules, contactInfo, locationInfo, generalInfo, eventPosterUrl, cafePosterUrl, sponsorsImageUrl, headerLogoUrl, backgroundLogoUrl, strictScheduleMode, monitorRefreshTime, assignOfficialsToCourt, groupLogicId } = req.body;
    const tournamentId = parseInt(req.params.id);
    const resolvedGroupLogicId = groupLogicId !== undefined
      ? await resolveTournamentGroupLogicId(groupLogicId)
      : undefined
    const currentTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { assignOfficialsToCourt: true, matchDuration: true, matchPlayTime: true }
    });

    // Si es solo una actualización de campos de info, no bloquear aunque haya calendario
    const isInfoOnlyUpdate = !name && !date && !venue && !numCourts && !jornadas && !matchDuration && !matchPlayTime && strictScheduleMode === undefined && monitorRefreshTime === undefined;

    if (!isInfoOnlyUpdate) {
      const locked = await hasActiveSchedule(tournamentId);
      if (locked) return res.status(423).json({ error: '🔒 TORNEO BLOQUEADO — No se puede modificar porque ya hay partidos programados' });
    }

    const mainDate = date || (jornadas && jornadas.length > 0 ? jornadas[0].date : null);

    if (jornadas) {
      for (const j of jornadas) {
        if (j.startTime >= j.endTime) {
          return res.status(400).json({ error: `En la jornada ${j.date}, la hora de fin debe ser posterior a la de inicio` });
        }
        const jornadaMatchDuration = j.matchDuration !== undefined ? parseInt(j.matchDuration) : (matchDuration !== undefined ? parseInt(matchDuration) : currentTournament?.matchDuration || 15);
        const jornadaMatchPlayTime = j.matchPlayTime !== undefined ? parseInt(j.matchPlayTime) : (matchPlayTime !== undefined ? parseInt(matchPlayTime) : currentTournament?.matchPlayTime || 10);
        if (jornadaMatchPlayTime > jornadaMatchDuration) {
          return res.status(400).json({ error: `En la jornada ${j.date}, el tiempo de partido no puede ser mayor que la duración de la ronda` });
        }
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(mainDate && { date: mainDate }),
      ...(venue !== undefined && { venue }),
      ...(numCourts && { numCourts: parseInt(numCourts) || 1 }),
      ...(matchDuration && { matchDuration: parseInt(matchDuration) }),
      ...(matchPlayTime !== undefined && { matchPlayTime: parseInt(matchPlayTime) }),
      ...(strictScheduleMode !== undefined && { strictScheduleMode: !!strictScheduleMode }),
      ...(monitorRefreshTime !== undefined && { monitorRefreshTime: parseInt(monitorRefreshTime) || 30 }),
      ...(assignOfficialsToCourt !== undefined && { assignOfficialsToCourt: !!assignOfficialsToCourt }),
      ...(resolvedGroupLogicId !== undefined && { groupLogicId: resolvedGroupLogicId }),
      rules: rules !== undefined ? (rules || null) : undefined,
      contactInfo: contactInfo !== undefined ? (contactInfo || null) : undefined,
      locationInfo: locationInfo !== undefined ? (locationInfo || null) : undefined,
      generalInfo: generalInfo !== undefined ? (generalInfo || null) : undefined,
      eventPosterUrl: eventPosterUrl !== undefined ? (eventPosterUrl || null) : undefined,
      cafePosterUrl: cafePosterUrl !== undefined ? (cafePosterUrl || null) : undefined,
      sponsorsImageUrl: sponsorsImageUrl !== undefined ? (sponsorsImageUrl || null) : undefined,
      headerLogoUrl: headerLogoUrl !== undefined ? (headerLogoUrl || null) : undefined,
      backgroundLogoUrl: backgroundLogoUrl !== undefined ? (backgroundLogoUrl || null) : undefined,
      ...(jornadas ? {
        jornadas: {
          deleteMany: {},
          create: jornadas.map(j => ({
            date: j.date,
            startTime: j.startTime,
            endTime: j.endTime,
            matchDuration: j.matchDuration !== undefined ? parseInt(j.matchDuration) : (matchDuration !== undefined ? parseInt(matchDuration) : currentTournament?.matchDuration || 15),
            matchPlayTime: j.matchPlayTime !== undefined ? parseInt(j.matchPlayTime) : (matchPlayTime !== undefined ? parseInt(matchPlayTime) : currentTournament?.matchPlayTime || 10),
            restRoundsBetweenMatches: resolveRestRoundsBetweenMatches(j.restRoundsBetweenMatches, 1)
          }))
        }
      } : {})
    }
    // Limpiar undefined
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k])

    const shouldClearOfficialAssignments = assignOfficialsToCourt === true && !currentTournament?.assignOfficialsToCourt;

    const tournament = await prisma.$transaction(async (tx) => {
      let existingJornadasWithConfigs = [];
      if (jornadas) {
        existingJornadasWithConfigs = await tx.jornada.findMany({
          where: { tournamentId },
          include: {
            courtConfigs: {
              include: { categories: true }
            }
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
        });
      }

      if (shouldClearOfficialAssignments) {
        await tx.official.updateMany({
          where: { tournamentId },
          data: { assignedCourtId: null }
        });
      }

      const updatedTournament = await tx.tournament.update({
        where: { id: tournamentId },
        data: updateData,
        include: {
          categories: {
            include: {
              teams: { include: { players: true } },
              matches: { include: { homeTeam: true, awayTeam: true, scheduleSlot: true } },
            },
          },
          jornadas: {
            include: {
              courtConfigs: { include: { categories: true, court: true } }
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
          },
          courts: true,
          groupLogic: true,
          scheduleSlots: { include: { match: { include: { homeTeam: true, awayTeam: true, category: true } } } },
          _count: { select: { scheduleSlots: true } }
        },
      });

      if (jornadas && existingJornadasWithConfigs.length > 0 && updatedTournament.jornadas.length > 0) {
        const oldJornadas = [...existingJornadasWithConfigs].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
        const newJornadas = [...updatedTournament.jornadas].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });

        const pairs = Math.min(oldJornadas.length, newJornadas.length);
        for (let i = 0; i < pairs; i++) {
          const from = oldJornadas[i];
          const to = newJornadas[i];
          if (!from.courtConfigs?.length) continue;

          for (const cc of from.courtConfigs) {
            await tx.jornadaCourtConfig.create({
              data: {
                jornadaId: to.id,
                courtId: cc.courtId,
                categories: {
                  connect: (cc.categories || []).map(cat => ({ id: cat.id }))
                }
              }
            });
          }
        }
      }

      return tx.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          categories: {
            include: {
              teams: { include: { players: true } },
              matches: { include: { homeTeam: true, awayTeam: true, scheduleSlot: true } },
            },
          },
          jornadas: {
            include: {
              courtConfigs: { include: { categories: true, court: true } }
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
          },
          courts: true,
          groupLogic: true,
          scheduleSlots: { include: { match: { include: { homeTeam: true, awayTeam: true, category: true } } } },
          _count: { select: { scheduleSlots: true } }
        },
      });
    });
    res.json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);

    // Borrado manual en cascada para evitar bloqueos por Foreign Keys (Match -> Team)
    await prisma.$transaction([
      prisma.matchLog.deleteMany({ where: { match: { category: { tournamentId } } } }),
      prisma.scheduleSlot.deleteMany({ where: { tournamentId } }),
      prisma.match.deleteMany({ where: { category: { tournamentId } } }),
      prisma.player.deleteMany({ where: { team: { category: { tournamentId } } } }),
      prisma.team.deleteMany({ where: { category: { tournamentId } } }),
      prisma.jornada.deleteMany({ where: { tournamentId } }),
      prisma.category.deleteMany({ where: { tournamentId } }),
      prisma.tournament.delete({ where: { id: tournamentId } })
    ]);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tournaments/:id/clone', async (req, res) => {
  const sourceId = parseInt(req.params.id);
  const { newName, options } = req.body;
  
  try {
    const source = await prisma.tournament.findUnique({
      where: { id: sourceId },
      include: {
        jornadas: true,
        categories: {
          include: {
            teams: {
              include: {
                players: true
              }
            }
          }
        },
        officials: true
      }
    });

    if (!source) return res.status(404).json({ error: 'Torneo no encontrado' });
    const defaultLogic = await ensureDefaultGroupLogic()

    const created = await prisma.$transaction(async (tx) => {
      console.log(`[CLONE] 🚀 Iniciando clonado de torneo "${source.name}" (ID: ${sourceId}) a "${newName}"`);
      
      // 1. Create Tournament
      const newTournamentData = {
        name: newName,
        active: false,
        groupLogicId: source.groupLogicId || defaultLogic.id,
      };

      if (options.params) {
        newTournamentData.date = source.date;
        newTournamentData.venue = source.venue;
        newTournamentData.matchDuration = source.matchDuration;
        newTournamentData.matchPlayTime = source.matchPlayTime;
        newTournamentData.numCourts = source.numCourts;
        newTournamentData.strictScheduleMode = source.strictScheduleMode;
        newTournamentData.monitorRefreshTime = source.monitorRefreshTime;
        newTournamentData.assignOfficialsToCourt = source.assignOfficialsToCourt;
      }

      if (options.info) {
        newTournamentData.rules = source.rules;
        newTournamentData.contactInfo = source.contactInfo;
        newTournamentData.locationInfo = source.locationInfo;
        newTournamentData.generalInfo = source.generalInfo;
        newTournamentData.eventPosterUrl = source.eventPosterUrl;
        newTournamentData.cafePosterUrl = source.cafePosterUrl;
        newTournamentData.sponsorsImageUrl = source.sponsorsImageUrl;
        newTournamentData.headerLogoUrl = source.headerLogoUrl;
        newTournamentData.backgroundLogoUrl = source.backgroundLogoUrl;
      }

      const newT = await tx.tournament.create({ data: newTournamentData });
      console.log(`[CLONE] ✅ Torneo base creado con ID: ${newT.id}`);

      // 2. Jornadas
      if (options.params && source.jornadas.length > 0) {
        console.log(`[CLONE] 📅 Copiando ${source.jornadas.length} jornadas...`);
        await tx.jornada.createMany({
          data: source.jornadas.map(j => ({
            date: j.date,
            startTime: j.startTime,
            endTime: j.endTime,
            matchDuration: j.matchDuration,
            matchPlayTime: j.matchPlayTime,
            restRoundsBetweenMatches: resolveRestRoundsBetweenMatches(j.restRoundsBetweenMatches, 1),
            tournamentId: newT.id
          }))
        });
      }

      // 3. Officials
      if (options.officials && source.officials.length > 0) {
        console.log(`[CLONE] ⚖️ Copiando ${source.officials.length} oficiales...`);
        await tx.official.createMany({
          data: source.officials.map(o => ({
            firstName: o.firstName,
            lastName: o.lastName,
            isOperational: o.isOperational,
            tournamentId: newT.id
          }))
        });
      }

      // 4. Categories, Teams, Players
      if (options.categories && source.categories.length > 0) {
        console.log(`[CLONE] 🏷️ Procesando ${source.categories.length} categorías...`);
        for (const cat of source.categories) {
          const newCat = await tx.category.create({
            data: {
              name: cat.name,
              color: cat.color,
              gender: cat.gender,
              isVeteran: cat.isVeteran,
              minAge: cat.minAge,
              maxAge: cat.maxAge,
              tournamentId: newT.id
            }
          });

          if (options.teams && cat.teams.length > 0) {
            console.log(`[CLONE]   -> 👥 Copiando ${cat.teams.length} equipos para la categoría "${cat.name}"...`);
            for (const team of cat.teams) {
              const newTeam = await tx.team.create({
                data: {
                  name: team.name,
                  club: team.club,
                  contactName: team.contactName,
                  contactLastName: team.contactLastName,
                  contactPhone: team.contactPhone,
                  contactEmail: team.contactEmail,
                  categoryId: newCat.id
                }
              });

              if (options.players && team.players.length > 0) {
                // Usamos createMany para los jugadores de este equipo
                await tx.player.createMany({
                  data: team.players.map(p => ({
                    name: p.name,
                    lastName: p.lastName,
                    phone: p.phone,
                    birthDate: p.birthDate,
                    number: p.number,
                    shirtSize: p.shirtSize,
                    teamId: newTeam.id
                  }))
                });
              }
            }
          }
        }
      }

      console.log(`[CLONE] ✨ Clonado de "${newName}" completado exitosamente.`);
      return newT;
    }, {
      timeout: 30000 
    });

    res.json(created);
  } catch (e) {
    console.error(`[CLONE] ❌ ERROR durante el clonado:`, e);
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// HELPER: ¿tiene calendario activo el torneo?
// ─────────────────────────────────────────────
async function hasActiveSchedule(tournamentId) {
  const count = await prisma.scheduleSlot.count({ where: { tournamentId } });
  return count > 0;
}

function parseDate(s) {
  if (!s || typeof s !== 'string') return null
  const parts = s.trim().split(/[\/\-]/).map(Number)
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null
  return new Date(y, m - 1, d)
}

function validatePlayerAge(birthDateStr, fromStr, toStr, isVeteran) {
  if (!birthDateStr || (!fromStr && !toStr)) return { ok: true }

  const b = parseDate(birthDateStr)
  const f = fromStr ? parseDate(fromStr) : null
  const t = toStr ? parseDate(toStr) : null

  console.log(`[Validación] Jugador: ${birthDateStr}, Desde: ${fromStr}, Hasta: ${toStr}, ¿Vet?: ${isVeteran}`);

  if (!b) return { ok: true }

  if (isVeteran) {
    // CATEGORÍA VETERANO: No pueden jugar más jóvenes que el límite (b > t)
    // En VET, el rango suele ser "nacidos antes de X".
    if (t && b > t) {
      return { ok: false, error: 'Demasiado joven para esta categoría Veterano' }
    }
    // Si hay un límite superior (muy viejo), lo ignoramos o avisamos, pero el usuario dice "no pueden jugar más jóvenes".
  } else {
    // CATEGORÍA ESTÁNDAR:
    // 1. No pueden jugar más viejos que el rango (b < f) -> ERROR
    if (f && b < f) {
      return { ok: false, error: 'Demasiado mayor para esta categoría' }
    }
    // 2. Pueden jugar en categorías superiores (b > t) -> AVISO
    if (t && b > t) {
      return { ok: true, warning: 'Aviso: Jugador en categoría superior (más joven de lo habitual)' }
    }
  }

  return { ok: true }
}

// ─────────────────────────────────────────────
// JORNADAS
// ─────────────────────────────────────────────
app.get('/api/tournaments/:tid/jornadas', async (req, res) => {
  try {
    const jornadas = await prisma.jornada.findMany({
      where: { tournamentId: parseInt(req.params.tid) },
      include: {
        courtConfigs: {
          include: {
            categories: true
          }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    res.json(jornadas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tournaments/:tid/jornadas', async (req, res) => {
  try {
    const { date, startTime, endTime, matchDuration, matchPlayTime, restRoundsBetweenMatches } = req.body;
    if (!date || !startTime || !endTime) return res.status(400).json({ error: 'Faltan campos (date, startTime, endTime)' });
    const tournamentId = parseInt(req.params.tid);
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { matchDuration: true, matchPlayTime: true }
    });
    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

    const resolvedMatchDuration = matchDuration !== undefined ? parseInt(matchDuration) : tournament.matchDuration;
    const resolvedMatchPlayTime = matchPlayTime !== undefined ? parseInt(matchPlayTime) : tournament.matchPlayTime;
    if (resolvedMatchPlayTime > resolvedMatchDuration) {
      return res.status(400).json({ error: 'El tiempo de partido no puede ser mayor que el tiempo de ronda en la jornada.' });
    }
    const jornada = await prisma.jornada.create({
      data: {
        date,
        startTime,
        endTime,
        matchDuration: resolvedMatchDuration,
        matchPlayTime: resolvedMatchPlayTime,
        restRoundsBetweenMatches: resolveRestRoundsBetweenMatches(restRoundsBetweenMatches, 1),
        tournamentId
      },
    });
    res.status(201).json(jornada);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tournaments/:tid/jornadas/:id', async (req, res) => {
  try {
    const { date, startTime, endTime, matchDuration, matchPlayTime, restRoundsBetweenMatches } = req.body;
    const resolvedMatchDuration = parseInt(matchDuration);
    const resolvedMatchPlayTime = parseInt(matchPlayTime);
    if (resolvedMatchPlayTime > resolvedMatchDuration) {
      return res.status(400).json({ error: 'El tiempo de partido no puede ser mayor que el tiempo de ronda en la jornada.' });
    }
    const jornada = await prisma.jornada.update({
      where: { id: parseInt(req.params.id) },
      data: {
        date,
        startTime,
        endTime,
        matchDuration: resolvedMatchDuration,
        matchPlayTime: resolvedMatchPlayTime,
        restRoundsBetweenMatches: resolveRestRoundsBetweenMatches(restRoundsBetweenMatches, 1)
      },
    });
    res.json(jornada);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tournaments/:tid/jornadas/:id', async (req, res) => {
  try {
    const locked = await hasActiveSchedule(parseInt(req.params.tid));
    if (locked) return res.status(423).json({ error: '🔒 CALENDARIO ACTIVO — elimina primero el calendario asignado' });
    await prisma.jornada.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
app.get('/api/tournaments/:tid/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { tournamentId: parseInt(req.params.tid) },
      include: { teams: { include: { players: true } } },
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tournaments/:tid/categories', async (req, res) => {
  try {
    const { name, color, minAge, maxAge, gender, isVeteran, manualGroupAssignment } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });

    // Validaciones de edad según tipo
    if (isVeteran) {
      if (!minAge) return res.status(400).json({ error: 'Para categorías de Veteranos es obligatorio indicar el "Año Desde"' });
    } else {
      if (!minAge || !maxAge) return res.status(400).json({ error: 'Es obligatorio indicar "Año Desde" y "Año Hasta"' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color || '#3B82F6',
        gender: gender || 'MIXTO',
        isVeteran: !!isVeteran,
        minAge: minAge || null,
        maxAge: maxAge || null,
        tournamentId: parseInt(req.params.tid)
      },
    });
    if (manualGroupAssignment !== undefined) {
      await setCategoryManualGroupAssignment(category.id, !!manualGroupAssignment);
    }
    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tournaments/:tid/bulk-import', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tid);
    const { rows } = req.body;
    // rows: Array<{ categoryName, gender, isVeteran, minAge, maxAge, teamName, contactName, contactLastName, contactPhone, contactEmail, playerName, playerLastName, playerPhone, playerBirthDate }>

    if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'Formato de datos incorrecto' });

    const results = { categories: 0, teams: 0, players: 0, warnings: [] };
    const categoryGroups = {};

    for (const r of rows) {
      // r es un Array de strings (columnas)
      const catName = (r[1] || 'SIN CATEGORIA').trim();
      const catGender = (r[2] || 'MIXTO').trim().toUpperCase();
      const key = `${catName}_${catGender}`;

      if (!categoryGroups[key]) {
        categoryGroups[key] = {
          name: catName,
          gender: catGender,
          teams: {}
        };
      }

      const teamName = (r[0] || 'SIN NOMBRE').trim();
      const teamKey = teamName;

      if (!categoryGroups[key].teams[teamKey]) {
        const cNom = (r[3] || '').trim();
        const cApe1 = (r[4] || '').trim();
        const cApe2 = (r[5] || '').trim();

        categoryGroups[key].teams[teamKey] = {
          name: teamName,
          contactName: cNom,
          contactLastName: `${cApe1} ${cApe2}`.trim(),
          contactEmail: (r[6] || '').trim(),
          contactPhone: (r[7] || '').trim(),
          players: []
        };
      }

      // Jugadores: P1(8-13), P2(14-19), P3(20-25), P4(26-31) (Grupos de 6 campos: Nom, Ape1, Ape2, Movil, FecNac, Talla)
      const playerStarts = [8, 14, 20, 26];
      for (const start of playerStarts) {
        if (r.length < start + 1) continue;
        const pNom = (r[start] || '').trim();
        if (pNom) {
          const pApe1 = (r[start + 1] || '').trim();
          const pApe2 = (r[start + 2] || '').trim();
          categoryGroups[key].teams[teamKey].players.push({
            name: pNom,
            lastName: `${pApe1} ${pApe2}`.trim(),
            phone: (r[start + 3] || '').trim(),
            birthDate: (r[start + 4] || '').trim(),
            shirtSize: (r[start + 5] || '').trim()
          });
        }
      }
    }

    for (const cgKey in categoryGroups) {
      const g = categoryGroups[cgKey];
      let cat = await prisma.category.findFirst({
        where: { tournamentId, name: g.name, gender: g.gender }
      });

      if (!cat) {
        // Detección automática de categoría veterano por nombre
        const autoIsVeteran = g.name.toUpperCase().includes('VET');
        
        cat = await prisma.category.create({
          data: {
            name: g.name,
            gender: g.gender || 'MIXTO',
            isVeteran: autoIsVeteran,
            minAge: g.minAge || null,
            maxAge: g.maxAge || null,
            tournamentId
          }
        });
        results.categories++;
      }

      for (const tKey in g.teams) {
        const teamData = g.teams[tKey];
        let team = await prisma.team.findFirst({
          where: { categoryId: cat.id, name: teamData.name }
        });

        if (!team) {
          team = await prisma.team.create({
            data: {
              name: teamData.name,
              contactName: teamData.contactName,
              contactLastName: teamData.contactLastName,
              contactPhone: teamData.contactPhone,
              contactEmail: teamData.contactEmail,
              categoryId: cat.id
            }
          });
          results.teams++;
        }

        // Control de máximo 4 jugadores por equipo en la importación
        for (const p of teamData.players) {
          const exists = await prisma.player.findFirst({
            where: { teamId: team.id, name: p.name, lastName: p.lastName }
          });
          if (!exists) {
            const playersInTeam = await prisma.player.count({ where: { teamId: team.id } });
            if (playersInTeam >= 4) {
              results.warnings.push(`${teamData.name}: Límite de 4 jugadores alcanzado (se omitieron los restantes)`);
              break;
            }

            const val = validatePlayerAge(p.birthDate, cat.minAge, cat.maxAge, cat.isVeteran);
            if (val.error) {
              results.warnings.push(`${p.name} ${p.lastName}: No importado (${val.error})`);
              continue;
            }
            if (val.warning) {
              results.warnings.push(`${p.name} ${p.lastName}: ${val.warning}`);
            }

            await prisma.player.create({
              data: { ...p, teamId: team.id }
            });
            results.players++;
          }
        }

        const finalCount = await prisma.player.count({ where: { teamId: team.id } });
        if (finalCount < 3) {
          results.warnings.push(`⚠️ ${teamData.name}: Tiene menos de 3 jugadores (${finalCount})`);
        }
      }
    }
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tournaments/:tid/categories/:id', async (req, res) => {
  try {
    const { name, color, minAge, maxAge, gender, isVeteran, manualGroupAssignment } = req.body;
    const categoryId = parseInt(req.params.id);
    const tournamentId = parseInt(req.params.tid);

    const locked = await hasActiveSchedule(tournamentId);

    if (locked) {
      // Si está bloqueado, solo permitimos cambiar nombre y color
      await prisma.category.update({
        where: { id: categoryId },
        data: { name, color },
      });
      return res.json({ id: categoryId, name, color, message: 'Actualizado (campos sensibles bloqueados por calendario activo)' });
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name, color, minAge, maxAge, gender, isVeteran },
    });
    if (manualGroupAssignment !== undefined) {
      await setCategoryManualGroupAssignment(categoryId, !!manualGroupAssignment);
    }
    res.json(category);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tournaments/:tid/categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const tournamentId = parseInt(req.params.tid);

    const locked = await hasActiveSchedule(tournamentId);
    if (locked) return res.status(423).json({ error: '🔒 CALENDARIO ACTIVO — eliminación bloqueada' });

    // NUEVA REGLA: No se puede eliminar si hay partidos generados
    const matchCount = await prisma.match.count({ where: { categoryId } });
    if (matchCount > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la categoría porque ya tiene partidos generados. Elimina primero los partidos.' });
    }

    await prisma.category.delete({ where: { id: categoryId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// TEAMS
// ─────────────────────────────────────────────
app.get('/api/categories/:cid/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: { categoryId: parseInt(req.params.cid) },
      include: { players: true },
    });
    res.json(teams);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories/:cid/teams', async (req, res) => {
  try {
    const { name, club, contactName, contactLastName, contactPhone, contactEmail, players } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del equipo es obligatorio' });
    const team = await prisma.team.create({
      data: {
        name,
        club,
        contactName,
        contactLastName,
        contactPhone,
        contactEmail,
        categoryId: parseInt(req.params.cid),
        players: players ? { create: players } : undefined,
      },
      include: { players: true },
    });
    res.status(201).json(team);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Importación masiva de equipos (CSV parsed en frontend)
app.post('/api/categories/:cid/teams/bulk', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.cid);

    // PROTECCIÓN: Bloquear si ya hay partidos generados
    const matchCount = await prisma.match.count({ where: { categoryId } });
    if (matchCount > 0) {
      return res.status(400).json({ error: 'No se pueden añadir equipos porque ya se han generado los partidos de esta categoría.' });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    const { teams } = req.body; // Array of { name, club, players[] }
    if (!Array.isArray(teams) || teams.length === 0)
      return res.status(400).json({ error: 'Array de equipos vacío' });

    // Validación de edad unificada
    for (const t of teams) {
      for (const p of t.players || []) {
        if (p.birthDate) {
          const val = validatePlayerAge(p.birthDate, category.minAge, category.maxAge, category.isVeteran);
          if (val.error) {
            return res.status(400).json({ error: `Jugador ${p.name}: ${val.error} en la categoría ${category.name}` });
          }
          // Nota: Los warnings en este endpoint específico de equipos/bulk se ignoran para no romper el flujo
          // pero el error sí bloquea la creación.
        }
      }
    }

    const created = [];
    for (const t of teams) {
      const team = await prisma.team.create({
        data: {
          name: t.name,
          club: t.club,
          categoryId,
          players: t.players ? {
            create: t.players.map(p => ({
              name: p.name,
              lastName: p.lastName,
              birthDate: p.birthDate,
              phone: p.phone,
              number: p.number,
              shirtSize: p.shirtSize
            }))
          } : undefined,
        },
        include: { players: true },
      });
      created.push(team);
    }
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const existing = await prisma.team.findUnique({ where: { id: parseInt(req.params.id) }, include: { category: true } });
    if (!existing) return res.status(404).json({ error: 'Equipo no encontrado' });

    // PROTECCIÓN: Bloquear si ya hay partidos generados
    const matchCount = await prisma.match.count({ where: { categoryId: existing.categoryId } });
    if (matchCount > 0) {
      return res.status(400).json({ error: 'No se puede editar el equipo porque ya se han generado los partidos de esta categoría.' });
    }

    const locked = await hasActiveSchedule(existing.category.tournamentId);
    if (locked) return res.status(423).json({ error: '🔒 CALENDARIO ACTIVO — edición bloqueada' });

    const { name, club, contactName, contactLastName, contactPhone, contactEmail, group } = req.body;
    const team = await prisma.team.update({
      where: { id: parseInt(req.params.id) },
      data: { name, club, contactName, contactLastName, contactPhone, contactEmail, ...(group !== undefined ? { group: group || null } : {}) },
      include: { players: true },
    });
    res.json(team);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    const existing = await prisma.team.findUnique({ where: { id: parseInt(req.params.id) }, include: { category: true } });
    if (!existing) return res.status(404).json({ error: 'Equipo no encontrado' });

    // PROTECCIÓN: Bloquear si ya hay partidos generados
    const matchCount = await prisma.match.count({ where: { categoryId: existing.categoryId } });
    if (matchCount > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el equipo porque ya se han generado los partidos de esta categoría.' });
    }

    const locked = await hasActiveSchedule(existing.category.tournamentId);
    if (locked) return res.status(423).json({ error: '🔒 CALENDARIO ACTIVO — eliminación bloqueada' });

    await prisma.team.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// PLAYERS
// ─────────────────────────────────────────────
app.post('/api/teams/:teamId/players', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { category: true } });
    if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });

    const { name, lastName, birthDate, phone, number, shirtSize } = req.body;

    // Validación de edad
    const val = validatePlayerAge(birthDate, team.category.minAge, team.category.maxAge, team.category.isVeteran);
    if (val.error) return res.status(400).json({ error: val.error });

    const player = await prisma.player.create({
      data: { name, lastName, birthDate, phone, shirtSize, teamId },
    });
    const responseData = { ...player, warning: val.warning || null };
    console.log(' -> Enviando respuesta creación:', responseData);
    res.status(201).json(responseData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tournaments/:tid/players-directory', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tid);
    const { search, categoryId, teamId } = req.query;

    const players = await prisma.player.findMany({
      where: {
        team: {
          category: {
            tournamentId
          },
          ...(categoryId ? { categoryId: parseInt(categoryId) } : {}),
          ...(teamId ? { id: parseInt(teamId) } : {}),
        },
        OR: search ? [
          { name: { contains: search } },
          { lastName: { contains: search } }
        ] : undefined
      },
      include: {
        team: {
          include: { category: true }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { name: 'asc' }
      ]
    });
    res.json(players);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
})

/**
 * Helper interno para generar la estructura de la Fase Final (Eliminatorias)
 * Se usa tanto al generar partidos por primera vez como al actualizar el cuadro.
 */
function sortStandingsRows(rows = []) {
  return [...rows].sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf)
}

function getGroupKeyFromName(groupName = '') {
  const match = String(groupName).match(/Grupo\s+([A-Z])/i)
  return match ? match[1].toUpperCase() : null
}

function getPhaseLabel(groupName) {
  const g = (groupName || '').toLowerCase()
  if (g.includes('octavo')) return 'OCTAVOS DE FINAL'
  if (g.includes('tercer y cuarto')) return '3º Y 4º PUESTO'
  if (g.includes('cuarto')) return 'CUARTOS DE FINAL'
  if (g.includes('semifinal')) return 'SEMIFINAL'
  if (g === 'final') return 'FINAL'
  return groupName
}

function buildStandingsHelpers(results, matches) {
  const groupedStandings = new Map()
  for (const row of results) {
    const key = row.group
    if (!groupedStandings.has(key)) groupedStandings.set(key, [])
    groupedStandings.get(key).push(row)
  }
  for (const [key, rows] of groupedStandings.entries()) {
    groupedStandings.set(key, sortStandingsRows(rows))
  }

  const isGroupFinished = (groupName) => {
    if (!groupName) return false
    return !matches.some(m => m.round === 1 && m.group === groupName && m.status === 'pending')
  }

  const getTeamByRank = (groupName, rank) => {
    if (!isGroupFinished(groupName)) return null
    const rows = groupedStandings.get(groupName) || []
    return rows[rank - 1]?.teamId || null
  }

  const getBestByRank = (rankPosition, bestIndex) => {
    const candidates = []
    for (const [groupName, rows] of groupedStandings.entries()) {
      if (!isGroupFinished(groupName)) return null
      const row = rows[rankPosition - 1]
      if (row) candidates.push(row)
    }
    const sorted = sortStandingsRows(candidates)
    return sorted[bestIndex - 1]?.teamId || null
  }

  return { groupedStandings, isGroupFinished, getTeamByRank, getBestByRank }
}

function shuffleArray(items = []) {
  return [...items].sort(() => Math.random() - 0.5)
}

function buildGroupsFromPreassignments(teams, definition) {
  const layout = getGroupLayout(teams.length, definition)
  const layoutByName = new Map(layout.map(group => [group.name, group.size]))
  const assignedTeams = []
  const unassignedTeams = []

  for (const team of teams) {
    if (team.group && layoutByName.has(team.group)) assignedTeams.push(team)
    else unassignedTeams.push(team)
  }

  const countByGroup = new Map(layout.map(group => [group.name, 0]))
  for (const team of assignedTeams) {
    countByGroup.set(team.group, (countByGroup.get(team.group) || 0) + 1)
  }

  const overflowGroup = layout.find(group => (countByGroup.get(group.name) || 0) > group.size)
  if (overflowGroup) {
    throw new Error(`El ${overflowGroup.name} supera su capacidad. Máximo ${overflowGroup.size} equipos.`)
  }

  const shuffledUnassigned = shuffleArray(unassignedTeams)
  const groupedTeams = new Map(layout.map(group => [group.name, assignedTeams.filter(team => team.group === group.name)]))

  for (const group of layout) {
    const currentTeams = groupedTeams.get(group.name) || []
    const missingSlots = group.size - currentTeams.length
    if (missingSlots <= 0) continue
    groupedTeams.set(group.name, [...currentTeams, ...shuffledUnassigned.splice(0, missingSlots)])
  }

  if (shuffledUnassigned.length > 0) {
    throw new Error('No se ha podido completar la asignación automática de grupos.')
  }

  return layout.map(group => ({
    name: group.name,
    teams: groupedTeams.get(group.name) || []
  }))
}

function resolveBracketSlotValue(value, helpers) {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw) return null

  const groupRankMatch = raw.match(/^([A-J])(\d+)$/)
  if (groupRankMatch) {
    const [, groupKey, rankText] = groupRankMatch
    return helpers.getTeamByRank(`Grupo ${groupKey}`, parseInt(rankText))
  }

  const bestRankMatch = raw.match(/^(\d+)-(\d+)$/)
  if (bestRankMatch) {
    const [, bestIndexText, rankText] = bestRankMatch
    return helpers.getBestByRank(parseInt(rankText), parseInt(bestIndexText))
  }

  return null
}

function buildInitialBracketMatches(definition, helpers) {
  const stages = buildBracketStages(definition)
  if (!stages.length) return []

  const firstStage = stages[0]
  const seededPositions = Array.isArray(definition.positions) ? definition.positions.slice(0, firstStage.size) : []
  const matches = []

  for (let i = 0; i < firstStage.matchCount; i++) {
    const homeSeed = seededPositions[i * 2] || ''
    const awaySeed = seededPositions[i * 2 + 1] || ''
    matches.push({
      h: resolveBracketSlotValue(homeSeed, helpers),
      a: resolveBracketSlotValue(awaySeed, helpers),
      g: firstStage.labels[i],
      r: firstStage.round
    })
  }

  for (let stageIndex = 1; stageIndex < stages.length; stageIndex++) {
    const stage = stages[stageIndex]
    for (let i = 0; i < stage.matchCount; i++) {
      matches.push({
        h: null,
        a: null,
        g: stage.labels[i],
        r: stage.round
      })
    }
    
    // Si estamos en la etapa Final, comprobamos si hay que jugar 3º y 4º puesto
    if (stage.name === 'Final' && definition?.finals?.playThirdFourth) {
      // Solo tiene sentido si hubo Semifinales
      if (stages.some(s => s.name === 'Semifinal')) {
        matches.push({
          h: null,
          a: null,
          g: 'Tercer y Cuarto Puesto',
          r: stage.round
        })
      }
    }
  }

  return matches
}

async function generateFinalPhaseBrackets(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { tournament: true }
  });
  if (!category) return 0;

  const teams = await prisma.team.findMany({ where: { categoryId } });
  const n = teams.length;
  if (n < 2) return 0;
  const { definition } = await getCategoryLogicDefinition(categoryId)

  // Borrar fase final previa vinculada a esta categoría
  await prisma.$transaction([
    prisma.scheduleSlot.deleteMany({ where: { match: { categoryId, round: { gte: 2 } } } }),
    prisma.match.deleteMany({ where: { categoryId, round: { gte: 2 } } })
  ]);

  // Comprobar si la fase de grupos ha terminado
  const pendingGroups = await prisma.match.findFirst({
    where: { categoryId, round: 1, status: 'pending' }
  });
  const isGroupsFinished = !pendingGroups;

  const results = isGroupsFinished ? await getDetailedStandings(categoryId) : [];
  const allMatches = await prisma.match.findMany({ where: { categoryId } })
  const helpers = buildStandingsHelpers(results, allMatches)
  const genericMatches = buildInitialBracketMatches(definition, helpers)

  if (getEnabledBracketSize(definition?.finals) === 0) {
    return 0
  }

  if (genericMatches.length > 0) {
    const createdGeneric = []
    for (const m of genericMatches) {
      const match = await prisma.match.create({
        data: {
          category: { connect: { id: categoryId } },
          homeTeam: m.h ? { connect: { id: m.h } } : undefined,
          awayTeam: m.a ? { connect: { id: m.a } } : undefined,
          group: m.g,
          round: m.r,
          status: 'pending',
          observations: getPhaseLabel(m.g)
        }
      })
      createdGeneric.push(match)
    }
    return createdGeneric.length
  }

  const getTeamByRank = (group, rank) => {
    if (!isGroupsFinished) return null;
    const gResults = results.filter(r => r.group === group);
    return gResults[rank - 1]?.teamId || null;
  };

  const nextMatches = [];
  if (n === 3) {
    // Grupo único a doble vuelta. Final entre 1º y 2º.
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo A', 2), g: 'Final', r: 2 });
  } else if (n === 4) {
    // Semifinales (1vs4, 2vs3) y Final
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo A', 4), g: 'Semifinal 1', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo A', 2), a: getTeamByRank('Grupo A', 3), g: 'Semifinal 2', r: 2 });
    nextMatches.push({ h: null, a: null, g: 'Final', r: 3 });
  } else if (n >= 5 && n <= 7) {
    // Direct Final entre 1º y 2º
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo A', 2), g: 'Final', r: 2 });
  } else if (n === 8 || n === 9) {
    // 2 Grupos (4-4 o 5-4). Se cruzan 1vs4, 2vs3 de forma cruzada entre grupos
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo B', 4), g: 'Cuartos 1', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo B', 2), a: getTeamByRank('Grupo A', 3), g: 'Cuartos 2', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo A', 2), a: getTeamByRank('Grupo B', 3), g: 'Cuartos 3', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo A', 4), g: 'Cuartos 4', r: 2 });
    nextMatches.push({ h: null, a: null, g: 'Semifinal 1', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Semifinal 2', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Final', r: 4 });
  } else if (n === 10 || n === 11) {
    // Playoff directo a un solo partido de Final entre los ganadores de cada grupo
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo B', 1), g: 'Final', r: 2 });
  } else if (n >= 12 && n <= 14) {
    // Genera un Cuadro de 16 equipos. Los cruces sin oponente (Seed > n) se quedan como "null" (BYE).
    const getS = (seed) => (isGroupsFinished && seed <= n) ? results[seed - 1]?.teamId : null;

    nextMatches.push({ h: getS(1), a: getS(16), g: 'Octavos 1', r: 2 });
    nextMatches.push({ h: getS(8), a: getS(9), g: 'Octavos 2', r: 2 });
    nextMatches.push({ h: getS(4), a: getS(13), g: 'Octavos 3', r: 2 });
    nextMatches.push({ h: getS(5), a: getS(12), g: 'Octavos 4', r: 2 });
    nextMatches.push({ h: getS(2), a: getS(15), g: 'Octavos 5', r: 2 });
    nextMatches.push({ h: getS(7), a: getS(10), g: 'Octavos 6', r: 2 });
    nextMatches.push({ h: getS(3), a: getS(14), g: 'Octavos 7', r: 2 });
    nextMatches.push({ h: getS(6), a: getS(11), g: 'Octavos 8', r: 2 });

    nextMatches.push({ h: null, a: null, g: 'Cuartos 1', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Cuartos 2', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Cuartos 3', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Cuartos 4', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Semifinal 1', r: 4 });
    nextMatches.push({ h: null, a: null, g: 'Semifinal 2', r: 4 });
    nextMatches.push({ h: null, a: null, g: 'Final', r: 5 });
  } else if (n === 16 || n === 17) {
    // 4 Grupos. Pasan los 4 primeros de cada grupo (Octavos completos).
    // Cruces para maximizar variedad entre grupos
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo D', 4), g: 'Octavos 1', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo B', 2), a: getTeamByRank('Grupo C', 3), g: 'Octavos 2', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo A', 4), g: 'Octavos 3', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo C', 2), a: getTeamByRank('Grupo D', 3), g: 'Octavos 4', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo C', 1), a: getTeamByRank('Grupo B', 4), g: 'Octavos 5', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo D', 2), a: getTeamByRank('Grupo A', 3), g: 'Octavos 6', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo D', 1), a: getTeamByRank('Grupo C', 4), g: 'Octavos 7', r: 2 });
    nextMatches.push({ h: getTeamByRank('Grupo A', 2), a: getTeamByRank('Grupo B', 3), g: 'Octavos 8', r: 2 });

    nextMatches.push({ h: null, a: null, g: 'Cuartos 1', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Cuartos 2', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Cuartos 3', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Cuartos 4', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Semifinal 1', r: 4 });
    nextMatches.push({ h: null, a: null, g: 'Semifinal 2', r: 4 });
    nextMatches.push({ h: null, a: null, g: 'Final', r: 5 });
  } else if (n === 19) {
    // 3 Grupos (1 de 7, 2 de 6). Pasan los primeros de cada grupo y el 2º del grupo de 7 (Grupo A).
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo C', 1), g: 'Semifinal 1', r: 3 });
    nextMatches.push({ h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo A', 2), g: 'Semifinal 2', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Final', r: 4 });
  } else if (n >= 15 && n <= 18) {
    // 3 Grupos. Pasan los 3 primeros y el mejor segundo. Semis y Final.
    const seconds = isGroupsFinished ? results.filter(r =>
      r.teamId === getTeamByRank('Grupo A', 2) ||
      r.teamId === getTeamByRank('Grupo B', 2) ||
      r.teamId === getTeamByRank('Grupo C', 2)
    ).map(r => r.teamId) : [];

    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: isGroupsFinished ? seconds[0] : null, g: 'Semifinal 1', r: 3 });
    nextMatches.push({ h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo C', 1), g: 'Semifinal 2', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Final', r: 4 });
  } else if (n >= 20 && n <= 24) {
    // 4 Grupos. Pasan los primeros de cada grupo.
    nextMatches.push({ h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo D', 1), g: 'Semifinal 1', r: 3 });
    nextMatches.push({ h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo C', 1), g: 'Semifinal 2', r: 3 });
    nextMatches.push({ h: null, a: null, g: 'Final', r: 4 });
  }

  const created = [];

  for (const m of nextMatches) {
    const match = await prisma.match.create({
      data: {
        category: { connect: { id: categoryId } },
        homeTeam: m.h ? { connect: { id: m.h } } : undefined,
        awayTeam: m.a ? { connect: { id: m.a } } : undefined,
        group: m.g,
        round: m.r,
        status: 'pending',
        observations: getPhaseLabel(m.g)
      }
    });
    created.push(match);
  }
  return created.length;
}

// ── MATCHES — Unificado: Generar partidos de grupo y eliminatorias ──
app.post('/api/tournaments/:tid/categories/:cid/generate-matches', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.cid);
    const tournamentId = parseInt(req.params.tid);

    // VALIDACIÓN DE SEGURIDAD: Bloquear si ya hay resultados
    const playedMatch = await prisma.match.findFirst({ where: { categoryId, status: 'played' } });
    if (playedMatch) {
      return res.status(400).json({ error: `No se pueden regenerar los partidos: El partido #${playedMatch.matchNumber} ya tiene resultados registrados.` });
    }

    // Al regenerar la liga, borramos TODO (liga y eliminatorias) 
    await prisma.$transaction([
      prisma.matchLog.deleteMany({ where: { match: { categoryId } } }),
      prisma.scheduleSlot.deleteMany({ where: { match: { categoryId } } }),
      prisma.match.deleteMany({ where: { categoryId } })
    ]);


    const teams = await prisma.team.findMany({
      where: { categoryId },
      include: { _count: { select: { players: true } } }
    });

    // VALIDACIÓN: Mínimo 3 jugadores por equipo
    const incompleteTeams = teams.filter(t => t._count.players < 3);
    if (incompleteTeams.length > 0) {
      const names = incompleteTeams.map(t => t.name).join(', ');
      return res.status(400).json({
        error: `No se pueden generar partidos: Los siguientes equipos tienen menos de 3 jugadores: ${names}.`
      });
    }

    if (teams.length < 2) return res.status(400).json({ error: 'Se necesitan al menos 2 equipos' });
    const { definition } = await getCategoryLogicDefinition(categoryId)

    let groups;
    try {
      if (definition?.groups && await getCategoryManualGroupAssignment(categoryId)) {
        groups = buildGroupsFromPreassignments(teams, definition);
      } else if (false) {
        const layout = getGroupLayout(teams.length, definition);
        const layoutByName = new Map(layout.map(group => [group.name, group.size]));
        const invalidTeam = teams.find(team => !team.group || !layoutByName.has(team.group));
        if (invalidTeam) {
          return res.status(400).json({ error: `Asignación manual incompleta o inválida. Revisa el equipo ${invalidTeam.name}.` });
        }

        const countByGroup = new Map(layout.map(group => [group.name, 0]));
        for (const team of teams) {
          countByGroup.set(team.group, (countByGroup.get(team.group) || 0) + 1);
        }

        const mismatch = layout.find(group => (countByGroup.get(group.name) || 0) !== group.size);
        if (mismatch) {
          return res.status(400).json({ error: `El ${mismatch.name} debe tener ${mismatch.size} equipos y ahora tiene ${countByGroup.get(mismatch.name) || 0}.` });
        }

        groups = layout.map(group => ({
          name: group.name,
          teams: teams.filter(team => team.group === group.name)
        }));
      } else {
        groups = splitIntoGroups(teams, definition);
      }
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    // Actualizar el grupo en la base de datos para cada equipo
    for (const group of groups) {
      const teamIds = group.teams.map(t => t.id);
      await prisma.team.updateMany({
        where: { id: { in: teamIds } },
        data: { group: group.name }
      });
    }

    const matches = initMatches(groups, categoryId, parseInt(definition.roundTripCount) || 1);

    // Asignar número correlativo global a cada partido de liga
    const created = [];
    for (const matchData of matches) {
      const m = await prisma.match.create({
        data: { ...matchData }
        // matchNumber se asignará al programar el calendario
      });
      created.push(m);
    }

    // GENERACIÓN AUTOMÁTICA DE FASE FINAL (TBD)
    // La función generateFinalPhaseBrackets también asigna matchNumbers
    await generateFinalPhaseBrackets(categoryId);


    // Recuperar los partidos con sus relaciones para el frontend
    const createdMatches = await prisma.match.findMany({
      where: { categoryId },
      include: { homeTeam: true, awayTeam: true }
    });

    res.json(createdMatches);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/categories/:cid/matches
 * Permite borrar todos los partidos de una categoría si NO hay resultados registrados.
 */
app.delete('/api/categories/:cid/matches', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.cid);
    const { type } = req.query; // 'final' para borrar solo eliminatorias

    const whereMatch = { categoryId };
    if (type === 'final') {
      whereMatch.round = { gte: 2 };
    }

    // VALIDACIÓN DE SEGURIDAD: Bloquear si hay resultados en el grupo a borrar
    const playedMatch = await prisma.match.findFirst({ where: { ...whereMatch, status: 'played' } });
    if (playedMatch) {
      return res.status(400).json({ error: 'No se pueden eliminar los partidos porque existen resultados registrados en la selección.' });
    }

    // 1. Transacción para asegurar consistencia
    await prisma.$transaction([
      // Borrar logs de actas asociados
      prisma.matchLog.deleteMany({ where: { match: whereMatch } }),
      // Borrar slots de calendario asociados a los partidos filtrados
      prisma.scheduleSlot.deleteMany({
        where: { match: whereMatch }
      }),
      // Borrar los partidos
      prisma.match.deleteMany({ where: whereMatch }),
      // Solo limpiamos grupos de equipos si borramos TODO (no si solo borramos fase final)
      ...(type !== 'final' ? [
        prisma.team.updateMany({
          where: { categoryId },
          data: { group: null }
        })
      ] : [])
    ]);

    if (type !== 'final') {
      await setCategoryManualGroupAssignment(categoryId, false);
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper interno para clasificación (usado por el endpoint de fase final)
async function getDetailedStandings(categoryId) {
  const teams = await prisma.team.findMany({ where: { categoryId } });
  const matches = await prisma.match.findMany({ where: { categoryId, round: 1, status: 'played' } });

  const standings = teams.map(team => {
    const played = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
    let wins = 0, diff = 0, pf = 0;
    played.forEach(m => {
      const isHome = m.homeTeamId === team.id;
      const ms = isHome ? m.homeScore : m.awayScore;
      const ts = isHome ? m.awayScore : m.homeScore;
      pf += ms; diff += (ms - ts);
      if (ms > ts) wins++;
    });
    return { teamId: team.id, group: team.group, wins, diff, pf };
  });

  // Orden FIBA: Victorias -> Diferencia -> Puntos Anotados
  return standings.sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf);
}

// ── MATCHES — Fase 2 (Deprecated - Now part of generate-matches) ──
app.post('/api/categories/:cid/generate-final-phase', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.cid);

    // VALIDACIÓN DE SEGURIDAD: Bloquear si ya hay resultados en la Fase Final
    const playedFinalMatch = await prisma.match.findFirst({
      where: { categoryId, round: { gte: 2 }, status: 'played' }
    });
    if (playedFinalMatch) {
      return res.status(400).json({ error: 'No se puede regenerar la Fase Final porque ya hay resultados registrados en el cuadro.' });
    }

    const count = await generateFinalPhaseBrackets(categoryId);
    res.json({ ok: true, count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.player.findUnique({ where: { id }, include: { team: { include: { category: true } } } });
    if (!existing) return res.status(404).json({ error: 'Jugador no encontrado' });

    const { name, lastName, birthDate, phone, number, shirtSize } = req.body;

    // Validar edad
    const val = validatePlayerAge(birthDate, existing.team.category.minAge, existing.team.category.maxAge, existing.team.category.isVeteran);
    if (val.error) return res.status(400).json({ error: val.error });

    const updated = await prisma.player.update({
      where: { id },
      data: { name, lastName, birthDate, phone, number, shirtSize }
    });
    res.json({ ...updated, warning: val.warning || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Jugador no encontrado' });

    await prisma.player.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint unificado arriba (reemplaza los duplicados)


// ─────────────────────────────────────────────
// MATCHES — Resultados
// ─────────────────────────────────────────────
app.get('/api/tournaments/:tid/matches', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { category: { tournamentId: parseInt(req.params.tid) } },
      include: { homeTeam: true, awayTeam: true, category: true, scheduleSlot: true },
      orderBy: { id: 'asc' },
    });
    res.json(matches);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/matches/:id/score', async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: { scheduleSlot: true }
    });

    if (!existingMatch) return res.status(404).json({ error: 'Partido no encontrado' });

    // REGLA: Solo se pueden modificar resultados si el partido está programado (Fase 2)
    if (!existingMatch.scheduleSlot) {
      return res.status(400).json({ error: 'No se puede introducir el resultado de un partido que no ha sido programado en el calendario.' });
    }

    let { homeScore, awayScore, homeFouls, awayFouls, observations, status, officialName, gameTime, sessionKey } = req.body;

    // Normalizar valores vacíos a null o 0 según corresponda
    const hVal = (homeScore === '' || homeScore === undefined) ? null : homeScore;
    const aVal = (awayScore === '' || awayScore === undefined) ? null : awayScore;

    // Convertir 0-0 explícito o null-null a reset
    const isReset = (hVal === null && aVal === null) || (parseInt(hVal) === 0 && parseInt(aVal) === 0 && status !== 'playing' && status !== 'played');

    if (isReset) {
      homeScore = null;
      awayScore = null;
      homeFouls = 0;
      awayFouls = 0;
      status = 'pending';
      // Solo ponemos a null si no se ha pasado un oficial explícitamente (ej: desde Admin)
      if (!officialName) officialName = null;
    }

    // REGLA: No se puede introducir un resultado si los equipos aún no están definidos (TBD)
    if (!isReset && (!existingMatch.homeTeamId || !existingMatch.awayTeamId)) {
      return res.status(400).json({ error: 'No se puede introducir el resultado de un partido de eliminatoria cuando todavía no están los equipos asignados.' });
    }

    if (!isReset) {
      homeScore = parseInt(homeScore) || 0;
      awayScore = parseInt(awayScore) || 0;
      homeFouls = parseInt(homeFouls) || 0;
      awayFouls = parseInt(awayFouls) || 0;

      // Reglas FIBA 3x3: máximo 21, no empates
      if (homeScore < 0 || awayScore < 0) return res.status(400).json({ error: 'Las puntuaciones no pueden ser negativas' });
      if (homeScore > 21 || awayScore > 21) return res.status(400).json({ error: 'Puntuación máxima FIBA 3x3: 21 puntos' });
    }

    const isOfficialScoreboardUpdate = !!officialName && officialName !== 'ADMINISTRADOR';
    if (isOfficialScoreboardUpdate && !ownsLiveMatchSession(existingMatch, officialName, sessionKey)) {
      return res.status(400).json({ error: 'Esta acta está abierta en otra sesión del mismo oficial o de otro oficial.' });
    }

    const match = await prisma.match.update({
      where: { id: parseInt(req.params.id) },
      data: {
        homeScore: isReset ? null : homeScore,
        awayScore: isReset ? null : awayScore,
        homeFouls: isReset ? 0 : homeFouls,
        awayFouls: isReset ? 0 : awayFouls,
        observations,
        officialName: isReset ? null : (officialName || existingMatch.officialName),
        status: isReset ? 'pending' : (status || 'played'),
        active: (status === 'played') ? false : (status === 'playing' ? true : (isReset ? false : existingMatch.active)),
        isLive: (status === 'played') ? false : existingMatch.isLive,
        liveSessionKey: (status === 'played' || isReset) ? null : (sessionKey || existingMatch.liveSessionKey)
      },
      include: { homeTeam: true, awayTeam: true },
    });

    // Registro de logs según la acción
    let action = "UPDATE_SCORE";
    let details = "Actualización de marcador/faltas";
    if (isReset) {
      action = "RESET";
      details = "Reinicio completo del acta";
    } else if (status === 'played') {
      action = "FINALIZE";
      details = "Partido finalizado y acta cerrada";
    }
    await createLog(matchId, officialName || existingMatch.officialName, action, match, details, gameTime);

    // ⚡ RECÁLCULO AUTOMÁTICO DE ELIMINATORIAS Y PROPAGACIÓN (Síncrono para asegurar consistencia)
    try {
      await refreshCategoryBrackets(match.categoryId);
    } catch (err) {
      console.error("❌ Error en recálculo automático:", err.message);
    }

    res.json(match);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// HELPER: RECÁLCULO DE CUADRO (BRACKETS)
// ─────────────────────────────────────────────
async function refreshCategoryBrackets(categoryId) {
  try {
    const teams = await prisma.team.findMany({ where: { categoryId } });
    const matches = await prisma.match.findMany({ where: { categoryId } });
    const n = teams.length;
    const { definition } = await getCategoryLogicDefinition(categoryId)

    const isGroupFinished = (groupName) => {
      if (!groupName) return false;
      return !matches.some(m => m.round === 1 && m.group === groupName && m.status === 'pending');
    };

    const results = await getDetailedStandings(categoryId);

    const getTeamByRank = (groupName, rank) => {
      if (!isGroupFinished(groupName)) return null;
      const gResults = results.filter(r => r.group === groupName);
      // Re-ordenamos localmente por grupo para asegurar precisión
      gResults.sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf);
      return gResults[rank - 1]?.teamId || null;
    };

    // Helper para semilla global (usado en n=12..14 para Cuadro de 16 con BYEs)
    const getGlobalSeed = (seed) => {
      const pendingGroups = matches.filter(m => m.round === 1 && m.status === 'pending');
      if (pendingGroups.length > 0) return null;
      return results[seed - 1]?.teamId || null;
    };

    const updates = [];
    const autoAdvanceGroups = new Set()

    // Helper para obtener ganador por nombre de grupo (eliminatorias)
    const getWinner = (groupName) => {
      const m = matches.find(m => m.group === groupName);
      if (!m) {
        console.log(`DEBUG: getWinner(${groupName}) -> Partido no encontrado`);
        return null;
      }
      if (autoAdvanceGroups.has(groupName) && m.homeTeamId && !m.awayTeamId) {
        return m.homeTeamId;
      }
      if (autoAdvanceGroups.has(groupName) && !m.homeTeamId && m.awayTeamId) {
        return m.awayTeamId;
      }
      if (m.status !== 'played') {
        console.log(`DEBUG: getWinner(${groupName}) -> Aún no jugado (status: ${m.status})`);
        return null;
      }
      const winner = m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
      console.log(`DEBUG: getWinner(${groupName}) -> Ganador: ${winner} (${m.homeScore}-${m.awayScore})`);
      return winner;
    };

    const getLoser = (groupName) => {
      const m = matches.find(x => x.group === groupName);
      if (!m) return null;
      if (autoAdvanceGroups.has(groupName)) {
        return null; // El BYE pierde por defecto
      }
      if (m.status !== 'played') {
        return null;
      }
      return m.homeScore < m.awayScore ? m.homeTeamId : m.awayTeamId;
    };

    const stages = buildBracketStages(definition)
    if (getEnabledBracketSize(definition?.finals) === 0) return
    if (stages.length > 0) {
      const genericHelpers = buildStandingsHelpers(results, matches)
      const seededPositions = Array.isArray(definition.positions) ? definition.positions.slice(0, stages[0].size) : []

      for (let i = 0; i < stages[0].matchCount; i++) {
        const homeSeedRaw = String(seededPositions[i * 2] || '').trim().toUpperCase()
        const awaySeedRaw = String(seededPositions[i * 2 + 1] || '').trim().toUpperCase()
        const hasExplicitBye =
          (homeSeedRaw && (awaySeedRaw === '' || awaySeedRaw === 'BYE')) ||
          (awaySeedRaw && (homeSeedRaw === '' || homeSeedRaw === 'BYE'))

        if (hasExplicitBye) {
          autoAdvanceGroups.add(stages[0].labels[i])
        }

        updates.push({
          group: stages[0].labels[i],
          h: resolveBracketSlotValue(homeSeedRaw, genericHelpers),
          a: resolveBracketSlotValue(awaySeedRaw, genericHelpers)
        });
      }

      for (let stageIndex = 1; stageIndex < stages.length; stageIndex++) {
        const prevStage = stages[stageIndex - 1]
        const stage = stages[stageIndex]
        for (let i = 0; i < stage.matchCount; i++) {
          updates.push({
            group: stage.labels[i],
            h: getWinner(prevStage.labels[i * 2]),
            a: getWinner(prevStage.labels[i * 2 + 1])
          });
        }
        
        if (stage.name === 'Final' && definition?.finals?.playThirdFourth && stages.some(s => s.name === 'Semifinal')) {
          updates.push({
            group: 'Tercer y Cuarto Puesto',
            h: getLoser('Semifinal 1'),
            a: getLoser('Semifinal 2')
          });
        }
      }
    } else
    // 2. DEFINIR CRUCES Y PROPAGACIÓN
    if (n === 3) {
      updates.push({ group: 'Final', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo A', 2) });
    } else if (n === 4) {
      updates.push({ group: 'Semifinal 1', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo A', 4) });
      updates.push({ group: 'Semifinal 2', h: getTeamByRank('Grupo A', 2), a: getTeamByRank('Grupo A', 3) });
      updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
    } else if (n >= 5 && n <= 7) {
      updates.push({ group: 'Final', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo A', 2) });
    } else if (n === 8 || n === 9) {
      updates.push({ group: 'Cuartos 1', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo B', 4) });
      updates.push({ group: 'Cuartos 2', h: getTeamByRank('Grupo B', 2), a: getTeamByRank('Grupo A', 3) });
      updates.push({ group: 'Cuartos 3', h: getTeamByRank('Grupo A', 2), a: getTeamByRank('Grupo B', 3) });
      updates.push({ group: 'Cuartos 4', h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo A', 4) });
      updates.push({ group: 'Semifinal 1', h: getWinner('Cuartos 1'), a: getWinner('Cuartos 3') });
      updates.push({ group: 'Semifinal 2', h: getWinner('Cuartos 2'), a: getWinner('Cuartos 4') });
      updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
    } else if (n === 10 || n === 11) {
      updates.push({ group: 'Final', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo B', 1) });
    } else if (n >= 12 && n <= 14) {
      updates.push({ group: 'Octavos 1', h: getGlobalSeed(1), a: getGlobalSeed(16) });
      updates.push({ group: 'Octavos 2', h: getGlobalSeed(8), a: getGlobalSeed(9) });
      updates.push({ group: 'Octavos 3', h: getGlobalSeed(4), a: getGlobalSeed(13) });
      updates.push({ group: 'Octavos 4', h: getGlobalSeed(5), a: getGlobalSeed(12) });
      updates.push({ group: 'Octavos 5', h: getGlobalSeed(2), a: getGlobalSeed(15) });
      updates.push({ group: 'Octavos 6', h: getGlobalSeed(7), a: getGlobalSeed(10) });
      updates.push({ group: 'Octavos 7', h: getGlobalSeed(3), a: getGlobalSeed(14) });
      updates.push({ group: 'Octavos 8', h: getGlobalSeed(6), a: getGlobalSeed(11) });
      updates.push({ group: 'Cuartos 1', h: getWinner('Octavos 1'), a: getWinner('Octavos 2') });
      updates.push({ group: 'Cuartos 2', h: getWinner('Octavos 3'), a: getWinner('Octavos 4') });
      updates.push({ group: 'Cuartos 3', h: getWinner('Octavos 5'), a: getWinner('Octavos 6') });
      updates.push({ group: 'Cuartos 4', h: getWinner('Octavos 7'), a: getWinner('Octavos 8') });
      updates.push({ group: 'Semifinal 1', h: getWinner('Cuartos 1'), a: getWinner('Cuartos 4') });
      updates.push({ group: 'Semifinal 2', h: getWinner('Cuartos 2'), a: getWinner('Cuartos 3') });
      updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
    } else if (n === 19) {
      // 3 Grupos (1 de 7, 2 de 6). Pasan los primeros de cada grupo y el 2º del grupo de 7 (Grupo A).
      updates.push({ group: 'Semifinal 1', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo C', 1) });
      updates.push({ group: 'Semifinal 2', h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo A', 2) });
      updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
    } else if (n >= 15 && n <= 18) {
      const all3Finished = isGroupFinished('Grupo A') && isGroupFinished('Grupo B') && isGroupFinished('Grupo C');
      if (all3Finished) {
        const seconds = results.filter(r =>
          r.teamId === getTeamByRank('Grupo A', 2) ||
          r.teamId === getTeamByRank('Grupo B', 2) ||
          r.teamId === getTeamByRank('Grupo C', 2)
        ).map(r => r.teamId);
        updates.push({ group: 'Semifinal 1', h: getTeamByRank('Grupo A', 1), a: seconds[0] });
      } else {
        updates.push({ group: 'Semifinal 1', h: getTeamByRank('Grupo A', 1) });
      }
      updates.push({ group: 'Semifinal 2', h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo C', 1) });
      updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
    } else if (n === 16 || n === 17) {
      updates.push({ group: 'Octavos 1', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo D', 4) });
      updates.push({ group: 'Octavos 2', h: getTeamByRank('Grupo B', 2), a: getTeamByRank('Grupo C', 3) });
      updates.push({ group: 'Octavos 3', h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo A', 4) });
      updates.push({ group: 'Octavos 4', h: getTeamByRank('Grupo C', 2), a: getTeamByRank('Grupo D', 3) });
      updates.push({ group: 'Octavos 5', h: getTeamByRank('Grupo C', 1), a: getTeamByRank('Grupo B', 4) });
      updates.push({ group: 'Octavos 6', h: getTeamByRank('Grupo D', 2), a: getTeamByRank('Grupo A', 3) });
      updates.push({ group: 'Octavos 7', h: getTeamByRank('Grupo D', 1), a: getTeamByRank('Grupo C', 4) });
      updates.push({ group: 'Octavos 8', h: getTeamByRank('Grupo A', 2), a: getTeamByRank('Grupo B', 3) });

      updates.push({ group: 'Cuartos 1', h: getWinner('Octavos 1'), a: getWinner('Octavos 2') });
      updates.push({ group: 'Cuartos 2', h: getWinner('Octavos 3'), a: getWinner('Octavos 4') });
      updates.push({ group: 'Cuartos 3', h: getWinner('Octavos 5'), a: getWinner('Octavos 6') });
      updates.push({ group: 'Cuartos 4', h: getWinner('Octavos 7'), a: getWinner('Octavos 8') });

      updates.push({ group: 'Semifinal 1', h: getWinner('Cuartos 1'), a: getWinner('Cuartos 2') });
      updates.push({ group: 'Semifinal 2', h: getWinner('Cuartos 3'), a: getWinner('Cuartos 4') });
      updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
    } else if (n === 20 || n === 21 || n === 22 || n === 24) {
      updates.push({ group: 'Semifinal 1', h: getTeamByRank('Grupo A', 1), a: getTeamByRank('Grupo D', 1) });
      updates.push({ group: 'Semifinal 2', h: getTeamByRank('Grupo B', 1), a: getTeamByRank('Grupo C', 1) });
      updates.push({ group: 'Final', h: getWinner('Semifinal 1'), a: getWinner('Semifinal 2') });
    }

    // 4. APLICAR ACTUALIZACIONES EN BD
    for (const upd of updates) {
      const match = matches.find(m => m.group === upd.group);
      if (match) {
        const data = {};
        let teamsChanged = false;

        // Comprobamos si el equipo local ha cambiado o debe pasar a TBD (null)
        if (upd.h !== undefined && upd.h !== match.homeTeamId) {
          data.homeTeamId = upd.h;
          teamsChanged = true;
        }
        // Comprobamos si el equipo visitante ha cambiado o debe pasar a TBD (null)
        if (upd.a !== undefined && upd.a !== match.awayTeamId) {
          data.awayTeamId = upd.a;
          teamsChanged = true;
        }

        if (teamsChanged) {
          // Si el partido ya ha sido jugado, NO lo reseteamos automáticamente.
          // Esto protege los resultados de finales o cruces manuales ante cambios en el bracket.
          if (match.status === 'played') {
            console.log(`DEBUG: Saltando reset de ${upd.group} porque ya está jugado.`);
            continue;
          }

          // REGLA: Si cambian los equipos de un partido (o pasan a ser desconocidos), 
          // debemos resetear cualquier resultado previo que tuviera ese partido.
          data.homeScore = null;
          data.awayScore = null;
          data.homeFouls = 0;
          data.awayFouls = 0;
          data.status = 'pending';
          data.active = false;
          data.isLive = false;
          
          console.log(`DEBUG: Actualizando ${upd.group}. Cambios detectados:`, {
            oldH: match.homeTeamId, newH: upd.h,
            oldA: match.awayTeamId, newA: upd.a
          });
          
          console.log(`DEBUG: Actualizando y RESETEANDO ${upd.group} por cambio de equipos clasificados:`, data);
          
          await prisma.match.update({
            where: { id: match.id },
            data
          });
          
          // CRÍTICO: Actualizar el objeto local 'match' para que las siguientes comprobaciones 
          // (ej: si este partido era una semifinal y ahora vamos a calcular la Final) 
          // utilicen el estado correcto (sin ganador).
          match.homeTeamId = upd.h;
          match.awayTeamId = upd.a;
          match.status = 'pending';
          match.homeScore = null;
          match.awayScore = null;
        }
      }
    }
  } catch (err) {
    console.error("❌ Error en refreshCategoryBrackets:", err.message);
  }
}

app.post('/api/tournaments/:tid/schedule', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tid);
    const { categoryIds, matchDuration, matchPlayTime } = req.body;
    let tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

    // Actualizar parámetros del torneo si se envían (override)
    if (matchDuration || matchPlayTime) {
      const newDuration = matchDuration ? parseInt(matchDuration) : tournament.matchDuration;
      const newPlayTime = matchPlayTime ? parseInt(matchPlayTime) : tournament.matchPlayTime;

      if (newPlayTime > newDuration) {
        return res.status(400).json({ error: 'El tiempo de partido no puede ser mayor que el tiempo de ronda' });
      }

      tournament = await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          matchDuration: newDuration,
          matchPlayTime: newPlayTime
        }
      });
    }

    // VALIDACIÓN: Todas las categorías que TENGAN EQUIPOS deben tener partidos generados (Fase 1 completada)
    const tournamentCategories = await prisma.category.findMany({
      where: { tournamentId },
      include: {
        _count: {
          select: {
            matches: true,
            teams: true
          }
        }
      }
    });

    // VALIDACIÓN: Según strictScheduleMode
    const categoriesWithTeams = tournamentCategories.filter(c => c._count.teams > 0);
    const incompleteCategories = categoriesWithTeams.filter(c => c._count.matches === 0);

    if (tournament.strictScheduleMode && incompleteCategories.length > 0) {
      const names = incompleteCategories.map(c => c.name).join(', ');
      return res.status(400).json({
        error: `No se puede generar el calendario (Modo Estricto): Las siguientes categorías tienen equipos pero no tienen sus partidos generados: ${names}. Por favor, genera los partidos de estas categorías o borra sus equipos para continuar.`
      });
    }

    // Obtener jornadas con sus configuraciones de pista del torneo
    const dbJornadas = await prisma.jornada.findMany({
      where: { tournamentId },
      include: {
        courtConfigs: {
          include: {
            court: true,
            categories: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });



    if (dbJornadas.length === 0) return res.status(400).json({ error: 'Debes definir al menos una jornada (día/hora)' });
    
    // Eliminamos la validación estricta de courtConfigs. 
    // Si no hay configuraciones, el scheduler asumirá que todas las pistas están disponibles para todas las categorías.


    // Borrar slots anteriores
    await prisma.scheduleSlot.deleteMany({ where: { tournamentId } });

    // Obtener partidos del torneo (filtrar por categorías si se indica)
    const whereClause = { category: { tournamentId } };
    if (categoryIds && categoryIds.length > 0) {
      whereClause.categoryId = { in: categoryIds };
    }

    const matchesToSchedule = await prisma.match.findMany({
      where: whereClause,
      include: { homeTeam: true, awayTeam: true, category: true },
      orderBy: { round: 'asc' },
    });

    if (matchesToSchedule.length === 0) return res.status(400).json({ error: 'No hay partidos generados. Ejecuta primero la Fase 1.' });

    // Obtener todas las pistas para que el scheduler sepa qué hay disponible por defecto
    const tournamentCourts = await prisma.court.findMany({ where: { tournamentId } });

    const slots = allocateSchedules(matchesToSchedule, { 
      matchDuration: tournament.matchDuration || 15, 
      tournamentId, 
      jornadas: dbJornadas,
      courts: tournamentCourts
    });



    const created = await prisma.$transaction(
      slots.map(s => prisma.scheduleSlot.create({ data: s }))
    );

    // Ahora asignar el matchNumber correlativo según orden cronológico del calendario
    // Orden: fecha → hora → pista (numérica)
    const sortedSlots = [...created].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.court.localeCompare(b.court, undefined, { numeric: true });
    });

    // Limpiar primero todos los matchNumbers del torneo
    // (updateMany no soporta filtros de relación en SQLite, usamos categoryIds)
    const cats = await prisma.category.findMany({
      where: { tournamentId },
      select: { id: true }
    });
    const catIds = cats.map(c => c.id);
    await prisma.match.updateMany({
      where: { categoryId: { in: catIds } },
      data: { matchNumber: null }
    });

    // Asignar matchNumber a cada partido programado en orden cronológico
    let num = 1;
    for (const slot of sortedSlots) {
      if (slot.matchId) {
        await prisma.match.update({
          where: { id: slot.matchId },
          data: { matchNumber: num++ }
        });
      }
    }

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tournaments/:tid/schedule', async (req, res) => {
  try {
    const slots = await prisma.scheduleSlot.findMany({
      where: { tournamentId: parseInt(req.params.tid) },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true, category: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { court: 'asc' }],
    });
    res.json(slots);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Helper para comparar cronológicamente dos slots (fecha y hora)
 * Retorna: -1 si a < b, 1 si a > b, 0 si iguales
 */
function compareScheduleSlots(dateA, timeA, dateB, timeB) {
  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;
  return timeA.localeCompare(timeB);
}

function getRoundIndexForDateTime(date, time, jornadas = []) {
  const targetJornadas = (jornadas || []).filter(j => j.date === date)
  const [targetHour, targetMinute] = String(time || '').split(':').map(Number)
  if (!Number.isFinite(targetHour) || !Number.isFinite(targetMinute)) return null
  const targetTotal = (targetHour * 60) + targetMinute

  let accumulatedIndex = 0
  for (const jornada of targetJornadas) {
    const [startHour, startMinute] = jornada.startTime.split(':').map(Number)
    const [endHour, endMinute] = jornada.endTime.split(':').map(Number)
    const startTotal = (startHour * 60) + startMinute
    const endTotal = (endHour * 60) + endMinute
    const duration = parseInt(jornada.matchDuration) || 15
    if (targetTotal < startTotal || targetTotal >= endTotal) {
      accumulatedIndex += Math.max(0, Math.ceil((endTotal - startTotal) / duration))
      continue
    }

    const offset = targetTotal - startTotal
    if (offset % duration !== 0) return null
    return accumulatedIndex + Math.floor(offset / duration)
  }

  return null
}

function getRequiredRestRoundsForDateTime(date, time, jornadas = []) {
  const jornada = (jornadas || []).find(j =>
    j.date === date &&
    j.startTime <= time &&
    j.endTime > time
  )
  if (!jornada) return 1
  if (jornada.restRoundsBetweenMatches === undefined || jornada.restRoundsBetweenMatches === null || jornada.restRoundsBetweenMatches === '') {
    return 1
  }
  return Math.max(0, parseInt(jornada.restRoundsBetweenMatches) || 0)
}

/**
 * PATCH /api/schedule/:id
 * Permite modificar manualmente el horario/pista de un partido ya programado.
 */
app.patch('/api/schedule/:id', async (req, res) => {
  try {
    const slotId = parseInt(req.params.id);
    const { date, startTime, court } = req.body;

    const existingSlot = await prisma.scheduleSlot.findUnique({
      where: { id: slotId },
      include: { match: { include: { category: true } } }
    });

    if (!existingSlot) return res.status(404).json({ error: 'Slot no encontrado' });

    const m = existingSlot.match;
    const targetDate = date || existingSlot.date;
    const targetTime = startTime || existingSlot.startTime;
    const targetCourt = court || existingSlot.court;

    // REGLA: No se puede mover un partido que ya ha sido jugado
    if (m.status === 'played') {
      return res.status(400).json({ error: 'No se puede modificar el horario de un partido que ya tiene resultados registrados.' });
    }

    // NUEVAS REGLAS DE NEGOCIO (DISPONIBILIDAD DE EQUIPOS, DESCANSOS Y FASES)
    const tournament = await prisma.tournament.findUnique({
      where: { id: existingSlot.tournamentId },
      include: { jornadas: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] } }
    });
    const matchDuration = tournament?.matchDuration || 15;
    const getMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const targetMins = getMins(targetTime);
    const targetRoundIndex = getRoundIndexForDateTime(targetDate, targetTime, tournament?.jornadas || []);
    const requiredRestRounds = getRequiredRestRoundsForDateTime(targetDate, targetTime, tournament?.jornadas || []);
    const hId = m.homeTeamId;
    const aId = m.awayTeamId;

    // 1. Disponibilidad de Equipos: ¿Están los equipos jugando ya a esa hora?
    if (hId || aId) {
      const teamConflict = await prisma.scheduleSlot.findFirst({
        where: {
          tournamentId: existingSlot.tournamentId,
          date: targetDate,
          startTime: targetTime,
          NOT: { id: slotId },
          match: {
            OR: [
              { homeTeamId: hId }, { awayTeamId: hId },
              { homeTeamId: aId }, { awayTeamId: aId }
            ].filter(cond => Object.values(cond)[0] != null)
          }
        },
        include: { match: true }
      });
      if (teamConflict) {
        return res.status(400).json({ error: `Conflicto de equipos: Uno de los equipos ya tiene un partido programado a las ${targetTime}.` });
      }
    }

    // 2. Descanso de Equipos: Mantener ronda de margen para los equipos
    if (hId || aId) {
      const teamMatches = await prisma.scheduleSlot.findMany({
        where: {
          tournamentId: existingSlot.tournamentId,
          NOT: { id: slotId },
          match: {
            OR: [
              { homeTeamId: hId }, { awayTeamId: hId },
              { homeTeamId: aId }, { awayTeamId: aId }
            ].filter(cond => Object.values(cond)[0] != null)
          }
        }
      });
      for (const tm of teamMatches) {
        if (tm.date === targetDate) {
          const otherRoundIndex = getRoundIndexForDateTime(tm.date, tm.startTime, tournament?.jornadas || []);
          const hasRoundIndexGap = targetRoundIndex !== null && otherRoundIndex !== null;
          const diff = Math.abs(targetMins - getMins(tm.startTime));
          if ((hasRoundIndexGap && Math.abs(targetRoundIndex - otherRoundIndex) <= requiredRestRounds) || (!hasRoundIndexGap && diff < (matchDuration * (requiredRestRounds + 1)))) {
            return res.status(400).json({ error: `Falta descanso: Los equipos deben tener al menos ${requiredRestRounds} ronda(s) de descanso entre partidos para esta franja.` });
          }
        }
      }
    }

    // 3. Integridad de Fases: Todas las fases de grupos (Ronda 1) deben terminar antes de eliminatorias (Ronda > 1)
    const categoryMatches = await prisma.scheduleSlot.findMany({
      where: {
        tournamentId: existingSlot.tournamentId,
        match: { categoryId: m.categoryId },
        NOT: { id: slotId }
      },
      include: { match: true }
    });

    for (const other of categoryMatches) {
      const otherMins = getMins(other.startTime);
      const isSameDay = other.date === targetDate;
      const timeDiff = Math.abs(targetMins - otherMins);

      // Si el partido a editar es de ELIMINATORIA y el otro es de GRUPO
      if (m.round > 1 && other.match.round === 1) {
        if (compareScheduleSlots(targetDate, targetTime, other.date, other.startTime) <= 0) {
          return res.status(400).json({ error: `Orden inválido: Las eliminatorias de ${m.category?.name || 'la categoría'} no pueden empezar hasta que terminen todos los grupos.` });
        }
      }
      // Viceversa: Si el partido a editar es de GRUPO y el otro es de ELIMINATORIA
      if (m.round === 1 && other.match.round > 1) {
        if (compareScheduleSlots(targetDate, targetTime, other.date, other.startTime) >= 0) {
          return res.status(400).json({ error: `Orden inválido: Los partidos de grupo deben jugarse antes que las eliminatorias.` });
        }
      }

      // Regla de margen entre fases consecutivas (Ronda N y Ronda N+1)
      if (Math.abs(m.round - other.match.round) === 1) {
        if (isSameDay && timeDiff < (matchDuration * 2)) {
          return res.status(400).json({ error: `Margen insuficiente: Debe haber una franja de descanso al cambiar de fase (Ronda ${Math.min(m.round, other.match.round)} a ${Math.max(m.round, other.match.round)}).` });
        }
      }

      // Orden estricto de rondas (N+1 siempre después de N)
      if (other.match.round < m.round) {
        if (compareScheduleSlots(targetDate, targetTime, other.date, other.startTime) <= 0) {
          return res.status(400).json({ error: `Orden inválido: La Ronda ${m.round} debe ser posterior a la Ronda ${other.match.round}.` });
        }
      }
      if (other.match.round > m.round) {
        if (compareScheduleSlots(targetDate, targetTime, other.date, other.startTime) >= 0) {
          return res.status(400).json({ error: `Orden inválido: La Ronda ${m.round} debe ser anterior a la Ronda ${other.match.round}.` });
        }
      }
    }

    // VALIDACIÓN DE DISPONIBILIDAD: ¿Está la pista libre en ese horario?
    if (date || startTime || court) {
      const conflict = await prisma.scheduleSlot.findFirst({
        where: {
          tournamentId: existingSlot.tournamentId,
          date: targetDate,
          startTime: targetTime,
          court: targetCourt,
          NOT: { id: slotId }
        }
      });

      if (conflict) {
        return res.status(409).json({ error: `La ${targetCourt} ya está ocupada el día ${targetDate} a las ${targetTime}.` });
      }

      // 4. Validación de configuración de pista/jornada:
      // ¿Está permitida esta categoría en esta pista y este día/hora?
      const jornada = await prisma.jornada.findFirst({
        where: {
          tournamentId: existingSlot.tournamentId,
          date: targetDate,
          startTime: { lte: targetTime },
          endTime: { gt: targetTime }
        },
        include: {
          courtConfigs: {
            include: {
              court: true,
              categories: true
            }
          }
        }
      });

      if (!jornada) {
        return res.status(400).json({ error: `El horario ${targetTime} del día ${targetDate} está fuera de las jornadas definidas del torneo.` });
      }

      // Buscar si hay una configuración específica para esta pista en esta jornada
      const courtConfig = jornada.courtConfigs.find(cc => cc.court.name === targetCourt);
      if (courtConfig) {
        // Si hay configuración:
        // - Si no tiene categorías -> Pista cerrada.
        // - Si tiene categorías -> Solo esas permitidas.
        if (courtConfig.categories.length === 0) {
          return res.status(400).json({ error: `La pista ${targetCourt} está cerrada para esta jornada.` });
        }
        const isAllowed = courtConfig.categories.some(cat => cat.id === m.categoryId);
        if (!isAllowed) {
          const allowedNames = courtConfig.categories.map(c => c.name).join(', ');
          return res.status(400).json({ error: `La pista ${targetCourt} no permite la categoría ${m.category?.name}. Solo permitidas: ${allowedNames}.` });
        }
      }
    }

    const updated = await prisma.scheduleSlot.update({
      where: { id: slotId },
      data: { date, startTime, court },
      include: { match: { include: { homeTeam: true, awayTeam: true, category: true } } }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/tournaments/:tid/schedule', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.tid);

    // REGLA DE SEGURIDAD: No borrar calendario si ya hay resultados
    const tournamentCategories = await prisma.category.findMany({
      where: { tournamentId },
      select: { id: true }
    });
    const categoryIds = tournamentCategories.map(c => c.id);

    const playedMatch = await prisma.match.findFirst({
      where: {
        categoryId: { in: categoryIds },
        status: 'played'
      },
      include: { category: true }
    });

    if (playedMatch) {
      return res.status(400).json({
        error: `No se puede borrar el calendario: El partido #${playedMatch.matchNumber} de la categoría ${playedMatch.category.name} ya tiene resultados registrados.`
      });
    }

    // Borrar el calendario y logs asociados
    await prisma.$transaction([
      prisma.matchLog.deleteMany({ where: { match: { category: { tournamentId } } } }),
      prisma.scheduleSlot.deleteMany({ where: { tournamentId } }),
      prisma.match.updateMany({
        where: { categoryId: { in: categoryIds } },
        data: { matchNumber: null }
      })
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// STANDINGS — Clasificación por categoría
// ─────────────────────────────────────────────
app.get('/api/categories/:cid/standings', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.cid);
    const teams = await prisma.team.findMany({ where: { categoryId } });
    const matches = await prisma.match.findMany({
      where: { categoryId, round: 1, status: 'played' },
    });

    const standings = teams.map(team => {
      const played = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
      let wins = 0, losses = 0, pf = 0, pa = 0;
      played.forEach(m => {
        const isHome = m.homeTeamId === team.id;
        const myScore = isHome ? m.homeScore : m.awayScore;
        const theirScore = isHome ? m.awayScore : m.homeScore;
        pf += myScore;
        pa += theirScore;
        if (myScore > theirScore) wins++;
        else losses++;
      });
      return { team, played: played.length, wins, losses, pf, pa, diff: pf - pa };
    });

    // Ordenar: victorias desc, diferencia desc, anotados desc
    standings.sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf);

    // Devolvemos la clasificación por grupos (Mapa) y también la lista global
    const byGroup = {};
    standings.forEach(s => {
      const g = s.team.group || 'Grupo A';
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(s);
    });

    res.json({ global: standings, byGroup });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// RANKING FINAL — El Honor del Torneo
// ─────────────────────────────────────────────
app.get('/api/categories/:cid/final-ranking', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.cid);

    // Solo mostrar ranking final si TODOS los partidos de la categoría han terminado
    const allMatches = await prisma.match.findMany({ where: { categoryId } });
    const pendingMatches = allMatches.filter(m => m.status !== 'played');

    if (allMatches.length === 0) {
      return res.json([]);
    }

    const teams = await prisma.team.findMany({ where: { categoryId } });
    const matches = allMatches.filter(m => m.status === 'played');
    // Sort matches for the logic below if needed, though they are already filtered


    // 1. Calcular estadísticas TOTALES (Liga + Eliminatorias) para el balance general
    const totalStats = teams.map(team => {
      const played = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
      let wins = 0, pf = 0, pa = 0;
      played.forEach(m => {
        const isHome = m.homeTeamId === team.id;
        const myScore = isHome ? m.homeScore : m.awayScore;
        const theirScore = isHome ? m.awayScore : m.homeScore;
        pf += (myScore || 0); pa += (theirScore || 0);
        if (myScore > theirScore) wins++;
      });
      return { teamId: team.id, team, wins, pf, pa, diff: pf - pa };
    });

    // Ordenador FIBA para desempates en Ranking Final
    const fibaSort = (a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf;

    // 2. Mapear progreso en eliminatorias
    const finalMatch = matches.find(m => m.group === 'Final');
    const semiMatches = matches.filter(m => m.group.startsWith('Semifinal'));
    const cuartoMatches = matches.filter(m => m.group.startsWith('Cuartos'));
    const octavoMatches = matches.filter(m => m.group.startsWith('Octavos'));

    const ranking = [];

    // Puestos 1 y 2 (Final)
    if (finalMatch) {
      const winnerId = finalMatch.homeScore > finalMatch.awayScore ? finalMatch.homeTeamId : finalMatch.awayTeamId;
      const loserId = finalMatch.homeScore > finalMatch.awayScore ? finalMatch.awayTeamId : finalMatch.homeTeamId;
      ranking.push({ rank: 1, ...totalStats.find(s => s.teamId === winnerId), note: 'CAMPEÓN' });
      ranking.push({ rank: 2, ...totalStats.find(s => s.teamId === loserId), note: 'SUB-CAMPEÓN' });
    }

    // Puestos 3 y 4 (Semis o 3er y 4º puesto)
    const thirdFourthMatch = matches.find(m => m.group === 'Tercer y Cuarto Puesto');
    if (thirdFourthMatch && thirdFourthMatch.status === 'played') {
      const winnerId = thirdFourthMatch.homeScore > thirdFourthMatch.awayScore ? thirdFourthMatch.homeTeamId : thirdFourthMatch.awayTeamId;
      const loserId = thirdFourthMatch.homeScore > thirdFourthMatch.awayScore ? thirdFourthMatch.awayTeamId : thirdFourthMatch.homeTeamId;
      if (winnerId) ranking.push({ rank: 3, ...totalStats.find(s => s.teamId === winnerId), note: '3º PUESTO' });
      if (loserId) ranking.push({ rank: 4, ...totalStats.find(s => s.teamId === loserId), note: '4º PUESTO' });
    } else {
      const semiLosersIds = semiMatches.map(m => m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId).filter(id => id !== null);
      const semiLosersStats = semiLosersIds.map(id => totalStats.find(s => s.teamId === id)).sort(fibaSort);
      semiLosersStats.forEach((s, i) => ranking.push({ rank: 3 + i, ...s, note: 'SEMIFINALISTA' }));
    }

    // Puestos 5-8 (Cuartos)
    const cuartoLosersIds = cuartoMatches.map(m => m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId).filter(id => id !== null);
    const cuartoLosersStats = cuartoLosersIds.map(id => totalStats.find(s => s.teamId === id)).sort(fibaSort);
    let currentRank = ranking.length + 1;
    cuartoLosersStats.forEach((s, i) => ranking.push({ rank: currentRank + i, ...s, note: 'CUARTOS' }));

    // Puestos 9-16 (Octavos)
    const octavoLosersIds = octavoMatches.map(m => m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId).filter(id => id !== null);
    const octavoLosersStats = octavoLosersIds.map(id => totalStats.find(s => s.teamId === id)).sort(fibaSort);
    currentRank = ranking.length + 1;
    octavoLosersStats.forEach((s, i) => ranking.push({ rank: currentRank + i, ...s, note: 'OCTAVOS' }));

    // Resto de equipos (por estadística de liga)
    const alreadyRanked = new Set(ranking.map(r => r?.teamId).filter(Boolean));
    const restStats = totalStats.filter(s => !alreadyRanked.has(s.teamId)).sort(fibaSort);

    currentRank = ranking.length + 1;
    restStats.forEach((s, i) => ranking.push({ rank: currentRank + i, ...s, note: 'FASE GRUPOS' }));

    res.json(ranking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
ensureDefaultGroupLogic()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🏀 SPBASKET 3x3 Backend corriendo en http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch((e) => {
    console.error('Error inicializando lógica de grupos por defecto:', e)
    process.exit(1)
  })

// Catch-all para el frontend (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
