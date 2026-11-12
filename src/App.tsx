import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  MarkerType,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowRightLeft,
  BarChart3,
  Building2,
  Cable,
  CircleDollarSign,
  Cpu,
  Database,
  Download,
  Factory,
  FileText,
  Gauge,
  GitBranchPlus,
  LayoutDashboard,
  Network,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Route,
  ShieldCheck,
  SkipForward,
  Trash2,
  Wallet,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type Building = {
  id: number
  name: string
  x: number
  y: number
}

type Connection = {
  id: string
  from: number
  to: number
  distance: number
  costPerMeter: number
  cableType: string
}

type NavKey =
  | 'intro'
  | 'dashboard'
  | 'campus'
  | 'buildings'
  | 'connections'
  | 'prim'
  | 'kruskal'
  | 'comparison'
  | 'report'
  | 'info'
  | 'viva'

type AlgorithmStep = {
  name: string
  description: string
  edgeId: string | null
  total: number
  selectedIds: string[]
  acceptedIds: string[]
  rejectedIds: string[]
  type: 'select' | 'accept' | 'reject' | 'done'
}

const navItems: Array<{ key: NavKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'intro', label: 'Project Introduction', icon: LayoutDashboard },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'campus', label: 'Campus Network', icon: Network },
  { key: 'buildings', label: 'Buildings Management', icon: Building2 },
  { key: 'connections', label: 'Connections Management', icon: Cable },
  { key: 'prim', label: "Prim's Algorithm", icon: GitBranchPlus },
  { key: 'kruskal', label: "Kruskal's Algorithm", icon: Route },
  { key: 'comparison', label: 'Algorithm Comparison', icon: BarChart3 },
  { key: 'report', label: 'Installation Report', icon: FileText },
  { key: 'info', label: 'Project Info', icon: Database },
  { key: 'viva', label: 'Viva Prep', icon: Cpu },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const calculateCost = (distance: number, costPerMeter: number) => Number((distance * costPerMeter).toFixed(2))

const getConnectionCost = (connection: Connection) => calculateCost(connection.distance, connection.costPerMeter)

const defaultBuildings: Building[] = [
  { id: 0, name: 'V Block', x: 200, y: 100 },
  { id: 1, name: 'SR Block', x: 400, y: 100 },
  { id: 2, name: 'CV Block', x: 600, y: 100 },
  { id: 3, name: 'JC Bose Block', x: 800, y: 100 },
  { id: 4, name: 'Ganga', x: 150, y: 350 },
  { id: 5, name: 'Yamuna', x: 300, y: 350 },
  { id: 6, name: 'Narmada', x: 450, y: 350 },
  { id: 7, name: 'Krishna', x: 600, y: 350 },
  { id: 8, name: 'Godavari', x: 750, y: 350 },
  { id: 9, name: 'Saraswathi', x: 900, y: 350 },
  { id: 10, name: 'Brahmaputra', x: 1050, y: 350 },
  { id: 11, name: 'Kaveri', x: 1200, y: 350 },
]

const defaultConnections: Connection[] = [
  { id: 'C1', from: 0, to: 1, distance: 200, costPerMeter: 18, cableType: 'Fiber' },
  { id: 'C2', from: 0, to: 4, distance: 250, costPerMeter: 18, cableType: 'Fiber' },
  { id: 'C3', from: 0, to: 5, distance: 260, costPerMeter: 19, cableType: 'Copper' },
  { id: 'C4', from: 1, to: 2, distance: 200, costPerMeter: 17, cableType: 'Fiber' },
  { id: 'C5', from: 1, to: 5, distance: 240, costPerMeter: 16, cableType: 'Fiber' },
  { id: 'C6', from: 1, to: 6, distance: 260, costPerMeter: 18, cableType: 'Copper' },
  { id: 'C7', from: 2, to: 3, distance: 200, costPerMeter: 19, cableType: 'Fiber' },
  { id: 'C8', from: 2, to: 7, distance: 250, costPerMeter: 17, cableType: 'Fiber' },
  { id: 'C9', from: 3, to: 9, distance: 260, costPerMeter: 20, cableType: 'Fiber' },
  { id: 'C10', from: 4, to: 5, distance: 150, costPerMeter: 16, cableType: 'Copper' },
  { id: 'C11', from: 4, to: 6, distance: 300, costPerMeter: 18, cableType: 'Fiber' },
  { id: 'C12', from: 5, to: 6, distance: 150, costPerMeter: 17, cableType: 'Fiber' },
  { id: 'C13', from: 5, to: 7, distance: 300, costPerMeter: 18, cableType: 'Fiber' },
  { id: 'C14', from: 6, to: 7, distance: 150, costPerMeter: 16, cableType: 'Copper' },
  { id: 'C15', from: 6, to: 8, distance: 300, costPerMeter: 18, cableType: 'Fiber' },
  { id: 'C16', from: 7, to: 8, distance: 150, costPerMeter: 15, cableType: 'Fiber' },
  { id: 'C17', from: 7, to: 9, distance: 300, costPerMeter: 17, cableType: 'Copper' },
  { id: 'C18', from: 8, to: 9, distance: 150, costPerMeter: 16, cableType: 'Fiber' },
  { id: 'C19', from: 9, to: 10, distance: 150, costPerMeter: 18, cableType: 'Fiber' },
  { id: 'C20', from: 10, to: 11, distance: 150, costPerMeter: 18, cableType: 'Fiber' },
  { id: 'C21', from: 8, to: 10, distance: 300, costPerMeter: 19, cableType: 'Copper' },
  { id: 'C22', from: 9, to: 11, distance: 300, costPerMeter: 17, cableType: 'Fiber' },
  { id: 'C23', from: 6, to: 3, distance: 350, costPerMeter: 17, cableType: 'Fiber' },
]

const scenarioOptions = [
  { id: 'custom', label: 'Custom Campus (12 buildings)', description: 'Exact campus layout preserving building IDs and coordinates.' },
  { id: 'small', label: 'Small Campus (5 buildings)', description: 'Compact network for departmental connectivity.' },
  { id: 'medium', label: 'Medium Campus (10 buildings)', description: 'Balanced academic campus with central utilities.' },
  { id: 'large', label: 'Large Campus (15 buildings)', description: 'Expansive network with multiple residential and research blocks.' },
] as const

type ScenarioId = (typeof scenarioOptions)[number]['id']

