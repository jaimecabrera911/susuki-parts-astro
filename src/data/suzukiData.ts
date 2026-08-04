import type { SuzukiModel, SuzukiPart, ExplodedDiagram, VinLookupResult } from '../types';
import { MOTORCYCLE_SVGS, PARTS_SVGS, DIAGRAM_SVGS } from './svgAssets';

export const SUZUKI_MODELS: SuzukiModel[] = [
  {
    id: 'gixxer-150-fi',
    name: 'Gixxer 150 FI',
    category: 'Naked / Sport',
    image: MOTORCYCLE_SVGS['gixxer-150-fi'],
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['Standard (Carburador)', 'FI (Inyección Electrónica)', 'FI ABS (Disco Doble)']
  },
  {
    id: 'gixxer-250',
    name: 'Gixxer SF 250',
    category: 'Sport / Fairing',
    image: MOTORCYCLE_SVGS['gixxer-250'],
    years: [2020, 2021, 2022, 2023, 2024],
    versions: ['Naked ABS', 'SF Fairing ABS', 'MotoGP Edition']
  },
  {
    id: 'gsx-r1000',
    name: 'GSX-R1000',
    category: 'Superbike',
    image: MOTORCYCLE_SVGS['gsx-r1000'],
    years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['Standard ABS', 'GSX-R1000R Spec', '100th Anniversary Edition']
  },
  {
    id: 'vstrom-650',
    name: 'V-Strom 650',
    category: 'Adventure / Tourer',
    image: MOTORCYCLE_SVGS['vstrom-650'],
    years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['DL650 Standard', 'DL650 XT Spoke Wheels', 'Touring Edition']
  },
  {
    id: 'dr-650',
    name: 'DR 650 SE',
    category: 'Dual Sport / Enduro',
    image: MOTORCYCLE_SVGS['dr-650'],
    years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    versions: ['Dual Sport Standard', 'Adventure Spec']
  },
  {
    id: 'gn-125',
    name: 'GN 125',
    category: 'Custom / Commuter',
    image: MOTORCYCLE_SVGS['gn-125'],
    years: [2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024],
    versions: ['GN 125H', 'GN 125F Alloy']
  }
];

export const SUZUKI_PARTS: SuzukiPart[] = [
  {
    id: 'part-01',
    oemNumber: '13780-06G00',
    name: 'Filtro de Aire Elemento Seco OEM',
    category: 'filtros',
    price: 154000,
    stock: 14,
    image: PARTS_SVGS['part-01'],
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
    oemNumber: '16510-05240',
    name: 'Filtro de Aceite Genuino Cartucho Magnético',
    category: 'filtros',
    price: 52000,
    stock: 45,
    image: PARTS_SVGS['part-02'],
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
    oemNumber: '59300-33820-000',
    name: 'Pastillas de Freno Sinterizadas Delanteras Tokico OEM',
    category: 'frenos',
    price: 256000,
    stock: 0,
    image: PARTS_SVGS['part-03'],
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
    oemNumber: '27511-24B00',
    name: 'Kit de Arrastre Sprocket & Piñón Paso 520 HD',
    category: 'transmision',
    price: 460000,
    stock: 6,
    image: PARTS_SVGS['part-04'],
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
    oemNumber: '15100-33E00',
    name: 'Bomba de Combustible de Alta Presión EFI 3.5 BAR',
    category: 'motor',
    price: 756000,
    stock: 0,
    image: PARTS_SVGS['part-05'],
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
    oemNumber: '09482-00406',
    name: 'Bujía de Iridium NGK CPR8EA-9 Suzuki Spec',
    category: 'electrico',
    price: 74000,
    stock: 32,
    image: PARTS_SVGS['part-06'],
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
    oemNumber: '31800-21E20',
    name: 'Relé Solenoide de Arranque con Fusible de 30A',
    category: 'electrico',
    price: 168000,
    stock: 0,
    image: PARTS_SVGS['part-07'],
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
    oemNumber: '12111-38A00',
    name: 'Kit Pistón Estándar 62.0mm con Anillos RIK OEM',
    category: 'motor',
    price: 376000,
    stock: 5,
    image: PARTS_SVGS['part-08'],
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
    oemNumber: '13400-27G10',
    name: 'Cuerpo de Aceleración Electrónico EFI Throttle Body 32mm',
    category: 'motor',
    price: 920000,
    stock: 0,
    image: PARTS_SVGS['part-09'],
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
  }
];

export const EXPLODED_DIAGRAMS: ExplodedDiagram[] = [
  {
    id: 'diag-gixxer-engine',
    title: 'Despiece Bloque Motor & Inyección Electrónica',
    category: 'Motor & Admisión',
    modelTarget: 'Gixxer 150 FI (2018-2024)',
    diagramImage: DIAGRAM_SVGS['diag-gixxer-engine'],
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
    modelTarget: 'V-Strom 650 (2015-2024)',
    diagramImage: DIAGRAM_SVGS['diag-vstrom-intake'],
    description: 'Caja de filtro de aire secundario, toberas de resonancia y sensores de presión MAP/IAT.',
    hotspots: [
      { partId: 'part-01', itemNumber: 1, x: 38, y: 45, label: 'Filtro de Aire Elemento Seco OEM 13780-06G00' },
      { partId: 'part-07', itemNumber: 2, x: 70, y: 30, label: 'Relé Estanco de Arranque' }
    ]
  },
  {
    id: 'diag-gsxr-brake',
    title: 'Sistema de Freno Delantero Monobloque Tokico',
    category: 'Frenos & ABS',
    modelTarget: 'GSX-R1000 (2017-2024)',
    diagramImage: DIAGRAM_SVGS['diag-gsxr-brake'],
    description: 'Pinzas radiales de 4 pistones, sensores de rueda ABS y latiguillos metálicos blindados.',
    hotspots: [
      { partId: 'part-03', itemNumber: 2, x: 48, y: 58, label: 'Pastillas Tokico Sinterizadas SSS' }
    ]
  },
  {
    id: 'diag-transmission',
    title: 'Kit de Arrastre & Transmisión Final',
    category: 'Transmisión',
    modelTarget: 'Gixxer 250 (2020-2024)',
    diagramImage: DIAGRAM_SVGS['diag-transmission'],
    description: 'Conjunto de piñón de ataque, corona trasera paso 520 y cadena de transmisión con O-Ring.',
    hotspots: [
      { partId: 'part-04', itemNumber: 3, x: 28, y: 50, label: 'Kit de Arrastre Sprocket & Piñón Paso 520 HD' }
    ]
  }
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
