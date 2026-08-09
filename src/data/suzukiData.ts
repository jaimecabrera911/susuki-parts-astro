import type { SuzukiModel, SuzukiPart, ExplodedDiagram, VinLookupResult } from '../types';
import { MOTORCYCLE_SVGS, PARTS_SVGS, DIAGRAM_SVGS } from './svgAssets';

export const SUZUKI_MODELS: SuzukiModel[] = [
  {
    id: 'gixxer-150-fi',
    name: 'Gixxer 150 FI',
    category: 'Naked / Sport',
    image: '/motorcycles/gixxer-150-fi.png',
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['Standard (Carburador)', 'FI (Inyección Electrónica)', 'FI ABS (Disco Doble)']
  },
  {
    id: 'gixxer-250',
    name: 'Gixxer SF 250',
    category: 'Sport / Fairing',
    image: '/motorcycles/gixxer-250.png',
    years: [2020, 2021, 2022, 2023, 2024],
    versions: ['Naked ABS', 'SF Fairing ABS', 'MotoGP Edition']
  },
  {
    id: 'gsx-r1000',
    name: 'GSX-R1000',
    category: 'Superbike',
    image: '/motorcycles/gsx-r1000.png',
    years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['Standard ABS', 'GSX-R1000R Spec', '100th Anniversary Edition']
  },
  {
    id: 'vstrom-650',
    name: 'V-Strom 650',
    category: 'Adventure / Tourer',
    image: '/motorcycles/vstrom-650.png',
    years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['DL650 Standard', 'DL650 XT Spoke Wheels', 'Touring Edition']
  },
  {
    id: 'dr-650',
    name: 'DR 650 SE',
    category: 'Dual Sport / Enduro',
    image: '/motorcycles/dr-650.png',
    years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['Dual Sport Standard', 'Adventure Spec']
  },
  {
    id: 'gn-125',
    name: 'GN 125',
    category: 'Custom / Commuter',
    image: '/motorcycles/gn-125.png',
    years: [2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024],
    versions: ['GN 125H', 'GN 125F Alloy']
  }
];