const vivaQuestions = [
  { question: 'What is a Minimum Spanning Tree?', answer: 'A minimum spanning tree is a connected, acyclic subgraph that connects all vertices of a weighted graph while minimizing the total edge weight.' },
  { question: 'What is a greedy algorithm?', answer: 'A greedy algorithm makes the locally optimal choice at each step to reach a globally optimal result for suitable problems such as MST construction.' },
  { question: 'Explain Prim\'s algorithm.', answer: 'Prim\'s algorithm starts from a selected node and repeatedly adds the cheapest edge that connects the growing tree to an unvisited node.' },
  { question: 'Explain Kruskal\'s algorithm.', answer: 'Kruskal\'s algorithm sorts all edges by weight and repeatedly adds the smallest edge that does not form a cycle.' },
  { question: 'What is Disjoint Set Union?', answer: 'DSU is a data structure that tracks a set of elements and supports quick union and find operations used in Kruskal\'s algorithm for cycle detection.' },
  { question: 'What is cycle detection?', answer: 'Cycle detection checks whether adding an edge would create a loop in the current spanning structure; if so, the edge is rejected.' },
  { question: 'What is the time complexity of Prim\'s algorithm using a simple matrix?', answer: 'Using an adjacency matrix, Prim\'s algorithm runs in O(V²).' },
  { question: 'What is the time complexity of Kruskal\'s algorithm?', answer: 'Kruskal\'s algorithm is O(E log E) because sorting edges dominates the complexity.' },
  { question: 'What is the space complexity of an MST algorithm?', answer: 'The space complexity is generally O(V + E) for graph storage and supporting data structures.' },
  { question: 'How is Prim\'s algorithm different from Kruskal\'s algorithm?', answer: 'Prim grows a tree from a source node, while Kruskal builds a forest by selecting the minimum edges globally without cycles.' },
  { question: 'Why is MST important in networking?', answer: 'It minimizes cable length and total cost while keeping the entire network connected and efficient.' },
  { question: 'Can MST exist for a disconnected graph?', answer: 'No. A spanning tree requires a connected graph; a disconnected graph cannot have a valid MST.' },
  { question: 'What is the role of edge weight in MST?', answer: 'The edge weight represents cost, distance, or latency, and the algorithm minimizes the sum of weights in the selected tree.' },
  { question: 'How does DSU detect cycles?', answer: 'If the endpoints of an edge belong to the same set, the edge would create a cycle and is discarded.' },
  { question: 'What is the importance of sorting edges in Kruskal\'s algorithm?', answer: 'Sorting ensures that the cheapest valid edges are considered first, which leads to the minimum total cost tree.' },
  { question: 'What is the effect of graph density on MST algorithms?', answer: 'Dense graphs have more edges, which can increase computational cost, but MST still produces the minimum connecting structure.' },
  { question: 'Name a real-world application of MST.', answer: 'Network design, road construction, water pipelines, electricity grids, and telecommunication infrastructure planning all use MSTs.' },
  { question: 'Why do we prefer minimum-cost cable layouts in campuses?', answer: 'They reduce installation cost, maintenance effort, and resource wastage while maintaining connectivity.' },
  { question: 'What is the main limitation of Prim\'s algorithm?', answer: 'It is efficient for connected graphs but may need careful implementation for large graphs when using simpler data structures.' },
  { question: 'What is the main limitation of Kruskal\'s algorithm?', answer: 'It requires sorting all edges, which can be expensive for extremely large graphs with many edges.' },
  { question: 'How do you validate that an MST result is correct?', answer: 'You verify that all vertices are connected, the graph is acyclic, and the total edge weight is minimized compared to alternative spanning trees.' },
  { question: 'Why is the result of Prim\'s and Kruskal\'s algorithms equal on a connected graph?', answer: 'Both algorithms compute a minimum spanning tree for the same weighted graph, producing the same minimum total cost when the graph is connected.' },
]

const quizQuestions = [
  { question: 'Which algorithm starts from a source node and grows a tree outward?', options: ["Prim's algorithm", 'Kruskal\'s algorithm', 'Dijkstra\'s algorithm', 'Bellman-Ford'], answer: "Prim's algorithm" },
  { question: 'Which algorithm sorts all edges by weight first?', options: ["Prim's algorithm", 'Kruskal\'s algorithm', 'Breadth-first search', 'Depth-first search'], answer: "Kruskal's algorithm" },
  { question: 'What does DSU help detect?', options: ['Shortest path', 'Cycle formation', 'Node capacity', 'Graph traversal'], answer: 'Cycle formation' },
  { question: 'What is the key property of a spanning tree?', options: ['It contains all vertices and no cycles', 'It contains only the heaviest edges', 'It ignores connectivity', 'It repeats nodes'], answer: 'It contains all vertices and no cycles' },
  { question: 'Why is mutating the graph to connect all buildings important?', options: ['It reduces energy use', 'It minimizes total cable cost', 'It removes nodes', 'It increases redundancy'], answer: 'It minimizes total cable cost' },
]

const buildScenarioGraph = (scenarioId: ScenarioId) => {
  if (scenarioId === 'custom') {
    return { buildings: defaultBuildings, connections: defaultConnections }
  }

  const sizeMap: Record<Exclude<ScenarioId, 'custom'>, number> = { small: 5, medium: 10, large: 15 }
  const size = sizeMap[scenarioId]
  const buildingNamesByScenario = {
    small: ['Main Block', 'CSE Block', 'ECE Block', 'Library', 'Administration'],
    medium: ['Main Block', 'CSE Block', 'ECE Block', 'Library', 'Administration', 'Laboratory', 'Auditorium', 'Hostel', 'Research Center', 'Data Center'],
    large: ['Main Block', 'CSE Block', 'ECE Block', 'Library', 'Administration', 'Laboratory', 'Auditorium', 'Hostel', 'Research Center', 'Data Center', 'Mechanical Block', 'Medical Center', 'Cafeteria', 'Innovation Center', 'Innovation Park'],
  }
  const buildingNames = buildingNamesByScenario[scenarioId]

  const columns = scenarioId === 'small' ? 2 : scenarioId === 'medium' ? 3 : 4
  const stepX = scenarioId === 'small' ? 220 : scenarioId === 'medium' ? 180 : 150
  const stepY = scenarioId === 'small' ? 180 : scenarioId === 'medium' ? 150 : 120

  const buildings: Building[] = Array.from({ length: size }, (_, index) => ({
    id: index,
    name: buildingNames[index],
    x: 120 + (index % columns) * stepX + (index % 2 === 0 ? 20 : 0),
    y: 120 + Math.floor(index / columns) * stepY,
  }))

  const connections: Connection[] = []
  const seen = new Set<string>()

  for (let i = 0; i < buildings.length; i += 1) {
    for (let j = i + 1; j < buildings.length; j += 1) {
      const first = buildings[i]
      const second = buildings[j]
      const distance = Math.round(Math.hypot(second.x - first.x, second.y - first.y))
      const shouldInclude =
        scenarioId === 'small'
          ? distance < 380
          : scenarioId === 'medium'
            ? distance < 420
            : distance < 460

      if (!shouldInclude) continue

      const id = `SC-${i + 1}-${j + 1}`
      if (seen.has(`${first.id}-${second.id}`) || seen.has(`${second.id}-${first.id}`)) continue
      seen.add(`${first.id}-${second.id}`)
      connections.push({
        id,
        from: first.id,
        to: second.id,
        distance,
        costPerMeter: 14 + ((distance % 10) + i + j) % 8,
        cableType: (distance % 3 === 0 ? 'Fiber' : distance % 3 === 1 ? 'Copper' : 'Hybrid'),
      })
    }
  }

  if (connections.length < size - 1) {
    for (let i = 0; i < size - 1; i += 1) {
      const first = buildings[i]
      const second = buildings[i + 1]
      const distance = Math.round(Math.hypot(second.x - first.x, second.y - first.y))
      connections.push({
        id: `SC-LINK-${i + 1}`,
        from: first.id,
        to: second.id,
        distance,
        costPerMeter: 18,
        cableType: 'Fiber',
      })
    }
  }

  return { buildings, connections }
}

const STORAGE_KEYS = {
  buildings: 'netoptima-buildings-v2',
  connections: 'netoptima-connections-v2',
  legacyBuildings: 'netoptima-buildings',
  legacyConnections: 'netoptima-connections',
} as const

const readStorage = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key)
  if (!raw) {
    localStorage.removeItem(STORAGE_KEYS.legacyBuildings)
    localStorage.removeItem(STORAGE_KEYS.legacyConnections)
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as T

    if (key === STORAGE_KEYS.buildings && Array.isArray(parsed)) {
      const legacyNames = new Set([
        'Academic Block',
        'Admin Office',
        'Research Lab',
        'Library',
        'Auditorium',
        'Hostel A',
        'Hostel B',
        'Sports Center',
        'Data Center',
        'Innovation Hub',
        'Main Block',
        'CSE Block',
        'ECE Block',
        'Administration',
        'Laboratory',
        'Research Center',
        'Innovation Park',
        'Mechanical Block',
        'Medical Center',
        'Cafeteria',
      ])

      const hasLegacyCampusLayout =
        parsed.length !== defaultBuildings.length ||
        parsed.some((building: any) => {
          if (!building || typeof building !== 'object') return false
          return typeof building.id === 'string' || legacyNames.has(building.name)
        })

      if (hasLegacyCampusLayout) {
        localStorage.setItem(key, JSON.stringify(fallback))
        return fallback
      }
    }

    if (key === STORAGE_KEYS.connections && Array.isArray(parsed)) {
      const hasLegacyConnections =
        parsed.length !== defaultConnections.length ||
        parsed.some((connection: any) => !connection || typeof connection.from === 'string' || typeof connection.to === 'string')

      if (hasLegacyConnections) {
        localStorage.setItem(key, JSON.stringify(fallback))
        return fallback
      }
    }

    return parsed
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
}

