import type { ShippingMethod, CityRecord, ShippingZone } from '../types';

export const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'zone-local',
    name: 'Zona Local (Bogotá & Cundinamarca)',
    description: 'Tarifas preferenciales para envíos locales y Sabana de Bogotá.',
    departments: ['Bogotá D.C.', 'Cundinamarca'],
    active: true
  },
  {
    id: 'zone-principal',
    name: 'Zona Departamentos Principales',
    description: 'Ciudades y departamentos principales de Colombia (Antioquia, Valle, Atlántico, Santander, etc.).',
    departments: [
      'Antioquia', 'Valle del Cauca', 'Atlántico', 'Santander', 'Bolívar', 
      'Risaralda', 'Caldas', 'Quindío', 'Tolima', 'Huila', 'Meta', 'Norte de Santander'
    ],
    active: true
  },
  {
    id: 'zone-nacional',
    name: 'Zona Especial / Resto del País',
    description: 'Cobertura nacional para el resto de departamentos y zonas reingresadas.',
    departments: [], // Vaciado = Cobertura general nacional
    active: true
  }
];

export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'sm-servientrega-std',
    name: 'Envío Nacional Estándar',
    carrier: 'Servientrega',
    description: 'Despacho seguro a nivel nacional con número de guía rastreable en tiempo real.',
    price: 15000,
    estimatedDays: 3,
    dispatchDays: ['1', '2', '3', '4', '5'],
    freeShippingThreshold: 250000,
    active: true,
    zoneRates: [
      { zoneId: 'zone-local', price: 10000 },
      { zoneId: 'zone-principal', price: 15000 },
      { zoneId: 'zone-nacional', price: 22000 }
    ]
  },
  {
    id: 'sm-inter-express',
    name: 'Envío Exprés Prioritario',
    carrier: 'Inter Rapidísimo',
    description: 'Despacho prioritario 24-48 horas vía Inter Rapidísimo con notificación SMS.',
    price: 24000,
    estimatedDays: 1,
    dispatchDays: ['1', '2', '3', '4', '5', '6'],
    freeShippingThreshold: undefined,
    active: true,
    zoneRates: [
      { zoneId: 'zone-local', price: 16000 },
      { zoneId: 'zone-principal', price: 24000 },
      { zoneId: 'zone-nacional', price: 32000 }
    ]
  },
  {
    id: 'sm-pickup-store',
    name: 'Retiro en Tienda Principal',
    carrier: 'Retiro en tienda',
    description: 'Recoge tu pedido sin costo de flete en nuestra sede central (Av. Caracas #45-12, Bogotá D.C.).',
    price: 0,
    estimatedDays: 0,
    dispatchDays: ['1', '2', '3', '4', '5', '6'],
    freeShippingThreshold: undefined,
    active: true,
    zoneRates: [
      { zoneId: 'zone-local', price: 0 },
      { zoneId: 'zone-principal', price: 0 },
      { zoneId: 'zone-nacional', price: 0 }
    ]
  }
];

export const COLOMBIAN_DEPARTMENTS = [
  'Bogotá D.C.',
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada'
];

export const TOP_COLOMBIAN_CITIES = [
  'Bogotá D.C.',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Bucaramanga',
  'Pereira'
];

export const AVAILABLE_COUNTRIES = [
  'Colombia'
];