export const SUZUKI_PARTS: SuzukiPart[] = [
  {
    id: 'part-01',
    oemNumbers: ['13780-06G00', '13780-06G00-000', '13780-06G10'],
    name: 'Filtro de Aire Elemento Seco OEM',
    category: 'filtros',
    price: 154000,
    stock: 14,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-01.jpg',
    availability: 'in_stock',
    description: 'Elemento filtrante sintético impregnado de viscosidad industrial. Mantiene el caudal nominal del cuerpo de aceleración y evita la contaminación por sílice.',
    specs: [
      { label: 'Dimensiones', value: '185mm x 140mm x 32mm' },
      { label: 'Material', value: 'Celulosa micrométrica plisada' },
      { label: 'Eficiencia de Filtrado', value: '99.4% @ 5 micras' },
      { label: 'Origen', value: 'Made in Japan (Hamamatsu)' }
    ],
    compatibility: [
      { modelId: 'vstrom-650', yearStart: 2017, yearEnd: 2024, version: 'DL650 XT Spoke Wheels', note: 'Reemplazo directo cada 18.000 km' },
      { modelId: 'vstrom-650', yearStart: 2015, yearEnd: 2024, version: 'DL650 Standard' }
    ],
    schematicId: 'diag-vstrom-intake',
    diagramHotspot: { x: 38, y: 45, itemNumber: 1 }
  },
  {
    id: 'part-02',
    oemNumbers: ['16510-05240', '16510-05240-000', '16510-06B00'],
    name: 'Filtro de Aceite Genuino Cartucho Magnético',
    category: 'filtros',
    price: 52000,
    stock: 45,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-02.jpg',
    availability: 'in_stock',
    description: 'Filtro de aceite metálico centrifugado Suzuki Genuine Parts. Diseñado para motores mono y bicilíndricos de alta velocidad de rotación.',
    specs: [
      { label: 'Rosca', value: 'M20 x 1.5mm' },
      { label: 'Válvula By-Pass', value: 'Calibrada a 1.0 bar' },
      { label: 'Presión Máxima', value: '12 BAR' },
      { label: 'Certificación OEM', value: 'JASO MA2 / API SN' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2018, yearEnd: 2024 },
      { modelId: 'gixxer-250', yearStart: 2020, yearEnd: 2024 },
      { modelId: 'vstrom-650', yearStart: 2015, yearEnd: 2024 },
      { modelId: 'gn-125', yearStart: 2010, yearEnd: 2024 }
    ],
    schematicId: 'diag-gixxer-engine',
    diagramHotspot: { x: 64, y: 76, itemNumber: 4 }
  },
  {
    id: 'part-03',
    oemNumbers: ['59300-33820', '59300-33820-000', '59300-33820-999'],
    name: 'Pastillas de Freno Sinterizadas Delanteras Tokico OEM',
    category: 'frenos',
    price: 256000,
    stock: 0,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-03.jpg',
    availability: 'international',
    description: 'Pastillas de compuesto sinterizado cerámico-metálico Tokico para mordazas monobloque. Respuesta inmediata de frenado y retención térmica hasta 650°C.',
    specs: [
      { label: 'Compuesto', value: 'Metal Sinterizado Cobre-Carbón' },
      { label: 'Coeficiente Fricción', value: '0.55 HH' },
      { label: 'Espesor Total', value: '8.5mm' },
      { label: 'Soporte ABS', value: '100% Calibrado para sensor ABS' }
    ],
    compatibility: [
      { modelId: 'gsx-r1000', yearStart: 2017, yearEnd: 2024, version: 'GSX-R1000R Spec' },
      { modelId: 'gsx-r1000', yearStart: 2017, yearEnd: 2024, version: 'Standard ABS' }
    ],
    schematicId: 'diag-gsxr-brake',
    diagramHotspot: { x: 48, y: 58, itemNumber: 2 }
  },
  {
    id: 'part-04',
    oemNumbers: ['27511-24B00', '27511-24B00-000', '27511-24B00-999', '27511-24B20'],
    name: 'Kit de Arrastre Sprocket & Piñón Paso 520 HD',
    category: 'transmision',
    price: 460000,
    stock: 6,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-04.jpg',
    availability: 'in_stock',
    description: 'Corona de acero S45C tratada térmicamente e inducción superficial. Piñón de ataque con silentblock antivibración original.',
    specs: [
      { label: 'Relación Dientes', value: '45T Corona / 15T Piñón' },
      { label: 'Paso Cadena', value: '520 O-Ring Sealed' },
      { label: 'Dureza Superficial', value: '58-62 HRC' },
      { label: 'Durabilidad Estimada', value: '25.000 km' }
    ],
    compatibility: [
      { modelId: 'gixxer-250', yearStart: 2020, yearEnd: 2024, version: 'SF Fairing ABS' },
      { modelId: 'gixxer-250', yearStart: 2020, yearEnd: 2024, version: 'Naked ABS' }
    ],
    schematicId: 'diag-transmission',
    diagramHotspot: { x: 22, y: 55, itemNumber: 3 }
  },
  {
    id: 'part-05',
    oemNumbers: ['15100-33E00', '15100-33E00-000', '15100-33E00-999'],
    name: 'Bomba de Combustible de Alta Presión EFI 3.5 BAR',
    category: 'motor',
    price: 756000,
    stock: 0,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-05.jpg',
    availability: 'on_order',
    description: 'Módulo sumergible completo de inyección con regulador de presión interno, malla filtrante lavable y sensor de nivel inductivo.',
    specs: [
      { label: 'Presión Operativa', value: '3.5 BAR constante' },
      { label: 'Caudal Nominal', value: '95 L/h @ 12V' },
      { label: 'Conector', value: '4 Pines Sellado IP67' },
      { label: 'Ajuste Inyector', value: 'Cuerpo Denso / Keihin' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2019, yearEnd: 2024, version: 'FI (Inyección Electrónica)', note: 'No compatible con versión carburada 2018' },
      { modelId: 'gixxer-150-fi', yearStart: 2020, yearEnd: 2024, version: 'FI ABS (Disco Doble)' }
    ],
    schematicId: 'diag-gixxer-engine',
    diagramHotspot: { x: 44, y: 34, itemNumber: 2 }
  },
  {
    id: 'part-06',
    oemNumbers: ['09482-00406', '09482-00406-000', '9478-00406'],
    name: 'Bujía de Iridium NGK CPR8EA-9 Suzuki Spec',
    category: 'electrico',
    price: 74000,
    stock: 32,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-06.jpg',
    availability: 'in_stock',
    description: 'Bujía de encendido con electrodo central ultra-fino de iridio. Optimiza la inflamabilidad del aire/combustible y reduce el consumo en ralentí.',
    specs: [
      { label: 'Grado Térmico', value: '8 NGK' },
      { label: 'Calibración Electrodo', value: '0.8mm - 0.9mm' },
      { label: 'Diámetro Rosca', value: '10mm (Llave 16mm)' },
      { label: 'Resistencia Integrada', value: '5 kOhm RFI Shield' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2018, yearEnd: 2024 },
      { modelId: 'gixxer-250', yearStart: 2020, yearEnd: 2024 },
      { modelId: 'dr-650', yearStart: 2012, yearEnd: 2024 }
    ],
    schematicId: 'diag-gixxer-engine',
    diagramHotspot: { x: 50, y: 22, itemNumber: 1 }
  },
  {
    id: 'part-07',
    oemNumbers: ['31800-21E20', '31800-21E20-000', '31800-21E20-999'],
    name: 'Relé Solenoide de Arranque con Fusible de 30A',
    category: 'electrico',
    price: 168000,
    stock: 0,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-07.jpg',
    availability: 'international',
    description: 'Relé electromagnético reforzado para motor de arranque. Incluye portafusible principal con cubierta de goma estanca a prueba de intemperie.',
    specs: [
      { label: 'Capacidad Amperaje', value: '150A Pico / 30A Continuo' },
      { label: 'Voltaje Bobina', value: '12V DC' },
      { label: 'Resistencia al Agua', value: 'IP68 Sumergible' }
    ],
    compatibility: [
      { modelId: 'vstrom-650', yearStart: 2015, yearEnd: 2024 },
      { modelId: 'dr-650', yearStart: 2012, yearEnd: 2024 },
      { modelId: 'gn-125', yearStart: 2010, yearEnd: 2024 }
    ],
    schematicId: 'diag-vstrom-intake',
    diagramHotspot: { x: 70, y: 30, itemNumber: 2 }
  },
  {
    id: 'part-08',
    oemNumbers: ['12111-38A00', '12111-38A00-000', '12111-38A10', '12111-38A20'],
    name: 'Kit Pistón Estándar 62.0mm con Anillos RIK OEM',
    category: 'motor',
    price: 376000,
    stock: 5,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-08.jpg',
    availability: 'in_stock',
    description: 'Pistón forjado en aleación de aluminio hiper-eutéctico. Incluye bulón cementado, circlips de retención y juego de anillos cromados RIK Japan.',
    specs: [
      { label: 'Diámetro Nominal', value: '62.00mm STD' },
      { label: 'Diámetro Bulón', value: '15mm' },
      { label: 'Tratamiento Falda', value: 'Recubrimiento de Disulfuro de Molibdeno' },
      { label: 'Relación de Compresión', value: '9.8:1' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2018, yearEnd: 2024, version: 'Standard (Carburador)' },
      { modelId: 'gixxer-150-fi', yearStart: 2019, yearEnd: 2024, version: 'FI (Inyección Electrónica)' }
    ],
    schematicId: 'diag-gixxer-engine',
    diagramHotspot: { x: 52, y: 50, itemNumber: 3 }
  },
  {
    id: 'part-09',
    oemNumbers: ['13400-27G10', '13400-27G10-000', '13400-27G10-999'],
    name: 'Cuerpo de Aceleración Electrónico EFI Throttle Body 32mm',
    category: 'motor',
    price: 920000,
    stock: 0,
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-09.jpg',
    availability: 'international',
    description: 'Cuerpo de aceleración electrónico original Suzuki con sensor TPS (Throttle Position Sensor) integrado y válvula de mariposa servo-asistida. Suministro internacional desde el centro de distribución de Suzuki en India.',
    specs: [
      { label: 'Diámetro Bore', value: '32mm' },
      { label: 'Sensor Integrado', value: 'TPS 0-5V Lineal' },
      { label: 'Voltaje de Operación', value: '12V DC' },
      { label: 'Conector', value: '6 pines sellado IP67' },
      { label: 'Origen', value: 'Suzuki India · Genuine OEM' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2019, yearEnd: 2024, version: 'FI (Inyección Electrónica)' }
    ]
  },
  {
    id: 'part-10',
    name: 'Radiador de Refrigeración con Termostato',
    description: 'Conjunto de radiador de aluminio con ventilador termo-activado, termostato de 80°C y tapa de presión de 1.1 bar. Esencial para mantener la temperatura óptima del motor monocilíndrico.',
    price: 320000,
    stock: 8,
    category: 'motor',
    oemNumbers: ['17710-14G00', '17710-14G00-000'],
    schematicId: 'diag-gixxer-cooling',
    diagramHotspot: { itemNumber: 1, x: 38, y: 42 },
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-10.jpg',
    specs: [
      { label: 'Material', value: 'Aluminio soldado TIG' },
      { label: 'Capacidad', value: '0.95 L refrigerante' },
      { label: 'Apertura termostato', value: '80°C ± 2°C' },
      { label: 'Origen', value: 'Suzuki Genuine OEM' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2018, yearEnd: 2024 }
    ]
  },
  {
    id: 'part-11',
    name: 'Múltiple de Escape Acero Inoxidable',
    description: 'Header de escape en acero inoxidable 304 con colector tri-axial. Conexión slip-fit al silenciador original. Incluye junta de grafito y tornillería de montaje.',
    price: 285000,
    stock: 5,
    category: 'motor',
    oemNumbers: ['14181-35F00', '14181-35F10'],
    schematicId: 'diag-gixxer-exhaust',
    diagramHotspot: { itemNumber: 2, x: 56, y: 38 },
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-10.jpg',
    specs: [
      { label: 'Material', value: 'SS304 pulido espejo' },
      { label: 'Diámetro', value: '32mm entrada / 45mm salida' },
      { label: 'Sensor lambda', value: 'M18 x 1.5' },
      { label: 'Origen', value: 'Suzuki Genuine OEM' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2018, yearEnd: 2024 }
    ]
  },
  {
    id: 'part-12',
    name: 'Pinza de Freno Delantero 4 Pistones',
    description: 'Pinza radial monobloque de aluminio forjado con 4 pistones opuestos. Compatible con disco de 310mm. Sellos de pistón resistentes a DOT-5.1.',
    price: 890000,
    stock: 3,
    category: 'frenos',
    oemNumbers: ['59100-31850', '59100-31851'],
    schematicId: 'diag-gsxr-brake',
    diagramHotspot: { itemNumber: 1, x: 28, y: 50 },
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-10.jpg',
    specs: [
      { label: 'Configuración', value: '4 pistones opuestos' },
      { label: 'Material', value: 'Aluminio forjado 2014-T6' },
      { label: 'Peso', value: '720 g' },
      { label: 'Origen', value: 'Tokico · OEM Suzuki' }
    ],
    compatibility: [
      { modelId: 'gsxr-1000', yearStart: 2017, yearEnd: 2024 }
    ]
  },
  {
    id: 'part-13',
    name: 'Slider de Chasis Protector (Par)',
    description: 'Protectores de chasis deslizantes con inserto de teflón reemplazable. Absorben impacto en caída protegiendo el frame, el carenado y el motor.',
    price: 165000,
    stock: 12,
    category: 'motor',
    oemNumbers: ['99182-31J00', '99182-31J00-000'],
    schematicId: 'diag-vstrom-frame',
    diagramHotspot: { itemNumber: 1, x: 50, y: 60 },
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-10.jpg',
    specs: [
      { label: 'Material', value: 'Nylon PA66 + Teflón' },
      { label: 'Inserto', value: 'Reemplazable' },
      { label: 'Diámetro', value: '25mm' },
      { label: 'Origen', value: 'Suzuki Genuine OEM' }
    ],
    compatibility: [
      { modelId: 'vstrom-650', yearStart: 2015, yearEnd: 2024 }
    ]
  },
  {
    id: 'part-14',
    name: 'Pedal de Cambios Reforzado con Punta Plegable',
    description: 'Palanca de cambios mecanizada en aluminio 6061-T6 con punta plegable de polímero. Mayor leverage y mejor feel al reducir el recorrido.',
    price: 95000,
    stock: 18,
    category: 'motor',
    oemNumbers: ['25600-14G01', '25610-14G01'],
    schematicId: 'diag-gixxer-foot-control',
    diagramHotspot: { itemNumber: 3, x: 42, y: 70 },
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-10.jpg',
    specs: [
      { label: 'Material', value: 'Aluminio 6061-T6 anodizado' },
      { label: 'Punta', value: 'Polímero plegable' },
      { label: 'Recorrido', value: 'Reducido 15% vs OEM' },
      { label: 'Origen', value: 'Suzuki Genuine OEM' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2018, yearEnd: 2024 }
    ]
  },
  {
    id: 'part-15',
    name: 'Tacómetro Digital Multifunción',
    description: 'Cluster de instrumentos LCD con tacómetro analógico-digital, odómetro, trip, indicador de marcha y nivel de combustible. Calibrado al protocolo CAN-bus OEM.',
    price: 540000,
    stock: 4,
    category: 'electrico',
    oemNumbers: ['34100-14G20', '34100-14G20-000'],
    schematicId: 'diag-gixxer-dash',
    diagramHotspot: { itemNumber: 2, x: 50, y: 40 },
    image: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/parts/part-10.jpg',
    specs: [
      { label: 'Display', value: 'LCD con retroiluminación LED' },
      { label: 'Funciones', value: 'Taco, Odo, Trip, Marcha, Fuel' },
      { label: 'Conector', value: '6 pines sellado IP67' },
      { label: 'Origen', value: 'Suzuki Genuine OEM' }
    ],
    compatibility: [
      { modelId: 'gixxer-150-fi', yearStart: 2020, yearEnd: 2024 }
    ]
  }
];