const normalizeBuildingCoordinates = (buildings: Building[]) => {
  if (!buildings.length) return [] as Building[]

  const minX = Math.min(...buildings.map((building) => building.x))
  const maxX = Math.max(...buildings.map((building) => building.x))
  const minY = Math.min(...buildings.map((building) => building.y))
  const maxY = Math.max(...buildings.map((building) => building.y))

  const graphWidth = 1200
  const graphHeight = 520
  const padding = 120

  return buildings.map((building) => {
    const xSpan = maxX - minX || 1
    const ySpan = maxY - minY || 1
    const px = padding + ((building.x - minX) / xSpan) * (graphWidth - padding * 2)
    const py = padding + ((building.y - minY) / ySpan) * (graphHeight - padding * 2)

    return {
      ...building,
      x: px,
      y: py,
    }
  })
}

const clearSavedCampusData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}

const isGraphConnected = (buildings: Building[], connections: Connection[]) => {
  if (buildings.length === 0) return true
  const visited = new Set<number>()
  const queue: number[] = [buildings[0].id]

  while (queue.length > 0) {
    const current = queue.shift() as number
    if (visited.has(current)) continue
    visited.add(current)

    const neighbours = connections
      .filter((connection) => connection.from === current || connection.to === current)
      .flatMap((connection) => [connection.from, connection.to])
      .filter((node) => node !== current)

    neighbours.forEach((node) => {
      if (!visited.has(node)) queue.push(node)
    })
  }

  return visited.size === buildings.length
}

const findMSTPrim = (buildings: Building[], connections: Connection[], startId: number) => {
  const visited = new Set<number>([startId])
  const selectedIds: string[] = []
  const steps: AlgorithmStep[] = []
  let total = 0
  let iteration = 0

  while (visited.size < buildings.length) {
    const candidateConnections = connections.filter((connection) => {
      const fromVisited = visited.has(connection.from)
      const toVisited = visited.has(connection.to)
      return fromVisited !== toVisited
    })

    if (candidateConnections.length === 0) break

    const selectedConnection = candidateConnections.reduce<Connection | undefined>((best, connection) => {
      if (!best) return connection
      return getConnectionCost(connection) < getConnectionCost(best) ? connection : best
    }, undefined)

    if (!selectedConnection) break

    const nextVertex = visited.has(selectedConnection.from) ? selectedConnection.to : selectedConnection.from
    visited.add(nextVertex)
    selectedIds.push(selectedConnection.id)
    total += getConnectionCost(selectedConnection)
    iteration += 1

    steps.push({
      name: `Step ${iteration}`,
      description: `Selected ${selectedConnection.from} → ${selectedConnection.to} with cost ${formatMoney(getConnectionCost(selectedConnection))}.`,
      edgeId: selectedConnection.id,
      total,
      selectedIds: [...selectedIds],
      acceptedIds: [...selectedIds],
      rejectedIds: [],
      type: 'select',
    })
  }

  const connected = visited.size === buildings.length && selectedIds.length === buildings.length - 1
  return {
    cost: total,
    edges: selectedIds,
    steps,
    connected,
  }
}

const findMSTKruskal = (buildings: Building[], connections: Connection[]) => {
  const parent = new Map<number, number>()
  const rank = new Map<number, number>()
  const accepted: string[] = []
  const rejected: string[] = []
  let total = 0
  const steps: AlgorithmStep[] = []

  const find = (node: number): number => {
    if (!parent.has(node)) {
      parent.set(node, node)
      rank.set(node, 0)
    }

    if (parent.get(node) !== node) {
      parent.set(node, find(parent.get(node) as number))
    }

    return parent.get(node) as number
  }

  const union = (a: number, b: number) => {
    const rootA = find(a)
    const rootB = find(b)

    if (rootA === rootB) return false

    if ((rank.get(rootA) ?? 0) < (rank.get(rootB) ?? 0)) {
      parent.set(rootA, rootB)
    } else if ((rank.get(rootA) ?? 0) > (rank.get(rootB) ?? 0)) {
      parent.set(rootB, rootA)
    } else {
      parent.set(rootB, rootA)
      rank.set(rootA, (rank.get(rootA) ?? 0) + 1)
    }

    return true
  }

  const sorted = [...connections].sort((a, b) => getConnectionCost(a) - getConnectionCost(b))

  sorted.forEach((connection, index) => {
    const rootA = find(connection.from)
    const rootB = find(connection.to)
    const isCycle = rootA === rootB

    if (!isCycle && union(connection.from, connection.to)) {
      total += getConnectionCost(connection)
      accepted.push(connection.id)
      steps.push({
        name: `Accepted ${index + 1}`,
        description: `No cycle detected for ${connection.from} → ${connection.to}; edge accepted by Kruskal's algorithm.`,
        edgeId: connection.id,
        total,
        selectedIds: [...accepted],
        acceptedIds: [...accepted],
        rejectedIds: [...rejected],
        type: 'accept',
      })
    } else {
      rejected.push(connection.id)
      steps.push({
        name: `Rejected ${index + 1}`,
        description: `Cycle detected between ${connection.from} and ${connection.to}; edge rejected to preserve acyclic MST structure.`,
        edgeId: connection.id,
        total,
        selectedIds: [...accepted],
        acceptedIds: [...accepted],
        rejectedIds: [...rejected],
        type: 'reject',
      })
    }
  })

  const connected = accepted.length === buildings.length - 1

  return {
    cost: total,
    edges: accepted,
    steps,
    connected,
  }
}

const getBuildingName = (id: number, buildings: Building[]) =>
  buildings.find((building) => building.id === id)?.name ?? String(id)

const emptyBuildingForm = { id: '', name: '', x: 0, y: 0 }
const emptyConnectionForm = { from: '', to: '', distance: 120, costPerMeter: 18, cableType: 'Fiber' }

