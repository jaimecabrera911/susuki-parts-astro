import React, { useState, useEffect } from 'react';
import { AdminSidebar, type AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminMetrics } from './AdminMetrics';
import { BrandsManager } from './BrandsManager';
import { ModelsManager } from './ModelsManager';
import { CategoriesManager } from './CategoriesManager';
import { PartsManager } from './PartsManager';
import { SchematicsManager } from './SchematicsManager';
import { BrandModal } from './BrandModal';
import { ModelDrawer } from './ModelDrawer';
import { CategoryModal } from './CategoryModal';
import { PartDrawer } from './PartDrawer';
import { SchematicDrawer } from './SchematicDrawer';
import { SchematicViewModal } from './SchematicViewModal';
import { 
  getStoredBrands, 
  saveStoredBrands, 
  getStoredModels, 
  saveStoredModels,
  getStoredCategories,
  saveStoredCategories,
  getStoredParts,
  saveStoredParts,
  getStoredSchematics,
  saveStoredSchematics
} from '../../data/adminStore';
import type { Brand, SuzukiModel, Category, SuzukiPart, AvailabilityStatus, ExplodedDiagram } from '../../types';
import { CheckCircle2, ShoppingCart, BarChart3 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('brands');
  const [searchQuery, setSearchQuery] = useState('');

  // Store States
  const [brands, setBrands] = useState<Brand[]>(() => getStoredBrands());
  const [models, setModels] = useState<SuzukiModel[]>(() => getStoredModels());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [parts, setParts] = useState<SuzukiPart[]>(() => getStoredParts());
  const [schematics, setSchematics] = useState<ExplodedDiagram[]>(() => getStoredSchematics());

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modal / Drawer state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);

  const [isModelDrawerOpen, setIsModelDrawerOpen] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<SuzukiModel | null>(null);
  const [modelDrawerInitialTab, setModelDrawerInitialTab] = useState<'data' | 'schematics'>('data');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [isPartDrawerOpen, setIsPartDrawerOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<SuzukiPart | null>(null);

  const [isSchematicDrawerOpen, setIsSchematicDrawerOpen] = useState(false);
  const [schematicToEdit, setSchematicToEdit] = useState<ExplodedDiagram | null>(null);

  const [isSchematicViewModalOpen, setIsSchematicViewModalOpen] = useState(false);
  const [schematicToView, setSchematicToView] = useState<ExplodedDiagram | null>(null);

  useEffect(() => {
    saveStoredBrands(brands);
  }, [brands]);

  useEffect(() => {
    saveStoredModels(models);
  }, [models]);

  useEffect(() => {
    saveStoredCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveStoredParts(parts);
  }, [parts]);

  useEffect(() => {
    saveStoredSchematics(schematics);
  }, [schematics]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- BRAND HANDLERS ---
  const handleSaveBrand = (savedBrand: Brand) => {
    const exists = brands.some(b => b.id === savedBrand.id);
    if (exists) {
      setBrands(brands.map(b => b.id === savedBrand.id ? savedBrand : b));
      showToast(`Marca "${savedBrand.name}" actualizada con éxito.`);
    } else {
      setBrands([...brands, savedBrand]);
      showToast(`Marca "${savedBrand.name}" creada con éxito.`);
    }
  };

  const handleToggleBrandActive = (id: string) => {
    setBrands(brands.map(b => {
      if (b.id === id) {
        const updated = { ...b, active: !b.active };
        showToast(`Marca "${b.name}" ${updated.active ? 'activada' : 'desactivada'}.`, 'info');
        return updated;
      }
      return b;
    }));
  };

  const handleDeleteBrand = (id: string) => {
    const brand = brands.find(b => b.id === id);
    if (!brand) return;
    if (confirm(`¿Estás seguro de eliminar la marca "${brand.name}"? Los modelos asociados podrían quedar sin marca.`)) {
      setBrands(brands.filter(b => b.id !== id));
      showToast(`Marca "${brand.name}" eliminada.`, 'info');
    }
  };

  // --- MODEL HANDLERS ---
  const handleSaveModel = (savedModel: SuzukiModel) => {
    const exists = models.some(m => m.id === savedModel.id);
    if (exists) {
      setModels(models.map(m => m.id === savedModel.id ? savedModel : m));
      showToast(`Modelo "${savedModel.name}" actualizado con éxito.`);
    } else {
      setModels([...models, savedModel]);
      showToast(`Modelo "${savedModel.name}" creado con éxito.`);
    }
  };

  const handleDuplicateModel = (sourceModel: SuzukiModel) => {
    const newId = `${sourceModel.id}-copy-${Date.now().toString().slice(-4)}`;
    const duplicated: SuzukiModel = {
      ...sourceModel,
      id: newId,
      name: `${sourceModel.name} (Copia)`,
      notes: `Duplicado de ${sourceModel.name}`
    };
    setModels([...models, duplicated]);
    showToast(`Modelo "${sourceModel.name}" duplicado con éxito.`);
  };

  const handleToggleModelActive = (id: string) => {
    setModels(models.map(m => {
      if (m.id === id) {
        const updated = { ...m, active: m.active === false ? true : false };
        showToast(`Modelo "${m.name}" ${updated.active ? 'activado' : 'desactivado'}.`, 'info');
        return updated;
      }
      return m;
    }));
  };

  const handleDeleteModel = (id: string) => {
    const model = models.find(m => m.id === id);
    if (!model) return;
    if (confirm(`¿Estás seguro de eliminar el modelo "${model.name}"?`)) {
      setModels(models.filter(m => m.id !== id));
      showToast(`Modelo "${model.name}" eliminado.`, 'info');
    }
  };

  // --- CATEGORY HANDLERS ---
  const handleSaveCategory = (savedCategory: Category) => {
    const exists = categories.some(c => c.id === savedCategory.id);
    if (exists) {
      setCategories(categories.map(c => c.id === savedCategory.id ? savedCategory : c));
      showToast(`Categoría "${savedCategory.name}" actualizada con éxito.`);
    } else {
      setCategories([...categories, savedCategory]);
      showToast(`Categoría "${savedCategory.name}" creada con éxito.`);
    }
  };

  const handleToggleCategoryActive = (id: string) => {
    setCategories(categories.map(c => {
      if (c.id === id) {
        const updated = { ...c, active: !c.active };
        showToast(`Categoría "${c.name}" ${updated.active ? 'activada' : 'desactivada'}.`, 'info');
        return updated;
      }
      return c;
    }));
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    if (confirm(`¿Estás seguro de eliminar la categoría "${cat.name}" y sus subcategorías?`)) {
      setCategories(categories.filter(c => c.id !== id));
      showToast(`Categoría "${cat.name}" eliminada.`, 'info');
    }
  };

  // --- SCHEMATIC-TO-MODEL LINKING HANDLERS ---
  const handleLinkSchematicToModel = (schematicId: string, modelId: string) => {
    setSchematics(schematics.map(s => {
      if (s.id === schematicId) {
        const existingIds = s.applicableModelIds || [];
        if (!existingIds.includes(modelId)) {
          showToast(`Despiece "${s.title}" vinculado al modelo.`, 'info');
          return { ...s, applicableModelIds: [...existingIds, modelId] };
        }
      }
      return s;
    }));
  };

  const handleUnlinkSchematicFromModel = (schematicId: string, modelId: string) => {
    setSchematics(schematics.map(s => {
      if (s.id === schematicId) {
        const updatedIds = (s.applicableModelIds || []).filter(id => id !== modelId);
        showToast(`Despiece "${s.title}" desvinculado del modelo.`, 'info');
        return { ...s, applicableModelIds: updatedIds };
      }
      return s;
    }));
  };

  const handleCreateSchematicForModel = (model: SuzukiModel, presetCategory?: string) => {
    setIsModelDrawerOpen(false);
    const minY = Math.min(...(model.years || [2020]));
    const maxY = Math.max(...(model.years || [2024]));

    const catName = presetCategory || 'Motor & Admisión';

    const sectionMap: Record<string, string> = {
      'Frenos & Suspensión': 'Brakes',
      'Transmisión & Embrague': 'Drive & Transmission',
      'Eléctrico & Encendido': 'Frame & Electrical',
      'Chasis & Carrocería': 'Frame & Electrical',
      'Motor & Admisión': 'Engine'
    };

    const presetSchematic: ExplodedDiagram = {
      id: `diag-${Date.now().toString().slice(-6)}`,
      title: `Despiece ${catName} - ${model.name}`,
      category: catName,
      section: sectionMap[catName] || 'Engine',
      applicableModelIds: [model.id],
      modelTarget: `${model.name} (${minY}-${maxY})`,
      diagramImage: '',
      description: `Diagrama despiece oficial para ${model.name} (${catName}).`,
      hotspots: []
    };

    setSchematicToEdit(presetSchematic);
    setIsSchematicDrawerOpen(true);
  };

  // --- PART HANDLERS ---
  const handleSavePart = (savedPart: SuzukiPart) => {
    const exists = parts.some(p => p.id === savedPart.id);
    if (exists) {
      setParts(parts.map(p => p.id === savedPart.id ? savedPart : p));
      showToast(`Repuesto "${savedPart.name}" actualizado con éxito.`);
    } else {
      setParts([...parts, savedPart]);
      showToast(`Repuesto "${savedPart.name}" creado con éxito.`);
    }
  };

  const handleDuplicatePart = (sourcePart: SuzukiPart) => {
    const newId = `part-${Date.now().toString().slice(-6)}`;
    const duplicated: SuzukiPart = {
      ...sourcePart,
      id: newId,
      name: `${sourcePart.name} (Copia)`,
      oemNumbers: [
        `${sourcePart.oemNumbers[0] || 'OEM'}-COPY`,
        ...sourcePart.oemNumbers.slice(1)
      ]
    };
    setParts([...parts, duplicated]);
    showToast(`Repuesto "${sourcePart.name}" duplicado con éxito.`);
  };

  const handleTogglePartAvailability = (id: string) => {
    setParts(parts.map(p => {
      if (p.id === id) {
        const current = p.availability || (p.stock > 0 ? 'in_stock' : 'on_order');
        let nextStatus: AvailabilityStatus = 'in_stock';
        if (current === 'in_stock') nextStatus = 'international';
        else if (current === 'international') nextStatus = 'on_order';
        else nextStatus = 'in_stock';

        const updated = { ...p, availability: nextStatus };
        showToast(`Disponibilidad de "${p.name}" cambiada a ${nextStatus}.`, 'info');
        return updated;
      }
      return p;
    }));
  };

  const handleDeletePart = (id: string) => {
    const part = parts.find(p => p.id === id);
    if (!part) return;
    if (confirm(`¿Estás seguro de eliminar el repuesto "${part.name}"?`)) {
      setParts(parts.filter(p => p.id !== id));
      showToast(`Repuesto "${part.name}" eliminado del catálogo.`, 'info');
    }
  };

  // --- SCHEMATIC HANDLERS ---
  const handleSaveSchematic = (savedSchematic: ExplodedDiagram) => {
    const exists = schematics.some(s => s.id === savedSchematic.id);
    if (exists) {
      setSchematics(schematics.map(s => s.id === savedSchematic.id ? savedSchematic : s));
      showToast(`Despiece "${savedSchematic.title}" actualizado con éxito.`);
    } else {
      setSchematics([...schematics, savedSchematic]);
      showToast(`Despiece "${savedSchematic.title}" creado con éxito.`);
    }
  };

  const handleDuplicateSchematic = (sourceSchematic: ExplodedDiagram) => {
    const newId = `diag-${Date.now().toString().slice(-6)}`;
    const duplicated: ExplodedDiagram = {
      ...sourceSchematic,
      id: newId,
      title: `${sourceSchematic.title} (Copia)`
    };
    setSchematics([...schematics, duplicated]);
    showToast(`Despiece "${sourceSchematic.title}" duplicado con éxito.`);
  };

  const handleDeleteSchematic = (id: string) => {
    const schematic = schematics.find(s => s.id === id);
    if (!schematic) return;
    if (confirm(`¿Estás seguro de eliminar el despiece "${schematic.title}"?`)) {
      setSchematics(schematics.filter(s => s.id !== id));
      showToast(`Despiece "${schematic.title}" eliminado.`, 'info');
    }
  };

  const handlePrimaryAction = () => {
    if (activeTab === 'brands') {
      setBrandToEdit(null);
      setIsBrandModalOpen(true);
    } else if (activeTab === 'models') {
      setModelToEdit(null);
      setModelDrawerInitialTab('data');
      setIsModelDrawerOpen(true);
    } else if (activeTab === 'categories') {
      setCategoryToEdit(null);
      setIsCategoryModalOpen(true);
    } else if (activeTab === 'parts') {
      setPartToEdit(null);
      setIsPartDrawerOpen(true);
    } else if (activeTab === 'schematics') {
      setSchematicToEdit(null);
      setIsSchematicDrawerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex font-sans antialiased">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        brandsCount={brands.length}
        modelsCount={models.length}
        categoriesCount={categories.length}
        partsCount={parts.length}
        schematicsCount={schematics.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminHeader
          title={
            activeTab === 'brands' ? 'Gestión de Marcas' :
            activeTab === 'models' ? 'Gestión de Modelos' :
            activeTab === 'categories' ? 'Gestión de Categorías & Subcategorías' :
            activeTab === 'parts' ? 'Catálogo de Repuestos' :
            activeTab === 'schematics' ? 'Despieces Explosión' :
            activeTab === 'orders' ? 'Gestión de Pedidos' : 'Métricas & Informes'
          }
          subtitle={
            activeTab === 'brands' ? 'Administra las marcas de motocicletas y sus configuraciones en el catálogo Suzuki Parts' :
            activeTab === 'models' ? 'Administra la compatibilidad por modelo, años, versiones, despieces y especificaciones OEM' :
            activeTab === 'categories' ? 'Administra la estructura jerárquica de categorías principales y subcategorías de repuestos' :
            activeTab === 'parts' ? 'Administra el catálogo oficial de repuestos OEM, precios, existencias y matriz de compatibilidad' :
            activeTab === 'schematics' ? 'Administra diagramas exploded-view y puntos hotspots interactivos vinculados a repuestos' :
            'Sistema administrativo Suzuki Parts Expert'
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onPrimaryAction={
            activeTab === 'brands' || activeTab === 'models' || activeTab === 'categories' || activeTab === 'parts' || activeTab === 'schematics' ? handlePrimaryAction : undefined
          }
          primaryActionLabel={
            activeTab === 'brands' ? 'Nueva Marca' :
            activeTab === 'models' ? 'Nuevo Modelo' :
            activeTab === 'categories' ? 'Nueva Categoría' :
            activeTab === 'parts' ? 'Nuevo Repuesto' : 'Nuevo Despiece'
          }
        />

        {/* Content Body */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Toast Notification Banner */}
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
              <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                <span className="text-xs font-bold font-mono">{toast.message}</span>
              </div>
            </div>
          )}

          {/* Metrics KPIs Summary */}
          <AdminMetrics brands={brands} models={models} />

          {/* Tab Views */}
          {activeTab === 'brands' && (
            <BrandsManager
              brands={brands}
              searchQuery={searchQuery}
              onAddBrand={() => { setBrandToEdit(null); setIsBrandModalOpen(true); }}
              onEditBrand={(brand) => { setBrandToEdit(brand); setIsBrandModalOpen(true); }}
              onToggleActive={handleToggleBrandActive}
              onDeleteBrand={handleDeleteBrand}
            />
          )}

          {activeTab === 'models' && (
            <ModelsManager
              models={models}
              brands={brands}
              schematics={schematics}
              searchQuery={searchQuery}
              onAddModel={() => { setModelToEdit(null); setModelDrawerInitialTab('data'); setIsModelDrawerOpen(true); }}
              onEditModel={(model) => { setModelToEdit(model); setModelDrawerInitialTab('data'); setIsModelDrawerOpen(true); }}
              onManageSchematics={(model) => { setModelToEdit(model); setModelDrawerInitialTab('schematics'); setIsModelDrawerOpen(true); }}
              onDuplicateModel={handleDuplicateModel}
              onToggleActive={handleToggleModelActive}
              onDeleteModel={handleDeleteModel}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesManager
              categories={categories}
              parts={parts}
              searchQuery={searchQuery}
              onAddCategory={() => { setCategoryToEdit(null); setIsCategoryModalOpen(true); }}
              onEditCategory={(cat) => { setCategoryToEdit(cat); setIsCategoryModalOpen(true); }}
              onToggleCategoryActive={handleToggleCategoryActive}
              onDeleteCategory={handleDeleteCategory}
              onSaveCategory={handleSaveCategory}
            />
          )}

          {activeTab === 'parts' && (
            <PartsManager
              parts={parts}
              models={models}
              searchQuery={searchQuery}
              onAddPart={() => { setPartToEdit(null); setIsPartDrawerOpen(true); }}
              onEditPart={(part) => { setPartToEdit(part); setIsPartDrawerOpen(true); }}
              onDuplicatePart={handleDuplicatePart}
              onToggleAvailability={handleTogglePartAvailability}
              onDeletePart={handleDeletePart}
            />
          )}

          {activeTab === 'schematics' && (
            <SchematicsManager
              schematics={schematics}
              models={models}
              parts={parts}
              searchQuery={searchQuery}
              onAddSchematic={() => { setSchematicToEdit(null); setIsSchematicDrawerOpen(true); }}
              onEditSchematic={(schematic) => { setSchematicToEdit(schematic); setIsSchematicDrawerOpen(true); }}
              onViewSchematic={(schematic) => { setSchematicToView(schematic); setIsSchematicViewModalOpen(true); }}
              onDuplicateSchematic={handleDuplicateSchematic}
              onDeleteSchematic={handleDeleteSchematic}
            />
          )}

          {/* Placeholder views for remaining modules */}
          {activeTab !== 'brands' && activeTab !== 'models' && activeTab !== 'categories' && activeTab !== 'parts' && activeTab !== 'schematics' && (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center max-w-xl mx-auto my-12 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E60012] border border-red-200 flex items-center justify-center mx-auto mb-4">
                {activeTab === 'orders' && <ShoppingCart className="w-8 h-8" />}
                {activeTab === 'metrics' && <BarChart3 className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight font-display">
                MÓDULO {activeTab.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-sans">
                Este módulo está listo para enlazarse con los flujos de pedidos y métricas de ventas.
              </p>
              <button
                onClick={() => setActiveTab('categories')}
                className="px-5 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#b5000b] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                Ir a Categorías y Subcat
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <BrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSave={handleSaveBrand}
        brandToEdit={brandToEdit}
      />

      <ModelDrawer
        isOpen={isModelDrawerOpen}
        onClose={() => setIsModelDrawerOpen(false)}
        onSave={handleSaveModel}
        modelToEdit={modelToEdit}
        brands={brands}
        schematics={schematics}
        onLinkSchematic={handleLinkSchematicToModel}
        onUnlinkSchematic={handleUnlinkSchematicFromModel}
        onCreateSchematicForModel={handleCreateSchematicForModel}
        onEditSchematic={(schematic) => {
          setIsModelDrawerOpen(false);
          setSchematicToEdit(schematic);
          setIsSchematicDrawerOpen(true);
        }}
        onViewSchematic={(schematic) => {
          setSchematicToView(schematic);
          setIsSchematicViewModalOpen(true);
        }}
        initialTab={modelDrawerInitialTab}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
      />

      <PartDrawer
        isOpen={isPartDrawerOpen}
        onClose={() => setIsPartDrawerOpen(false)}
        onSave={handleSavePart}
        partToEdit={partToEdit}
        models={models}
      />

      <SchematicDrawer
        isOpen={isSchematicDrawerOpen}
        onClose={() => setIsSchematicDrawerOpen(false)}
        onSave={handleSaveSchematic}
        schematicToEdit={schematicToEdit}
        models={models}
        parts={parts}
      />

      <SchematicViewModal
        isOpen={isSchematicViewModalOpen}
        onClose={() => setIsSchematicViewModalOpen(false)}
        schematic={schematicToView}
        parts={parts}
        onEditSchematic={(schematic) => {
          setIsSchematicViewModalOpen(false);
          setSchematicToEdit(schematic);
          setIsSchematicDrawerOpen(true);
        }}
        onEditPart={(part) => {
          setIsSchematicViewModalOpen(false);
          setPartToEdit(part);
          setIsPartDrawerOpen(true);
        }}
      />
    </div>
  );
};