export const EXPLODED_DIAGRAMS: ExplodedDiagram[] = [
  {
    id: 'diag-gixxer-engine',
    title: 'Despiece Bloque Motor & Inyección Electrónica',
    category: 'Motor & Admisión',
    section: 'Engine',
    applicableModelIds: ['gixxer-150-fi'],
    modelTarget: 'Gixxer 150 FI (2018-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-gixxer-engine.jpg',
    description: 'Diagrama técnico exploded-view del conjunto de culata, pistón, inyector de combustible Denso y módulo de filtrado de aceite.',
    hotspots: [
      { partId: 'part-06', itemNumber: 1, x: 50, y: 22, label: 'Bujía Iridium NGK CPR8EA-9' },
      { partId: 'part-05', itemNumber: 2, x: 44, y: 34, label: 'Bomba / Inyector Alta Presión' },
      { partId: 'part-08', itemNumber: 3, x: 52, y: 50, label: 'Kit Pistón STD 62mm & Anillos' },
      { partId: 'part-02', itemNumber: 4, x: 64, y: 76, label: 'Filtro de Aceite Cartucho Magnético' }
    ]
  },
  {
    id: 'diag-vstrom-intake',
    title: 'Diagrama de Admisión y Filtrado de Aire',
    category: 'Sistema de Aire',
    section: 'Air & Fuel',
    applicableModelIds: ['vstrom-650'],
    modelTarget: 'V-Strom 650 (2015-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-vstrom-intake.jpg',
    description: 'Caja de filtro de aire secundario, toberas de resonancia y sensores de presión MAP/IAT.',
    hotspots: [
      { partId: 'part-01', itemNumber: 1, x: 38, y: 45, label: 'Filtro de Aire Elemento Seco OEM 13780-06G00' },
      { partId: 'part-07', itemNumber: 2, x: 70, y: 30, label: 'Relé Estanco de Arranque' }
    ]
  },
  {
    id: 'diag-transmission',
    title: 'Kit de Arrastre & Transmisión Final',
    category: 'Transmisión',
    section: 'Drive & Transmission',
    applicableModelIds: ['gixxer-250'],
    modelTarget: 'Gixxer 250 (2020-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-transmission.jpg',
    description: 'Conjunto de piñón de ataque, corona trasera paso 520 y cadena de transmisión con O-Ring.',
    hotspots: [
      { partId: 'part-04', itemNumber: 3, x: 28, y: 50, label: 'Kit de Arrastre Sprocket & Piñón Paso 520 HD' }
    ]
  },
  {
    id: 'diag-gixxer-cooling',
    title: 'Sistema de Refrigeración del Motor',
    category: 'Sistema de Refrigeración',
    section: 'Cooling System',
    applicableModelIds: ['gixxer-150-fi'],
    modelTarget: 'Gixxer 150 FI (2018-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-gixxer-engine.jpg',
    description: 'Conjunto de radiador de aluminio, termostato de 80°C, ventilador termo-activado, mangueras de coolant y tapa de presión.',
    hotspots: [
      { partId: 'part-10', itemNumber: 1, x: 38, y: 42, label: 'Radiador de Refrigeración con Termostato' }
    ]
  },
  {
    id: 'diag-gixxer-exhaust',
    title: 'Sistema de Escape Completo',
    category: 'Sistema de Escape',
    section: 'Exhaust',
    applicableModelIds: ['gixxer-150-fi'],
    modelTarget: 'Gixxer 150 FI (2018-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-gixxer-engine.jpg',
    description: 'Múltiple de escape en acero inoxidable, junta de grafito, catalizador y silenciador trasero con sensor lambda integrado.',
    hotspots: [
      { partId: 'part-11', itemNumber: 2, x: 56, y: 38, label: 'Múltiple de Escape Acero Inoxidable' }
    ]
  },
  {
    id: 'diag-gixxer-foot-control',
    title: 'Pedales y Controles del Piloto',
    category: 'Controles',
    section: 'Foot Control',
    applicableModelIds: ['gixxer-150-fi'],
    modelTarget: 'Gixxer 150 FI (2018-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-transmission.jpg',
    description: 'Conjunto de pedal de cambios, pedal de freno trasero, foot-pegs del piloto y estriberas del pasajero.',
    hotspots: [
      { partId: 'part-14', itemNumber: 3, x: 42, y: 70, label: 'Pedal de Cambios Reforzado con Punta Plegable' }
    ]
  },
  {
    id: 'diag-gixxer-dash',
    title: 'Panel de Instrumentos & Display',
    category: 'Instrumentación',
    section: 'Dash & Gauges',
    applicableModelIds: ['gixxer-150-fi'],
    modelTarget: 'Gixxer 150 FI (2020-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-vstrom-intake.jpg',
    description: 'Cluster de instrumentos LCD con tacómetro, odómetro, indicador de marcha, nivel de combustible y testigos de aviso.',
    hotspots: [
      { partId: 'part-15', itemNumber: 2, x: 50, y: 40, label: 'Tacómetro Digital Multifunción' }
    ]
  },
  {
    id: 'diag-gsxr-engine',
    title: 'Bloque Motor GSX-R1000 Performance',
    category: 'Motor & Admisión',
    section: 'Engine',
    applicableModelIds: ['gsxr-1000'],
    modelTarget: 'GSX-R1000 (2017-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-gixxer-engine.jpg',
    description: 'Despiece del motor tetracilíndrico en línea con árbol de levas DOHC, pistones forjados y sistema de inyección doble.',
    hotspots: [
      { partId: 'part-06', itemNumber: 1, x: 50, y: 22, label: 'Bujía Iridium NGK CPR8EA-9' },
      { partId: 'part-08', itemNumber: 3, x: 52, y: 50, label: 'Kit Pistón STD 62mm & Anillos' }
    ]
  },
  {
    id: 'diag-gsxr-brake',
    title: 'Sistema de Freno Delantero Monobloque Tokico',
    category: 'Frenos & ABS',
    section: 'Brakes',
    applicableModelIds: ['gsxr-1000'],
    modelTarget: 'GSX-R1000 (2017-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-gsxr-brake.jpg',
    description: 'Pinzas radiales de 4 pistones, sensores de rueda ABS y latiguillos metálicos blindados.',
    hotspots: [
      { partId: 'part-12', itemNumber: 1, x: 28, y: 50, label: 'Pinza de Freno Delantero 4 Pistones' },
      { partId: 'part-03', itemNumber: 2, x: 48, y: 58, label: 'Pastillas Tokico Sinterizadas SSS' }
    ]
  },
  {
    id: 'diag-vstrom-electrical',
    title: 'Sistema Eléctrico & Cableado V-Strom',
    category: 'Sistema Eléctrico',
    section: 'Electrical',
    applicableModelIds: ['vstrom-650'],
    modelTarget: 'V-Strom 650 (2015-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-vstrom-intake.jpg',
    description: 'Arnés principal, relé de arranque, regulador/rectificador y ECU de gestión del motor.',
    hotspots: [
      { partId: 'part-07', itemNumber: 1, x: 42, y: 50, label: 'Relé Estanco de Arranque' }
    ]
  },
  {
    id: 'diag-vstrom-frame',
    title: 'Chasis & Protectores de Carenado',
    category: 'Chasis & Body',
    section: 'Frame',
    applicableModelIds: ['vstrom-650'],
    modelTarget: 'V-Strom 650 (2015-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-transmission.jpg',
    description: 'Estructura tubular de doble viga, sliders de chasis y puntos de anclaje del carenado adventure.',
    hotspots: [
      { partId: 'part-13', itemNumber: 1, x: 50, y: 60, label: 'Slider de Chasis Protector (Par)' }
    ]
  },
  {
    id: 'diag-gixxer-250-engine',
    title: 'Motor Gixxer 250 Oil-Cooled',
    category: 'Motor & Admisión',
    section: 'Engine',
    applicableModelIds: ['gixxer-250'],
    modelTarget: 'Gixxer 250 (2020-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-gixxer-engine.jpg',
    description: 'Despiece del motor monocilíndrico de 249cc con refrigeración por aceite, sistema SOHC y balancines de rodillos.',
    hotspots: [
      { partId: 'part-06', itemNumber: 1, x: 50, y: 22, label: 'Bujía Iridium NGK CPR8EA-9' },
      { partId: 'part-02', itemNumber: 2, x: 64, y: 76, label: 'Filtro de Aceite Cartucho Magnético' }
    ]
  },
  {
    id: 'diag-gixxer-250-transmission',
    title: 'Transmisión 6-Speed Gixxer 250',
    category: 'Transmisión',
    section: 'Drive & Transmission',
    applicableModelIds: ['gixxer-250'],
    modelTarget: 'Gixxer 250 (2020-2024)',
    diagramImage: 'https://ep-young-sun-ay6bvrv0.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/schematics/diag-transmission.jpg',
    description: 'Caja de cambios de 6 velocidades, embrague slipper y eje de salida sellado.',
    hotspots: [
      { partId: 'part-04', itemNumber: 1, x: 28, y: 50, label: 'Kit de Arrastre Sprocket & Piñón Paso 520 HD' }
    ]
  }
];