function App() {
  const [nav, setNav] = useState<NavKey>('intro')
  const [scenarioKey, setScenarioKey] = useState<ScenarioId>('custom')
  const [buildings, setBuildings] = useState<Building[]>(() => readStorage(STORAGE_KEYS.buildings, defaultBuildings))
  const [connections, setConnections] = useState<Connection[]>(() => readStorage(STORAGE_KEYS.connections, defaultConnections))
  const [buildingForm, setBuildingForm] = useState(emptyBuildingForm)
  const [connectionForm, setConnectionForm] = useState(emptyConnectionForm)
  const [editingBuildingId, setEditingBuildingId] = useState<number | null>(null)
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)
  const [budgetPlan, setBudgetPlan] = useState(450000)
  const [costSensitivity, setCostSensitivity] = useState(12)
  const [primStart, setPrimStart] = useState<number>(defaultBuildings[0].id)
  const [primPlaying, setPrimPlaying] = useState(false)
  const [primStepIndex, setPrimStepIndex] = useState(0)
  const [kruskalPlaying, setKruskalPlaying] = useState(false)
  const [kruskalStepIndex, setKruskalStepIndex] = useState(0)
  const [checkFrom, setCheckFrom] = useState<number>(defaultBuildings[0].id)
  const [checkTo, setCheckTo] = useState<number>(defaultBuildings[1].id)
  const [toast, setToast] = useState('')
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const primTimerRef = useRef<number | null>(null)
  const kruskalTimerRef = useRef<number | null>(null)

  const primResult = useMemo(() => {
    if (buildings.length === 0) return { cost: 0, edges: [], steps: [], connected: false }
    const start = buildings.find((building) => building.id === primStart)?.id ?? buildings[0].id
    return findMSTPrim(buildings, connections, start)
  }, [buildings, connections, primStart])

  const kruskalResult = useMemo(() => findMSTKruskal(buildings, connections), [buildings, connections])

  const rejectedEdgeIds = useMemo(() => {
    const rejected = new Set<string>()
    kruskalResult.steps.forEach((step) => {
      if (step.type === 'reject' && step.edgeId) rejected.add(step.edgeId)
    })
    return rejected
  }, [kruskalResult.steps])

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.legacyBuildings)
    localStorage.removeItem(STORAGE_KEYS.legacyConnections)
    localStorage.setItem(STORAGE_KEYS.buildings, JSON.stringify(buildings))
  }, [buildings])

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.legacyBuildings)
    localStorage.removeItem(STORAGE_KEYS.legacyConnections)
    localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(connections))
  }, [connections])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const startId = buildings.find((building) => building.id === primStart)?.id ?? buildings[0]?.id ?? 0
    setPrimStart(startId)
  }, [buildings, primStart])

  useEffect(() => {
    if (!primPlaying) return

    primTimerRef.current = window.setInterval(() => {
      setPrimStepIndex((current) => {
        const totalSteps = primResult.steps.length
        if (current >= totalSteps - 1) {
          setPrimPlaying(false)
          return totalSteps - 1
        }
        return current + 1
      })
    }, 1100)

    return () => {
      if (primTimerRef.current) window.clearInterval(primTimerRef.current)
    }
  }, [primPlaying, primResult])

  useEffect(() => {
    if (!kruskalPlaying) return

    kruskalTimerRef.current = window.setInterval(() => {
      setKruskalStepIndex((current) => {
        const totalSteps = kruskalResult.steps.length
        if (current >= totalSteps - 1) {
          setKruskalPlaying(false)
          return totalSteps - 1
        }
        return current + 1
      })
    }, 1200)

    return () => {
      if (kruskalTimerRef.current) window.clearInterval(kruskalTimerRef.current)
    }
  }, [kruskalPlaying, kruskalResult])

  const graphConnected = useMemo(() => isGraphConnected(buildings, connections), [buildings, connections])
  const normalizedBuildings = useMemo(() => normalizeBuildingCoordinates(buildings), [buildings])

  const mstConnections = useMemo(() => {
    const selectedIds = new Set(primResult.edges)
    return connections.filter((connection) => selectedIds.has(connection.id))
  }, [primResult.edges, connections])

  const totalCableLength = mstConnections.reduce((sum, connection) => sum + connection.distance, 0)
  const minimumCost = primResult.cost
  const totalConnections = connections.length
  const totalBuildings = buildings.length
  const costProjection = minimumCost * (1 + costSensitivity / 100)
  const budgetRemaining = budgetPlan - minimumCost
  const connectivityPath = useMemo(() => {
    const adjacency = new Map<number, number[]>()
    buildings.forEach((building) => adjacency.set(building.id, []))
    connections.forEach((connection) => {
      adjacency.get(connection.from)?.push(connection.to)
      adjacency.get(connection.to)?.push(connection.from)
    })

    const queue: number[] = [checkFrom]
    const visited = new Set<number>([checkFrom])
    const parent = new Map<number, number | null>([[checkFrom, null]])

    while (queue.length > 0) {
      const current = queue.shift() as number
      if (current === checkTo) break

      ;(adjacency.get(current) ?? []).forEach((neighbour) => {
        if (!visited.has(neighbour)) {
          visited.add(neighbour)
          parent.set(neighbour, current)
          queue.push(neighbour)
        }
      })
    }

    if (!visited.has(checkTo)) return []

    const path: number[] = []
    let cursor: number | null = checkTo

    while (cursor !== null) {
      path.unshift(cursor)
      cursor = parent.get(cursor) ?? null
    }

    return path
  }, [buildings, connections, checkFrom, checkTo])

  const chartData = useMemo(
    () =>
      buildings.map((building) => ({
        name: building.id,
        value: connections.filter((c) => c.from === building.id || c.to === building.id).length,
      })),
    [buildings, connections],
  )

  const flowNodes: Node[] = normalizedBuildings.map((building) => ({
    id: String(building.id),
    position: { x: building.x, y: building.y },
    data: { label: building.name },
    draggable: true,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      background: '#081426',
      border: '1px solid rgba(34, 211, 238, 0.7)',
      color: '#e2e8f0',
      borderRadius: 18,
      width: 130,
      boxShadow: '0 0 24px rgba(34,211,238,0.22)',
      animation: 'pulse 2.1s ease-in-out infinite',
    },
  }))

  const selectedMstSet = new Set(primResult.edges)
  const flowEdges: Edge[] = connections.map((connection) => {
    const isSelected = selectedMstSet.has(connection.id)
    const isRejected = rejectedEdgeIds.has(connection.id)

    return {
      id: connection.id,
      source: String(connection.from),
      target: String(connection.to),
      label: `${connection.distance}m • ${formatCurrency(getConnectionCost(connection))}`,
      type: 'straight',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isSelected ? '#34d399' : isRejected ? '#94a3b8' : '#8b5cf6',
      },
      style: {
        stroke: isSelected ? '#34d399' : isRejected ? '#94a3b8' : '#8b5cf6',
        strokeWidth: isSelected ? 5 : isRejected ? 2 : 2.5,
        opacity: isSelected ? 1 : isRejected ? 0.5 : 0.82,
        filter: isSelected ? 'drop-shadow(0 0 8px rgba(52,211,153,0.9))' : 'none',
      },
      labelStyle: { fill: '#e2e8f0', fontSize: 11, fontWeight: 600 },
      animated: isSelected,
      zIndex: isSelected ? 100 : 0,
    }
  })

  const resetToDefaultCampus = () => {
    clearSavedCampusData()
    localStorage.setItem(STORAGE_KEYS.buildings, JSON.stringify(defaultBuildings))
    localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(defaultConnections))
    setScenarioKey('custom')
    setBuildings(defaultBuildings)
    setConnections(defaultConnections)
    setPrimStart(defaultBuildings[0]?.id ?? 0)
    setCheckFrom(defaultBuildings[0]?.id ?? 0)
    setCheckTo(defaultBuildings[1]?.id ?? 0)
    setPrimStepIndex(0)
    setKruskalStepIndex(0)
    setPrimPlaying(false)
    setKruskalPlaying(false)
    setToast('Custom campus reset to the original 12-building layout.')
  }

  const loadScenario = (scenarioId: ScenarioId) => {
    const selected = buildScenarioGraph(scenarioId)
    setScenarioKey(scenarioId)
    setBuildings(selected.buildings)
    setConnections(selected.connections)
    setPrimStart(selected.buildings[0]?.id ?? 0)
    setCheckFrom(selected.buildings[0]?.id ?? 0)
    setCheckTo(selected.buildings[1]?.id ?? 0)
    setPrimStepIndex(0)
    setKruskalStepIndex(0)
    setPrimPlaying(false)
    setKruskalPlaying(false)
    setToast(`${scenarioOptions.find((item) => item.id === scenarioId)?.label ?? 'Scenario'} loaded.`)
  }

  const handleAddOrUpdateBuilding = () => {
    if (!buildingForm.name.trim()) {
      setToast('Building name is required.')
      return
    }

    const hasIdValue = String(buildingForm.id).trim() !== ''
    const parsedId = Number(buildingForm.id)
    if (!editingBuildingId && (!hasIdValue || !Number.isFinite(parsedId) || parsedId < 0)) {
      setToast('A valid numeric building ID is required.')
      return
    }

    const normalizedId = editingBuildingId ?? Math.round(parsedId)
    const normalizedName = buildingForm.name.trim()

    const existing = buildings.some((item) => item.id === normalizedId && editingBuildingId !== normalizedId)
    if (existing) {
      setToast('Building ID must be unique.')
      return
    }

    const position = {
      x: Number.isFinite(buildingForm.x) && buildingForm.x !== 0 ? buildingForm.x : 120 + buildings.length * 60,
      y: Number.isFinite(buildingForm.y) && buildingForm.y !== 0 ? buildingForm.y : 100 + buildings.length * 35,
    }

    if (editingBuildingId) {
      setBuildings((current) =>
        current.map((building) =>
          building.id === editingBuildingId
            ? { ...building, name: normalizedName, x: position.x, y: position.y }
            : building,
        ),
      )
      setConnections((current) =>
        current.map((connection) => ({
          ...connection,
          from: connection.from === editingBuildingId ? normalizedId : connection.from,
          to: connection.to === editingBuildingId ? normalizedId : connection.to,
        })),
      )
      setToast('Building updated successfully.')
    } else {
      setBuildings((current) => [...current, { id: normalizedId, name: normalizedName, x: position.x, y: position.y }])
      setToast('Building added successfully.')
    }

    setBuildingForm(emptyBuildingForm)
    setEditingBuildingId(null)
  }

  const handleEditBuilding = (building: Building) => {
    setEditingBuildingId(building.id)
    setBuildingForm({ id: String(building.id), name: building.name, x: building.x, y: building.y })
  }

  const handleDeleteBuilding = (id: number) => {
    setBuildings((current) => current.filter((building) => building.id !== id))
    setConnections((current) => current.filter((connection) => connection.from !== id && connection.to !== id))
    setToast('Building deleted.')
  }

  const handleAddOrUpdateConnection = () => {
    const fromValue = Number(connectionForm.from)
    const toValue = Number(connectionForm.to)

    if (!connectionForm.from || !connectionForm.to) {
      setToast('Both end buildings are required.')
      return
    }

    if (fromValue === toValue) {
      setToast('A connection cannot connect a building to itself.')
      return
    }

    if (Number(connectionForm.distance) <= 0 || Number(connectionForm.costPerMeter) <= 0) {
      setToast('Distance and cost per meter must be greater than zero.')
      return
    }

    const newConnection: Connection = {
      id: editingConnectionId ?? `C${Date.now()}`,
      from: fromValue,
      to: toValue,
      distance: Number(connectionForm.distance),
      costPerMeter: Number(connectionForm.costPerMeter),
      cableType: connectionForm.cableType,
    }

    if (editingConnectionId) {
      setConnections((current) =>
        current.map((connection) => (connection.id === editingConnectionId ? newConnection : connection)),
      )
      setToast('Connection updated successfully.')
    } else {
      setConnections((current) => [...current, newConnection])
      setToast('Connection added successfully.')
    }

    setConnectionForm(emptyConnectionForm)
    setEditingConnectionId(null)
  }

  const handleEditConnection = (connection: Connection) => {
    setEditingConnectionId(connection.id)
    setConnectionForm({
      from: String(connection.from),
      to: String(connection.to),
      distance: connection.distance,
      costPerMeter: connection.costPerMeter,
      cableType: connection.cableType,
    })
  }

  const handleDeleteConnection = (id: string) => {
    setConnections((current) => current.filter((connection) => connection.id !== id))
    setToast('Connection deleted.')
  }

  const exportCsvReport = () => {
    const rows = mstConnections.map((connection) => ({
      id: connection.id,
      from: getBuildingName(connection.from, buildings),
      to: getBuildingName(connection.to, buildings),
      distance: connection.distance,
      costPerMeter: connection.costPerMeter,
      totalCost: getConnectionCost(connection),
    }))

    const summary = [
      ['Project', 'NetOptima - Minimum-Cost Network Cable Installation System'],
      ['Campus scenario', scenarioOptions.find((option) => option.id === scenarioKey)?.label ?? scenarioKey],
      ['Generated on', new Date().toLocaleDateString()],
      ['Total cable length (m)', String(totalCableLength)],
      ['Total installation cost', formatCurrency(minimumCost)],
      ['Prim MST cost', formatCurrency(primResult.cost)],
      ['Kruskal MST cost', formatCurrency(kruskalResult.cost)],
      ['Connectivity', graphConnected ? 'Connected' : 'Disconnected'],
      [''],
    ]

    const columns = ['ID', 'From', 'To', 'Distance (m)', 'Cost per meter', 'Total cost']
    const csv = [
      ...summary.map((row) => row.map(String).join(',')),
      columns.join(','),
      ...rows.map((row) => [row.id, row.from, row.to, row.distance, row.costPerMeter, row.totalCost].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'netoptima-report.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const exportPdfReport = () => {
    const doc = new jsPDF()
    const scenarioLabel = scenarioOptions.find((option) => option.id === scenarioKey)?.label ?? 'Custom Campus'

    doc.setFillColor(8, 17, 29)
    doc.rect(0, 0, 210, 297, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text('NetOptima - Installation Report', 14, 18)
    doc.setFontSize(11)
    doc.setTextColor(148, 163, 184)
    doc.text(`Campus scenario: ${scenarioLabel}`, 14, 28)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35)

    const summaryRows = [
      ['Selected connections', String(mstConnections.length)],
      ['Total cable length', `${totalCableLength} m`],
      ['Total installation cost', formatCurrency(minimumCost)],
      ['Prim MST cost', formatCurrency(primResult.cost)],
      ['Kruskal MST cost', formatCurrency(kruskalResult.cost)],
      ['Connectivity', graphConnected ? 'Connected' : 'Disconnected'],
    ]

    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: summaryRows,
      startY: 42,
      styles: { fillColor: [15, 23, 42], textColor: [226, 232, 240], lineColor: [59, 130, 246], fontSize: 9 },
      headStyles: { fillColor: [34, 211, 238], textColor: [15, 23, 42], fontStyle: 'bold' },
    })

    const rows = mstConnections.map((connection) => [
      connection.id,
      getBuildingName(connection.from, buildings),
      getBuildingName(connection.to, buildings),
      `${connection.distance} m`,
      formatMoney(connection.costPerMeter),
      formatMoney(getConnectionCost(connection)),
    ])

    autoTable(doc, {
      head: [['ID', 'From', 'To', 'Distance', 'Cost/m', 'Total cost']],
      body: rows,
      startY: (doc as any).lastAutoTable.finalY + 8,
      styles: { fontSize: 9, fillColor: [15, 23, 42], textColor: [226, 232, 240], lineColor: [59, 130, 246] },
      headStyles: { fillColor: [34, 211, 238], textColor: [15, 23, 42], fontStyle: 'bold' },
    })

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.text('Algorithm comparison', 14, (doc as any).lastAutoTable.finalY + 8)
    doc.text(`Prim: ${formatCurrency(primResult.cost)} | Kruskal: ${formatCurrency(kruskalResult.cost)}`, 14, (doc as any).lastAutoTable.finalY + 16)
    doc.text(`Selected MST edge count: ${mstConnections.length} | Total length: ${totalCableLength}m`, 14, (doc as any).lastAutoTable.finalY + 24)
    doc.save('netoptima-installation-report.pdf')
  }

  const currentPrimStep = primResult.steps[primStepIndex] ?? primResult.steps[primResult.steps.length - 1]
  const currentKruskalStep = kruskalResult.steps[kruskalStepIndex] ?? kruskalResult.steps[kruskalResult.steps.length - 1]
  const quizScore = quizQuestions.reduce((score, question, index) => {
    return quizAnswers[index] === question.answer ? score + 1 : score
  }, 0)
  const answeredQuizCount = Object.keys(quizAnswers).length

  const metricCards = [
    { title: 'Total buildings', value: totalBuildings.toString(), subtitle: 'Campus nodes', icon: Building2 },
    { title: 'Total connections', value: totalConnections.toString(), subtitle: 'Active links', icon: Cable },
    { title: 'Selected MST edges', value: String(mstConnections.length), subtitle: 'Minimum spanning tree', icon: Network },
    { title: 'Minimum installation cost', value: formatCurrency(minimumCost), subtitle: 'Lowest feasible spend', icon: CircleDollarSign },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-full max-w-[280px] border-r border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl p-4">
          <div className="mb-8 flex items-center gap-3 px-3 pt-4">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 p-2 shadow-lg shadow-cyan-500/20">
              <Factory className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">DAA Project</p>
              <h1 className="text-xl font-bold text-white">NetOptima</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setNav(key)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all ${
                  nav === key
                    ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200 shadow-lg shadow-cyan-900/20'
                    : 'border-transparent bg-slate-900/60 text-slate-300 hover:border-violet-500/30 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <ArrowRightLeft className="h-4 w-4 opacity-60" />
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-200">System Status</p>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-200">
              <span>Connectivity</span>
              <span className={graphConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {graphConnected ? 'Stable' : 'Disconnected'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-200">
              <span>Budget health</span>
              <span className={budgetRemaining >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {budgetRemaining >= 0 ? 'Within plan' : 'Over budget'}
              </span>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <header className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">Installation Intelligence</p>
              <h2 className="mt-1 text-3xl font-bold text-white">Minimum-Cost Network Cable Installation System</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
                <span className="mr-2 text-slate-400">Scenario:</span>
                <select
                  value={scenarioKey}
                  onChange={(event) => loadScenario(event.target.value as ScenarioId)}
                  className="bg-transparent text-cyan-200 outline-none"
                >
                  {scenarioOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-slate-900 text-slate-200">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={resetToDefaultCampus}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
              >
                Reset campus
              </button>
              <button
                type="button"
                onClick={() => {
                  clearSavedCampusData()
                  setScenarioKey('custom')
                  setBuildings(defaultBuildings)
                  setConnections(defaultConnections)
                  setPrimStart(defaultBuildings[0]?.id ?? 0)
                  setCheckFrom(defaultBuildings[0]?.id ?? 0)
                  setCheckTo(defaultBuildings[1]?.id ?? 0)
                  setPrimStepIndex(0)
                  setKruskalStepIndex(0)
                  setPrimPlaying(false)
                  setKruskalPlaying(false)
                  setToast('Saved campus data cleared. Refresh to rehydrate the default graph.')
                }}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              >
                Clear saved data
              </button>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                Campus health: {graphConnected ? 'Connected' : 'Disconnected'}
              </div>
              <button type="button" className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
                Live monitoring
              </button>
            </div>          </header>

          {toast && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {toast}
            </div>
          )}

          {nav === 'intro' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/70 p-8 shadow-2xl shadow-cyan-950/30">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Academic Project • DAA</p>
                    <h3 className="mt-4 text-4xl font-bold text-white md:text-5xl">NetOptima</h3>
                    <p className="mt-4 max-w-xl text-lg text-slate-300">
                      Minimum-Cost Network Cable Installation System for campus infrastructure planning using Prim's and Kruskal's algorithms.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" onClick={() => setNav('dashboard')} className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-900/30">
                        Open dashboard
                      </button>
                      <button type="button" onClick={() => setNav('viva')} className="rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100">
                        Prep for viva
                      </button>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Problem statement</p>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      The campus comprises multiple buildings, and the objective is to connect every building through the shortest and cheapest possible network of cables while retaining full connectivity and minimizing installation cost.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {['React', 'TypeScript', 'Tailwind', 'React Flow', 'Recharts', 'Algorithm Design'].map((item) => (
                        <span key={item} className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                  <h4 className="text-lg font-semibold text-cyan-200">Objectives</h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                    <li>Minimize cable installation cost.</li>
                    <li>Ensure complete campus connectivity.</li>
                    <li>Apply graph-theory optimization.</li>
                    <li>Compare algorithmic efficiency.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                  <h4 className="text-lg font-semibold text-violet-200">Real-world relevance</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    This project models real campus and infrastructure planning, where connectivity and budget constraints are critical decision factors for network deployment.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                  <h4 className="text-lg font-semibold text-emerald-200">Core concept</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    The problem is interpreted as a Minimum Spanning Tree problem: connect all buildings using the least total cable cost while avoiding cycles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {nav === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map(({ title, value, subtitle, icon: Icon }) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/40">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-slate-400">{title}</span>
                      <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{value}</div>
                    <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Interactive campus graph</p>
                      <h3 className="text-xl font-semibold text-white">Network topology</h3>
                    </div>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                      {graphConnected ? 'All buildings connected' : 'Disconnected topology'}
                    </span>
                  </div>
                  <div className="h-[420px] w-full rounded-2xl border border-slate-800 bg-slate-950/60">
                    <ReactFlow fitView fitViewOptions={{ padding: 0.2 }} nodes={flowNodes} edges={flowEdges} minZoom={0.3} maxZoom={1.8} className="bg-transparent">
                      <MiniMap pannable zoomable nodeColor={() => '#22d3ee'} />
                      <Controls />
                      <Background gap={18} color="#274562" size={1} />
                    </ReactFlow>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-cyan-300" />
                      <h3 className="text-lg font-semibold text-white">Budget planner</h3>
                    </div>
                    <input
                      type="range"
                      min={100000}
                      max={1000000}
                      step={10000}
                      value={budgetPlan}
                      onChange={(event) => setBudgetPlan(Number(event.target.value))}
                      className="w-full accent-cyan-400"
                    />
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                      <span>Allocated budget</span>
                      <strong>{formatCurrency(budgetPlan)}</strong>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                      <span>Remaining</span>
                      <strong className={budgetRemaining >= 0 ? 'text-emerald-300' : 'text-amber-300'}>
                        {formatCurrency(budgetRemaining)}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-violet-300" />
                      <h3 className="text-lg font-semibold text-white">What-if cost analysis</h3>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={1}
                      value={costSensitivity}
                      onChange={(event) => setCostSensitivity(Number(event.target.value))}
                      className="w-full accent-violet-400"
                    />
                    <div className="mt-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Cost sensitivity</span>
                        <strong>{costSensitivity}%</strong>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-cyan-200">
                        <span>Projected MST cost</span>
                        <strong>{formatCurrency(costProjection)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      <h3 className="text-lg font-semibold text-white">Connectivity checker</h3>
                    </div>
                    <div className="space-y-3">
                      <select
                        value={String(checkFrom)}
                        onChange={(event) => setCheckFrom(Number(event.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      >
                        {buildings.map((building) => (
                          <option key={building.id} value={String(building.id)}>
                            {building.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={String(checkTo)}
                        onChange={(event) => setCheckTo(Number(event.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      >
                        {buildings.map((building) => (
                          <option key={building.id} value={String(building.id)}>
                            {building.name}
                          </option>
                        ))}
                      </select>
                      <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200">
                        {connectivityPath.length > 1 ? (
                          <span>
                            Path: {connectivityPath.join(' → ')}
                          </span>
                        ) : (
                          <span className="text-rose-300">No route available between selected buildings.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-white">Node degree distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#cbd5e1" />
                        <YAxis stroke="#cbd5e1" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.5)', borderRadius: 12 }}
                        />
                        <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-white">Network growth</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { month: 'Jan', value: 12 },
                          { month: 'Feb', value: 18 },
                          { month: 'Mar', value: 22 },
                          { month: 'Apr', value: 31 },
                          { month: 'May', value: 38 },
                          { month: 'Jun', value: 42 },
                        ]}
                      >
                        <defs>
                          <linearGradient id="networkFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#cbd5e1" />
                        <YAxis stroke="#cbd5e1" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 12 }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#a855f7" fill="url(#networkFill)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {nav === 'campus' && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Campus Network</p>
                  <h3 className="text-2xl font-semibold text-white">Optimum cable topology</h3>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
                  {graphConnected ? 'Fully connected' : 'Not fully connected'}
                </div>
              </div>
              <div className="h-[560px] w-full rounded-2xl border border-slate-800 bg-slate-950/60">
                <ReactFlow fitView fitViewOptions={{ padding: 0.2 }} nodes={flowNodes} edges={flowEdges} minZoom={0.45} maxZoom={1.8} className="bg-transparent">
                  <MiniMap pannable zoomable nodeColor={() => '#22d3ee'} />
                  <Controls />
                  <Background gap={18} color="#274562" size={1} />
                </ReactFlow>
              </div>
            </div>
          )}

          {nav === 'buildings' && (
            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Buildings Management</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{editingBuildingId ? 'Edit building' : 'Add building'}</h3>
                <div className="mt-5 space-y-4">
                  <input
                    type="number"
                    placeholder="Building ID"
                    value={buildingForm.id}
                    onChange={(event) => setBuildingForm((current) => ({ ...current, id: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                    readOnly={Boolean(editingBuildingId)}
                  />
                  <input
                    type="text"
                    placeholder="Building name"
                    value={buildingForm.name}
                    onChange={(event) => setBuildingForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="X"
                      value={buildingForm.x}
                      onChange={(event) => setBuildingForm((current) => ({ ...current, x: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                    />
                    <input
                      type="number"
                      placeholder="Y"
                      value={buildingForm.y}
                      onChange={(event) => setBuildingForm((current) => ({ ...current, y: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOrUpdateBuilding}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 font-medium text-white shadow-lg shadow-cyan-900/40"
                  >
                    {editingBuildingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingBuildingId ? 'Update building' : 'Add building'}
                  </button>
                  {editingBuildingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBuildingId(null)
                        setBuildingForm(emptyBuildingForm)
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-200"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Building registry</p>
                    <h3 className="text-xl font-semibold text-white">Current campus buildings</h3>
                  </div>
                  <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
                    {buildings.length} entries
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                    <thead className="bg-slate-950/80 text-slate-300">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Coordinates</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {buildings.map((building) => (
                        <tr key={building.id} className="bg-slate-900/40">
                          <td className="px-4 py-3 font-semibold text-cyan-200">{building.id}</td>
                          <td className="px-4 py-3">{building.name}</td>
                          <td className="px-4 py-3">
                            ({building.x}, {building.y})
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleEditBuilding(building)} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-200">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => handleDeleteBuilding(building.id)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-200">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {nav === 'connections' && (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Connections Management</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{editingConnectionId ? 'Edit connection' : 'Add connection'}</h3>
                <div className="mt-5 space-y-4">
                  <select
                    value={String(connectionForm.from)}
                    onChange={(event) => setConnectionForm((current) => ({ ...current, from: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                  >
                    <option value="">From building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={String(building.id)}>{building.name}</option>
                    ))}
                  </select>
                  <select
                    value={String(connectionForm.to)}
                    onChange={(event) => setConnectionForm((current) => ({ ...current, to: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                  >
                    <option value="">To building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={String(building.id)}>{building.name}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Distance (m)"
                      value={connectionForm.distance}
                      onChange={(event) => setConnectionForm((current) => ({ ...current, distance: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                    />
                    <input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Cost / meter"
                      value={connectionForm.costPerMeter}
                      onChange={(event) => setConnectionForm((current) => ({ ...current, costPerMeter: Number(event.target.value) }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                    />
                  </div>
                  <select
                    value={connectionForm.cableType}
                    onChange={(event) => setConnectionForm((current) => ({ ...current, cableType: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
                  >
                    <option value="Fiber">Fiber</option>
                    <option value="Copper">Copper</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-3 text-sm text-cyan-100">
                    Total cost:{' '}
                    <strong>
                      {formatCurrency(
                        getConnectionCost({
                          id: 'preview',
                          from: Number(connectionForm.from) || 0,
                          to: Number(connectionForm.to) || 0,
                          distance: Number(connectionForm.distance),
                          costPerMeter: Number(connectionForm.costPerMeter),
                          cableType: connectionForm.cableType,
                        }),
                      )}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOrUpdateConnection}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-3 font-medium text-white shadow-lg shadow-violet-900/30"
                  >
                    {editingConnectionId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingConnectionId ? 'Update connection' : 'Add connection'}
                  </button>
                  {editingConnectionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingConnectionId(null)
                        setConnectionForm(emptyConnectionForm)
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-slate-200"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Cable inventory</p>
                    <h3 className="text-xl font-semibold text-white">Link registry</h3>
                  </div>
                  <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">
                    {connections.length} links
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                    <thead className="bg-slate-950/80 text-slate-300">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3">Distance</th>
                        <th className="px-4 py-3">Cost</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {connections.map((connection) => (
                        <tr key={connection.id} className="bg-slate-900/40">
                          <td className="px-4 py-3 font-semibold text-violet-200">{connection.id}</td>
                          <td className="px-4 py-3">
                            {getBuildingName(connection.from, buildings)} → {getBuildingName(connection.to, buildings)}
                          </td>
                          <td className="px-4 py-3">{connection.distance}m</td>
                          <td className="px-4 py-3">{formatCurrency(getConnectionCost(connection))}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleEditConnection(connection)} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-200">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => handleDeleteConnection(connection.id)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-200">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {nav === 'prim' && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Prim's Algorithm</p>
                  <h3 className="text-2xl font-semibold text-white">Minimum spanning tree builder</h3>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={String(primStart)}
                    onChange={(event) => setPrimStart(Number(event.target.value))}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  >
                    {buildings.map((building) => (
                      <option key={building.id} value={String(building.id)}>{building.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setPrimPlaying(true)} className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                    <Play className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setPrimPlaying(false)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                    <Pause className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setPrimStepIndex((current) => Math.min(current + 1, primResult.steps.length - 1))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                    <SkipForward className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => { setPrimPlaying(false); setPrimStepIndex(0) }} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Current cost</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-200">{formatCurrency(currentPrimStep?.total ?? 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Selected edges</p>
                  <p className="mt-2 text-2xl font-bold text-violet-200">{(currentPrimStep?.selectedIds ?? []).length}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Connectivity</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-200">{primResult.connected ? 'Connected' : 'Incomplete'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(primResult.steps.length ? primResult.steps : [{ name: 'No steps', description: 'Add enough connections for a valid graph.', edgeId: null, total: 0, selectedIds: [], acceptedIds: [], rejectedIds: [], type: 'done' }]).map((step, index) => {
                  const active = index === primStepIndex
                  return (
                    <div key={`${step.name}-${index}`} className={`rounded-2xl border p-4 transition-all ${active ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-slate-700 bg-slate-950/60'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{step.name}</p>
                          <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-cyan-200">
                          {formatCurrency(step.total)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {nav === 'kruskal' && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Kruskal's Algorithm</p>
                  <h3 className="text-2xl font-semibold text-white">Disjoint set MST evaluation</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setKruskalPlaying(true)} className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-medium text-white">
                    <Play className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setKruskalPlaying(false)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                    <Pause className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setKruskalStepIndex((current) => Math.min(current + 1, kruskalResult.steps.length - 1))} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                    <SkipForward className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => { setKruskalPlaying(false); setKruskalStepIndex(0) }} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Current cost</p>
                  <p className="mt-2 text-2xl font-bold text-violet-200">{formatCurrency(currentKruskalStep?.total ?? 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Accepted edges</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-200">{(currentKruskalStep?.acceptedIds ?? []).length}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm text-slate-400">Rejected edges</p>
                  <p className="mt-2 text-2xl font-bold text-rose-200">{(currentKruskalStep?.rejectedIds ?? []).length}</p>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">Cycle detection logic</p>
                <p className="mt-2 text-slate-300">
                  Kruskal's algorithm sorts all connections by cost, then chooses the cheapest edge that does not create a cycle. If the endpoints already belong to the same disjoint set, the edge is rejected, otherwise it is accepted and the set is merged.
                </p>
              </div>

              <div className="space-y-3">
                {(kruskalResult.steps.length ? kruskalResult.steps : [{ name: 'No steps', description: 'No edges processed yet.', edgeId: null, total: 0, selectedIds: [], acceptedIds: [], rejectedIds: [], type: 'done' }]).map((step, index) => {
                  const active = index === kruskalStepIndex
                  const tint = step.type === 'accept' ? 'border-emerald-500/40 bg-emerald-500/10' : step.type === 'reject' ? 'border-rose-500/40 bg-rose-500/10' : 'border-slate-700 bg-slate-950/60'
                  return (
                    <div key={`${step.name}-${index}`} className={`rounded-2xl border p-4 transition-all ${active ? tint : 'border-slate-700 bg-slate-950/60'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{step.name}</p>
                          <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-violet-200">
                          {formatCurrency(step.total)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {nav === 'comparison' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-cyan-300" />
                    <h3 className="text-xl font-semibold text-white">Prim's result</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center justify-between"><span>MST cost</span><strong className="text-cyan-200">{formatCurrency(primResult.cost)}</strong></li>
                    <li className="flex items-center justify-between"><span>Edges</span><strong>{primResult.edges.length}</strong></li>
                    <li className="flex items-center justify-between"><span>Connected</span><strong>{primResult.connected ? 'Yes' : 'No'}</strong></li>
                    <li className="flex items-center justify-between"><span>Time complexity</span><strong>O(V²) / O(E log V)</strong></li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-violet-500/20 bg-slate-900/80 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Database className="h-4 w-4 text-violet-300" />
                    <h3 className="text-xl font-semibold text-white">Kruskal's result</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center justify-between"><span>MST cost</span><strong className="text-violet-200">{formatCurrency(kruskalResult.cost)}</strong></li>
                    <li className="flex items-center justify-between"><span>Edges</span><strong>{kruskalResult.edges.length}</strong></li>
                    <li className="flex items-center justify-between"><span>Connected</span><strong>{kruskalResult.connected ? 'Yes' : 'No'}</strong></li>
                    <li className="flex items-center justify-between"><span>Time complexity</span><strong>O(E log E)</strong></li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <h3 className="mb-4 text-xl font-semibold text-white">Comparison summary</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-sm text-slate-400">Same MST cost</p>
                    <p className="mt-2 text-lg font-bold text-emerald-200">{primResult.cost === kruskalResult.cost ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-sm text-slate-400">Selected edges</p>
                    <p className="mt-2 text-lg font-bold text-cyan-200">{primResult.edges.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-sm text-slate-400">Graph status</p>
                    <p className="mt-2 text-lg font-bold text-violet-200">{graphConnected ? 'Connected' : 'Disconnected'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-sm text-slate-400">Total cost</p>
                    <p className="mt-2 text-lg font-bold text-white">{formatCurrency(primResult.cost)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {nav === 'info' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Project Information</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Problem statement and methodology</h3>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <h4 className="text-lg font-semibold text-cyan-200">Problem statement</h4>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      A campus network contains multiple buildings with cable installation requirements between them. The objective is to interconnect all buildings while minimizing the total cable length and installation cost. This is a classic minimum spanning tree problem in graph theory, where the building network is modeled as a weighted undirected graph.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <h4 className="text-lg font-semibold text-violet-200">Objectives</h4>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                      <li>Connect all campus buildings with minimum total cost.</li>
                      <li>Eliminate redundant and expensive cables.</li>
                      <li>Build an efficient and scalable campus infrastructure.</li>
                      <li>Use MST algorithms to generate a low-cost communication backbone.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                  <h4 className="text-lg font-semibold text-cyan-200">Methodology</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Each building is represented as a node and each cable as a weighted edge. The network is converted into a graph, and both Prim's and Kruskal's algorithms are applied to compute the minimum spanning tree while preserving connectivity.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                  <h4 className="text-lg font-semibold text-violet-200">Algorithms used</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Prim's algorithm grows a spanning tree from a selected building by repeatedly adding the cheapest edge that connects the tree to an unvisited node. Kruskal's algorithm sorts all edges by weight and adds the shortest safe edge that does not form a cycle.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                  <h4 className="text-lg font-semibold text-emerald-200">Applications</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    MST solutions are relevant to computer networking, road planning, cable layout, utility distribution, telecommunications design, and infrastructure cost optimization across large facilities and campuses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {nav === 'viva' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300">DAA Viva Preparation</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Important questions, answers, and quick assessment</h3>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-200">{vivaQuestions.length} Q&A entries</span>
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-200">{quizQuestions.length} quiz questions</span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">Score: {quizScore}/{quizQuestions.length}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-white">Interactive quiz</h4>
                  <span className="text-sm text-slate-300">Answered: {answeredQuizCount}/{quizQuestions.length}</span>
                </div>
                <div className="space-y-4">
                  {quizQuestions.map((item, index) => (
                    <div key={item.question} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <p className="font-medium text-cyan-100">{index + 1}. {item.question}</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {item.options.map((option) => (
                          <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                            <input
                              type="radio"
                              name={`quiz-${index}`}
                              value={option}
                              checked={quizAnswers[index] === option}
                              onChange={() => setQuizAnswers((current) => ({ ...current, [index]: option }))}
                              className="accent-cyan-400"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      {quizAnswers[index] && (
                        <p className={`mt-3 text-sm ${quizAnswers[index] === item.answer ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {quizAnswers[index] === item.answer ? 'Correct.' : `Correct answer: ${item.answer}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {vivaQuestions.map((item, index) => (
                  <div key={`${item.question}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                    <h4 className="text-lg font-semibold text-cyan-200">Q{index + 1}. {item.question}</h4>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nav === 'report' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Installation Report</p>
                    <h3 className="text-2xl font-semibold text-white">Selected cable installation package</h3>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={exportCsvReport} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">
                      <Download className="h-4 w-4" /> CSV
                    </button>
                    <button type="button" onClick={exportPdfReport} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white">
                      <FileText className="h-4 w-4" /> PDF
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-400">Selected connections</p>
                    <p className="mt-2 text-2xl font-bold text-white">{mstConnections.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-400">Total cable length</p>
                    <p className="mt-2 text-2xl font-bold text-cyan-200">{totalCableLength} m</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm text-slate-400">Total cost</p>
                    <p className="mt-2 text-2xl font-bold text-violet-200">{formatCurrency(minimumCost)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                    <thead className="bg-slate-950/80 text-slate-300">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">From</th>
                        <th className="px-4 py-3">To</th>
                        <th className="px-4 py-3">Distance</th>
                        <th className="px-4 py-3">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {mstConnections.map((connection) => (
                        <tr key={connection.id} className="bg-slate-900/40">
                          <td className="px-4 py-3 font-semibold text-cyan-200">{connection.id}</td>
                          <td className="px-4 py-3">{getBuildingName(connection.from, buildings)}</td>
                          <td className="px-4 py-3">{getBuildingName(connection.to, buildings)}</td>
                          <td className="px-4 py-3">{connection.distance} m</td>
                          <td className="px-4 py-3">{formatCurrency(getConnectionCost(connection))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