export const DEFAULT_COLOMBIAN_CITIES: CityRecord[] = [
  // 1. Bogotá D.C. & Cundinamarca
  { id: 'city-1', country: 'Colombia', department: 'Bogotá D.C.', city: 'Bogotá D.C.', active: true, code: '11001' },
  { id: 'city-2', country: 'Colombia', department: 'Cundinamarca', city: 'Soacha', active: true, code: '25754' },
  { id: 'city-3', country: 'Colombia', department: 'Cundinamarca', city: 'Chía', active: true, code: '250001' },
  { id: 'city-4', country: 'Colombia', department: 'Cundinamarca', city: 'Zipaquirá', active: true, code: '250252' },
  { id: 'city-5', country: 'Colombia', department: 'Cundinamarca', city: 'Fusagasugá', active: true, code: '252001' },
  { id: 'city-6', country: 'Colombia', department: 'Cundinamarca', city: 'Facatativá', active: true, code: '253001' },
  { id: 'city-7', country: 'Colombia', department: 'Cundinamarca', city: 'Girardot', active: true, code: '252431' },
  { id: 'city-8', country: 'Colombia', department: 'Cundinamarca', city: 'Mosquera', active: true, code: '250040' },
  { id: 'city-9', country: 'Colombia', department: 'Cundinamarca', city: 'Funza', active: true, code: '250020' },
  { id: 'city-10', country: 'Colombia', department: 'Cundinamarca', city: 'Madrid', active: true, code: '250030' },

  // 2. Antioquia
  { id: 'city-11', country: 'Colombia', department: 'Antioquia', city: 'Medellín', active: true, code: '05001' },
  { id: 'city-12', country: 'Colombia', department: 'Antioquia', city: 'Envigado', active: true, code: '055420' },
  { id: 'city-13', country: 'Colombia', department: 'Antioquia', city: 'Itagüí', active: true, code: '055410' },
  { id: 'city-14', country: 'Colombia', department: 'Antioquia', city: 'Bello', active: true, code: '051050' },
  { id: 'city-15', country: 'Colombia', department: 'Antioquia', city: 'Rionegro', active: true, code: '054040' },
  { id: 'city-16', country: 'Colombia', department: 'Antioquia', city: 'Sabaneta', active: true, code: '055450' },
  { id: 'city-17', country: 'Colombia', department: 'Antioquia', city: 'Apartadó', active: true, code: '057050' },
  { id: 'city-18', country: 'Colombia', department: 'Antioquia', city: 'Caucasia', active: true, code: '052010' },
  { id: 'city-19', country: 'Colombia', department: 'Antioquia', city: 'Caldas', active: true, code: '055440' },
  { id: 'city-20', country: 'Colombia', department: 'Antioquia', city: 'La Estrella', active: true, code: '055460' },

  // 3. Valle del Cauca
  { id: 'city-21', country: 'Colombia', department: 'Valle del Cauca', city: 'Cali', active: true, code: '76001' },
  { id: 'city-22', country: 'Colombia', department: 'Valle del Cauca', city: 'Palmira', active: true, code: '763533' },
  { id: 'city-23', country: 'Colombia', department: 'Valle del Cauca', city: 'Buenaventura', active: true, code: '761001' },
  { id: 'city-24', country: 'Colombia', department: 'Valle del Cauca', city: 'Tuluá', active: true, code: '763022' },
  { id: 'city-25', country: 'Colombia', department: 'Valle del Cauca', city: 'Buga', active: true, code: '763041' },
  { id: 'city-26', country: 'Colombia', department: 'Valle del Cauca', city: 'Cartago', active: true, code: '762021' },
  { id: 'city-27', country: 'Colombia', department: 'Valle del Cauca', city: 'Jamundí', active: true, code: '763540' },
  { id: 'city-28', country: 'Colombia', department: 'Valle del Cauca', city: 'Yumbo', active: true, code: '763550' },

  // 4. Atlántico
  { id: 'city-29', country: 'Colombia', department: 'Atlántico', city: 'Barranquilla', active: true, code: '08001' },
  { id: 'city-30', country: 'Colombia', department: 'Atlántico', city: 'Soledad', active: true, code: '082001' },
  { id: 'city-31', country: 'Colombia', department: 'Atlántico', city: 'Malambo', active: true, code: '082010' },
  { id: 'city-32', country: 'Colombia', department: 'Atlántico', city: 'Baranoa', active: true, code: '081001' },
  { id: 'city-33', country: 'Colombia', department: 'Atlántico', city: 'Sabanagrande', active: true, code: '082020' },

  // 5. Santander
  { id: 'city-34', country: 'Colombia', department: 'Santander', city: 'Bucaramanga', active: true, code: '68001' },
  { id: 'city-35', country: 'Colombia', department: 'Santander', city: 'Floridablanca', active: true, code: '681001' },
  { id: 'city-36', country: 'Colombia', department: 'Santander', city: 'Girón', active: true, code: '687541' },
  { id: 'city-37', country: 'Colombia', department: 'Santander', city: 'Piedecuesta', active: true, code: '681011' },
  { id: 'city-38', country: 'Colombia', department: 'Santander', city: 'Barrancabermeja', active: true, code: '687031' },
  { id: 'city-39', country: 'Colombia', department: 'Santander', city: 'San Gil', active: true, code: '684031' },

  // 6. Bolívar
  { id: 'city-40', country: 'Colombia', department: 'Bolívar', city: 'Cartagena', active: true, code: '13001' },
  { id: 'city-41', country: 'Colombia', department: 'Bolívar', city: 'Magangué', active: true, code: '134100' },
  { id: 'city-42', country: 'Colombia', department: 'Bolívar', city: 'Turbaco', active: true, code: '131001' },
  { id: 'city-43', country: 'Colombia', department: 'Bolívar', city: 'Arjona', active: true, code: '131010' },

  // 7. Eje Cafetero (Risaralda, Caldas, Quindío)
  { id: 'city-44', country: 'Colombia', department: 'Risaralda', city: 'Pereira', active: true, code: '66001' },
  { id: 'city-45', country: 'Colombia', department: 'Risaralda', city: 'Dosquebradas', active: true, code: '661001' },
  { id: 'city-46', country: 'Colombia', department: 'Risaralda', city: 'Santa Rosa de Cabal', active: true, code: '661020' },
  { id: 'city-47', country: 'Colombia', department: 'Caldas', city: 'Manizales', active: true, code: '17001' },
  { id: 'city-48', country: 'Colombia', department: 'Caldas', city: 'Villamaría', active: true, code: '170020' },
  { id: 'city-49', country: 'Colombia', department: 'Caldas', city: 'La Dorada', active: true, code: '175001' },
  { id: 'city-50', country: 'Colombia', department: 'Quindío', city: 'Armenia', active: true, code: '63001' },
  { id: 'city-51', country: 'Colombia', department: 'Quindío', city: 'Calarcá', active: true, code: '631001' },
  { id: 'city-52', country: 'Colombia', department: 'Quindío', city: 'Montenegro', active: true, code: '631020' },

  // 8. Norte de Santander & Tolima
  { id: 'city-53', country: 'Colombia', department: 'Norte de Santander', city: 'Cúcuta', active: true, code: '54001' },
  { id: 'city-54', country: 'Colombia', department: 'Norte de Santander', city: 'Ocaña', active: true, code: '546001' },
  { id: 'city-55', country: 'Colombia', department: 'Norte de Santander', city: 'Villa del Rosario', active: true, code: '541001' },
  { id: 'city-56', country: 'Colombia', department: 'Norte de Santander', city: 'Los Patios', active: true, code: '541010' },
  { id: 'city-57', country: 'Colombia', department: 'Tolima', city: 'Ibagué', active: true, code: '73001' },
  { id: 'city-58', country: 'Colombia', department: 'Tolima', city: 'Espinal', active: true, code: '733001' },
  { id: 'city-59', country: 'Colombia', department: 'Tolima', city: 'Melgar', active: true, code: '734001' },

  // 9. Sur de Colombia (Nariño, Huila, Cauca)
  { id: 'city-60', country: 'Colombia', department: 'Nariño', city: 'Pasto', active: true, code: '52001' },
  { id: 'city-61', country: 'Colombia', department: 'Nariño', city: 'Ipiales', active: true, code: '524061' },
  { id: 'city-62', country: 'Colombia', department: 'Nariño', city: 'Tumaco', active: true, code: '527001' },
  { id: 'city-63', country: 'Colombia', department: 'Huila', city: 'Neiva', active: true, code: '41001' },
  { id: 'city-64', country: 'Colombia', department: 'Huila', city: 'Pitalito', active: true, code: '417001' },
  { id: 'city-65', country: 'Colombia', department: 'Huila', city: 'Garzón', active: true, code: '414001' },
  { id: 'city-66', country: 'Colombia', department: 'Cauca', city: 'Popayán', active: true, code: '19001' },
  { id: 'city-67', country: 'Colombia', department: 'Cauca', city: 'Santander de Quilichao', active: true, code: '197001' },

  // 10. Caribe & Orinoquía (Magdalena, Meta, Córdoba, Cesar, Sucre, La Guajira, Casanare)
  { id: 'city-68', country: 'Colombia', department: 'Magdalena', city: 'Santa Marta', active: true, code: '47001' },
  { id: 'city-69', country: 'Colombia', department: 'Magdalena', city: 'Ciénaga', active: true, code: '471001' },
  { id: 'city-70', country: 'Colombia', department: 'Meta', city: 'Villavicencio', active: true, code: '50001' },
  { id: 'city-71', country: 'Colombia', department: 'Meta', city: 'Acacías', active: true, code: '501001' },
  { id: 'city-72', country: 'Colombia', department: 'Meta', city: 'Granada', active: true, code: '504001' },
  { id: 'city-73', country: 'Colombia', department: 'Córdoba', city: 'Montería', active: true, code: '23001' },
  { id: 'city-74', country: 'Colombia', department: 'Córdoba', city: 'Cereté', active: true, code: '231001' },
  { id: 'city-75', country: 'Colombia', department: 'Córdoba', city: 'Lorica', active: true, code: '234001' },
  { id: 'city-76', country: 'Colombia', department: 'Cesar', city: 'Valledupar', active: true, code: '20001' },
  { id: 'city-77', country: 'Colombia', department: 'Cesar', city: 'Aguachica', active: true, code: '201001' },
  { id: 'city-78', country: 'Colombia', department: 'Sucre', city: 'Sincelejo', active: true, code: '70001' },
  { id: 'city-79', country: 'Colombia', department: 'Sucre', city: 'Corozal', active: true, code: '701001' },
  { id: 'city-80', country: 'Colombia', department: 'La Guajira', city: 'Riohacha', active: true, code: '44001' },
  { id: 'city-81', country: 'Colombia', department: 'La Guajira', city: 'Maicao', active: true, code: '444001' },
  { id: 'city-82', country: 'Colombia', department: 'Casanare', city: 'Yopal', active: true, code: '85001' },
  { id: 'city-83', country: 'Colombia', department: 'Casanare', city: 'Aguazul', active: true, code: '851001' },

  // 11. Boyacá, Caquetá, Chocó, Insular y Territorios
  { id: 'city-84', country: 'Colombia', department: 'Boyacá', city: 'Tunja', active: true, code: '15001' },
  { id: 'city-85', country: 'Colombia', department: 'Boyacá', city: 'Duitama', active: true, code: '15040' },
  { id: 'city-86', country: 'Colombia', department: 'Boyacá', city: 'Sogamoso', active: true, code: '15220' },
  { id: 'city-87', country: 'Colombia', department: 'Boyacá', city: 'Chiquinquirá', active: true, code: '154001' },
  { id: 'city-88', country: 'Colombia', department: 'Caquetá', city: 'Florencia', active: true, code: '18001' },
  { id: 'city-89', country: 'Colombia', department: 'Chocó', city: 'Quibdó', active: true, code: '27001' },
  { id: 'city-90', country: 'Colombia', department: 'San Andrés y Providencia', city: 'San Andrés', active: true, code: '88001' },
  { id: 'city-91', country: 'Colombia', department: 'Amazonas', city: 'Leticia', active: true, code: '91001' },
  { id: 'city-92', country: 'Colombia', department: 'Arauca', city: 'Arauca', active: true, code: '81001' },
  { id: 'city-93', country: 'Colombia', department: 'Guainía', city: 'Inírida', active: true, code: '94001' },
  { id: 'city-94', country: 'Colombia', department: 'Guaviare', city: 'San José del Guaviare', active: true, code: '95001' },
  { id: 'city-95', country: 'Colombia', department: 'Putumayo', city: 'Mocoa', active: true, code: '86001' },
  { id: 'city-96', country: 'Colombia', department: 'Putumayo', city: 'Puerto Asís', active: true, code: '862001' },
  { id: 'city-97', country: 'Colombia', department: 'Vaupés', city: 'Mitú', active: true, code: '97001' },
  { id: 'city-98', country: 'Colombia', department: 'Vichada', city: 'Puerto Carreño', active: true, code: '99001' }
];