/** Orden canónico de las secciones de la motocicleta para mostrar en el catálogo. */
export const MOTORCYCLE_SECTION_ORDER: string[] = [
  'Motor',
  'Admisión y Combustible',
  'Transmisión y Kit de Arrastre',
  'Frenos',
  'Sistema de Refrigeración',
  'Chasis y Eléctrico',
  'Sistema de Escape',
  'Controles y Pedales',
  'Tablero e Instrumentos',
  'Carrocería y Carenaje',
  'Accesorios y Complementos'
];

export const SAMPLE_VINS: Record<string, VinLookupResult> = {
  'JS1GW73A2100984': {
    vin: 'JS1GW73A2100984',
    found: true,
    motorcycle: {
      brand: 'SUZUKI',
      modelId: 'gsx-r1000',
      modelName: 'GSX-R1000',
      year: 2021,
      version: 'GSX-R1000R Spec'
    },
    engineCode: 'T719-109283',
    assemblyPlant: 'Toyokawa Plant, Japan',
    specsSummary: 'Engine: 999.8cc In-line 4, DOHC 16V VVT | Power: 202 HP @ 13,200 RPM | Brembo / Tokico ABS'
  },
  'LC6PCJ42891234': {
    vin: 'LC6PCJ42891234',
    found: true,
    motorcycle: {
      brand: 'SUZUKI',
      modelId: 'gixxer-150-fi',
      modelName: 'Gixxer 150 FI',
      year: 2020,
      version: 'FI ABS (Disco Doble)'
    },
    engineCode: 'F408-882910',
    assemblyPlant: 'Suzuki Colombia (CKD Parts Japan)',
    specsSummary: 'Engine: 154.9cc Single SOHC 2V SEP | Fuel Injection denso 28mm | Single Channel ABS'
  },
  'JS1DL65A1009123': {
    vin: 'JS1DL65A1009123',
    found: true,
    motorcycle: {
      brand: 'SUZUKI',
      modelId: 'vstrom-650',
      modelName: 'V-Strom 650',
      year: 2021,
      version: 'DL650 XT Spoke Wheels'
    },
    engineCode: 'P513-200192',
    assemblyPlant: 'Hamamatsu Plant, Japan',
    specsSummary: 'Engine: 645cc 90° V-Twin DOHC 8V | Traction Control 3 Modes | Tubeless Spoke Wheels'
  }
};
